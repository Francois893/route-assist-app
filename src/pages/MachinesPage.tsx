import { useState } from "react";
import { useMachines, useClients } from "@/hooks/use-data";
import { useOverdueMachines } from "@/hooks/use-overdue-machines";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Cpu, MapPin, Loader2, AlertTriangle, Clock, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function MachinesPage() {
  const { data: machines = [], isLoading } = useMachines();
  const { data: clients = [] } = useClients();
  const [search, setSearch] = useState("");
  const overdueMachines = useOverdueMachines();

  const filtered = machines.filter(m => {
    const q = search.toLowerCase();
    return (
      (m.serial_number?.toLowerCase().includes(q)) ||
      (m.name?.toLowerCase().includes(q)) ||
      (m.model?.toLowerCase().includes(q))
    );
  });

  const machinesWithClient = filtered.map(m => ({
    ...m,
    client: clients.find(c => c.id === m.client_id),
  }));

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Parc machines</h1>
        <p className="page-subtitle">Toutes les machines enregistrées et leur localisation</p>
      </div>

      <Tabs defaultValue={overdueMachines.length > 0 ? "relancer" : "toutes"} className="mb-6">
        <TabsList>
          <TabsTrigger value="toutes">Toutes les machines</TabsTrigger>
          <TabsTrigger value="relancer" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            À relancer
            {overdueMachines.length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {overdueMachines.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="toutes">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par n° de série, nom ou modèle..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filtered.length} machine{filtered.length > 1 ? 's' : ''}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {machinesWithClient.map(m => (
              <Card key={m.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{m.name}</h3>
                    <p className="text-xs text-muted-foreground">{m.model}</p>
                    {m.serial_number && (
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">S/N: {m.serial_number}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {m.client ? (
                        <Link to={`/clients/${m.client.id}`} className="hover:text-primary hover:underline">
                          {m.client.name} — {m.client.city}
                        </Link>
                      ) : (
                        <span>Client inconnu</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground">
              <Cpu className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucune machine trouvée</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="relancer">
          {overdueMachines.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Aucune machine à relancer</p>
              <p className="text-sm mt-1">Toutes les maintenances sont à jour.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                {overdueMachines.length} machine{overdueMachines.length > 1 ? 's' : ''} en retard de maintenance — pensez à contacter les clients.
              </p>
              {overdueMachines.map(({ machine, client, lastMaintenanceDate, daysOverdue }) => (
                <Card key={machine.id} className="p-4 border-destructive/30 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{machine.name}</h3>
                        <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                          +{daysOverdue} jour{daysOverdue > 1 ? 's' : ''}
                        </span>
                      </div>
                      {machine.model && <p className="text-xs text-muted-foreground">{machine.model}</p>}
                      {machine.serial_number && (
                        <p className="text-xs font-mono text-muted-foreground">S/N: {machine.serial_number}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Dernière maintenance : {lastMaintenanceDate} · Intervalle : {machine.maintenance_interval_days} jours
                      </p>
                      {client && (
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <Link to={`/clients/${client.id}`} className="text-primary font-medium hover:underline">
                              {client.name}
                            </Link>
                            <span className="text-muted-foreground">— {client.city}</span>
                          </div>
                          {client.phone && (
                            <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
