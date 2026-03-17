import { useState } from "react";
import { useClients, useMachines, useInterventions, useAddClient } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, ChevronRight, Building2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const { data: machines = [] } = useMachines();
  const { data: interventions = [] } = useInterventions();
  const addClient = useAddClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', email: '', contact: '' });

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name || !form.city) return;
    addClient.mutate(form, { onSuccess: () => { setForm({ name: '', address: '', city: '', phone: '', email: '', contact: '' }); setOpen(false); } });
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} clients enregistrés</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Nouveau client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ajouter un client</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Adresse</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div><Label>Ville *</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><Label>Contact</Label><Input value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} /></div>
              <Button onClick={handleAdd} className="w-full" disabled={addClient.isPending}>Ajouter</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(client => {
          const clientMachines = machines.filter(m => m.client_id === client.id);
          const clientInterventions = interventions.filter(i => i.client_id === client.id);
          return (
            <Link key={client.id} to={`/clients/${client.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-accent" /></div>
                    <div><h3 className="font-semibold text-sm">{client.name}</h3><p className="text-xs text-muted-foreground">{client.city}</p></div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{clientMachines.length} machine{clientMachines.length > 1 ? 's' : ''}</span>
                  <span>{clientInterventions.length} intervention{clientInterventions.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {clientMachines.slice(0, 3).map(m => <StatusBadge key={m.id} status={m.status} />)}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
