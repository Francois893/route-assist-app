import { useEffect, useMemo, useState } from "react";
import { useClients, useInterventions, useTechnicians } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WeekDayBar from "@/components/route-planning/WeekDayBar";
import DayItinerary from "@/components/route-planning/DayItinerary";
import FranceMap from "@/components/route-planning/FranceMap";
import { optimizeOrder, calculateTravelTimes } from "@/lib/route-optimizer";
import { Route, Loader2, Home, Calendar, Navigation, Clock, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getWeekDates(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().split("T")[0];
  });
}

function shiftWeek(dateStr: string, weeks: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split("T")[0];
}

export default function RoutePlanning() {
  const { data: clients = [] } = useClients();
  const { data: interventions = [], isLoading } = useInterventions();
  const { data: technicians = [] } = useTechnicians();
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [optimized, setOptimized] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  if (!selectedTech && technicians.length > 0) {
    setSelectedTech(technicians[0].id);
  }

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const activeTech = technicians.find(t => t.id === selectedTech);

  const homePoint = activeTech?.home_latitude && activeTech?.home_longitude
    ? { lat: activeTech.home_latitude, lng: activeTech.home_longitude }
    : null;

  // All interventions for the week for this tech
  const weekInterventions = useMemo(() => {
    return interventions.filter(
      i => i.technician_id === selectedTech && i.status !== "terminee" && weekDates.includes(i.date)
    );
  }, [interventions, selectedTech, weekDates]);

  // Group by day and enrich with client data + optimization
  const processedDays = useMemo(() => {
    return weekDates.map((date, dayIdx) => {
      const dayInters = weekInterventions
        .filter(i => i.date === date)
        .map(inter => ({
          ...inter,
          client: clients.find(c => c.id === inter.client_id),
        }));

      // Get geo-located interventions
      const geoInters = dayInters
        .filter(i => i.client?.latitude && i.client?.longitude)
        .map(i => ({
          ...i,
          lat: i.client!.latitude!,
          lng: i.client!.longitude!,
        }));

      // Optimize order if enabled
      const ordered = optimized && geoInters.length > 1
        ? optimizeOrder(geoInters, homePoint?.lat, homePoint?.lng)
        : geoInters;

      // Calculate travel times between stops
      const { travelFromPrev, travelToFirst, travelFromLast } = calculateTravelTimes(
        ordered,
        homePoint?.lat,
        homePoint?.lng
      );

      const enriched = ordered.map((inter, idx) => ({
        ...inter,
        travelFromPrev: travelFromPrev[idx] || 0,
      }));

      // Include non-geolocated interventions at the end
      const nonGeo = dayInters
        .filter(i => !i.client?.latitude || !i.client?.longitude)
        .map(i => ({ ...i, lat: 0, lng: 0, travelFromPrev: 0 }));

      return {
        date,
        dayIdx,
        interventions: [...enriched, ...nonGeo],
        geoInterventions: enriched,
        travelToFirst,
        travelFromLast,
      };
    });
  }, [weekDates, weekInterventions, clients, optimized, homePoint]);

  // Compute stats
  const totalInterventions = weekInterventions.length;
  const totalTravel = processedDays.reduce((s, d) => {
    const interTravel = d.interventions.reduce((ss, i) => ss + i.travelFromPrev, 0);
    return s + interTravel + (homePoint ? d.travelToFirst + d.travelFromLast : 0);
  }, 0);
  const totalWork = weekInterventions.reduce((s, i) => s + (i.duration || 0), 0);
  const totalKm = Math.round(totalTravel * 1); // ~1 km/min at 60km/h

  // Map data
  const filteredDays = selectedDay !== null
    ? processedDays.filter((_, i) => i === selectedDay)
    : processedDays;

  const mapPoints = filteredDays.flatMap(d =>
    d.geoInterventions.map((inter, idx) => ({
      lat: inter.lat,
      lng: inter.lng,
      label: String(idx + 1),
      dayIndex: d.dayIdx,
      orderInDay: idx,
      clientName: inter.client?.name || "",
      interventionType: inter.type,
      travelFromPrev: inter.travelFromPrev,
    }))
  );

  const routesByDay = filteredDays
    .filter(d => d.geoInterventions.length > 0)
    .map(d => {
      const pts = d.geoInterventions.map(i => ({ lat: i.lat, lng: i.lng }));
      const allPts = homePoint
        ? [homePoint, ...pts, homePoint]
        : pts;
      return { dayIndex: d.dayIdx, points: allPts };
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const weekLabel = `${new Date(weekDates[0]).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} — ${new Date(weekDates[6]).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Route className="w-6 h-6 text-primary" />
          Optimisation de tournée
        </h1>
        <p className="page-subtitle">Planification hebdomadaire des trajets technicien</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedTech} onValueChange={setSelectedTech}>
          <SelectTrigger className="w-52 rounded-xl">
            <SelectValue placeholder="Technicien" />
          </SelectTrigger>
          <SelectContent>
            {technicians.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setSelectedDate(shiftWeek(selectedDate, -1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          />
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setSelectedDate(shiftWeek(selectedDate, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={() => setOptimized(!optimized)}
          variant={optimized ? "default" : "outline"}
          className="rounded-xl"
        >
          <Route className="w-4 h-4 mr-1.5" />
          {optimized ? "Optimisé ✓" : "Optimiser les trajets"}
        </Button>
      </div>

      {/* Technician home */}
      {activeTech && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="w-4 h-4 text-primary" />
          <span>Domicile : {activeTech.home_address || "Non renseigné — configurez dans Techniciens"}</span>
        </div>
      )}

      {/* Week navigation */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Semaine du {weekLabel}
        </p>
        <WeekDayBar
          weekDates={weekDates}
          interventionsByDay={Object.fromEntries(processedDays.map(d => [d.date, d.interventions]))}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Navigation className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalInterventions}</p>
              <p className="text-[11px] text-muted-foreground">Interventions</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-lg font-bold">{Math.floor(totalTravel / 60)}h{String(totalTravel % 60).padStart(2, "0")}</p>
              <p className="text-[11px] text-muted-foreground">Temps trajet</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-info/15 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-info" />
            </div>
            <div>
              <p className="text-lg font-bold">~{totalKm} km</p>
              <p className="text-[11px] text-muted-foreground">Distance estimée</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold">{Math.floor(totalWork / 60)}h{String(totalWork % 60).padStart(2, "0")}</p>
              <p className="text-[11px] text-muted-foreground">Temps travail</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Map + Itinerary */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Map - larger */}
        <Card className="lg:col-span-3 p-0 overflow-hidden rounded-2xl">
          <Suspense fallback={
            <div className="h-[450px] flex items-center justify-center bg-muted/30">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }>
            <div className="h-[450px] lg:h-[550px]">
              <FranceMap
                homePoint={homePoint}
                mapPoints={mapPoints}
                routesByDay={routesByDay}
                showRoutes={optimized}
              />
            </div>
          </Suspense>
        </Card>

        {/* Itinerary */}
        <div className="lg:col-span-2 space-y-2 max-h-[550px] overflow-y-auto pr-1">
          <h2 className="font-semibold flex items-center gap-2 text-sm sticky top-0 bg-background py-2 z-10">
            <Calendar className="w-4 h-4 text-primary" />
            Itinéraire détaillé
          </h2>

          {filteredDays.map(d => {
            if (d.interventions.length === 0) return null;
            return (
              <DayItinerary
                key={d.date}
                date={d.date}
                dayIdx={d.dayIdx}
                interventions={d.interventions}
                hasHome={!!homePoint}
                travelToFirst={d.travelToFirst}
                travelFromLast={d.travelFromLast}
              />
            );
          })}

          {totalInterventions === 0 && (
            <Card className="p-8 text-center text-muted-foreground text-sm rounded-2xl">
              Aucune intervention planifiée cette semaine
            </Card>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="font-medium">Légende :</span>
        {weekDates.map((d, i) => {
          const count = processedDays[i]?.interventions.length || 0;
          if (count === 0) return null;
          return (
            <div key={d} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: `hsl(${[24, 210, 152, 280, 38, 0, 180][i]}, ${[95, 80, 60, 60, 92, 72, 60][i]}%, ${[53, 55, 42, 55, 50, 51, 45][i]}%)` }}
              />
              <span>{DAY_LABELS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
