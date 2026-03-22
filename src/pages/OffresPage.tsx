import { useState } from "react";
import {
  Package,
  Wrench,
  Settings,
  Plus,
  Minus,
  Trash2,
  Download,
  ShoppingCart,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { equipmentCatalog, type Equipment } from "@/lib/equipment-data";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface CartItem {
  equipment: Equipment;
  quantity: number;
  discount: number; // percentage
}

interface ServiceItem {
  id: string;
  description: string;
  price: number;
  discount: number;
}

export default function OffresPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [refSearch, setRefSearch] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [servicePrice, setServicePrice] = useState("");

  const filteredEquipment = equipmentCatalog.filter(
    (eq) =>
      eq.reference.toLowerCase().includes(refSearch.toLowerCase()) ||
      eq.designation.toLowerCase().includes(refSearch.toLowerCase())
  );

  const addToCart = (eq: Equipment) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.equipment.id === eq.id);
      if (existing) {
        return prev.map((c) =>
          c.equipment.id === eq.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { equipment: eq, quantity: 1, discount: 0 }];
    });
    toast.success(`${eq.reference} ajouté au panier`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.equipment.id === id
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const updateDiscount = (id: string, discount: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.equipment.id === id ? { ...c, discount: Math.min(100, Math.max(0, discount)) } : c
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.equipment.id !== id));
  };

  const addService = () => {
    if (!serviceDesc || !servicePrice) return;
    setServices((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: serviceDesc,
        price: parseFloat(servicePrice),
        discount: 0,
      },
    ]);
    setServiceDesc("");
    setServicePrice("");
    toast.success("Prestation ajoutée");
  };

  const updateServiceDiscount = (id: string, discount: number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, discount: Math.min(100, Math.max(0, discount)) } : s))
    );
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const totalItems = cart.length + services.length;

  const cartTotal = cart.reduce((sum, c) => {
    const line = c.equipment.price * c.quantity * (1 - c.discount / 100);
    return sum + line;
  }, 0);

  const servicesTotal = services.reduce((sum, s) => {
    return sum + s.price * (1 - s.discount / 100);
  }, 0);

  const grandTotal = cartTotal + servicesTotal;

  const exportPDF = () => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(0, 204, 153);
    doc.rect(0, 0, w, 28, "F");
    doc.setTextColor(15, 20, 25);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("OFFRE COMMERCIALE", 14, 18);
    doc.setFontSize(9);
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, w - 14, 18, { align: "right" });

    let y = 40;

    // Material section
    if (cart.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 204, 153);
      doc.setFont("helvetica", "bold");
      doc.text("MATÉRIEL", 14, y);
      y += 8;

      // Table header
      doc.setFillColor(25, 30, 38);
      doc.rect(14, y, w - 28, 8, "F");
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.setFont("helvetica", "bold");
      doc.text("Référence", 16, y + 5.5);
      doc.text("Désignation", 50, y + 5.5);
      doc.text("Qté", 120, y + 5.5);
      doc.text("PU HT", 135, y + 5.5);
      doc.text("Remise", 158, y + 5.5);
      doc.text("Total HT", 178, y + 5.5);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 220, 220);

      cart.forEach((item, i) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const bg = i % 2 === 0 ? [20, 24, 30] : [25, 30, 38];
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.rect(14, y - 1, w - 28, 8, "F");

        doc.setFontSize(8);
        doc.setTextColor(220, 220, 220);
        doc.text(item.equipment.reference, 16, y + 4.5);
        const desig =
          item.equipment.designation.length > 35
            ? item.equipment.designation.substring(0, 35) + "..."
            : item.equipment.designation;
        doc.text(desig, 50, y + 4.5);
        doc.text(String(item.quantity), 122, y + 4.5);
        doc.text(item.equipment.price.toFixed(2) + " €", 135, y + 4.5);
        doc.text(item.discount > 0 ? `-${item.discount}%` : "-", 160, y + 4.5);
        const lineTotal = item.equipment.price * item.quantity * (1 - item.discount / 100);
        doc.text(lineTotal.toFixed(2) + " €", 178, y + 4.5);
        y += 9;
      });

      // Subtotal
      doc.setFillColor(0, 204, 153);
      doc.rect(140, y, w - 168, 8, "F");
      doc.setTextColor(15, 20, 25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Sous-total matériel: ${cartTotal.toFixed(2)} €`, 142, y + 5.5);
      y += 16;
    }

    // Services section
    if (services.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 204, 153);
      doc.setFont("helvetica", "bold");
      doc.text("PRESTATIONS", 14, y);
      y += 8;

      doc.setFillColor(25, 30, 38);
      doc.rect(14, y, w - 28, 8, "F");
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text("Description", 16, y + 5.5);
      doc.text("Montant HT", 135, y + 5.5);
      doc.text("Remise", 158, y + 5.5);
      doc.text("Total HT", 178, y + 5.5);
      y += 10;

      doc.setFont("helvetica", "normal");
      services.forEach((s, i) => {
        const bg = i % 2 === 0 ? [20, 24, 30] : [25, 30, 38];
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.rect(14, y - 1, w - 28, 8, "F");
        doc.setTextColor(220, 220, 220);
        doc.text(s.description.substring(0, 60), 16, y + 4.5);
        doc.text(s.price.toFixed(2) + " €", 135, y + 4.5);
        doc.text(s.discount > 0 ? `-${s.discount}%` : "-", 160, y + 4.5);
        doc.text((s.price * (1 - s.discount / 100)).toFixed(2) + " €", 178, y + 4.5);
        y += 9;
      });

      doc.setFillColor(0, 204, 153);
      doc.rect(140, y, w - 168, 8, "F");
      doc.setTextColor(15, 20, 25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Sous-total prestations: ${servicesTotal.toFixed(2)} €`, 142, y + 5.5);
      y += 16;
    }

    // Grand total
    doc.setFillColor(0, 204, 153);
    doc.rect(14, y, w - 28, 12, "F");
    doc.setTextColor(15, 20, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`TOTAL HT: ${grandTotal.toFixed(2)} €`, w - 16, y + 8.5, { align: "right" });

    // Footer
    const h = doc.internal.pageSize.getHeight();
    doc.setFillColor(0, 204, 153);
    doc.rect(0, h - 12, w, 12, "F");
    doc.setTextColor(15, 20, 25);
    doc.setFontSize(7);
    doc.text("Document généré automatiquement — TechField", w / 2, h - 4, { align: "center" });

    doc.save(`offre_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF téléchargé");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase text-foreground">
            Offres
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Créer une offre commerciale
          </p>
        </div>
        {totalItems > 0 && (
          <Button onClick={exportPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
        )}
      </div>

      <Tabs defaultValue="materiel" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="materiel" className="gap-2">
            <Package className="h-4 w-4" />
            Matériel
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Settings className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="intervention" className="gap-2">
            <Wrench className="h-4 w-4" />
            Intervention
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materiel" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une référence..."
              value={refSearch}
              onChange={(e) => setRefSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {refSearch && (
            <div className="space-y-1 max-h-60 overflow-auto">
              {filteredEquipment.map((eq) => (
                <Card
                  key={eq.id}
                  className="p-3 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => addToCart(eq)}
                >
                  <div className="min-w-0">
                    <span className="font-mono text-sm text-primary font-semibold">
                      {eq.reference}
                    </span>
                    <p className="text-xs text-muted-foreground truncate">
                      {eq.designation}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold">
                      {eq.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                    </span>
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Ajoutez une prestation de maintenance à l'offre
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Contrat de maintenance annuel..."
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs">Montant HT (€)</Label>
                <Input
                  type="number"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <Button onClick={addService} size="sm" className="gap-2">
              <Plus className="h-3 w-3" />
              Ajouter
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="intervention" className="space-y-4">
          <Card className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Ajoutez une prestation d'intervention à l'offre
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Intervention corrective sur site..."
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs">Montant HT (€)</Label>
                <Input
                  type="number"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <Button onClick={addService} size="sm" className="gap-2">
              <Plus className="h-3 w-3" />
              Ajouter
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cart */}
      {totalItems > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Panier ({totalItems} article{totalItems > 1 ? "s" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cart.map((item) => (
              <div
                key={item.equipment.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm text-primary font-semibold">
                    {item.equipment.reference}
                  </span>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.equipment.designation}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.equipment.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.equipment.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    type="number"
                    value={item.discount || ""}
                    onChange={(e) =>
                      updateDiscount(item.equipment.id, Number(e.target.value))
                    }
                    placeholder="Remise %"
                    className="w-20 h-7 text-xs"
                  />
                  <span className="text-sm font-semibold w-24 text-right">
                    {(
                      item.equipment.price *
                      item.quantity *
                      (1 - item.discount / 100)
                    ).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeFromCart(item.equipment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {services.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
              >
                <div className="flex-1 min-w-0">
                  <Badge variant="outline" className="text-xs mb-1">
                    Prestation
                  </Badge>
                  <p className="text-sm text-foreground truncate">
                    {s.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={s.discount || ""}
                    onChange={(e) =>
                      updateServiceDiscount(s.id, Number(e.target.value))
                    }
                    placeholder="Remise %"
                    className="w-20 h-7 text-xs"
                  />
                  <span className="text-sm font-semibold w-24 text-right">
                    {(s.price * (1 - s.discount / 100)).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeService(s.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Total HT
              </span>
              <span className="text-xl font-bold text-primary">
                {grandTotal.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
