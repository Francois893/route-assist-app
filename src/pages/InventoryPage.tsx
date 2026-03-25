import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  AlertTriangle,
  History,
  Package,
  ChevronDown,
  ChevronUp,
  Save,
  Warehouse,
  User,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import QrScanner from "@/components/QrScanner";

interface InventoryItem {
  id: string;
  reference: string;
  designation: string;
  location_type: string;
  technician_id: string | null;
  quantity: number;
  min_stock: number;
  updated_at: string;
}

interface HistoryEntry {
  id: string;
  old_quantity: number;
  new_quantity: number;
  changed_at: string;
  note: string;
}

interface Technician {
  id: string;
  name: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("atelier");
  const [loading, setLoading] = useState(true);

  // QR scanner
  const [scanOpen, setScanOpen] = useState(false);

  // Add item dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newRef, setNewRef] = useState("");
  const [newDesig, setNewDesig] = useState("");
  const [newQty, setNewQty] = useState("0");
  const [newMinStock, setNewMinStock] = useState("0");

  // Detail / edit dialog
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editMinStock, setEditMinStock] = useState("");
  const [editNote, setEditNote] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .order("reference");
    if (data) setItems(data as InventoryItem[]);
    setLoading(false);
  };

  const fetchTechnicians = async () => {
    const { data } = await supabase.from("technicians").select("id, name");
    if (data) setTechnicians(data);
  };

  useEffect(() => {
    fetchItems();
    fetchTechnicians();
  }, []);

  const fetchHistory = async (inventoryId: string) => {
    setHistoryLoading(true);
    const { data } = await supabase
      .from("inventory_history")
      .select("*")
      .eq("inventory_id", inventoryId)
      .order("changed_at", { ascending: false })
      .limit(20);
    if (data) setHistory(data as HistoryEntry[]);
    setHistoryLoading(false);
  };

  // Locations = atelier + each technician
  const locations = useMemo(() => {
    const locs: { key: string; label: string; type: string; techId: string | null }[] = [
      { key: "atelier", label: "Atelier", type: "atelier", techId: null },
    ];
    technicians.forEach((t) =>
      locs.push({ key: t.id, label: t.name, type: "technician", techId: t.id })
    );
    return locs;
  }, [technicians]);

  const activeLocation = locations.find((l) => l.key === activeTab);

  const filteredItems = useMemo(() => {
    let filtered = items.filter((i) => {
      if (activeTab === "atelier") return i.location_type === "atelier";
      return i.location_type === "technician" && i.technician_id === activeTab;
    });
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.reference.toLowerCase().includes(q) ||
          i.designation.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [items, activeTab, search]);

  const lowStockItems = useMemo(
    () => items.filter((i) => i.min_stock > 0 && i.quantity <= i.min_stock),
    [items]
  );

  const handleAdd = async () => {
    if (!newRef.trim()) return;
    const payload: Record<string, unknown> = {
      reference: newRef.trim(),
      designation: newDesig.trim(),
      quantity: parseInt(newQty) || 0,
      min_stock: parseInt(newMinStock) || 0,
      location_type: activeLocation?.type || "atelier",
      technician_id: activeLocation?.type === "technician" ? activeLocation.techId : null,
    };
    const { error } = await supabase.from("inventory").insert(payload as never);
    if (error) {
      toast.error("Erreur lors de l'ajout");
      return;
    }
    toast.success("Article ajouté");
    setAddOpen(false);
    setNewRef("");
    setNewDesig("");
    setNewQty("0");
    setNewMinStock("0");
    fetchItems();
  };

  const openDetail = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditQty(String(item.quantity));
    setEditMinStock(String(item.min_stock));
    setEditNote("");
    fetchHistory(item.id);
  };

  const handleQrScan = (ref: string) => {
    setScanOpen(false);
    const found = items.find((i) => i.reference.toLowerCase() === ref.toLowerCase());
    if (found) {
      openDetail(found);
      toast.success(`Article trouvé : ${found.reference}`);
    } else {
      toast.error(`Aucun article avec la référence "${ref}" dans l'inventaire`);
    }
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    const newQuantity = parseInt(editQty) || 0;
    const newMin = parseInt(editMinStock) || 0;
    const oldQuantity = selectedItem.quantity;

    // Update inventory
    const { error } = await supabase
      .from("inventory")
      .update({ quantity: newQuantity, min_stock: newMin } as never)
      .eq("id", selectedItem.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    // Log history if quantity changed
    if (newQuantity !== oldQuantity) {
      await supabase.from("inventory_history").insert({
        inventory_id: selectedItem.id,
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        note: editNote || "",
      } as never);
    }

    toast.success("Stock mis à jour");
    setSelectedItem(null);
    fetchItems();
  };

  const getTechName = (id: string | null) =>
    technicians.find((t) => t.id === id)?.name || "Inconnu";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase text-foreground">
            Inventaire
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion des stocks par emplacement
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold text-warning">
                {lowStockItems.length} article{lowStockItems.length > 1 ? "s" : ""} en stock bas
              </span>
            </div>
            <div className="space-y-1">
              {lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-warning/10 rounded-lg px-2 py-1 transition-colors"
                  onClick={() => openDetail(item)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-primary font-semibold">{item.reference}</span>
                    <span className="text-muted-foreground">{item.designation}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.location_type === "atelier"
                        ? "Atelier"
                        : getTechName(item.technician_id)}
                    </Badge>
                  </div>
                  <span className="font-semibold text-destructive">
                    {item.quantity} / {item.min_stock} min
                  </span>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <p className="text-xs text-muted-foreground pl-2">
                  +{lowStockItems.length - 5} autre{lowStockItems.length - 5 > 1 ? "s" : ""}...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs per location */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary flex-wrap h-auto gap-1">
          {locations.map((loc) => (
            <TabsTrigger key={loc.key} value={loc.key} className="gap-1.5 text-xs">
              {loc.type === "atelier" ? (
                <Warehouse className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
              {loc.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence ou nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {locations.map((loc) => (
          <TabsContent key={loc.key} value={loc.key} className="mt-4 space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>
            ) : filteredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun article dans cet inventaire
              </p>
            ) : (
              filteredItems.map((item) => {
                const isLow = item.min_stock > 0 && item.quantity <= item.min_stock;
                return (
                  <Card
                    key={item.id}
                    className={`cursor-pointer transition-all hover:border-primary/30 ${
                      isLow ? "border-warning/40" : ""
                    }`}
                    onClick={() => openDetail(item)}
                  >
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-primary font-semibold">
                            {item.reference}
                          </span>
                          {isLow && (
                            <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.designation}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-lg font-bold ${
                            isLow ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          {item.quantity}
                        </p>
                        {item.min_stock > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            min: {item.min_stock}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un article — {activeLocation?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Référence</Label>
              <Input value={newRef} onChange={(e) => setNewRef(e.target.value)} placeholder="REF-001" />
            </div>
            <div>
              <Label className="text-xs">Désignation</Label>
              <Input
                value={newDesig}
                onChange={(e) => setNewDesig(e.target.value)}
                placeholder="Description de l'article"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Quantité</Label>
                <Input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Stock minimum</Label>
                <Input
                  type="number"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail / edit dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        <DialogContent className="max-w-md">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  {selectedItem.reference}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedItem.designation}</p>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Quantité actuelle</Label>
                    <Input
                      type="number"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Stock minimum</Label>
                    <Input
                      type="number"
                      value={editMinStock}
                      onChange={(e) => setEditMinStock(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Note (optionnel)</Label>
                  <Input
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Raison du changement..."
                  />
                </div>
                <Button onClick={handleSave} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>

                {/* History */}
                <div className="border-t border-border pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Historique des modifications
                    </span>
                  </div>
                  {historyLoading ? (
                    <p className="text-xs text-muted-foreground">Chargement...</p>
                  ) : history.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucune modification</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-auto">
                      {history.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/50"
                        >
                          <div>
                            <span className="text-muted-foreground">
                              {format(new Date(h.changed_at), "dd/MM/yyyy HH:mm", {
                                locale: fr,
                              })}
                            </span>
                            {h.note && (
                              <span className="text-muted-foreground ml-2">— {h.note}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 font-mono shrink-0">
                            <span className="text-destructive">{h.old_quantity}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-primary font-semibold">{h.new_quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
