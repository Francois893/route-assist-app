import { useState, useMemo } from "react";
import { useInterventions, useClients, useTechnicians } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  startOfWeek, endOfWeek, addWeeks, subWeeks,
  startOfMonth, endOfMonth, addMonths, subMonths,
  addDays, subDays,
  format, eachDayOfInterval, isSameDay, parseISO, isSameMonth
} from "date-fns";
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

type ViewMode = "day" | "week" | "month";

export default function PlanningPage() {
  const { data: interventions = [], isLoading } = useInterventions();
  const { data: clients = [] } = useClients();
  const { data: technicians = [] } = useTechnicians();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [filterTech, setFilterTech] = useState<string>("all");

  const techColorMap = useMemo(() => {
    const map = new Map<string, typeof TECH_COLORS[0]>();
    technicians.forEach((t, i) => map.set(t.id, TECH_COLORS[i % TECH_COLORS.length]));
    return map;
  }, [technicians]);

  // Compute date range based on view mode
  const { rangeStart, rangeEnd, days } = useMemo(() => {
    let start: Date, end: Date;
    if (viewMode === "day") {
      start = currentDate;
      end = currentDate;
    } else if (viewMode === "week") {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    }
    return { rangeStart: start, rangeEnd: end, days: eachDayOfInterval({ start, end }) };
  }, [currentDate, viewMode]);

  const navigate = (dir: 1 | -1) => {
    if (viewMode === "day") setCurrentDate(d => dir === 1 ? addDays(d, 1) : subDays(d, 1));
    else if (viewMode === "week") setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
  };

  const headerLabel = useMemo(() => {
    if (viewMode === "day") return format(currentDate, "EEEE d MMMM yyyy", { locale: fr });
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, "d MMM", { locale: fr })} — ${format(we, "d MMM yyyy", { locale: fr })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: fr });
  }, [currentDate, viewMode]);

  const scheduled = interventions.filter(i => {
    if (!i.date) return false;
    const d = parseISO(i.date);
    if (d < rangeStart || d > rangeEnd) return false;
    if (filterTech !== "all" && i.technician_id !== filterTech) return false;
    return true;
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Planning</h1>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={v => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="day">Jour</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
              <TabsTrigger value="month">Mois</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={filterTech} onValueChange={setFilterTech}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Tous" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les techniciens</SelectItem>
              {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
        <button
          className="font-medium text-sm capitalize hover:text-primary transition-colors"
          onClick={() => setCurrentDate(new Date())}
        >
          {headerLabel}
        </button>
        <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-5 w-5" /></Button>
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

      {/* DAY VIEW */}
      {viewMode === "day" && (
        <Card className="p-4">
          <h2 className="font-semibold capitalize mb-3">
            {format(currentDate, "EEEE d MMMM", { locale: fr })}
          </h2>
          {scheduled.length === 0 && <p className="text-sm text-muted-foreground">Aucune intervention ce jour</p>}
          <div className="space-y-2">
            {scheduled.map(inter => {
              const client = clients.find(c => c.id === inter.client_id);
              const tech = technicians.find(t => t.id === inter.technician_id);
              const color = inter.technician_id ? techColorMap.get(inter.technician_id) : null;
              return (
                <div key={inter.id} className={`rounded-xl p-3 border ${color ? `${color.bg} ${color.border}` : "bg-muted/50 border-border/50"}`}>
                  <p className="font-semibold text-sm">{client?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{tech?.name || "—"} · {inter.type} · {inter.status}</p>
                  {inter.description && <p className="text-xs mt-1">{inter.description}</p>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* WEEK VIEW */}
      {viewMode === "week" && (
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
                  <span className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>{format(day, "d")}</span>
                </div>
                <div className="space-y-1.5">
                  {dayInterventions.map(inter => {
                    const client = clients.find(c => c.id === inter.client_id);
                    const tech = technicians.find(t => t.id === inter.technician_id);
                    const color = inter.technician_id ? techColorMap.get(inter.technician_id) : null;
                    return (
                      <div key={inter.id} className={`rounded-lg p-2 border text-xs ${color ? `${color.bg} ${color.border}` : "bg-muted/50 border-border/50"}`}>
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
      )}

      {/* MONTH VIEW */}
      {viewMode === "month" && (
        <div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => (
              <div key={d} className="text-xs font-medium text-muted-foreground text-center py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const dayInterventions = scheduled.filter(i => isSameDay(parseISO(i.date), day));
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              return (
                <div
                  key={day.toISOString()}
                  className={`rounded-xl p-1.5 min-h-[80px] border transition-colors ${
                    isToday ? "ring-1 ring-primary/50 border-primary/30" : "border-border/30"
                  } ${!isCurrentMonth ? "opacity-40" : ""}`}
                >
                  <span className={`text-xs font-medium block text-right mb-1 ${isToday ? "text-primary" : ""}`}>
                    {format(day, "d")}
                  </span>
                  <div className="space-y-0.5">
                    {dayInterventions.slice(0, 2).map(inter => {
                      const color = inter.technician_id ? techColorMap.get(inter.technician_id) : null;
                      const client = clients.find(c => c.id === inter.client_id);
                      return (
                        <div key={inter.id} className={`rounded px-1 py-0.5 text-[10px] truncate ${color ? `${color.bg} ${color.text}` : "bg-muted/50"}`}>
                          {client?.name || "—"}
                        </div>
                      );
                    })}
                    {dayInterventions.length > 2 && (
                      <span className="text-[10px] text-muted-foreground pl-1">+{dayInterventions.length - 2}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
