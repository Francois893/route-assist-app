import { useState } from "react";
import { useAudits, useClients, useMachines, useInterventions, useTechnicians } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Search, FileDown, Eye, ClipboardCheck, CheckCircle2, XCircle, Calendar, User, Wrench } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import type { DbAudit } from "@/hooks/use-data";

export default function AuditHistoryPage() {
  const { data: audits = [], isLoading } = useAudits();
  const { data: clients = [] } = useClients();
  const { data: machines = [] } = useMachines();
  const { data: interventions = [] } = useInterventions();
  const { data: technicians = [] } = useTechnicians();
  const [search, setSearch] = useState("");
  const [selectedAudit, setSelectedAudit] = useState<DbAudit | null>(null);

  const getAuditMachines = (audit: DbAudit) => {
    const ids: string[] = (audit as any).machine_ids?.length
      ? (audit as any).machine_ids
      : [];
    // Fallback to intervention's machines
    if (ids.length === 0) {
      const inter = interventions.find(i => i.id === audit.intervention_id);
      if (inter) {
        const interIds: string[] = (inter as any).machine_ids?.length
          ? (inter as any).machine_ids
          : inter.machine_id ? [inter.machine_id] : [];
        return interIds.map(id => machines.find(m => m.id === id)).filter(Boolean);
      }
    }
    return ids.map(id => machines.find(m => m.id === id)).filter(Boolean);
  };

  const getAuditContext = (audit: DbAudit) => {
    const inter = interventions.find(i => i.id === audit.intervention_id);
    const client = inter ? clients.find(c => c.id === inter.client_id) : null;
    const auditMachines = getAuditMachines(audit);
    const tech = technicians.find(t => t.id === audit.technician_id);
    return { inter, client, machines: auditMachines, tech };
  };

  const filtered = audits.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    const { client, machines: ms, tech } = getAuditContext(a);
    return (
      client?.name?.toLowerCase().includes(q) ||
      ms.some((m: any) => m?.name?.toLowerCase().includes(q)) ||
      tech?.name?.toLowerCase().includes(q) ||
      a.date?.toLowerCase().includes(q)
    );
  });

  const etatLabel: Record<string, string> = { bon: "Bon", moyen: "Moyen", mauvais: "Mauvais" };
  const securiteLabel: Record<string, string> = { conforme: "Conforme", "non-conforme": "Non conforme" };
  const usureLabel: Record<string, string> = { faible: "Faible", moyenne: "Moyenne", elevee: "Élevée" };

  const etatColor = (v: string | null) => v === "bon" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : v === "moyen" ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-red-500/15 text-red-400 border-red-500/20";
  const securiteColor = (v: string | null) => v === "conforme" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-red-500/15 text-red-400 border-red-500/20";

  const exportPDF = (audit: DbAudit) => {
    const { client, machines: auditMachines, tech, inter } = getAuditContext(audit);
    const machineNames = auditMachines.map((m: any) => m?.name).filter(Boolean).join(", ") || "—";
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;
    const lh = 7;
    const margin = 20;
    const contentW = pageW - margin * 2;

    doc.setFillColor(20, 24, 31);
    doc.rect(0, 0, pageW, 45, "F");
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 45, pageW, 2, "F");

    doc.setTextColor(249, 115, 22);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("RAPPORT D'AUDIT", margin, 25);

    doc.setTextColor(180, 180, 180);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${format(new Date(audit.date), "dd MMMM yyyy", { locale: fr })}`, margin, 35);
    doc.text(`Réf: AUD-${audit.id.slice(0, 8).toUpperCase()}`, pageW - margin - 50, 35);

    y = 58;

    const drawInfoBlock = (title: string, items: [string, string][]) => {
      doc.setFillColor(30, 35, 45);
      doc.roundedRect(margin, y, contentW, 10 + items.length * lh, 3, 3, "F");
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin + 5, y + 7);
      y += 12;
      doc.setTextColor(220, 220, 220);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      items.forEach(([label, value]) => {
        doc.setTextColor(140, 140, 140);
        doc.text(label, margin + 5, y);
        doc.setTextColor(220, 220, 220);
        doc.text(value, margin + 55, y);
        y += lh;
      });
      y += 5;
    };

    drawInfoBlock("INFORMATIONS GÉNÉRALES", [
      ["Client :", client?.name || "—"],
      ["Machines :", machineNames],
      ["Technicien :", tech?.name || "—"],
      ["Intervention :", inter?.description || "—"],
    ]);

    drawInfoBlock("ÉVALUATION", [
      ["État général :", etatLabel[audit.etat_general || ""] || "—"],
      ["Sécurité :", securiteLabel[audit.securite || ""] || "—"],
      ["Propreté :", etatLabel[audit.proprete || ""] || "—"],
      ["Usure :", usureLabel[audit.usure || ""] || "—"],
    ]);

    const checklist = (audit.checklist as any[]) || [];
    if (checklist.length > 0) {
      doc.setFillColor(30, 35, 45);
      doc.roundedRect(margin, y, contentW, 10 + checklist.length * (lh + 3), 3, 3, "F");
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("CHECKLIST DE VÉRIFICATION", margin + 5, y + 7);
      y += 14;

      checklist.forEach((item: any) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const icon = item.checked ? "✓" : "✗";
        doc.setTextColor(item.checked ? 34 : 239, item.checked ? 197 : 68, item.checked ? 94 : 68);
        doc.setFont("helvetica", "bold");
        doc.text(icon, margin + 5, y);
        doc.setTextColor(220, 220, 220);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(item.label || "", margin + 14, y);
        if (item.comment) {
          y += lh - 2;
          doc.setTextColor(140, 140, 140);
          doc.setFontSize(8);
          doc.text(`→ ${item.comment}`, margin + 14, y);
        }
        y += lh;
      });
      y += 5;
    }

    const drawTextBlock = (title: string, text: string) => {
      if (!text) return;
      if (y > 240) { doc.addPage(); y = 20; }
      const lines = doc.splitTextToSize(text, contentW - 10);
      doc.setFillColor(30, 35, 45);
      doc.roundedRect(margin, y, contentW, 12 + lines.length * 5, 3, 3, "F");
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin + 5, y + 7);
      y += 14;
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(lines, margin + 5, y);
      y += lines.length * 5 + 5;
    };

    drawTextBlock("OBSERVATIONS", audit.observations || "");
    drawTextBlock("RECOMMANDATIONS", audit.recommandations || "");

    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(249, 115, 22);
    doc.rect(0, pageH - 12, pageW, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("TechField — Rapport d'audit généré automatiquement", margin, pageH - 4);
    doc.text(format(new Date(), "dd/MM/yyyy HH:mm"), pageW - margin - 30, pageH - 4);

    doc.save(`audit-${client?.name?.replace(/\s+/g, "_") || "rapport"}-${audit.date}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Historique des audits</h1>
            <p className="page-subtitle">{audits.length} audit{audits.length > 1 ? "s" : ""} enregistré{audits.length > 1 ? "s" : ""}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = "/audit"}>
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Nouvel audit
          </Button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher par client, machine, technicien..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun audit trouvé</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(audit => {
            const { client, machines: auditMachines, tech } = getAuditContext(audit);
            const machineNames = auditMachines.map((m: any) => m?.name).filter(Boolean).join(", ");
            return (
              <Card key={audit.id} className="p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{client?.name || "Client inconnu"}</span>
                      <Badge variant="outline" className={etatColor(audit.etat_general)}>
                        {etatLabel[audit.etat_general || ""] || "—"}
                      </Badge>
                      <Badge variant="outline" className={securiteColor(audit.securite)}>
                        {securiteLabel[audit.securite || ""] || "—"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(audit.date), "dd MMM yyyy", { locale: fr })}
                      </span>
                      {tech && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {tech.name}
                        </span>
                      )}
                      {machineNames && (
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          {machineNames}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedAudit(audit)} title="Voir">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => exportPDF(audit)} title="Exporter PDF">
                      <FileDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedAudit} onOpenChange={() => setSelectedAudit(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedAudit && (() => {
            const { client, machines: auditMachines, tech, inter } = getAuditContext(selectedAudit);
            const machineNames = auditMachines.map((m: any) => m?.name).filter(Boolean).join(", ") || "—";
            const checklist = (selectedAudit.checklist as any[]) || [];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                    Audit — {client?.name || "—"}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-muted/30">
                    <span className="text-xs text-muted-foreground">Date</span>
                    <p className="font-medium">{format(new Date(selectedAudit.date), "dd MMMM yyyy", { locale: fr })}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30">
                    <span className="text-xs text-muted-foreground">Technicien</span>
                    <p className="font-medium">{tech?.name || "—"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 col-span-2">
                    <span className="text-xs text-muted-foreground">Machines</span>
                    <p className="font-medium">{machineNames}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 col-span-2">
                    <span className="text-xs text-muted-foreground">Intervention</span>
                    <p className="font-medium truncate">{inter?.description || "—"}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ["État", etatLabel[selectedAudit.etat_general || ""], etatColor(selectedAudit.etat_general)],
                    ["Sécurité", securiteLabel[selectedAudit.securite || ""], securiteColor(selectedAudit.securite)],
                    ["Propreté", etatLabel[selectedAudit.proprete || ""], etatColor(selectedAudit.proprete)],
                    ["Usure", usureLabel[selectedAudit.usure || ""], etatColor(selectedAudit.usure === "faible" ? "bon" : selectedAudit.usure === "moyenne" ? "moyen" : "mauvais")],
                  ].map(([label, value, color]) => (
                    <div key={label as string} className="text-center p-3 rounded-xl bg-muted/30">
                      <span className="text-xs text-muted-foreground block mb-1">{label}</span>
                      <Badge variant="outline" className={color as string}>{value || "—"}</Badge>
                    </div>
                  ))}
                </div>

                {checklist.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Checklist</h3>
                      <div className="space-y-2">
                        {checklist.map((item: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/20">
                            {item.checked ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                            )}
                            <div>
                              <span>{item.label}</span>
                              {item.comment && <p className="text-xs text-muted-foreground mt-0.5">→ {item.comment}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {(selectedAudit.observations || selectedAudit.recommandations) && (
                  <>
                    <Separator />
                    {selectedAudit.observations && (
                      <div>
                        <h3 className="font-semibold text-sm mb-1">Observations</h3>
                        <p className="text-sm text-muted-foreground">{selectedAudit.observations}</p>
                      </div>
                    )}
                    {selectedAudit.recommandations && (
                      <div>
                        <h3 className="font-semibold text-sm mb-1">Recommandations</h3>
                        <p className="text-sm text-muted-foreground">{selectedAudit.recommandations}</p>
                      </div>
                    )}
                  </>
                )}

                {(selectedAudit.photos?.length ?? 0) > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Photos</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedAudit.photos!.map((photo, i) => (
                          <img key={i} src={photo} alt={`Photo ${i + 1}`} className="w-full h-24 object-cover rounded-lg border" />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-2">
                  <Button onClick={() => exportPDF(selectedAudit)}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Exporter en PDF
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
