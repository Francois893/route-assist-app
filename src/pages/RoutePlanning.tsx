import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { MapPin, Clock, Route, Navigation } from "lucide-react";

export default function RoutePlanning() {
  const { clients, interventions, technicians } = useAppStore();
  const [selectedTech, setSelectedTech] = useState<string>(technicians[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [optimized, setOptimized] = useState(false);

  const techInterventions = interventions
    .filter(i => i.technicianId === selectedTech && i.status !== 'terminee')
    .sort((a, b) => a.date.localeCompare(b.date));

  const techInterventionsForDate = techInterventions.filter(i => i.date === selectedDate);

  const interventionsWithClients = techInterventionsForDate.map(inter => {
    const client = clients.find(c => c.id === inter.clientId);
    return { ...inter, client };
  });

  const totalTravel = interventionsWithClients.reduce((s, i) => s + i.travelTime, 0);
  const totalDuration = interventionsWithClients.reduce((s, i) => s + i.duration + i.travelTime, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Optimisation de tournée</h1>
        <p className="page-subtitle">Planification et visualisation des trajets</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select value={selectedTech} onValueChange={setSelectedTech}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Technicien" /></SelectTrigger>
          <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        />
        <Button onClick={() => setOptimized(!optimized)} variant={optimized ? "default" : "outline"}>
          <Route className="w-4 h-4 mr-1" /> {optimized ? 'Optimisé ✓' : 'Optimiser la tournée'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="stat-card">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            <div>
              <p className="text-lg font-bold">{interventionsWithClients.length}</p>
              <p className="text-xs text-muted-foreground">Interventions</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            <div>
              <p className="text-lg font-bold">{totalTravel} min</p>
              <p className="text-xs text-muted-foreground">Temps de trajet</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-info" />
            <div>
              <p className="text-lg font-bold">{Math.round(totalDuration / 60)}h{totalDuration % 60 > 0 ? `${String(totalDuration % 60).padStart(2, '0')}` : ''}</p>
              <p className="text-xs text-muted-foreground">Durée totale estimée</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map placeholder */}
        <Card className="p-0 overflow-hidden">
          <div className="bg-accent/5 h-80 lg:h-full min-h-[320px] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-primary/5" />
            {/* Simulated map with client points */}
            <div className="relative w-full h-full p-6">
              <div className="absolute inset-0 border-2 border-dashed border-border/50 m-4 rounded-lg" />
              {interventionsWithClients.map((inter, idx) => {
                const x = inter.client?.longitude ? ((inter.client.longitude - 4.3) / 1.6) * 80 + 10 : 50;
                const y = inter.client?.latitude ? ((45.8 - inter.client.latitude) / 0.7) * 80 + 10 : 50;
                return (
                  <div
                    key={inter.id}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg">
                      {idx + 1}
                    </div>
                    <span className="text-[10px] font-medium mt-1 bg-card px-1 rounded shadow-sm whitespace-nowrap">
                      {inter.client?.name?.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
              {optimized && interventionsWithClients.length > 1 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  {interventionsWithClients.slice(0, -1).map((inter, idx) => {
                    const next = interventionsWithClients[idx + 1];
                    const x1 = inter.client?.longitude ? ((inter.client.longitude - 4.3) / 1.6) * 80 + 10 : 50;
                    const y1 = inter.client?.latitude ? ((45.8 - inter.client.latitude) / 0.7) * 80 + 10 : 50;
                    const x2 = next.client?.longitude ? ((next.client.longitude - 4.3) / 1.6) * 80 + 10 : 50;
                    const y2 = next.client?.latitude ? ((45.8 - next.client.latitude) / 0.7) * 80 + 10 : 50;
                    return (
                      <line key={idx} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                        stroke="hsl(24, 95%, 53%)" strokeWidth="2" strokeDasharray="6,4" />
                    );
                  })}
                </svg>
              )}
              {interventionsWithClients.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Aucune intervention pour cette date</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Route list */}
        <div className="space-y-3">
          <h2 className="font-semibold">Itinéraire{optimized ? ' optimisé' : ''}</h2>
          {interventionsWithClients.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm">
              Aucune intervention planifiée pour cette date
            </Card>
          ) : (
            interventionsWithClients.map((inter, idx) => (
              <Card key={inter.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{inter.client?.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {inter.client?.address}, {inter.client?.city}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{inter.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <StatusBadge status={inter.type} />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {inter.travelTime} min trajet
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
