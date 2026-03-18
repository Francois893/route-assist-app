import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import Interventions from "@/pages/Interventions";
import AuditPage from "@/pages/AuditPage";
import RoutePlanning from "@/pages/RoutePlanning";
import DevisPage from "@/pages/DevisPage";
import TechniciansPage from "@/pages/TechniciansPage";
import MachinesPage from "@/pages/MachinesPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/interventions" element={<Interventions />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/tournees" element={<RoutePlanning />} />
            <Route path="/devis" element={<DevisPage />} />
            <Route path="/techniciens" element={<TechniciansPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
