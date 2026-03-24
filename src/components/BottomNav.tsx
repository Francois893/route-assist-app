import { Users, Cpu, Wrench, CalendarDays, ClipboardCheck, ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { label: "Clients", to: "/clients", icon: Users },
  { label: "Machines", to: "/machines", icon: Cpu },
  { label: "Interv.", to: "/interventions", icon: Wrench },
  { label: "Planning", to: "/planning", icon: CalendarDays },
  { label: "Audit", to: "/audit", icon: ClipboardCheck },
  { label: "Offres", to: "/offres", icon: ShoppingCart },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors text-muted-foreground",
                isActive && "text-primary"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
