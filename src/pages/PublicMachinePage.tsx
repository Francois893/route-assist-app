import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Cpu, Calendar, Clock, Wrench, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

interface MachineData {
  id: string;
  name: string;
  model: string | null;
  serial_number: string | null;
  status: string;
  type: string | null;
  install_date: string | null;
  maintenance_interval_days: number;
  client_id: string;
}

interface ClientData {
  name: string;
  city: string;
}

interface InterventionData {
  id: string;
  date: string;
  type: string;
  status: string;
  description: string | null;
  duration: number | null;
  notes: string | null;
  technician_id: string | null;
}

export default function PublicMachinePage() {
  const { id } = useParams<{ id: string }>();
  const [machine, setMachine] = useState<MachineData | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [interventions, setInterventions] = useState<InterventionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: m, error: me } = await supabase
        .from("machines")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (me || !m) {
        setError(true);
        setLoading(false);
        return;
      }
      setMachine(m);

      const [clientRes, interventionsRes] = await Promise.all([
        supabase.from("clients").select("name, city").eq("id", m.client_id).maybeSingle(),
        supabase
          .from("interventions")
          .select("id, date, type, status, description, duration, notes, technician_id")
          .or(`machine_id.eq.${id},machine_ids.cs.{${id}}`)
          .order("date", { ascending: false })
          .limit(20),
      ]);

      if (clientRes.data) setClient(clientRes.data);
      if (interventionsRes.data) setInterventions(interventionsRes.data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Machine introuvable</h1>
          <p className="text-sm text-muted-foreground">
            Ce QR code ne correspond à aucune machine enregistrée.
          </p>
        </div>
      </div>
    );
  }

  const lastIntervention = interventions[0];
  const statusIcon = machine.status === "operational" ? (
    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
  ) : machine.status === "hors-service" ? (
    <AlertTriangle className="w-5 h-5 text-destructive" />
  ) : (
    <Wrench className="w-5 h-5 text-amber-500" />
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{machine.name}</h1>
              {client && (
                <p className="text-sm text-muted-foreground">{client.name} — {client.city}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusIcon}
            <StatusBadge status={machine.status} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Identification */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" /> Identification
          </h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
            {machine.model && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modèle</span>
                <span className="font-medium text-foreground">{machine.model}</span>
              </div>
            )}
            {machine.serial_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">N° de série</span>
                <span className="font-mono font-medium text-foreground">{machine.serial_number}</span>
              </div>
            )}
            {machine.type && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground capitalize">{machine.type}</span>
              </div>
            )}
            {machine.install_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date d'installation</span>
                <span className="font-medium text-foreground">{machine.install_date}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intervalle maintenance</span>
              <span className="font-medium text-foreground">{machine.maintenance_interval_days} jours</span>
            </div>
          </div>
        </section>

        {/* Dernière intervention */}
        {lastIntervention && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Dernière intervention
            </h2>
            <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{lastIntervention.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Type</span>
                <StatusBadge status={lastIntervention.type} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Statut</span>
                <StatusBadge status={lastIntervention.status} />
              </div>
              {lastIntervention.duration && lastIntervention.duration > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée</span>
                  <span className="font-medium text-foreground">{lastIntervention.duration} min</span>
                </div>
              )}
              {lastIntervention.notes && (
                <div className="pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Remarques</span>
                  <p className="text-sm text-foreground mt-1">{lastIntervention.notes}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Historique */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Historique des interventions
          </h2>
          {interventions.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-sm">
              Aucune intervention enregistrée
            </div>
          ) : (
            <div className="space-y-2">
              {interventions.map((inter) => (
                <div key={inter.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{inter.date}</span>
                    <StatusBadge status={inter.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={inter.type} />
                    {inter.duration && inter.duration > 0 && <span>· {inter.duration} min</span>}
                  </div>
                  {inter.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{inter.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
          Fiche générée automatiquement · Consultation en lecture seule
        </div>
      </div>
    </div>
  );
}
