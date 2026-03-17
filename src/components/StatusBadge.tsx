import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  'operational': { label: 'Opérationnel', className: 'bg-success/10 text-success border-success/20' },
  'maintenance': { label: 'En maintenance', className: 'bg-warning/10 text-warning border-warning/20' },
  'hors-service': { label: 'Hors service', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  'planifiee': { label: 'Planifiée', className: 'bg-info/10 text-info border-info/20' },
  'en-cours': { label: 'En cours', className: 'bg-warning/10 text-warning border-warning/20' },
  'terminee': { label: 'Terminée', className: 'bg-success/10 text-success border-success/20' },
  'en-attente': { label: 'En attente', className: 'bg-warning/10 text-warning border-warning/20' },
  'accepte': { label: 'Accepté', className: 'bg-success/10 text-success border-success/20' },
  'refuse': { label: 'Refusé', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  'preventive': { label: 'Préventive', className: 'bg-info/10 text-info border-info/20' },
  'corrective': { label: 'Corrective', className: 'bg-warning/10 text-warning border-warning/20' },
  'audit': { label: 'Audit', className: 'bg-accent/10 text-accent border-accent/20' },
  'bon': { label: 'Bon', className: 'bg-success/10 text-success border-success/20' },
  'moyen': { label: 'Moyen', className: 'bg-warning/10 text-warning border-warning/20' },
  'mauvais': { label: 'Mauvais', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  'conforme': { label: 'Conforme', className: 'bg-success/10 text-success border-success/20' },
  'non-conforme': { label: 'Non conforme', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
