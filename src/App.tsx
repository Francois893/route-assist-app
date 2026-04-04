import { Component, type ErrorInfo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createIDBPersister } from "@/lib/idb-persister";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { NetworkStatusBar } from "@/components/NetworkStatusBar";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24h – keep cache for offline
      staleTime: 1000 * 60 * 5, // 5min
      networkMode: "offlineFirst", // serve cache immediately, refetch in background when online
      retry: (failureCount) => {
        if (!navigator.onLine) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

const persister = createIDBPersister();

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App render error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-foreground">Un problème d'affichage est survenu</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Retournez à l'accueil ou rechargez la page pour continuer.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => window.location.assign("/")}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Accueil
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground"
              >
                Recharger
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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

  if (profile && !profile.name) {
    return <ProfileSetupPage userId={user.id} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/index" element={<Navigate to="/" replace />} />
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
  <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}>
    <AppErrorBoundary>
      <TooltipProvider>
        <NetworkStatusBar />
        <Toaster />
        <Sonner />
        <AuthGate />
      </TooltipProvider>
    </AppErrorBoundary>
  </PersistQueryClientProvider>
);

export default App;
