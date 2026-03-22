import { useState } from "react";
import { Search, Package, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { equipmentCatalog, type Equipment } from "@/lib/equipment-data";

export default function EquipmentPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = equipmentCatalog.filter(
    (eq) =>
      eq.reference.toLowerCase().includes(search.toLowerCase()) ||
      eq.designation.toLowerCase().includes(search.toLowerCase()) ||
      eq.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase text-foreground">
            Matériel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catalogue de références disponibles
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">
          {equipmentCatalog.length} références
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par référence, désignation ou catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((eq) => (
          <EquipmentRow
            key={eq.id}
            equipment={eq}
            expanded={expandedId === eq.id}
            onToggle={() => setExpandedId(expandedId === eq.id ? null : eq.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Aucune référence trouvée
          </div>
        )}
      </div>
    </div>
  );
}

function EquipmentRow({
  equipment,
  expanded,
  onToggle,
}: {
  equipment: Equipment;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/30"
      onClick={onToggle}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-primary">
              {equipment.reference}
            </span>
            <Badge variant="secondary" className="text-xs">
              {equipment.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {equipment.designation}
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50">
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Désignation
                </span>
                <p className="text-sm text-foreground mt-1">
                  {equipment.designation}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Prix unitaire HT
                </span>
                <p className="text-lg font-bold text-primary mt-1">
                  {equipment.price.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Description
              </span>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {equipment.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
