import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Cpu,
  Wrench,
  CalendarDays,
  ClipboardCheck,
  History,
  MapPin,
  FileText,
  Package,
  ShoppingCart,
  BarChart3,
} from "lucide-react";

const menuItems = [
  { title: "Tableau de bord", description: "Vue d'ensemble de l'activité", url: "/dashboard", icon: LayoutDashboard },
  { title: "Clients", description: "Gestion des clients et fiches", url: "/clients", icon: Users },
  { title: "Machines", description: "Parc machines installées", url: "/machines", icon: Cpu },
  { title: "Interventions", description: "Suivi des interventions", url: "/interventions", icon: Wrench },
  { title: "Planning", description: "Planification des interventions", url: "/planning", icon: CalendarDays },
  { title: "Audit", description: "Formulaire d'audit terrain", url: "/audit", icon: ClipboardCheck },
  { title: "Historique audits", description: "Consulter les audits passés", url: "/audits", icon: History },
  { title: "Tournées", description: "Optimisation des trajets", url: "/tournees", icon: MapPin },
  { title: "Devis", description: "Suivi des devis et offres", url: "/devis", icon: FileText },
  { title: "Matériel", description: "Catalogue de références", url: "/materiel", icon: Package },
  { title: "Offres", description: "Créer une offre commerciale", url: "/offres", icon: ShoppingCart },
  { title: "Techniciens", description: "Performance et coûts", url: "/techniciens", icon: BarChart3 },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 pt-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-wider uppercase text-foreground">TechField</h1>
        <p className="text-muted-foreground text-sm">Gestion d'interventions techniques</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:shadow-primary/5 flex flex-col items-center text-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
