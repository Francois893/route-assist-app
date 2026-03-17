import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import type { Intervention } from "@/lib/types";

export default function Interventions() {
  const { clients, machines, interventions, technicians, addIntervention, updateIntervention } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: '', machineId: '', technicianId: '', date: '', type: 'preventive' as Intervention['type'],
    description: '', duration: 0, travelTime: 0, notes: ''
  });

  const clientMachines = machines.filter(m => m.clientId === form.clientId);

  const filtered = interventions.filter(i => {
    const client = clients.find(c => c.id === i.clientId);
    const matchSearch = client?.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSubmit = () => {
    if (!form.clientId || !form.date) return;
    if (editId) {
      updateIntervention(editId, form);
      setEditId(null);
    } else {
      const newInter: Intervention = { id: `i${Date.now()}`, ...form, status: 'planifiee', photos: [] };
      addIntervention(newInter);
    }
    setForm({ clientId: '', machineId: '', technicianId: '', date: '', type: 'preventive', description: '', duration: 0, travelTime: 0, notes: '' });
    setOpen(false);
  };

  const openEdit = (inter: Intervention) => {
    setEditId(inter.id);
    setForm({
      clientId: inter.clientId, machineId: inter.machineId, technicianId: inter.technicianId,
      date: inter.date, type: inter.type, description: inter.description,
      duration: inter.duration, travelTime: inter.travelTime, notes: inter.notes
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Interventions</h1>
          <p className="page-subtitle">{interventions.length} interventions</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditId(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Nouvelle intervention</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? 'Modifier' : 'Nouvelle'} intervention</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Client *</Label>
                <Select value={form.clientId} onValueChange={v => setForm({...form, clientId: v, machineId: ''})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Machine</Label>
                <Select value={form.machineId} onValueChange={v => setForm({...form, machineId: v})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une machine" /></SelectTrigger>
                  <SelectContent>{clientMachines.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Technicien *</Label>
                <Select value={form.technicianId} onValueChange={v => setForm({...form, technicianId: v})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un technicien" /></SelectTrigger>
                  <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v as Intervention['type']})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Préventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="audit">Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Durée (min)</Label><Input type="number" value={form.duration} onChange={e => setForm({...form, duration: +e.target.value})} /></div>
                <div><Label>Trajet (min)</Label><Input type="number" value={form.travelTime} onChange={e => setForm({...form, travelTime: +e.target.value})} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <Button onClick={handleSubmit} className="w-full">{editId ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="planifiee">Planifiée</SelectItem>
            <SelectItem value="en-cours">En cours</SelectItem>
            <SelectItem value="terminee">Terminée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Machine</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Technicien</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inter => {
                const client = clients.find(c => c.id === inter.clientId);
                const machine = machines.find(m => m.id === inter.machineId);
                const tech = technicians.find(t => t.id === inter.technicianId);
                return (
                  <tr key={inter.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">{inter.date}</td>
                    <td className="px-4 py-3 font-medium">{client?.name}</td>
                    <td className="px-4 py-3">{machine?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={inter.type} /></td>
                    <td className="px-4 py-3">{tech?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={inter.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(inter)}>Modifier</Button>
                        {inter.status === 'planifiee' && (
                          <Button variant="ghost" size="sm" onClick={() => updateIntervention(inter.id, { status: 'en-cours' })}>Démarrer</Button>
                        )}
                        {inter.status === 'en-cours' && (
                          <Button variant="ghost" size="sm" onClick={() => updateIntervention(inter.id, { status: 'terminee' })}>Terminer</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
