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

interface MachineAuditData {
  machine_id: string;
  machine_name: string;
  etat_general: string;
  securite: string;
  proprete: string;
  usure: string;
  checklist: { id: string; label: string; checked: boolean; comment: string }[];
  observations: string;
}

const etatLabel: Record<string, string> = { bon: "Bon", moyen: "Moyen", mauvais: "Mauvais" };
const securiteLabel: Record<string, string> = { conforme: "Conforme", "non-conforme": "Non conforme" };
const usureLabel: Record<string, string> = { faible: "Faible", moyenne: "Moyenne", elevee: "Élevée" };

const etatColor = (v: string | null) => v === "bon" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : v === "moyen" ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-red-500/15 text-red-400 border-red-500/20";
const securiteColor = (v: string | null) => v === "conforme" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-red-500/15 text-red-400 border-red-500/20";

function getMachineAudits(audit: DbAudit): MachineAuditData[] {
  const checklist = audit.checklist as any;
  if (Array.isArray(checklist) && checklist.length > 0 && checklist[0]?.machine_id) {
    return checklist as MachineAuditData[];
  }
  // Legacy format: single checklist for all machines
  return [];
}

export default function AuditHistoryPage() {
  const { data: audits = [], isLoading } = useAudits();
  const { data: clients = [] } = useClients();
  const { data: machines = [] } = useMachines();
  const { data: interventions = [] } = useInterventions();
  const { data: technicians = [] } = useTechnicians();
  const [search, setSearch] = useState("");
  const [selectedAudit, setSelectedAudit] = useState<DbAudit | null>(null);

  const getAuditMachines = (audit: DbAudit) => {
    const ids: string[] = (audit as any).machine_ids?.length ? (audit as any).machine_ids : [];
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

  const exportPDF = (audit: DbAudit) => {
    const { client, machines: auditMachines, tech, inter } = getAuditContext(audit);
    const perMachine = getMachineAudits(audit);
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 20;
    const lh = 7;
    const margin = 20;
    const contentW = pageW - margin * 2;

    const checkPage = (needed: number) => {
      if (y + needed > pageH - 20) { doc.addPage(); y = 20; }
    };

    const statusConfig: Record<string, { label: string; r: number; g: number; b: number }> = {
      'ok': { label: 'OK', r: 34, g: 160, b: 34 },
      'attention': { label: 'À prévoir', r: 220, g: 150, b: 0 },
      'danger': { label: 'À changer', r: 210, g: 40, b: 40 },
      'non-verifie': { label: 'Non vérifié', r: 150, g: 150, b: 150 },
    };

    // Header — light theme with accent
    doc.setFillColor(0, 90, 170);
    doc.rect(0, 0, pageW, 42, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("RAPPORT D'AUDIT", margin, 22);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${format(new Date(audit.date), "dd MMMM yyyy", { locale: fr })}`, margin, 33);
    doc.text(`Réf: AUD-${audit.id.slice(0, 8).toUpperCase()}`, pageW - margin - 50, 33);
    y = 52;

    const drawInfoBlock = (title: string, items: [string, string][]) => {
      checkPage(10 + items.length * lh + 5);
      // Title bar
      doc.setFillColor(235, 240, 248);
      doc.roundedRect(margin, y, contentW, 10 + items.length * lh, 3, 3, "F");
      doc.setDrawColor(0, 90, 170);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentW, 10 + items.length * lh, 3, 3, "S");
      doc.setTextColor(0, 70, 140);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin + 5, y + 7);
      y += 12;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      items.forEach(([label, value]) => {
        doc.setTextColor(100, 100, 100);
        doc.text(label, margin + 5, y);
        doc.setTextColor(30, 30, 30);
        const lines = doc.splitTextToSize(value, contentW - 65);
        doc.text(lines[0] || "", margin + 55, y);
        y += lh;
      });
      y += 5;
    };

    const machineNames = auditMachines.map((m: any) => m?.name).filter(Boolean).join(", ") || "—";

    drawInfoBlock("INFORMATIONS GÉNÉRALES", [
      ["Client :", client?.name || "—"],
      ["Machines :", machineNames],
      ["Technicien :", tech?.name || "—"],
      ["Intervention :", inter?.description || "—"],
    ]);

    // Per-machine details
    if (perMachine.length > 0) {
      perMachine.forEach((ma) => {
        checkPage(50);
        // Machine header
        doc.setFillColor(0, 90, 170);
        doc.roundedRect(margin, y, contentW, 8, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        const typeLabel = ma.machine_type ? ` (${ma.machine_type})` : "";
        doc.text(`MACHINE : ${ma.machine_name}${typeLabel}`, margin + 5, y + 6);
        y += 14;

        // Évaluation
        drawInfoBlock("ÉVALUATION", [
          ["État général :", etatLabel[ma.etat_general] || "—"],
          ["Sécurité :", securiteLabel[ma.securite] || "—"],
          ["Propreté :", etatLabel[ma.proprete] || "—"],
          ["Usure :", usureLabel[ma.usure] || "—"],
        ]);

        // Checklist
        if (ma.checklist?.length > 0) {
          // Group by category
          const groups: { category: string; items: any[] }[] = [];
          ma.checklist.forEach((item: any) => {
            const cat = item.category || "Général";
            const last = groups[groups.length - 1];
            if (last && last.category === cat) { last.items.push(item); }
            else { groups.push({ category: cat, items: [item] }); }
          });

          groups.forEach((group) => {
            const rowH = 8;
            const blockH = 10 + group.items.length * rowH;
            checkPage(blockH + 5);

            // Category header
            doc.setFillColor(235, 240, 248);
            doc.setDrawColor(0, 90, 170);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, y, contentW, blockH, 2, 2, "FD");
            doc.setTextColor(0, 70, 140);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(group.category, margin + 5, y + 7);
            y += 12;

            group.items.forEach((item: any) => {
              checkPage(rowH + 3);
              const status = item.status || (item.checked ? 'ok' : 'non-verifie');
              const cfg = statusConfig[status] || statusConfig['non-verifie'];

              // Status colored pill
              doc.setFillColor(cfg.r, cfg.g, cfg.b);
              doc.roundedRect(margin + 4, y - 3.5, 22, 5, 1.5, 1.5, "F");
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(6.5);
              doc.setFont("helvetica", "bold");
              doc.text(cfg.label, margin + 5.5, y);

              // Label
              doc.setTextColor(30, 30, 30);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(9);
              doc.text(item.label || "", margin + 30, y);

              // Comment
              if (item.comment) {
                doc.setTextColor(120, 120, 120);
                doc.setFontSize(7.5);
                doc.text(`→ ${item.comment}`, margin + 30, y + 4);
                y += 3;
              }
              y += rowH;
            });
            y += 4;
          });
        }

        // Observations per machine
        if (ma.observations) {
          checkPage(20);
          const lines = doc.splitTextToSize(ma.observations, contentW - 10);
          const blockH = 12 + lines.length * 5;
          doc.setFillColor(245, 245, 245);
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.roundedRect(margin, y, contentW, blockH, 3, 3, "FD");
          doc.setTextColor(0, 70, 140);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text("OBSERVATIONS", margin + 5, y + 7);
          y += 14;
          doc.setTextColor(50, 50, 50);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(lines, margin + 5, y);
          y += lines.length * 5 + 5;
        }

        y += 5;
      });
    } else {
      // Legacy single evaluation
      drawInfoBlock("ÉVALUATION", [
        ["État général :", etatLabel[audit.etat_general || ""] || "—"],
        ["Sécurité :", securiteLabel[audit.securite || ""] || "—"],
        ["Propreté :", etatLabel[audit.proprete || ""] || "—"],
        ["Usure :", usureLabel[audit.usure || ""] || "—"],
      ]);

      const legacyChecklist = (audit.checklist as any[]) || [];
      if (legacyChecklist.length > 0 && !legacyChecklist[0]?.machine_id) {
        checkPage(14 + legacyChecklist.length * 10);
        doc.setFillColor(235, 240, 248);
        doc.setDrawColor(0, 90, 170);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, y, contentW, 10 + legacyChecklist.length * (lh + 3), 3, 3, "FD");
        doc.setTextColor(0, 70, 140);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("CHECKLIST DE VÉRIFICATION", margin + 5, y + 7);
        y += 14;
        legacyChecklist.forEach((item: any) => {
          checkPage(lh + 5);
          const status = item.status || (item.checked ? 'ok' : 'non-verifie');
          const cfg = statusConfig[status] || statusConfig['non-verifie'];

          doc.setFillColor(cfg.r, cfg.g, cfg.b);
          doc.roundedRect(margin + 4, y - 3.5, 22, 5, 1.5, 1.5, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "bold");
          doc.text(cfg.label, margin + 5.5, y);

          doc.setTextColor(30, 30, 30);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.text(item.label || "", margin + 30, y);
          if (item.comment) {
            y += lh - 2;
            doc.setTextColor(120, 120, 120);
            doc.setFontSize(7.5);
            doc.text(`→ ${item.comment}`, margin + 30, y);
          }
          y += lh;
        });
        y += 5;
      }
    }

    // General recommandations
    const drawTextBlock = (title: string, text: string) => {
      if (!text) return;
      checkPage(25);
      const lines = doc.splitTextToSize(text, contentW - 10);
      const blockH = 12 + lines.length * 5;
      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentW, blockH, 3, 3, "FD");
      doc.setTextColor(0, 70, 140);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin + 5, y + 7);
      y += 14;
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(lines, margin + 5, y);
      y += lines.length * 5 + 5;
    };

    if (perMachine.length === 0) {
      drawTextBlock("OBSERVATIONS", audit.observations || "");
    }
    drawTextBlock("RECOMMANDATIONS", audit.recommandations || "");

    // Footer
    doc.setFillColor(0, 90, 170);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("TechField — Rapport d'audit généré automatiquement", margin, pageH - 3);
    doc.text(format(new Date(), "dd/MM/yyyy HH:mm"), pageW - margin - 30, pageH - 3);

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
            const perMachine = getMachineAudits(selectedAudit);
            const legacyChecklist = perMachine.length === 0 ? ((selectedAudit.checklist as any[]) || []) : [];

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

                {/* Per-machine detail view */}
                {perMachine.length > 0 ? (
                  perMachine.map((ma, idx) => (
                    <div key={idx}>
                      <Separator />
                      <div className="mt-3">
                        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-primary" />
                          {ma.machine_name}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                          {[
                            ["État", etatLabel[ma.etat_general], etatColor(ma.etat_general)],
                            ["Sécurité", securiteLabel[ma.securite], securiteColor(ma.securite)],
                            ["Propreté", etatLabel[ma.proprete], etatColor(ma.proprete)],
                            ["Usure", usureLabel[ma.usure], etatColor(ma.usure === "faible" ? "bon" : ma.usure === "moyenne" ? "moyen" : "mauvais")],
                          ].map(([label, value, color]) => (
                            <div key={label as string} className="text-center p-2 rounded-xl bg-muted/30">
                              <span className="text-xs text-muted-foreground block mb-1">{label}</span>
                              <Badge variant="outline" className={color as string}>{value || "—"}</Badge>
                            </div>
                          ))}
                        </div>
                        {ma.checklist?.length > 0 && (
                          <div className="space-y-1.5 mb-3">
                            {ma.checklist.map((item, i) => (
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
                        )}
                        {ma.observations && (
                          <div className="p-3 rounded-xl bg-muted/20 text-sm">
                            <span className="text-xs text-muted-foreground">Observations</span>
                            <p className="mt-1">{ma.observations}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <>
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

                    {legacyChecklist.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-semibold text-sm mb-2">Checklist</h3>
                          <div className="space-y-2">
                            {legacyChecklist.map((item: any, i: number) => (
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
                      </>
                    )}
                  </>
                )}

                {selectedAudit.recommandations && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-sm mb-1">Recommandations</h3>
                      <p className="text-sm text-muted-foreground">{selectedAudit.recommandations}</p>
                    </div>
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
