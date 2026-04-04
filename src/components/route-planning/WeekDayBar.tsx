interface WeekDayBarProps {
  weekDates: string[];
  interventionsByDay: Record<string, any[]>;
  selectedDay: number | null;
  onSelectDay: (idx: number | null) => void;
}

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

export default function WeekDayBar({ weekDates, interventionsByDay, selectedDay, onSelectDay }: WeekDayBarProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {weekDates.map((d, i) => {
        const count = (interventionsByDay[d] || []).length;
        const isSelected = selectedDay === i;
        return (
          <button
            key={d}
            onClick={() => onSelectDay(isSelected ? null : i)}
            className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium min-w-[60px] transition-all border
              ${isSelected ? "ring-2 ring-primary bg-primary/10 border-primary/30" : "bg-card border-border/50 hover:bg-accent/10"}`}
          >
            <span className="text-muted-foreground font-semibold">{DAY_LABELS[i]}</span>
            <span className="text-[10px] text-muted-foreground/70">{d.slice(5)}</span>
            {count > 0 ? (
              <span
                className="mt-1 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: DAY_COLORS[i] }}
              >{count}</span>
            ) : (
              <span className="mt-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-muted-foreground bg-muted">0</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
