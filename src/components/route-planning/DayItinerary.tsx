import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { MapPin, Clock, Home, ArrowDown } from "lucide-react";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_COLORS = [
  "hsl(24, 95%, 53%)",
  "hsl(210, 80%, 55%)",
  "hsl(152, 60%, 42%)",
  "hsl(280, 60%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(180, 60%, 45%)",
];

interface InterventionWithClient {
  id: string;
  date: string;
  type: string;
  status: string;
  duration: number | null;
  travel_time: number | null;
  travelFromPrev: number;
  client?: {
    name: string;
    address: string | null;
    city: string;
  } | null;
}

interface DayItineraryProps {
  date: string;
  dayIdx: number;
  interventions: InterventionWithClient[];
  hasHome: boolean;
  travelToFirst: number;
  travelFromLast: number;
}

export default function DayItinerary({ date, dayIdx, interventions, hasHome, travelToFirst, travelFromLast }: DayItineraryProps) {
  const totalTravel = interventions.reduce((s, i) => s + i.travelFromPrev, 0) + (hasHome ? travelToFirst + travelFromLast : 0);
  const totalWork = interventions.reduce((s, i) => s + (i.duration || 0), 0);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full" style={{ background: DAY_COLORS[dayIdx] }} />
          <span className="text-sm font-bold">{DAY_LABELS[dayIdx]} {date.slice(5)}</span>
          <span className="text-xs text-muted-foreground">
            ({interventions.length} intervention{interventions.length > 1 ? "s" : ""})
          </span>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">🚗 {totalTravel} min</span>
          <span className="flex items-center gap-1">🔧 {Math.floor(totalWork / 60)}h{String(totalWork % 60).padStart(2, "0")}</span>
        </div>
      </div>

      {hasHome && (
        <>
          <Card className="p-3 border-dashed border-primary/40 rounded-xl mb-0.5">
            <div className="flex items-center gap-2 text-xs">
              <Home className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">Départ domicile</span>
              {travelToFirst > 0 && (
                <span className="ml-auto text-muted-foreground">→ {travelToFirst} min</span>
              )}
            </div>
          </Card>
          <div className="flex justify-center py-0.5">
            <ArrowDown className="w-3.5 h-3.5 text-muted-foreground/50" />
          </div>
        </>
      )}

      {interventions.map((inter, idx) => (
        <div key={inter.id}>
          <Card className="p-3 rounded-xl hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                style={{ background: DAY_COLORS[dayIdx] }}
              >{idx + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm truncate">{inter.client?.name}</h3>
                  <StatusBadge status={inter.type} />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{inter.client?.address}, {inter.client?.city}</span>
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {inter.travelFromPrev > 0 && idx > 0 && (
                    <span className="flex items-center gap-1">🚗 {inter.travelFromPrev} min</span>
                  )}
                  {inter.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {inter.duration} min
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
          {idx < interventions.length - 1 && (
            <div className="flex justify-center py-0.5">
              <ArrowDown className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
          )}
        </div>
      ))}

      {hasHome && (
        <>
          <div className="flex justify-center py-0.5">
            <ArrowDown className="w-3.5 h-3.5 text-muted-foreground/50" />
          </div>
          <Card className="p-3 border-dashed border-primary/40 rounded-xl">
            <div className="flex items-center gap-2 text-xs">
              <Home className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">Retour domicile</span>
              {travelFromLast > 0 && (
                <span className="ml-auto text-muted-foreground">← {travelFromLast} min</span>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
