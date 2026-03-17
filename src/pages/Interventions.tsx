import { useState } from "react";
import { useClients, useMachines, useInterventions, useTechnicians, useAddIntervention, useUpdateIntervention } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Loader2 } from "lucide-react";
import type { DbIntervention } from "@/hooks/use-data";

export default function Interventions() {
  const { data: clients = [] } = useClients();
  const { data: allMachines = [] } = useMachines();
  const { data: interventions = [], isLoading } = useInterventions();
  const { data: technicians = [] } = useTechnicians();
  const addIntervention = useAddIntervention();
  const updateIntervention = useUpdateIntervention();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_id: '', machine_id: '' as string | null, technician_id: '' as string | null, date: '',
    type: 'preventive', description: '', duration: 0, travel_time: 0, notes: ''
  });

  const clientMachines = allMachines.filter(m => m.client_id === form.client_id);

  const filtered = interventions.filter(i => {
    const client = clients.find(c => c.id === i.client_id);
    const matchSearch = client?.name.toLowerCase().includes(search.toLowerCase()) || (i.description || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSubmit = () => {
    if (!form.client_id || !form.date) return;
    if (editId) {
      updateIntervention.mutate({ id: editId, ...form }, { onSuccess: () => { setOpen(false); setEditId(null); } });
    } else {
      addIntervention.mutate({ ...form, status: 'planifiee', photos: [] }, { onSuccess: () => { setOpen(false); } });
    }
  };

  const openEdit = (inter: DbIntervention) => {
    setEditId(inter.id);
    setForm({
      client_id: inter.client_id, machine_id: inter.machine_id, technician_id: inter.technician_id,
      date: inter.date, type: inter.type, description: inter.description || '',
      duration: inter.duration || 0, travel_time: inter.travel_time || 0, notes: inter.notes || ''
    });
    setOpen(true);
  };

  const changeStatus = (id: string, status: string) => {
    updateIntervention.mutate({ id, status });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Interventions</h1>
          <p className="page-subtitle">{interventions.length} interventions</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditId(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm({ client_id: '', machine_id: null, technician_id: null, date: '', type: 'preventive', description: '', duration: 0, travel_time: 0, notes: '' }); }}>
              <Plus className="w-4 h-4 mr-1" /> Nouvelle intervention
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? 'Modifier' : 'Nouvelle'} intervention</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Client *</Label>
                <Select value={form.client_id} onValueChange={v => setForm({...form, client_id: v, machine_id: null})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Machine</Label>
                <Select value={form.machine_id || ''} onValueChange={v => setForm({...form, machine_id: v || null})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une machine" /></SelectTrigger>
                  <SelectContent>{clientMachines.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Technicien</Label>
                <Select value={form.technician_id || ''} onValueChange={v => setForm({...form, technician_id: v || null})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un technicien" /></SelectTrigger>
                  <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
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
                <div><Label>Trajet (min)</Label><Input type="number" value={form.travel_time} onChange={e => setForm({...form, travel_time: +e.target.value})} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              {editId && (
                <div>
                  <Label>Statut</Label>
                  <Select value={form.type === form.type ? (interventions.find(i => i.id === editId)?.status || 'planifiee') : 'planifiee'} onValueChange={v => changeStatus(editId, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
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
                const client = clients.find(c => c.id === inter.client_id);
                const machine = allMachines.find(m => m.id === inter.machine_id);
                const tech = technicians.find(t => t.id === inter.technician_id);
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
                          <Button variant="ghost" size="sm" onClick={() => changeStatus(inter.id, 'en-cours')}>Démarrer</Button>
                        )}
                        {inter.status === 'en-cours' && (
                          <Button variant="ghost" size="sm" onClick={() => changeStatus(inter.id, 'terminee')}>Terminer</Button>
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
