import { useState, useEffect } from "react";
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
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { equipmentCatalog, type Equipment } from "@/lib/equipment-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface CartItem {
  equipment: Equipment;
  quantity: number;
  discount: number;
}

interface ServiceItem {
  id: string;
  description: string;
  price: number;
  discount: number;
}

interface ClientInfo {
  id: string;
  name: string;
  address: string | null;
  city: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
}

export default function OffresPage() {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [refSearch, setRefSearch] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [offreNumero, setOffreNumero] = useState("");
  const [commandeRef, setCommandeRef] = useState("");
  const [transporteur, setTransporteur] = useState("");
  const [delaiLivraison, setDelaiLivraison] = useState("");
  const [conditionsPaiement, setConditionsPaiement] = useState("VIREMENT 60 J");
  const [validiteOffre, setValiditeOffre] = useState("");

  useEffect(() => {
    supabase.from("clients").select("id, name, address, city, contact, phone, email").then(({ data }) => {
      if (data) setClients(data);
    });
    // Generate offer number
    const now = new Date();
    setOffreNumero(`EO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`);
    // Default validity 3 months
    const validity = new Date(now);
    validity.setMonth(validity.getMonth() + 3);
    setValiditeOffre(validity.toLocaleDateString("fr-FR"));
  }, []);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

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
    return sum + c.equipment.price * c.quantity * (1 - c.discount / 100);
  }, 0);

  const servicesTotal = services.reduce((sum, s) => {
    return sum + s.price * (1 - s.discount / 100);
  }, 0);

  const grandTotal = cartTotal + servicesTotal;

  const fmtNum = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exportPDF = () => {
    if (!selectedClient) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const margin = 14;
    const rightCol = 120;

    // ── HEADER: Company info (left) + Client info (right) ──
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 160, 120);
    doc.text("TECHFIELD", margin, 18);
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text("Your technical solutions partner", margin, 23);

    doc.setDrawColor(0, 160, 120);
    doc.setLineWidth(0.5);
    doc.line(margin, 27, w - margin, 27);

    // Company details
    let y = 35;
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text("TechField Solutions S.A.S.", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text("Zone Industrielle", margin, y + 4);
    doc.text("Tel.: +33 1 00 00 00 00", margin, y + 8);
    doc.text("www.techfield.fr", margin, y + 12);

    // Client box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(rightCol, y - 5, w - rightCol - margin, 28, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(selectedClient.name, rightCol + 4, y + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    if (selectedClient.contact) doc.text(selectedClient.contact, rightCol + 4, y + 6);
    if (selectedClient.address) doc.text(selectedClient.address, rightCol + 4, y + 11);
    doc.text(selectedClient.city, rightCol + 4, y + 16);
    if (selectedClient.phone) doc.text(`Tel: ${selectedClient.phone}`, rightCol + 4, y + 21);

    // ── OFFER INFO ──
    y = 70;
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.text("OFFRE N°:", margin, y);
    doc.setFont("helvetica", "bold");
    doc.text(offreNumero, margin + 25, y);
    doc.setFont("helvetica", "normal");
    doc.text("Date:", margin, y + 5);
    doc.text(new Date().toLocaleDateString("fr-FR"), margin + 25, y + 5);
    if (commandeRef) {
      doc.text("V/COMMANDE N°:", margin, y + 10);
      doc.text(commandeRef, margin + 35, y + 10);
    }
    if (transporteur) {
      doc.text("TRANSPORTEUR:", margin, y + 15);
      doc.text(transporteur, margin + 35, y + 15);
    }

    // "Offre" title on the right
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 160, 120);
    doc.text("Offre", w - margin, y + 5, { align: "right" });

    // ── TABLE ──
    y = 98;
    const colRef = margin;
    const colDesig = margin + 28;
    const colQte = 128;
    const colPU = 145;
    const colMontant = w - margin;

    // Table header
    doc.setFillColor(0, 160, 120);
    doc.rect(margin, y, w - 2 * margin, 8, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Réf.", colRef + 2, y + 5.5);
    doc.text("Désignation", colDesig, y + 5.5);
    doc.text("Qté.", colQte, y + 5.5);
    doc.text("Prix Uni. HT", colPU, y + 5.5);
    doc.text("Montant HT", colMontant - 2, y + 5.5, { align: "right" });
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);

    const drawLine = (ref: string, desig: string, qty: string, pu: string, total: string, bold = false) => {
      if (y > h - 45) {
        doc.addPage();
        y = 20;
      }
      // alternating bg
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 1, w - 2 * margin, 7, "F");
      // border lines
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + 6, w - margin, y + 6);

      doc.setFontSize(7.5);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(30, 30, 30);
      doc.text(ref, colRef + 2, y + 4);
      const truncDesig = desig.length > 50 ? desig.substring(0, 50) + "..." : desig;
      doc.text(truncDesig, colDesig, y + 4);
      if (qty) doc.text(qty, colQte + 4, y + 4, { align: "center" });
      if (pu) doc.text(pu, colPU + 15, y + 4, { align: "right" });
      doc.text(total, colMontant - 2, y + 4, { align: "right" });
      y += 8;
    };

    // Separator row for sections
    const drawSectionSep = (title: string) => {
      if (y > h - 45) { doc.addPage(); y = 20; }
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 160, 120);
      doc.text(title, colDesig, y + 4);
      y += 7;
      doc.setDrawColor(0, 160, 120);
      doc.setLineWidth(0.3);
      doc.line(margin, y - 1, w - margin, y - 1);
      y += 2;
    };

    // Material items
    if (cart.length > 0) {
      drawSectionSep("*MATÉRIEL*");
      cart.forEach((item) => {
        const lineTotal = item.equipment.price * item.quantity * (1 - item.discount / 100);
        const puDisplay = fmtNum(item.equipment.price);
        const totalDisplay = fmtNum(lineTotal);
        const ref = item.equipment.reference.replace("MEL-", "");
        drawLine(ref, item.equipment.designation, String(item.quantity), puDisplay, totalDisplay);
      });
    }

    // Services
    if (services.length > 0) {
      drawSectionSep("*PRESTATIONS*");
      services.forEach((s) => {
        const lineTotal = s.price * (1 - s.discount / 100);
        drawLine("", s.description, "1", fmtNum(s.price), fmtNum(lineTotal));
      });
    }

    // ── TOTALS ──
    y += 4;
    // Bottom border
    doc.setDrawColor(0, 160, 120);
    doc.setLineWidth(0.5);
    doc.line(margin, y, w - margin, y);
    y += 6;

    // Montant HT & DTO row
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, 60, 14, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 160, 120);
    doc.text("Montant HT", margin + 4, y + 6);
    doc.setTextColor(30, 30, 30);
    doc.text(fmtNum(grandTotal), margin + 4, y + 11);

    // DTO P.P. column
    doc.setFillColor(240, 240, 240);
    doc.rect(margin + 62, y, 30, 14, "F");
    doc.setTextColor(0, 160, 120);
    doc.text("DTO. P.P.", margin + 66, y + 6);

    // Total net HT
    doc.setFillColor(0, 160, 120);
    doc.rect(colPU - 10, y, w - margin - colPU + 10, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("Total net H.T.", colPU, y + 6);
    doc.setFontSize(10);
    doc.text(fmtNum(grandTotal), colMontant - 2, y + 11, { align: "right" });

    y += 22;

    // ── CONDITIONS ──
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Devise", margin, y);
    doc.text("Euros", margin + 40, y);
    doc.text("Conditions de règlement", margin, y + 5);
    doc.text(conditionsPaiement, margin + 40, y + 5);
    if (delaiLivraison) {
      doc.text("Délai de livraison", margin, y + 10);
      doc.text(delaiLivraison, margin + 40, y + 10);
    }
    doc.text(`Offre valable pour les envois jusqu'au`, margin, y + 15);
    doc.text(validiteOffre, margin + 55, y + 15);

    doc.setTextColor(100, 100, 100);
    doc.text("Prix exonérés de TVA", w - margin, y + 15, { align: "right" });

    // ── FOOTER ──
    doc.setFontSize(6);
    doc.setTextColor(130, 130, 130);
    doc.text("TechField Solutions — Document généré automatiquement", w / 2, h - 8, { align: "center" });

    doc.save(`offre_${offreNumero}.pdf`);
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
        {totalItems > 0 && selectedClient && (
          <Button onClick={exportPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
        )}
      </div>

      {/* Step 1: Client Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            1. Sélectionner le client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} — {c.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClient && (
            <div className="p-3 rounded-xl bg-secondary/50 text-sm space-y-1">
              <p className="font-semibold text-foreground">{selectedClient.name}</p>
              {selectedClient.contact && <p className="text-muted-foreground">{selectedClient.contact}</p>}
              {selectedClient.address && <p className="text-muted-foreground">{selectedClient.address}</p>}
              <p className="text-muted-foreground">{selectedClient.city}</p>
            </div>
          )}
          {/* Offer details */}
          {selectedClient && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              <div>
                <Label className="text-xs">N° Offre</Label>
                <Input value={offreNumero} onChange={(e) => setOffreNumero(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Conditions paiement</Label>
                <Input value={conditionsPaiement} onChange={(e) => setConditionsPaiement(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Transporteur</Label>
                <Input value={transporteur} onChange={(e) => setTransporteur(e.target.value)} placeholder="FED EX..." />
              </div>
              <div>
                <Label className="text-xs">Réf. commande client</Label>
                <Input value={commandeRef} onChange={(e) => setCommandeRef(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Délai de livraison</Label>
                <Input value={delaiLivraison} onChange={(e) => setDelaiLivraison(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Validité offre</Label>
                <Input value={validiteOffre} onChange={(e) => setValiditeOffre(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Add items */}
      {selectedClient && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                2. Ajouter des articles
              </CardTitle>
            </CardHeader>
            <CardContent>
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

                <TabsContent value="maintenance" className="space-y-3">
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
                </TabsContent>

                <TabsContent value="intervention" className="space-y-3">
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

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
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.equipment.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.equipment.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        type="number"
                        value={item.discount || ""}
                        onChange={(e) => updateDiscount(item.equipment.id, Number(e.target.value))}
                        placeholder="Remise %"
                        className="w-20 h-7 text-xs"
                      />
                      <span className="text-sm font-semibold w-24 text-right">
                        {(item.equipment.price * item.quantity * (1 - item.discount / 100)).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.equipment.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {services.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs mb-1">Prestation</Badge>
                      <p className="text-sm text-foreground truncate">{s.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={s.discount || ""}
                        onChange={(e) => updateServiceDiscount(s.id, Number(e.target.value))}
                        placeholder="Remise %"
                        className="w-20 h-7 text-xs"
                      />
                      <span className="text-sm font-semibold w-24 text-right">
                        {(s.price * (1 - s.discount / 100)).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeService(s.id)}>
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
                    {grandTotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                  </span>
                </div>

                <Button onClick={exportPDF} className="w-full gap-2 mt-2">
                  <Download className="h-4 w-4" />
                  Télécharger l'offre en PDF
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
