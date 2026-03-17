import { useParams, Link } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Cpu, Phone, Mail, MapPin, User } from "lucide-react";
import { useState } from "react";
import type { Machine } from "@/lib/types";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { clients, machines, interventions, technicians, addMachine } = useAppStore();
  const client = clients.find(c => c.id === id);
  const clientMachines = machines.filter(m => m.clientId === id);
  const clientInterventions = interventions.filter(i => i.clientId === id);
  const [openMachine, setOpenMachine] = useState(false);
  const [machineForm, setMachineForm] = useState({ name: '', model: '', serialNumber: '' });

  if (!client) return <div className="text-center py-12 text-muted-foreground">Client introuvable</div>;

  const handleAddMachine = () => {
    if (!machineForm.name) return;
    const newMachine: Machine = {
      id: `m${Date.now()}`,
      clientId: client.id,
      name: machineForm.name,
      model: machineForm.model,
      serialNumber: machineForm.serialNumber,
      installDate: new Date().toISOString().split('T')[0],
      status: 'operational',
    };
    addMachine(newMachine);
    setMachineForm({ name: '', model: '', serialNumber: '' });
    setOpenMachine(false);
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
        <h2 className="font-semibold text-lg">Machines ({clientMachines.length})</h2>
        <Dialog open={openMachine} onOpenChange={setOpenMachine}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Ajouter</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle machine</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom *</Label><Input value={machineForm.name} onChange={e => setMachineForm({...machineForm, name: e.target.value})} /></div>
              <div><Label>Modèle</Label><Input value={machineForm.model} onChange={e => setMachineForm({...machineForm, model: e.target.value})} /></div>
              <div><Label>N° série</Label><Input value={machineForm.serialNumber} onChange={e => setMachineForm({...machineForm, serialNumber: e.target.value})} /></div>
              <Button onClick={handleAddMachine} className="w-full">Ajouter</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {clientMachines.map(machine => {
          const machineInterventions = clientInterventions.filter(i => i.machineId === machine.id);
          return (
            <Card key={machine.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-sm">{machine.name}</h3>
                    <p className="text-xs text-muted-foreground">{machine.model} · {machine.serialNumber}</p>
                  </div>
                </div>
                <StatusBadge status={machine.status} />
              </div>
              <p className="text-xs text-muted-foreground mb-2">Installée le {machine.installDate}</p>
              {machineInterventions.length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-medium mb-1">Dernières interventions</p>
                  {machineInterventions.slice(0, 3).map(inter => {
                    const tech = technicians.find(t => t.id === inter.technicianId);
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

      <h2 className="font-semibold text-lg mb-4">Historique des interventions ({clientInterventions.length})</h2>
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
              {clientInterventions.map(inter => {
                const machine = machines.find(m => m.id === inter.machineId);
                const tech = technicians.find(t => t.id === inter.technicianId);
                return (
                  <tr key={inter.id} className="border-t">
                    <td className="px-4 py-3">{inter.date}</td>
                    <td className="px-4 py-3">{machine?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={inter.type} /></td>
                    <td className="px-4 py-3">{tech?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={inter.status} /></td>
                    <td className="px-4 py-3">{inter.duration > 0 ? `${inter.duration} min` : '–'}</td>
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
