import { useState, useMemo } from "react";
import { useInterventions, useClients, useTechnicians, useMachines } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const TECH_COLORS = [
  { bg: "bg-blue-500/15", border: "border-blue-500/40", text: "text-blue-400", dot: "bg-blue-500" },
  { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-400", dot: "bg-emerald-500" },
  { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-400", dot: "bg-amber-500" },
  { bg: "bg-rose-500/15", border: "border-rose-500/40", text: "text-rose-400", dot: "bg-rose-500" },
  { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-400", dot: "bg-violet-500" },
  { bg: "bg-cyan-500/15", border: "border-cyan-500/40", text: "text-cyan-400", dot: "bg-cyan-500" },
  { bg: "bg-orange-500/15", border: "border-orange-500/40", text: "text-orange-400", dot: "bg-orange-500" },
  { bg: "bg-teal-500/15", border: "border-teal-500/40", text: "text-teal-400", dot: "bg-teal-500" },
];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function PlanningPage() {
  const { data: interventions = [], isLoading } = useInterventions();
  const { data: clients = [] } = useClients();
  const { data: technicians = [] } = useTechnicians();
  const { data: allMachines = [] } = useMachines();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filterTech, setFilterTech] = useState<string>("all");

  const techColorMap = useMemo(() => {
    const map = new Map<string, typeof TECH_COLORS[0]>();
    technicians.forEach((t, i) => map.set(t.id, TECH_COLORS[i % TECH_COLORS.length]));
    return map;
  }, [technicians]);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  const scheduled = interventions.filter(i => {
    if (!i.date) return false;
    const d = parseISO(i.date);
    if (d < currentWeekStart || d > weekEnd) return false;
    if (filterTech !== "all" && i.technician_id !== filterTech) return false;
    return true;
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planning</h1>
        <Select value={filterTech} onValueChange={setFilterTech}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tous les techniciens" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les techniciens</SelectItem>
            {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(s => subWeeks(s, 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium text-sm">
          {format(currentWeekStart, "d MMM", { locale: fr })} — {format(weekEnd, "d MMM yyyy", { locale: fr })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(s => addWeeks(s, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {technicians.map(t => {
          const color = techColorMap.get(t.id);
          return (
            <div key={t.id} className="flex items-center gap-1.5 text-xs">
              <div className={`w-2.5 h-2.5 rounded-full ${color?.dot}`} />
              <span>{t.name}</span>
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map(day => {
          const dayInterventions = scheduled.filter(i => isSameDay(parseISO(i.date), day));
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={day.toISOString()} className={`p-3 min-h-[140px] ${isToday ? "ring-1 ring-primary/50" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium capitalize ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                  {format(day, "EEE", { locale: fr })}
                </span>
                <span className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1.5">
                {dayInterventions.map(inter => {
                  const client = clients.find(c => c.id === inter.client_id);
                  const tech = technicians.find(t => t.id === inter.technician_id);
                  const color = inter.technician_id ? techColorMap.get(inter.technician_id) : null;

                  return (
                    <div
                      key={inter.id}
                      className={`rounded-lg p-2 border text-xs ${color ? `${color.bg} ${color.border}` : "bg-muted/50 border-border/50"}`}
                    >
                      <p className="font-medium truncate">{client?.name || "—"}</p>
                      <p className="text-muted-foreground truncate">{tech?.name || "—"}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
