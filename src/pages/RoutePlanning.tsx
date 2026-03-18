import { useState, useMemo } from "react";
import { useClients, useInterventions, useTechnicians } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { MapPin, Clock, Route, Navigation, Loader2, Home, Calendar } from "lucide-react";

function getWeekDates(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().split("T")[0];
  });
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function RoutePlanning() {
  const { data: clients = [] } = useClients();
  const { data: interventions = [], isLoading } = useInterventions();
  const { data: technicians = [] } = useTechnicians();
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [optimized, setOptimized] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  if (!selectedTech && technicians.length > 0) {
    setSelectedTech(technicians[0].id);
  }

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const activeTech = technicians.find(t => t.id === selectedTech);

  const weekInterventions = useMemo(() => {
    return interventions.filter(
      i => i.technician_id === selectedTech && i.status !== "terminee" && weekDates.includes(i.date)
    );
  }, [interventions, selectedTech, weekDates]);

  const interventionsByDay = useMemo(() => {
    const map: Record<string, typeof weekInterventions> = {};
    weekDates.forEach(d => { map[d] = []; });
    weekInterventions.forEach(i => {
      if (map[i.date]) map[i.date].push(i);
    });
    return map;
  }, [weekInterventions, weekDates]);

  const displayDay = selectedDay || weekDates[0];
  const dayInterventions = interventionsByDay[displayDay] || [];

  const interventionsWithClients = dayInterventions.map(inter => ({
    ...inter,
    client: clients.find(c => c.id === inter.client_id),
  }));

  const totalTravelWeek = weekInterventions.reduce((s, i) => s + (i.travel_time || 0), 0);
  const totalDurationWeek = weekInterventions.reduce((s, i) => s + (i.duration || 0) + (i.travel_time || 0), 0);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  // Map points including home base
  const homePoint = activeTech?.home_latitude && activeTech?.home_longitude
    ? { lat: activeTech.home_latitude, lng: activeTech.home_longitude, label: "Domicile" }
    : null;

  const mapPoints = interventionsWithClients
    .filter(i => i.client?.latitude && i.client?.longitude)
    .map(i => ({
      lat: i.client!.latitude!,
      lng: i.client!.longitude!,
      label: i.client!.name?.split(" ")[0] || "",
    }));

  const allPoints = homePoint ? [homePoint, ...mapPoints, homePoint] : mapPoints;

  // Bounds for map normalization
  const lats = allPoints.map(p => p.lat);
  const lngs = allPoints.map(p => p.lng);
  const minLat = Math.min(...lats, 45.1);
  const maxLat = Math.max(...lats, 45.8);
  const minLng = Math.min(...lngs, 4.3);
  const maxLng = Math.max(...lngs, 5.9);
  const rangeLat = maxLat - minLat || 1;
  const rangeLng = maxLng - minLng || 1;

  const toX = (lng: number) => ((lng - minLng) / rangeLng) * 76 + 12;
  const toY = (lat: number) => ((maxLat - lat) / rangeLat) * 76 + 12;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Optimisation de tournée</h1>
        <p className="page-subtitle">Planification hebdomadaire des trajets</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select value={selectedTech} onValueChange={setSelectedTech}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Technicien" /></SelectTrigger>
          <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
        <input type="week" value={selectedDate.slice(0, 4) + "-W" + String(Math.ceil((new Date(selectedDate).getTime() - new Date(new Date(selectedDate).getFullYear(), 0, 1).getTime()) / 86400000 / 7)).padStart(2, "0")} onChange={e => {
          // Fallback to date input
        }} className="hidden" />
        <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedDay(null); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
        <Button onClick={() => setOptimized(!optimized)} variant={optimized ? "default" : "outline"}>
          <Route className="w-4 h-4 mr-1" /> {optimized ? "Optimisé ✓" : "Optimiser la tournée"}
        </Button>
      </div>

      {/* Home address display */}
      {activeTech && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Home className="w-4 h-4" />
          <span>Domicile : {activeTech.home_address || "Non renseigné"}</span>
        </div>
      )}

      {/* Week day selector */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {weekDates.map((d, i) => {
          const count = (interventionsByDay[d] || []).length;
          const isActive = d === displayDay;
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-[60px] ${
                isActive ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted text-foreground"
              }`}
            >
              <span>{DAY_LABELS[i]}</span>
              <span className="text-[10px] opacity-80">{d.slice(5)}</span>
              {count > 0 && (
                <span className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="stat-card"><div className="flex items-center gap-2"><Navigation className="w-5 h-5 text-primary" /><div><p className="text-lg font-bold">{weekInterventions.length}</p><p className="text-xs text-muted-foreground">Interventions (semaine)</p></div></div></Card>
        <Card className="stat-card"><div className="flex items-center gap-2"><Clock className="w-5 h-5 text-warning" /><div><p className="text-lg font-bold">{totalTravelWeek} min</p><p className="text-xs text-muted-foreground">Temps trajet (semaine)</p></div></div></Card>
        <Card className="stat-card"><div className="flex items-center gap-2"><Clock className="w-5 h-5 text-info" /><div><p className="text-lg font-bold">{Math.floor(totalDurationWeek / 60)}h{String(totalDurationWeek % 60).padStart(2, "0")}</p><p className="text-xs text-muted-foreground">Durée totale (semaine)</p></div></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-0 overflow-hidden">
          <div className="bg-accent/5 h-80 lg:h-full min-h-[320px] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-primary/5" />
            <div className="relative w-full h-full p-6">
              <div className="absolute inset-0 border-2 border-dashed border-border/50 m-4 rounded-lg" />

              {/* Home marker */}
              {homePoint && (
                <div className="absolute flex flex-col items-center z-10" style={{ left: `${toX(homePoint.lng)}%`, top: `${toY(homePoint.lat)}%`, transform: "translate(-50%, -50%)" }}>
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg border-2 border-primary">
                    <Home className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[10px] font-medium mt-1 bg-card px-1 rounded shadow-sm whitespace-nowrap">Domicile</span>
                </div>
              )}

              {interventionsWithClients.map((inter, idx) => {
                if (!inter.client?.latitude || !inter.client?.longitude) return null;
                const x = toX(inter.client.longitude);
                const y = toY(inter.client.latitude);
                return (
                  <div key={inter.id} className="absolute flex flex-col items-center z-10" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg">{idx + 1}</div>
                    <span className="text-[10px] font-medium mt-1 bg-card px-1 rounded shadow-sm whitespace-nowrap">{inter.client?.name?.split(" ")[0]}</span>
                  </div>
                );
              })}

              {/* Route lines with home as start/end */}
              {optimized && allPoints.length > 1 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  {allPoints.slice(0, -1).map((pt, idx) => {
                    const next = allPoints[idx + 1];
                    return (
                      <line key={idx} x1={`${toX(pt.lng)}%`} y1={`${toY(pt.lat)}%`} x2={`${toX(next.lng)}%`} y2={`${toY(next.lat)}%`} stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6,4" />
                    );
                  })}
                </svg>
              )}

              {interventionsWithClients.length === 0 && !homePoint && (
                <div className="absolute inset-0 flex items-center justify-center"><p className="text-sm text-muted-foreground">Aucune intervention pour ce jour</p></div>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Itinéraire du {new Date(displayDay).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            {optimized && " (optimisé)"}
          </h2>

          {homePoint && (
            <Card className="p-3 border-dashed border-primary/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center border-2 border-primary shrink-0">
                  <Home className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Départ — Domicile</h3>
                  <p className="text-xs text-muted-foreground">{activeTech?.home_address || "Adresse non renseignée"}</p>
                </div>
              </div>
            </Card>
          )}

          {interventionsWithClients.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm">Aucune intervention planifiée ce jour</Card>
          ) : (
            interventionsWithClients.map((inter, idx) => (
              <Card key={inter.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{inter.client?.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {inter.client?.address}, {inter.client?.city}</p>
                    <p className="text-xs text-muted-foreground mt-1">{inter.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <StatusBadge status={inter.type} />
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {inter.travel_time} min trajet</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}

          {homePoint && interventionsWithClients.length > 0 && (
            <Card className="p-3 border-dashed border-primary/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center border-2 border-primary shrink-0">
                  <Home className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Retour — Domicile</h3>
                  <p className="text-xs text-muted-foreground">{activeTech?.home_address}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
