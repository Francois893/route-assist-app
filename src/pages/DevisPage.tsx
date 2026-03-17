import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, TrendingUp } from "lucide-react";
import type { Devis } from "@/lib/types";

export default function DevisPage() {
  const { clients, devis, interventions, addDevis, updateDevis } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    interventionId: '', clientId: '', numeroOffre: '', montant: 0, description: '', status: 'en-attente' as Devis['status']
  });

  const filtered = devis.filter(d => {
    const client = clients.find(c => c.id === d.clientId);
    const matchSearch = client?.name.toLowerCase().includes(search.toLowerCase()) || d.numeroOffre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalEnAttente = devis.filter(d => d.status === 'en-attente').reduce((s, d) => s + d.montant, 0);
  const totalAccepte = devis.filter(d => d.status === 'accepte').reduce((s, d) => s + d.montant, 0);
  const totalRefuse = devis.filter(d => d.status === 'refuse').reduce((s, d) => s + d.montant, 0);

  const handleSubmit = () => {
    if (!form.clientId || !form.numeroOffre) return;
    if (editId) {
      updateDevis(editId, form);
      setEditId(null);
    } else {
      const newDevis: Devis = { id: `d${Date.now()}`, ...form, dateCreation: new Date().toISOString().split('T')[0] };
      addDevis(newDevis);
    }
    setForm({ interventionId: '', clientId: '', numeroOffre: '', montant: 0, description: '', status: 'en-attente' });
    setOpen(false);
  };

  const openEdit = (d: Devis) => {
    setEditId(d.id);
    setForm({ interventionId: d.interventionId, clientId: d.clientId, numeroOffre: d.numeroOffre, montant: d.montant, description: d.description, status: d.status });
    setOpen(true);
  };

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Suivi des devis</h1>
          <p className="page-subtitle">{devis.length} devis</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditId(null); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Nouveau devis</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Modifier' : 'Nouveau'} devis</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Client *</Label>
                <Select value={form.clientId} onValueChange={v => setForm({...form, clientId: v})}>
                  <SelectTrigger><SelectValue placeholder="Client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Intervention</Label>
                <Select value={form.interventionId} onValueChange={v => setForm({...form, interventionId: v})}>
                  <SelectTrigger><SelectValue placeholder="Intervention (optionnel)" /></SelectTrigger>
                  <SelectContent>{interventions.map(i => <SelectItem key={i.id} value={i.id}>{i.date} – {i.description}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>N° Offre *</Label><Input value={form.numeroOffre} onChange={e => setForm({...form, numeroOffre: e.target.value})} placeholder="OFF-2025-XXX" /></div>
              <div><Label>Montant (€)</Label><Input type="number" value={form.montant} onChange={e => setForm({...form, montant: +e.target.value})} /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              {editId && (
                <div>
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v as Devis['status']})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-attente">En attente</SelectItem>
                      <SelectItem value="accepte">Accepté</SelectItem>
                      <SelectItem value="refuse">Refusé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleSubmit} className="w-full">{editId ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="stat-card">
          <p className="text-xs text-muted-foreground mb-1">En attente</p>
          <p className="text-xl font-bold text-warning">{totalEnAttente.toLocaleString()}€</p>
        </Card>
        <Card className="stat-card">
          <p className="text-xs text-muted-foreground mb-1">Acceptés</p>
          <p className="text-xl font-bold text-success">{totalAccepte.toLocaleString()}€</p>
        </Card>
        <Card className="stat-card">
          <p className="text-xs text-muted-foreground mb-1">Refusés</p>
          <p className="text-xl font-bold text-destructive">{totalRefuse.toLocaleString()}€</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="en-attente">En attente</SelectItem>
            <SelectItem value="accepte">Accepté</SelectItem>
            <SelectItem value="refuse">Refusé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">N° Offre</th>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Montant</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const client = clients.find(c => c.id === d.clientId);
                return (
                  <tr key={d.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{d.numeroOffre}</td>
                    <td className="px-4 py-3 font-medium">{client?.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.description}</td>
                    <td className="px-4 py-3 font-semibold">{d.montant.toLocaleString()}€</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{d.dateCreation}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>Modifier</Button>
                        {d.status === 'en-attente' && (
                          <>
                            <Button variant="ghost" size="sm" className="text-success" onClick={() => updateDevis(d.id, { status: 'accepte' })}>Accepter</Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateDevis(d.id, { status: 'refuse' })}>Refuser</Button>
                          </>
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
