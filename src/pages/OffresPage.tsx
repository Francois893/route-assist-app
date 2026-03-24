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
  ChevronDown,
  ChevronUp,
  MapPin,
  Truck,
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

interface MaintenanceItem {
  id: string;
  nbBacs: number;
  distance: number;
  forfait: "A" | "B" | "C";
  prixForfait: number;
  totalPrice: number;
  discount: number;
  description: string;
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

function getForfait(distance: number): { label: "A" | "B" | "C"; price: number } {
  if (distance < 50) return { label: "A", price: 400 };
  if (distance <= 200) return { label: "B", price: 600 };
  return { label: "C", price: 821 };
}

function calcMaintenancePrice(nbBacs: number, forfaitPrice: number): number {
  if (nbBacs <= 0) return 0;
  const first = forfaitPrice;
  const others = Math.max(0, nbBacs - 1) * forfaitPrice * 0.6;
  return first + others;
}

function buildMaintenanceDescription(nbBacs: number, forfait: "A" | "B" | "C"): string {
  return `Maintenance préventive ${nbBacs} bac${nbBacs > 1 ? "s" : ""} — Forfait ${forfait}`;
}

export default function OffresPage() {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [refSearch, setRefSearch] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [offreNumero, setOffreNumero] = useState("");
  const [clientInfoOpen, setClientInfoOpen] = useState(true);

  // Maintenance form — string state for clearable inputs
  const [maintNbBacsStr, setMaintNbBacsStr] = useState<string>("1");
  const [maintDistanceStr, setMaintDistanceStr] = useState<string>("0");

  const maintNbBacs = parseInt(maintNbBacsStr) || 0;
  const maintDistance = parseInt(maintDistanceStr) || 0;

  useEffect(() => {
    supabase.from("clients").select("id, name, address, city, contact, phone, email").then(({ data }) => {
      if (data) setClients(data);
    });
    const now = new Date();
    setOffreNumero(`EO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`);
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
          c.equipment.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
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
      { id: crypto.randomUUID(), description: serviceDesc, price: parseFloat(servicePrice), discount: 0 },
    ]);
    setServiceDesc("");
    setServicePrice("");
    toast.success("Prestation ajoutée");
  };

  const addMaintenance = () => {
    if (maintNbBacs <= 0) return;
    const forfait = getForfait(maintDistance);
    const totalPrice = calcMaintenancePrice(maintNbBacs, forfait.price);
    const desc = buildMaintenanceDescription(maintNbBacs, forfait.label);
    setMaintenanceItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nbBacs: maintNbBacs,
        distance: maintDistance,
        forfait: forfait.label,
        prixForfait: forfait.price,
        totalPrice,
        discount: 0,
        description: desc,
      },
    ]);
    toast.success("Forfait maintenance ajouté");
  };

  const removeMaintenanceItem = (id: string) => {
    setMaintenanceItems((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMaintenanceDiscount = (id: string, discount: number) => {
    setMaintenanceItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, discount: Math.min(100, Math.max(0, discount)) } : m))
    );
  };

  const updateServiceDiscount = (id: string, discount: number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, discount: Math.min(100, Math.max(0, discount)) } : s))
    );
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const totalItems = cart.length + services.length + maintenanceItems.length;

  const cartTotal = cart.reduce((sum, c) => sum + c.equipment.price * c.quantity * (1 - c.discount / 100), 0);
  const servicesTotal = services.reduce((sum, s) => sum + s.price * (1 - s.discount / 100), 0);
  const maintenanceTotal = maintenanceItems.reduce((sum, m) => sum + m.totalPrice * (1 - m.discount / 100), 0);
  const grandTotal = cartTotal + servicesTotal + maintenanceTotal;

  const fmtPrice = (n: number) => {
    const parts = n.toFixed(2).split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${intPart},${parts[1]}`;
  };

  const fmtCurrency = (n: number) => {
    return `${fmtPrice(n)} €`;
  };

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

    // Colors — cyan/teal matching app theme
    const cyan = { r: 0, g: 172, b: 163 };
    const darkCyan = { r: 0, g: 130, b: 125 };
    const lightBg = { r: 235, g: 248, b: 247 };
    const white = { r: 255, g: 255, b: 255 };

    // ── HEADER ──
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(cyan.r, cyan.g, cyan.b);
    doc.text("TECHFIELD", margin, 18);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 110);
    doc.setFont("helvetica", "normal");
    doc.text("Your technical solutions partner", margin, 23);

    doc.setDrawColor(cyan.r, cyan.g, cyan.b);
    doc.setLineWidth(0.6);
    doc.line(margin, 27, w - margin, 27);

    // Company details
    let y = 35;
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 60);
    doc.setFont("helvetica", "bold");
    doc.text("TechField Solutions S.A.S.", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text("Zone Industrielle", margin, y + 4);
    doc.text("Tel.: +33 1 00 00 00 00", margin, y + 8);
    doc.text("www.techfield.fr", margin, y + 12);

    // Client box
    doc.setFillColor(lightBg.r, lightBg.g, lightBg.b);
    doc.roundedRect(rightCol, y - 5, w - rightCol - margin, 28, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 40);
    doc.text(selectedClient.name, rightCol + 4, y + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 80);
    if (selectedClient.contact) doc.text(selectedClient.contact, rightCol + 4, y + 6);
    if (selectedClient.address) doc.text(selectedClient.address, rightCol + 4, y + 11);
    doc.text(selectedClient.city, rightCol + 4, y + 16);
    if (selectedClient.phone) doc.text(`Tel: ${selectedClient.phone}`, rightCol + 4, y + 21);

    // ── OFFER INFO ──
    y = 70;
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 60);
    doc.setFont("helvetica", "normal");
    doc.text("OFFRE N°:", margin, y);
    doc.setFont("helvetica", "bold");
    doc.text(offreNumero, margin + 25, y);
    doc.setFont("helvetica", "normal");
    doc.text("Date:", margin, y + 5);
    doc.text(new Date().toLocaleDateString("fr-FR"), margin + 25, y + 5);

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(cyan.r, cyan.g, cyan.b);
    doc.text("Offre", w - margin, y + 5, { align: "right" });

    // ── TABLE ──
    y = 98;
    const colRef = margin;
    const colDesig = margin + 28;
    const colQte = 118;
    const colPU = 135;
    const colRemise = 158;
    const colMontant = w - margin;

    // Table header
    doc.setFillColor(cyan.r, cyan.g, cyan.b);
    doc.rect(margin, y, w - 2 * margin, 8, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(white.r, white.g, white.b);
    doc.text("Réf.", colRef + 2, y + 5.5);
    doc.text("Désignation", colDesig, y + 5.5);
    doc.text("Qté", colQte, y + 5.5);
    doc.text("P.U. HT", colPU, y + 5.5);
    doc.text("Remise", colRemise, y + 5.5);
    doc.text("Montant HT", colMontant - 2, y + 5.5, { align: "right" });
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 40);

    let rowIndex = 0;

    const drawRow = (ref: string, desig: string, qty: string, pu: string, remise: string, total: string) => {
      if (y > h - 45) { doc.addPage(); y = 20; }
      if (rowIndex % 2 === 0) {
        doc.setFillColor(lightBg.r, lightBg.g, lightBg.b);
        doc.rect(margin, y - 1, w - 2 * margin, 7, "F");
      }
      doc.setDrawColor(210, 215, 225);
      doc.line(margin, y + 6, w - margin, y + 6);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 40);
      doc.text(ref, colRef + 2, y + 4);
      const truncDesig = desig.length > 40 ? desig.substring(0, 40) + "..." : desig;
      doc.text(truncDesig, colDesig, y + 4);
      if (qty) doc.text(qty, colQte + 4, y + 4, { align: "center" });
      if (pu) doc.text(pu, colPU + 16, y + 4, { align: "right" });
      doc.text(remise, colRemise + 10, y + 4, { align: "center" });
      doc.text(total, colMontant - 2, y + 4, { align: "right" });
      y += 8;
      rowIndex++;
    };

    const drawSectionSep = (title: string) => {
      if (y > h - 45) { doc.addPage(); y = 20; }
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(cyan.r, cyan.g, cyan.b);
      doc.text(title, colDesig, y + 4);
      y += 7;
      doc.setDrawColor(cyan.r, cyan.g, cyan.b);
      doc.setLineWidth(0.3);
      doc.line(margin, y - 1, w - margin, y - 1);
      y += 2;
    };

    // Material items
    if (cart.length > 0) {
      drawSectionSep("MATÉRIEL");
      cart.forEach((item) => {
        const lineTotal = item.equipment.price * item.quantity * (1 - item.discount / 100);
        const remiseStr = item.discount > 0 ? `${item.discount}%` : "-";
        drawRow(
          item.equipment.reference.replace("MEL-", ""),
          item.equipment.designation,
          String(item.quantity),
          fmtPrice(item.equipment.price),
          remiseStr,
          fmtPrice(lineTotal)
        );
      });
    }

    // Maintenance items
    if (maintenanceItems.length > 0) {
      drawSectionSep("MAINTENANCE");
      maintenanceItems.forEach((m) => {
        const lineTotal = m.totalPrice * (1 - m.discount / 100);
        const remiseStr = m.discount > 0 ? `${m.discount}%` : "-";
        drawRow("", m.description, "1", fmtPrice(m.totalPrice), remiseStr, fmtPrice(lineTotal));
      });
    }

    // Services
    if (services.length > 0) {
      drawSectionSep("PRESTATIONS");
      services.forEach((s) => {
        const lineTotal = s.price * (1 - s.discount / 100);
        const remiseStr = s.discount > 0 ? `${s.discount}%` : "-";
        drawRow("", s.description, "1", fmtPrice(s.price), remiseStr, fmtPrice(lineTotal));
      });
    }

    // ── TOTALS ──
    y += 4;
    doc.setDrawColor(cyan.r, cyan.g, cyan.b);
    doc.setLineWidth(0.5);
    doc.line(margin, y, w - margin, y);
    y += 8;

    // Total net HT
    doc.setFillColor(cyan.r, cyan.g, cyan.b);
    doc.roundedRect(colPU - 20, y - 2, w - margin - colPU + 22, 16, 2, 2, "F");
    doc.setTextColor(white.r, white.g, white.b);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Total net H.T.", colPU - 14, y + 5);
    doc.setFontSize(11);
    doc.text(`${fmtPrice(grandTotal)} €`, colMontant - 2, y + 10, { align: "right" });

    y += 24;

    // ── CONDITIONS ──
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(70, 70, 80);
    doc.text("Devise", margin, y); doc.text("Euros", margin + 40, y);
    doc.text("Conditions de règlement", margin, y + 5); doc.text(conditionsPaiement, margin + 40, y + 5);
    if (delaiLivraison) { doc.text("Délai de livraison", margin, y + 10); doc.text(delaiLivraison, margin + 40, y + 10); }
    doc.text("Offre valable pour les envois jusqu'au", margin, y + 15); doc.text(validiteOffre, margin + 55, y + 15);
    doc.setTextColor(110, 110, 120);
    doc.text("Prix exonérés de TVA", w - margin, y + 15, { align: "right" });

    // ── FOOTER ──
    doc.setFontSize(6);
    doc.setTextColor(140, 140, 150);
    doc.text("TechField Solutions — Document généré automatiquement", w / 2, h - 8, { align: "center" });

    doc.save(`offre_${offreNumero}.pdf`);
    toast.success("PDF téléchargé");
  };

  const maintForfait = getForfait(maintDistance);
  const maintPreview = calcMaintenancePrice(maintNbBacs, maintForfait.price);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase text-foreground">Offres</h1>
          <p className="text-sm text-muted-foreground mt-1">Créer une offre commerciale</p>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              1. Sélectionner le client
            </CardTitle>
            {selectedClient && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setClientInfoOpen(!clientInfoOpen)}
                className="gap-1 text-xs text-muted-foreground"
              >
                {clientInfoOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {clientInfoOpen ? "Réduire" : "Détails"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} — {c.city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClient && clientInfoOpen && (
            <>
              <div className="p-3 rounded-xl bg-secondary/50 text-sm space-y-1">
                <p className="font-semibold text-foreground">{selectedClient.name}</p>
                {selectedClient.contact && <p className="text-muted-foreground">{selectedClient.contact}</p>}
                {selectedClient.address && <p className="text-muted-foreground">{selectedClient.address}</p>}
                <p className="text-muted-foreground">{selectedClient.city}</p>
              </div>
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
            </>
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
                  <TabsTrigger value="materiel" className="gap-2"><Package className="h-4 w-4" />Matériel</TabsTrigger>
                  <TabsTrigger value="maintenance" className="gap-2"><Settings className="h-4 w-4" />Maintenance</TabsTrigger>
                  <TabsTrigger value="intervention" className="gap-2"><Wrench className="h-4 w-4" />Intervention</TabsTrigger>
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
                            <span className="font-mono text-sm text-primary font-semibold">{eq.reference}</span>
                            <p className="text-xs text-muted-foreground truncate">{eq.designation}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-semibold">{fmtCurrency(eq.price)}</span>
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Calculez le forfait maintenance selon la distance et le nombre de bacs
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Nombre de bacs
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={maintNbBacsStr}
                        onChange={(e) => setMaintNbBacsStr(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Distance bureau / client (km)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={maintDistanceStr}
                        onChange={(e) => setMaintDistanceStr(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Forfait preview */}
                  <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Forfait applicable</span>
                      <Badge variant="outline" className="font-mono">
                        Forfait {maintForfait.label} — {fmtCurrency(maintForfait.price)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{"< 50 km → Forfait A : 400 €"}</p>
                      <p>{"50 - 200 km → Forfait B : 600 €"}</p>
                      <p>{"> 200 km → Forfait C : 821 €"}</p>
                    </div>
                    {maintNbBacs > 1 && (
                      <p className="text-xs text-muted-foreground">
                        1er bac : {fmtCurrency(maintForfait.price)} — bacs suivants : {fmtCurrency(maintForfait.price * 0.6)} chacun (-40%)
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm font-semibold">Total maintenance</span>
                      <span className="text-lg font-bold text-primary">{fmtCurrency(maintPreview)}</span>
                    </div>
                  </div>

                  <Button onClick={addMaintenance} size="sm" className="gap-2" disabled={maintNbBacs <= 0}>
                    <Plus className="h-3 w-3" />
                    Ajouter au panier
                  </Button>
                </TabsContent>

                <TabsContent value="intervention" className="space-y-3">
                  <p className="text-sm text-muted-foreground">Ajoutez une prestation d'intervention à l'offre</p>
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
                  <div key={item.equipment.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-sm text-primary font-semibold">{item.equipment.reference}</span>
                      <p className="text-xs text-muted-foreground truncate">{item.equipment.designation}</p>
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
                      {item.discount > 0 && (
                        <Badge variant="outline" className="text-xs text-warning">-{item.discount}%</Badge>
                      )}
                      <span className="text-sm font-semibold w-24 text-right">
                        {fmtCurrency(item.equipment.price * item.quantity * (1 - item.discount / 100))}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.equipment.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {maintenanceItems.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs mb-1">Maintenance</Badge>
                      <p className="text-sm text-foreground truncate">{m.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={m.discount || ""}
                        onChange={(e) => updateMaintenanceDiscount(m.id, Number(e.target.value))}
                        placeholder="Remise %"
                        className="w-20 h-7 text-xs"
                      />
                      {m.discount > 0 && (
                        <Badge variant="outline" className="text-xs text-warning">-{m.discount}%</Badge>
                      )}
                      <span className="text-sm font-semibold w-24 text-right">
                        {fmtCurrency(m.totalPrice * (1 - m.discount / 100))}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMaintenanceItem(m.id)}>
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
                      {s.discount > 0 && (
                        <Badge variant="outline" className="text-xs text-warning">-{s.discount}%</Badge>
                      )}
                      <span className="text-sm font-semibold w-24 text-right">
                        {fmtCurrency(s.price * (1 - s.discount / 100))}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeService(s.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total HT</span>
                  <span className="text-xl font-bold text-primary">{fmtCurrency(grandTotal)}</span>
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
