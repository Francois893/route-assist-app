import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  'operational': { label: 'Opérationnel', className: 'bg-success/15 text-success border-success/25' },
  'maintenance': { label: 'En maintenance', className: 'bg-warning/15 text-warning border-warning/25' },
  'hors-service': { label: 'Hors service', className: 'bg-destructive/15 text-destructive border-destructive/25' },
  'planifiee': { label: 'Planifiée', className: 'bg-info/15 text-info border-info/25' },
  'en-cours': { label: 'En cours', className: 'bg-warning/15 text-warning border-warning/25' },
  'terminee': { label: 'Terminée', className: 'bg-success/15 text-success border-success/25' },
  'en-attente': { label: 'En attente', className: 'bg-warning/15 text-warning border-warning/25' },
  'accepte': { label: 'Accepté', className: 'bg-success/15 text-success border-success/25' },
  'refuse': { label: 'Refusé', className: 'bg-destructive/15 text-destructive border-destructive/25' },
  'preventive': { label: 'Préventive', className: 'bg-info/15 text-info border-info/25' },
  'corrective': { label: 'Corrective', className: 'bg-warning/15 text-warning border-warning/25' },
  'audit': { label: 'Audit', className: 'bg-primary/15 text-primary border-primary/25' },
  'bon': { label: 'Bon', className: 'bg-success/15 text-success border-success/25' },
  'moyen': { label: 'Moyen', className: 'bg-warning/15 text-warning border-warning/25' },
  'mauvais': { label: 'Mauvais', className: 'bg-destructive/15 text-destructive border-destructive/25' },
  'conforme': { label: 'Conforme', className: 'bg-success/15 text-success border-success/25' },
  'non-conforme': { label: 'Non conforme', className: 'bg-destructive/15 text-destructive border-destructive/25' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium rounded-lg", config.className)}>
      {config.label}
    </Badge>
  );
}
