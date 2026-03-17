import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Wrench, Users, FileText, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { clients, interventions, devis, machines } = useAppStore();

  const interventionsEnCours = interventions.filter(i => i.status === 'en-cours').length;
  const interventionsPlanifiees = interventions.filter(i => i.status === 'planifiee').length;
  const devisEnAttente = devis.filter(d => d.status === 'en-attente');
  const totalDevisAcceptes = devis.filter(d => d.status === 'accepte').reduce((s, d) => s + d.montant, 0);
  const machinesHS = machines.filter(m => m.status === 'hors-service').length;

  const recentInterventions = [...interventions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">Vue d'ensemble de l'activité</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clients.length}</p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{interventionsEnCours}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{interventionsPlanifiees}</p>
              <p className="text-xs text-muted-foreground">Planifiées</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDevisAcceptes.toLocaleString()}€</p>
              <p className="text-xs text-muted-foreground">Devis acceptés</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{devisEnAttente.length}</p>
              <p className="text-xs text-muted-foreground">Devis en attente</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{machinesHS}</p>
              <p className="text-xs text-muted-foreground">Machines HS</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Interventions récentes</h2>
          <div className="space-y-3">
            {recentInterventions.map(inter => {
              const client = clients.find(c => c.id === inter.clientId);
              return (
                <div key={inter.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inter.description}</p>
                    <p className="text-xs text-muted-foreground">{client?.name} · {inter.date}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <StatusBadge status={inter.type} />
                    <StatusBadge status={inter.status} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/interventions" className="text-sm text-primary font-medium mt-3 inline-block hover:underline">
            Voir toutes les interventions →
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Devis en attente</h2>
          <div className="space-y-3">
            {devisEnAttente.map(d => {
              const client = clients.find(c => c.id === d.clientId);
              return (
                <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.description}</p>
                    <p className="text-xs text-muted-foreground">{client?.name} · {d.numeroOffre}</p>
                  </div>
                  <div className="text-sm font-semibold text-primary shrink-0 ml-2">
                    {d.montant.toLocaleString()}€
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/devis" className="text-sm text-primary font-medium mt-3 inline-block hover:underline">
            Voir tous les devis →
          </Link>
        </Card>
      </div>
    </div>
  );
}
