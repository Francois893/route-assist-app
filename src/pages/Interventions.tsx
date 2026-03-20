import { useState } from "react";
import { useClients, useMachines, useInterventions, useTechnicians, useAddIntervention, useUpdateIntervention } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Loader2, Wrench, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { DbIntervention } from "@/hooks/use-data";

const SECTIONS = [
  { key: "installation", label: "Installation" },
  { key: "assistance", label: "Assistance" },
  { key: "audit", label: "Audit / Visite" },
  { key: "atelier", label: "Atelier" },
] as const;

const STATUS_ORDER = [
  { key: "planifiee", label: "Planifié" },
  { key: "a-planifier", label: "A planifier" },
  { key: "en-cours", label: "En cours" },
  { key: "terminee", label: "Terminée" },
];

function getSection(type: string): string {
  if (type === "preventive" || type === "installation") return "installation";
  if (type === "corrective" || type === "assistance") return "assistance";
  if (type === "audit") return "audit";
  if (type === "atelier") return "atelier";
  return "installation";
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const TECH_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
  "bg-violet-500", "bg-cyan-500", "bg-orange-500", "bg-teal-500",
];

export default function Interventions() {
  const { data: clients = [] } = useClients();
  const { data: allMachines = [] } = useMachines();
  const { data: interventions = [], isLoading } = useInterventions();
  const { data: technicians = [] } = useTechnicians();
  const addIntervention = useAddIntervention();
  const updateIntervention = useUpdateIntervention();
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    installation: true, assistance: true, audit: true, atelier: true,
  });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_id: '', machine_ids: [] as string[], technician_id: '' as string | null, date: '',
    type: 'installation', description: '', duration: 0, travel_time: 0, notes: ''
  });

  const clientMachines = allMachines.filter(m => m.client_id === form.client_id);

  const toggleMachine = (machineId: string) => {
    setForm(prev => ({
      ...prev,
      machine_ids: prev.machine_ids.includes(machineId)
        ? prev.machine_ids.filter(id => id !== machineId)
        : [...prev.machine_ids, machineId]
    }));
  };

  const filtered = interventions.filter(i => {
    if (!search) return true;
    const client = clients.find(c => c.id === i.client_id);
    return (
      client?.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.description || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSubmit = () => {
    if (!form.client_id) return;
    const payload = {
      ...form,
      machine_id: form.machine_ids[0] || null,
      machine_ids: form.machine_ids,
    };
    if (editId) {
      updateIntervention.mutate({ id: editId, ...payload }, { onSuccess: () => { setOpen(false); setEditId(null); } });
    } else {
      addIntervention.mutate({ ...payload, status: form.date ? 'planifiee' : 'a-planifier', photos: [] } as any, { onSuccess: () => { setOpen(false); } });
    }
  };

  const openEdit = (inter: DbIntervention) => {
    setEditId(inter.id);
    const machineIds = inter.machine_ids?.length
      ? inter.machine_ids
      : inter.machine_id ? [inter.machine_id] : [];
    setForm({
      client_id: inter.client_id, machine_ids: machineIds as string[], technician_id: inter.technician_id,
      date: inter.date, type: inter.type, description: inter.description || '',
      duration: inter.duration || 0, travel_time: inter.travel_time || 0, notes: inter.notes || ''
    });
    setOpen(true);
  };

  const changeStatus = (id: string, status: string) => {
    updateIntervention.mutate({ id, status });
  };

  const techColorMap = new Map<string, string>();
  technicians.forEach((t, i) => techColorMap.set(t.id, TECH_COLORS[i % TECH_COLORS.length]));

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Interventions</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditId(null); }}>
          <DialogTrigger asChild>
            <Button className="rounded-full" onClick={() => { setEditId(null); setForm({ client_id: '', machine_ids: [], technician_id: null, date: '', type: 'installation', description: '', duration: 0, travel_time: 0, notes: '' }); }}>
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? 'Modifier / Planifier' : 'Nouvelle'} intervention</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Client *</Label>
                <Select value={form.client_id} onValueChange={v => setForm({...form, client_id: v, machine_ids: []})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1.5 mb-2"><Wrench className="w-3.5 h-3.5" /> Machines ({form.machine_ids.length})</Label>
                {clientMachines.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{form.client_id ? "Aucune machine pour ce client" : "Sélectionnez d'abord un client"}</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-xl border border-border/50 p-2">
                    {clientMachines.map(m => (
                      <label key={m.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/30 cursor-pointer text-sm">
                        <Checkbox checked={form.machine_ids.includes(m.id)} onCheckedChange={() => toggleMachine(m.id)} />
                        <span>{m.name}</span>
                        {m.model && <span className="text-xs text-muted-foreground">({m.model})</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Technicien</Label>
                <Select value={form.technician_id || ''} onValueChange={v => setForm({...form, technician_id: v || null})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un technicien" /></SelectTrigger>
                  <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="assistance">Assistance</SelectItem>
                    <SelectItem value="audit">Audit / Visite</SelectItem>
                    <SelectItem value="atelier">Atelier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Durée (min)</Label><Input type="number" value={form.duration} onChange={e => setForm({...form, duration: +e.target.value})} /></div>
                <div><Label>Trajet (min)</Label><Input type="number" value={form.travel_time} onChange={e => setForm({...form, travel_time: +e.target.value})} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              {editId && (
                <div>
                  <Label>Statut</Label>
                  <Select value={interventions.find(i => i.id === editId)?.status || 'planifiee'} onValueChange={v => changeStatus(editId, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a-planifier">A planifier</SelectItem>
                      <SelectItem value="planifiee">Planifiée</SelectItem>
                      <SelectItem value="en-cours">En cours</SelectItem>
                      <SelectItem value="terminee">Terminée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleSubmit} className="w-full" disabled={addIntervention.isPending || updateIntervention.isPending}>
                {editId ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Global search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9 rounded-xl" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map(section => {
          const sectionInterventions = filtered.filter(i => getSection(i.type) === section.key);
          const isOpen = openSections[section.key];

          return (
            <Card key={section.key} className="overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <span className="font-semibold text-base">{section.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{sectionInterventions.length}</span>
                  <Switch
                    checked={isOpen}
                    onCheckedChange={(checked) => setOpenSections(prev => ({ ...prev, [section.key]: checked }))}
                  />
                </div>
              </div>

              {isOpen && sectionInterventions.length > 0 && (
                <div className="px-4 pb-4">
                  {STATUS_ORDER.map(status => {
                    const statusInterventions = sectionInterventions.filter(i => i.status === status.key);
                    if (statusInterventions.length === 0) return null;

                    return (
                      <div key={status.key} className="mb-4 last:mb-0">
                        <h3 className="font-bold text-sm mb-2">{status.label}</h3>
                        <div className="space-y-1">
                          {statusInterventions.map(inter => {
                            const client = clients.find(c => c.id === inter.client_id);
                            const tech = technicians.find(t => t.id === inter.technician_id);
                            const techColor = inter.technician_id ? techColorMap.get(inter.technician_id) || "bg-muted" : "bg-muted";
                            const dateStr = inter.date
                              ? new Date(inter.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                              : "";

                            return (
                              <div
                                key={inter.id}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors group cursor-pointer"
                                onClick={() => openEdit(inter)}
                              >
                                <Avatar className="h-10 w-10 shrink-0">
                                  <AvatarFallback className={`${techColor} text-white text-xs font-medium`}>
                                    {tech ? getInitials(tech.name) : "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">
                                    {client?.name || "—"} {client?.city ? `/ ${client.city}` : ""}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {status.label} {dateStr ? `/ ${dateStr}` : ""}
                                  </p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(inter); }}>Modifier</DropdownMenuItem>
                                    {inter.status === "planifiee" && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); changeStatus(inter.id, "en-cours"); }}>Démarrer</DropdownMenuItem>}
                                    {inter.status === "en-cours" && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); changeStatus(inter.id, "terminee"); }}>Terminer</DropdownMenuItem>}
                                    {inter.status !== "a-planifier" && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); changeStatus(inter.id, "a-planifier"); }}>A planifier</DropdownMenuItem>}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isOpen && sectionInterventions.length === 0 && (
                <p className="px-4 pb-4 text-sm text-muted-foreground">Aucune intervention</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
