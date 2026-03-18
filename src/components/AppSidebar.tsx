import {
  LayoutDashboard,
  Users,
  Wrench,
  ClipboardCheck,
  MapPin,
  FileText,
  BarChart3,
  Cpu,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Machines", url: "/machines", icon: Cpu },
  { title: "Interventions", url: "/interventions", icon: Wrench },
  { title: "Audit", url: "/audit", icon: ClipboardCheck },
  { title: "Tournées", url: "/tournees", icon: MapPin },
  { title: "Devis", url: "/devis", icon: FileText },
  { title: "Techniciens", url: "/techniciens", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        <div className={`px-4 mb-6 flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Wrench className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm text-sidebar-accent-foreground tracking-wide">
              TechField
            </span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
