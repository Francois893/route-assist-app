import { useState } from "react";
import { useMachines, useClients } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Cpu, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function MachinesPage() {
  const { data: machines = [], isLoading } = useMachines();
  const { data: clients = [] } = useClients();
  const [search, setSearch] = useState("");

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
    </div>
  );
}
