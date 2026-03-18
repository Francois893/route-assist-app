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
  const monday = new Date(d);
  monday.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().split("T")[0];
  });
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_COLORS = [
  "hsl(24, 95%, 53%)",   // orange
  "hsl(210, 80%, 55%)",  // blue
  "hsl(152, 60%, 42%)",  // green
  "hsl(280, 60%, 55%)",  // purple
  "hsl(38, 92%, 50%)",   // yellow
  "hsl(0, 72%, 51%)",    // red
  "hsl(180, 60%, 45%)",  // teal
];

export default function RoutePlanning() {
  const { data: clients = [] } = useClients();
  const { data: interventions = [], isLoading } = useInterventions();
  const { data: technicians = [] } = useTechnicians();
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [optimized, setOptimized] = useState(false);

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

  // All week interventions with client data for map
  const allWeekWithClients = weekInterventions.map(inter => ({
    ...inter,
    client: clients.find(c => c.id === inter.client_id),
    dayIndex: weekDates.indexOf(inter.date),
  }));

  const totalTravelWeek = weekInterventions.reduce((s, i) => s + (i.travel_time || 0), 0);
  const totalDurationWeek = weekInterventions.reduce((s, i) => s + (i.duration || 0) + (i.travel_time || 0), 0);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const homePoint = activeTech?.home_latitude && activeTech?.home_longitude
    ? { lat: activeTech.home_latitude, lng: activeTech.home_longitude, label: "Domicile" }
    : null;

  const mapPoints = allWeekWithClients
    .filter(i => i.client?.latitude && i.client?.longitude)
    .map(i => ({
      lat: i.client!.latitude!,
      lng: i.client!.longitude!,
      label: i.client!.name?.split(" ")[0] || "",
      dayIndex: i.dayIndex,
    }));

  const allGeoPoints = [
    ...(homePoint ? [homePoint] : []),
    ...mapPoints.map(p => ({ lat: p.lat, lng: p.lng })),
  ];

  const lats = allGeoPoints.map(p => p.lat);
  const lngs = allGeoPoints.map(p => p.lng);
  const minLat = lats.length ? Math.min(...lats) - 0.05 : 45.1;
  const maxLat = lats.length ? Math.max(...lats) + 0.05 : 45.8;
  const minLng = lngs.length ? Math.min(...lngs) - 0.05 : 4.3;
  const maxLng = lngs.length ? Math.max(...lngs) + 0.05 : 5.9;
  const rangeLat = maxLat - minLat || 1;
  const rangeLng = maxLng - minLng || 1;

  const toX = (lng: number) => ((lng - minLng) / rangeLng) * 76 + 12;
  const toY = (lat: number) => ((maxLat - lat) / rangeLat) * 76 + 12;

  // Build route lines per day: home -> interventions -> home
  const routeLinesByDay = weekDates.map((d, dayIdx) => {
    const dayInters = allWeekWithClients
      .filter(i => i.date === d && i.client?.latitude && i.client?.longitude);
    if (dayInters.length === 0) return [];

    const points = dayInters.map(i => ({ x: toX(i.client!.longitude!), y: toY(i.client!.latitude!) }));
    const allPts = homePoint
      ? [{ x: toX(homePoint.lng), y: toY(homePoint.lat) }, ...points, { x: toX(homePoint.lng), y: toY(homePoint.lat) }]
      : points;

    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < allPts.length - 1; i++) {
      lines.push({ x1: allPts[i].x, y1: allPts[i].y, x2: allPts[i + 1].x, y2: allPts[i + 1].y });
    }
    return lines.map(l => ({ ...l, color: DAY_COLORS[dayIdx] }));
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Optimisation de tournée</h1>
        <p className="page-subtitle">Planification hebdomadaire des trajets</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select value={selectedTech} onValueChange={setSelectedTech}>
          <SelectTrigger className="w-52 rounded-xl"><SelectValue placeholder="Technicien" /></SelectTrigger>
          <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-3 text-sm" />
        <Button onClick={() => setOptimized(!optimized)} variant={optimized ? "default" : "outline"} className="rounded-xl">
          <Route className="w-4 h-4 mr-1" /> {optimized ? "Optimisé ✓" : "Optimiser la tournée"}
        </Button>
      </div>

      {activeTech && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Home className="w-4 h-4 text-primary" />
          <span>Domicile : {activeTech.home_address || "Non renseigné — configurez dans Techniciens"}</span>
        </div>
      )}

      {/* Week overview bar */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {weekDates.map((d, i) => {
          const count = (interventionsByDay[d] || []).length;
          return (
            <div
              key={d}
              className="flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium min-w-[60px] bg-card border border-border/50"
            >
              <span className="text-muted-foreground">{DAY_LABELS[i]}</span>
              <span className="text-[10px] text-muted-foreground/70">{d.slice(5)}</span>
              {count > 0 && (
                <span
                  className="mt-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: DAY_COLORS[i] }}
                >{count}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="stat-card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"><Navigation className="w-5 h-5 text-primary" /></div><div><p className="text-lg font-bold">{weekInterventions.length}</p><p className="text-xs text-muted-foreground">Interventions (semaine)</p></div></div></Card>
        <Card className="stat-card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div><div><p className="text-lg font-bold">{totalTravelWeek} min</p><p className="text-xs text-muted-foreground">Temps trajet (semaine)</p></div></div></Card>
        <Card className="stat-card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center"><Clock className="w-5 h-5 text-info" /></div><div><p className="text-lg font-bold">{Math.floor(totalDurationWeek / 60)}h{String(totalDurationWeek % 60).padStart(2, "0")}</p><p className="text-xs text-muted-foreground">Durée totale (semaine)</p></div></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <Card className="p-0 overflow-hidden rounded-2xl">
          <div className="bg-card h-96 lg:h-full min-h-[380px] relative">
            <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-primary/5 rounded-2xl" />
            <div className="relative w-full h-full p-6">
              <div className="absolute inset-0 border border-dashed border-border/40 m-4 rounded-xl" />

              {/* Home marker */}
              {homePoint && (
                <div className="absolute flex flex-col items-center z-20" style={{ left: `${toX(homePoint.lng)}%`, top: `${toY(homePoint.lat)}%`, transform: "translate(-50%, -50%)" }}>
                  <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-lg border-2 border-primary">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-semibold mt-1 bg-card/90 backdrop-blur px-2 py-0.5 rounded-lg shadow-sm whitespace-nowrap text-primary">Domicile</span>
                </div>
              )}

              {/* Intervention markers (all week, color-coded by day) */}
              {mapPoints.map((pt, idx) => (
                <div key={idx} className="absolute flex flex-col items-center z-10" style={{ left: `${toX(pt.lng)}%`, top: `${toY(pt.lat)}%`, transform: "translate(-50%, -50%)" }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                    style={{ background: DAY_COLORS[pt.dayIndex] }}
                  >{idx + 1}</div>
                  <span className="text-[10px] font-medium mt-1 bg-card/90 backdrop-blur px-1.5 py-0.5 rounded-lg shadow-sm whitespace-nowrap">{pt.label}</span>
                </div>
              ))}

              {/* Route lines */}
              {optimized && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  {routeLinesByDay.flat().map((line, idx) => (
                    <line key={idx} x1={`${line.x1}%`} y1={`${line.y1}%`} x2={`${line.x2}%`} y2={`${line.y2}%`} stroke={line.color} strokeWidth="2" strokeDasharray="6,4" opacity="0.7" />
                  ))}
                </svg>
              )}

              {allWeekWithClients.length === 0 && !homePoint && (
                <div className="absolute inset-0 flex items-center justify-center"><p className="text-sm text-muted-foreground">Aucune intervention cette semaine</p></div>
              )}
            </div>
          </div>
        </Card>

        {/* Itinerary per day */}
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Itinéraire semaine du {new Date(weekDates[0]).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </h2>

          {weekDates.map((d, dayIdx) => {
            const dayInters = (interventionsByDay[d] || []).map(inter => ({
              ...inter,
              client: clients.find(c => c.id === inter.client_id),
            }));
            if (dayInters.length === 0) return null;

            return (
              <div key={d}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: DAY_COLORS[dayIdx] }} />
                  <span className="text-sm font-semibold">{DAY_LABELS[dayIdx]} {d.slice(5)}</span>
                  <span className="text-xs text-muted-foreground">({dayInters.length} intervention{dayInters.length > 1 ? 's' : ''})</span>
                </div>

                {homePoint && (
                  <Card className="p-3 border-dashed border-primary/30 mb-1.5 rounded-xl">
                    <div className="flex items-center gap-2 text-xs">
                      <Home className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium">Départ domicile</span>
                    </div>
                  </Card>
                )}

                {dayInters.map((inter, idx) => (
                  <Card key={inter.id} className="p-3 mb-1.5 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: DAY_COLORS[dayIdx] }}>{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{inter.client?.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {inter.client?.address}, {inter.client?.city}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <StatusBadge status={inter.type} />
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {inter.travel_time} min</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {homePoint && (
                  <Card className="p-3 border-dashed border-primary/30 mb-3 rounded-xl">
                    <div className="flex items-center gap-2 text-xs">
                      <Home className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium">Retour domicile</span>
                    </div>
                  </Card>
                )}
              </div>
            );
          })}

          {weekInterventions.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground text-sm rounded-2xl">Aucune intervention planifiée cette semaine</Card>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-6 text-xs text-muted-foreground">
        {weekDates.map((d, i) => {
          const count = (interventionsByDay[d] || []).length;
          if (count === 0) return null;
          return (
            <div key={d} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: DAY_COLORS[i] }} />
              <span>{DAY_LABELS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
