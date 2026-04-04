import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Outlet } from "react-router-dom";
import { useProfile, signOut } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Layout() {
  const { data: profile } = useProfile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/50 bg-card/50 backdrop-blur-xl px-4 shrink-0 sticky top-0 z-30">
            <SidebarTrigger className="mr-4" />
            <span className="text-sm text-muted-foreground font-medium tracking-wide flex-1">Gestion d'interventions techniques</span>
            {profile && (
              <div className="flex items-center gap-2 mr-3">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium hidden sm:inline">{profile.name}</span>
                <Badge variant={profile.role === "admin" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                  {profile.role === "admin" ? "Admin" : "Utilisateur"}
                </Badge>
              </div>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="ml-1" onClick={() => signOut()} title="Déconnexion">
              <LogOut className="w-4 h-4" />
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
