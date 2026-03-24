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

const MACHINE_TYPES = [
  "B4 Piston",
  "B4 Gear",
  "B4 NS",
  "Micron Piston",
  "Micron Gear",
  "Macro",
] as const;
type MachineType = (typeof MACHINE_TYPES)[number];

interface SparePart {
  reference: string;
  designation: string;
  quantity: number;
}

const MACHINE_SPARE_PARTS: Record<string, SparePart[]> = {
  "B4 Piston": [
    { reference: "10100070", designation: "Filtre plat dépôt", quantity: 1 },
    { reference: "10100090", designation: "Filtre pompe", quantity: 1 },
    { reference: "10100053", designation: "Joint bouchon filtre pompe", quantity: 1 },
  ],
  "B4 Gear": [
    { reference: "10100090", designation: "Filtre pompe", quantity: 1 },
    { reference: "10100053", designation: "Joint bouchon filtre", quantity: 1 },
  ],
  "B4 NS": [],
  "Micron Piston": [
    { reference: "10100070", designation: "Filtre plat dépôt", quantity: 1 },
    { reference: "150029250", designation: "Filtre distributeur", quantity: 1 },
  ],
  "Micron Gear": [
    { reference: "150029250", designation: "Filtre distributeur", quantity: 1 },
  ],
  "Macro": [],
};

interface MaintenanceMachine {
  id: string;
  type: MachineType;
}

interface MaintenanceGroup {
  id: string;
  machines: MaintenanceMachine[];
  distance: number;
  forfait: "A" | "B" | "C";
  prixBase: number;
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

function getForfait(distance: number): { label: "A" | "B" | "C"; price: number } {
  if (distance < 50) return { label: "A", price: 414 };
  if (distance <= 200) return { label: "B", price: 526 };
  return { label: "C", price: 821.15 };
}

function calcMaintenance(nbMachines: number, prixBase: number) {
  if (nbMachines <= 0) return { total: 0, prixUnitaire: 0, remisePct: 0 };
  const total = prixBase + (nbMachines - 1) * prixBase * 0.6;
  const prixUnitaire = total / nbMachines;
  const remisePct = (1 - prixUnitaire / prixBase) * 100;
  return { total, prixUnitaire, remisePct: Math.round(remisePct) };
}

export default function OffresPage() {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [maintenanceGroups, setMaintenanceGroups] = useState<MaintenanceGroup[]>([]);
  const [refSearch, setRefSearch] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [offreNumero, setOffreNumero] = useState("");
  const [clientInfoOpen, setClientInfoOpen] = useState(true);

  // Maintenance form
  const [maintDistanceStr, setMaintDistanceStr] = useState<string>("0");
  const [maintMachines, setMaintMachines] = useState<MaintenanceMachine[]>([]);
  const [maintNewType, setMaintNewType] = useState<MachineType>("B4 Piston");

  const maintDistance = parseInt(maintDistanceStr) || 0;

  useEffect(() => {
    supabase.from("clients").select("id, name, address, city, contact, phone, email").then(({ data }) => {
      if (data) setClients(data);
    });
    const now = new Date();
    setOffreNumero(
      `EO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`
    );
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
        return prev.map((c) => (c.equipment.id === eq.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { equipment: eq, quantity: 1, discount: 0 }];
    });
    toast.success(`${eq.reference} ajouté au panier`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => (c.equipment.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)).filter((c) => c.quantity > 0)
    );
  };

  const updateDiscount = (id: string, discount: number) => {
    setCart((prev) => prev.map((c) => (c.equipment.id === id ? { ...c, discount: Math.min(100, Math.max(0, discount)) } : c)));
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

  // ── Maintenance machine management ──
  const addMaintMachine = () => {
    setMaintMachines((prev) => [...prev, { id: crypto.randomUUID(), type: maintNewType }]);
  };

  const removeMaintMachine = (id: string) => {
    setMaintMachines((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMaintMachineType = (id: string, type: MachineType) => {
    setMaintMachines((prev) => prev.map((m) => (m.id === id ? { ...m, type } : m)));
  };

  const addMaintenanceGroup = () => {
    if (maintMachines.length <= 0) return;
    const forfait = getForfait(maintDistance);
    setMaintenanceGroups((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        machines: [...maintMachines],
        distance: maintDistance,
        forfait: forfait.label,
        prixBase: forfait.price,
        discount: 0,
      },
    ]);
    setMaintMachines([]);
    toast.success("Forfait maintenance ajouté");
  };

  const removeMaintenanceGroup = (id: string) => {
    setMaintenanceGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const updateMaintenanceDiscount = (id: string, discount: number) => {
    setMaintenanceGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, discount: Math.min(100, Math.max(0, discount)) } : g))
    );
  };

  const updateServiceDiscount = (id: string, discount: number) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, discount: Math.min(100, Math.max(0, discount)) } : s)));
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const totalItems = cart.length + services.length + maintenanceGroups.length;

  const cartTotal = cart.reduce((sum, c) => sum + c.equipment.price * c.quantity * (1 - c.discount / 100), 0);
  const servicesTotal = services.reduce((sum, s) => sum + s.price * (1 - s.discount / 100), 0);
  const maintenanceTotal = maintenanceGroups.reduce((sum, g) => {
    const calc = calcMaintenance(g.machines.length, g.prixBase);
    return sum + calc.total * (1 - g.discount / 100);
  }, 0);
  const grandTotal = cartTotal + servicesTotal + maintenanceTotal;

  const fmtPrice = (n: number) => {
    const parts = n.toFixed(2).split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${intPart},${parts[1]}`;
  };

  const fmtCurrency = (n: number) => `${fmtPrice(n)} €`;

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

    const cyan = { r: 0, g: 172, b: 163 };
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

    let y = 35;
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 60);
    doc.setFont("helvetica", "bold");
    doc.text("TechField Solutions S.A.S.", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text("Zone Industrielle", margin, y + 4);
    doc.text("Tel.: +33 1 00 00 00 00", margin, y + 8);
    doc.text("www.techfield.fr", margin, y + 12);

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
      if (y > h - 45) {
        doc.addPage();
        y = 20;
      }
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
      if (y > h - 45) {
        doc.addPage();
        y = 20;
      }
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
        drawRow(item.equipment.reference.replace("MEL-", ""), item.equipment.designation, String(item.quantity), fmtPrice(item.equipment.price), remiseStr, fmtPrice(lineTotal));
      });
    }

    // Maintenance items — one line per machine
    if (maintenanceGroups.length > 0) {
      drawSectionSep("MAINTENANCE");
      maintenanceGroups.forEach((g) => {
        const nb = g.machines.length;
        const calc = calcMaintenance(nb, g.prixBase);
        const effectiveUnit = calc.prixUnitaire * (1 - g.discount / 100);
        const totalRemise = calc.remisePct + g.discount - (calc.remisePct * g.discount) / 100;
        const remiseStr = totalRemise > 0 ? `${Math.round(totalRemise)}%` : "-";

        g.machines.forEach((machine, idx) => {
          const lineTotal = effectiveUnit;
          const desc = `Maintenance préventive ${machine.type} — Forfait ${g.forfait}`;
          drawRow("", desc, "1", fmtPrice(g.prixBase), remiseStr, fmtPrice(lineTotal));
        });
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

    doc.setFillColor(cyan.r, cyan.g, cyan.b);
    doc.roundedRect(colPU - 20, y - 2, w - margin - colPU + 22, 16, 2, 2, "F");
    doc.setTextColor(white.r, white.g, white.b);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Total net H.T.", colPU - 14, y + 5);
    doc.setFontSize(11);
    doc.text(`${fmtPrice(grandTotal)} €`, colMontant - 2, y + 10, { align: "right" });

    y += 24;

    doc.setFontSize(6);
    doc.setTextColor(140, 140, 150);
    doc.text("TechField Solutions — Document généré automatiquement", w / 2, h - 8, { align: "center" });

    doc.save(`offre_${offreNumero}.pdf`);
    toast.success("PDF téléchargé");
  };

  const maintForfait = getForfait(maintDistance);
  const maintCalc = calcMaintenance(maintMachines.length, maintForfait.price);

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
              <Button variant="ghost" size="sm" onClick={() => setClientInfoOpen(!clientInfoOpen)} className="gap-1 text-xs text-muted-foreground">
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
                <SelectItem key={c.id} value={c.id}>
                  {c.name} — {c.city}
                </SelectItem>
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
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <Label className="text-xs">N° Offre</Label>
                  <Input value={offreNumero} onChange={(e) => setOffreNumero(e.target.value)} />
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
                    <Input placeholder="Rechercher une référence..." value={refSearch} onChange={(e) => setRefSearch(e.target.value)} className="pl-10" />
                  </div>
                  {refSearch && (
                    <div className="space-y-1 max-h-60 overflow-auto">
                      {filteredEquipment.map((eq) => (
                        <Card key={eq.id} className="p-3 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors" onClick={() => addToCart(eq)}>
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
                  <p className="text-sm text-muted-foreground">Sélectionnez les machines et la distance pour calculer le forfait</p>

                  {/* Distance */}
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Distance bureau / client (km)
                    </Label>
                    <Input type="number" min={0} value={maintDistanceStr} onChange={(e) => setMaintDistanceStr(e.target.value)} className="max-w-xs" />
                  </div>

                  {/* Machine list */}
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Machines à maintenir
                    </Label>

                    {maintMachines.map((machine, idx) => (
                      <div key={machine.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                        <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
                        <Select value={machine.type} onValueChange={(v) => updateMaintMachineType(machine.id, v as MachineType)}>
                          <SelectTrigger className="flex-1 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MACHINE_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {idx === 0 ? fmtCurrency(maintForfait.price) : fmtCurrency(maintForfait.price * 0.6)}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeMaintMachine(machine.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    <div className="flex items-center gap-2">
                      <Select value={maintNewType} onValueChange={(v) => setMaintNewType(v as MachineType)}>
                        <SelectTrigger className="flex-1 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MACHINE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={addMaintMachine}>
                        <Plus className="h-3 w-3" />
                        Ajouter
                      </Button>
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
                      <p>{"< 50 km → Forfait A : 414,00 €"}</p>
                      <p>{"50 - 200 km → Forfait B : 526,00 €"}</p>
                      <p>{"> 200 km → Forfait C : 821,15 €"}</p>
                    </div>
                    {maintMachines.length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border">
                        <p>Prix de base unitaire : {fmtCurrency(maintForfait.price)}</p>
                        <p>
                          Quantité : {maintMachines.length} machine{maintMachines.length > 1 ? "s" : ""}
                        </p>
                        {maintCalc.remisePct > 0 && <p>Remise multi-machines : {maintCalc.remisePct}%</p>}
                        <p>Prix final unitaire moyen : {fmtCurrency(maintCalc.prixUnitaire)}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm font-semibold">Total maintenance</span>
                      <span className="text-lg font-bold text-primary">{fmtCurrency(maintCalc.total)}</span>
                    </div>
                  </div>

                  <Button onClick={addMaintenanceGroup} size="sm" className="gap-2" disabled={maintMachines.length <= 0}>
                    <Plus className="h-3 w-3" />
                    Ajouter au panier
                  </Button>
                </TabsContent>

                <TabsContent value="intervention" className="space-y-3">
                  <p className="text-sm text-muted-foreground">Ajoutez une prestation d'intervention à l'offre</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} placeholder="Intervention corrective sur site..." rows={2} />
                    </div>
                    <div>
                      <Label className="text-xs">Montant HT (€)</Label>
                      <Input type="number" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} placeholder="0.00" />
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
                        <Badge variant="outline" className="text-xs text-warning">
                          -{item.discount}%
                        </Badge>
                      )}
                      <span className="text-sm font-semibold w-24 text-right">{fmtCurrency(item.equipment.price * item.quantity * (1 - item.discount / 100))}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.equipment.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {maintenanceGroups.map((g) => {
                  const nb = g.machines.length;
                  const calc = calcMaintenance(nb, g.prixBase);
                  const groupTotal = calc.total * (1 - g.discount / 100);
                  return (
                    <div key={g.id} className="p-3 rounded-xl bg-secondary/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            Maintenance Forfait {g.forfait} — {nb} machine{nb > 1 ? "s" : ""}
                          </p>
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            {g.machines.map((machine, idx) => (
                              <p key={machine.id}>
                                • {machine.type} — {fmtCurrency(idx === 0 && nb > 1 ? g.prixBase : calc.prixUnitaire)}
                              </p>
                            ))}
                          </div>
                          {calc.remisePct > 0 && <p className="text-xs text-muted-foreground mt-1">Remise multi-machines : {calc.remisePct}%</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Input
                            type="number"
                            value={g.discount || ""}
                            onChange={(e) => updateMaintenanceDiscount(g.id, Number(e.target.value))}
                            placeholder="Remise %"
                            className="w-20 h-7 text-xs"
                          />
                          {g.discount > 0 && (
                            <Badge variant="outline" className="text-xs text-warning">
                              -{g.discount}%
                            </Badge>
                          )}
                          <span className="text-sm font-semibold w-24 text-right">{fmtCurrency(groupTotal)}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMaintenanceGroup(g.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {services.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs mb-1">
                        Prestation
                      </Badge>
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
                        <Badge variant="outline" className="text-xs text-warning">
                          -{s.discount}%
                        </Badge>
                      )}
                      <span className="text-sm font-semibold w-24 text-right">{fmtCurrency(s.price * (1 - s.discount / 100))}</span>
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
