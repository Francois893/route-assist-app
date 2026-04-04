import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import AuthPage from "@/pages/AuthPage";
import ProfileSetupPage from "@/pages/ProfileSetupPage";
import HomePage from "@/pages/HomePage";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import Interventions from "@/pages/Interventions";
import AuditPage from "@/pages/AuditPage";
import AuditHistoryPage from "@/pages/AuditHistoryPage";
import RoutePlanning from "@/pages/RoutePlanning";
import DevisPage from "@/pages/DevisPage";
import TechniciansPage from "@/pages/TechniciansPage";
import MachinesPage from "@/pages/MachinesPage";
import PlanningPage from "@/pages/PlanningPage";
import EquipmentPage from "@/pages/EquipmentPage";
import OffresPage from "@/pages/OffresPage";
import InventoryPage from "@/pages/InventoryPage";
import NotFound from "@/pages/NotFound";
import SettingsPage from "@/pages/SettingsPage";

const queryClient = new QueryClient();

function AuthGate() {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  // Profile not yet completed (name empty)
  if (profile && !profile.name) {
    return <ProfileSetupPage userId={user.id} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/index" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/machines" element={<MachinesPage />} />
          <Route path="/interventions" element={<Interventions />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/audits" element={<AuditHistoryPage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/tournees" element={<RoutePlanning />} />
          <Route path="/devis" element={<DevisPage />} />
          <Route path="/materiel" element={<EquipmentPage />} />
          <Route path="/offres" element={<OffresPage />} />
          <Route path="/inventaire" element={<InventoryPage />} />
          <Route path="/techniciens" element={<TechniciansPage />} />
          <Route path="/parametres" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthGate />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
