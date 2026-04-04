import { useParams, Link } from "react-router-dom";
import { useClient, useMachines, useInterventions, useTechnicians, useAddMachine, useUpdateMachine } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Cpu, Phone, Mail, MapPin, User, Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import type { DbMachine } from "@/hooks/use-data";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading: lc } = useClient(id);
  const { data: machines = [] } = useMachines(id);
  const { data: interventions = [] } = useInterventions(id);
  const { data: technicians = [] } = useTechnicians();
  const addMachine = useAddMachine();
  const updateMachine = useUpdateMachine();
  const [openMachine, setOpenMachine] = useState(false);
  const [editMachine, setEditMachine] = useState<DbMachine | null>(null);
  const [machineForm, setMachineForm] = useState({ name: '', model: '', serial_number: '', status: 'operational' as string, type: '' as string });

  if (lc) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!client) return <div className="text-center py-12 text-muted-foreground">Client introuvable</div>;

  const openAdd = () => {
    setEditMachine(null);
    setMachineForm({ name: '', model: '', serial_number: '', status: 'operational', type: '' });
    setOpenMachine(true);
  };

  const openEdit = (m: DbMachine) => {
    setEditMachine(m);
    setMachineForm({ name: m.name, model: m.model || '', serial_number: m.serial_number || '', status: m.status, type: m.type || '' });
    setOpenMachine(true);
  };

  const handleSubmitMachine = () => {
    if (!machineForm.name) return;
    if (editMachine) {
      updateMachine.mutate({ id: editMachine.id, name: machineForm.name, model: machineForm.model, serial_number: machineForm.serial_number, status: machineForm.status, type: machineForm.type || null }, {
        onSuccess: () => { setOpenMachine(false); setEditMachine(null); }
      });
    } else {
      addMachine.mutate({
        client_id: client.id,
        name: machineForm.name,
        model: machineForm.model,
        serial_number: machineForm.serial_number,
        install_date: new Date().toISOString().split('T')[0],
        status: machineForm.status,
      }, {
        onSuccess: () => { setOpenMachine(false); }
      });
    }
  };

  return (
    <div>
      <Link to="/clients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour aux clients
      </Link>

      <Card className="p-5 mb-6">
        <h1 className="text-xl font-bold mb-4">{client.name}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" />{client.address}, {client.city}</div>
          <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{client.phone}</div>
          <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{client.email}</div>
          <div className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4" />Contact: {client.contact}</div>
        </div>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Machines ({machines.length})</h2>
        <Dialog open={openMachine} onOpenChange={(o) => { setOpenMachine(o); if (!o) setEditMachine(null); }}>
          <DialogTrigger asChild><Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Ajouter</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editMachine ? 'Modifier la machine' : 'Nouvelle machine'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom *</Label><Input value={machineForm.name} onChange={e => setMachineForm({...machineForm, name: e.target.value})} /></div>
              <div><Label>Modèle</Label><Input value={machineForm.model} onChange={e => setMachineForm({...machineForm, model: e.target.value})} /></div>
              <div><Label>N° série</Label><Input value={machineForm.serial_number} onChange={e => setMachineForm({...machineForm, serial_number: e.target.value})} /></div>
              <div>
                <Label>Statut</Label>
                <Select value={machineForm.status} onValueChange={v => setMachineForm({...machineForm, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Opérationnel</SelectItem>
                    <SelectItem value="maintenance">En maintenance</SelectItem>
                    <SelectItem value="hors-service">Hors service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmitMachine} className="w-full" disabled={addMachine.isPending || updateMachine.isPending}>
                {editMachine ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {machines.map(machine => {
          const machineInterventions = interventions.filter(i => 
            i.machine_id === machine.id || (i.machine_ids && i.machine_ids.includes(machine.id))
          );
          return (
            <Card key={machine.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-sm">{machine.name}</h3>
                    <p className="text-xs text-muted-foreground">{machine.model} · {machine.serial_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={machine.status} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(machine)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Installée le {machine.install_date}</p>
              {machineInterventions.length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-medium mb-1">Dernières interventions</p>
                  {machineInterventions.slice(0, 3).map(inter => {
                    const tech = technicians.find(t => t.id === inter.technician_id);
                    return (
                      <div key={inter.id} className="text-xs text-muted-foreground flex items-center justify-between py-1">
                        <span>{inter.date} – {tech?.name}</span>
                        <StatusBadge status={inter.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <h2 className="font-semibold text-lg mb-4">Historique des interventions ({interventions.length})</h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Machine</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Technicien</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-left px-4 py-3 font-medium">Durée</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map(inter => {
                const machine = machines.find(m => m.id === inter.machine_id);
                const tech = technicians.find(t => t.id === inter.technician_id);
                return (
                  <tr key={inter.id} className="border-t">
                    <td className="px-4 py-3">{inter.date}</td>
                    <td className="px-4 py-3">{machine?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={inter.type} /></td>
                    <td className="px-4 py-3">{tech?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={inter.status} /></td>
                    <td className="px-4 py-3">{inter.duration && inter.duration > 0 ? `${inter.duration} min` : '–'}</td>
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
