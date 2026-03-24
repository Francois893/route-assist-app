import { useState, useRef } from "react";
import { useClients, useMachines, useInterventions, useTechnicians, useAddAudit } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { defaultAuditChecklist } from "@/lib/mock-data";
import { Camera, CheckCircle, X, Loader2, Wrench, ChevronDown } from "lucide-react";
import type { AuditChecklistItem } from "@/lib/types";

interface MachineAuditState {
  etatGeneral: string;
  securite: string;
  proprete: string;
  usure: string;
  checklist: AuditChecklistItem[];
  observations: string;
}

const createDefaultMachineState = (): MachineAuditState => ({
  etatGeneral: "bon",
  securite: "conforme",
  proprete: "bon",
  usure: "faible",
  checklist: defaultAuditChecklist.map(c => ({ ...c })),
  observations: "",
});

export default function AuditPage() {
  const { data: clients = [] } = useClients();
  const { data: machines = [] } = useMachines();
  const { data: interventions = [] } = useInterventions();
  const { data: technicians = [] } = useTechnicians();
  const addAudit = useAddAudit();
  const [selectedIntervention, setSelectedIntervention] = useState("");
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);
  const [machineStates, setMachineStates] = useState<Record<string, MachineAuditState>>({});
  const [recommandations, setRecommandations] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [openMachines, setOpenMachines] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMachineState = (machineId: string, update: Partial<MachineAuditState>) => {
    setMachineStates(prev => ({
      ...prev,
      [machineId]: { ...(prev[machineId] || createDefaultMachineState()), ...update },
    }));
  };

  const toggleMachineCheck = (machineId: string, checkId: string) => {
    setMachineStates(prev => {
      const state = prev[machineId] || createDefaultMachineState();
      return {
        ...prev,
        [machineId]: {
          ...state,
          checklist: state.checklist.map(item =>
            item.id === checkId ? { ...item, checked: !item.checked } : item
          ),
        },
      };
    });
  };

  const updateMachineCheckComment = (machineId: string, checkId: string, comment: string) => {
    setMachineStates(prev => {
      const state = prev[machineId] || createDefaultMachineState();
      return {
        ...prev,
        [machineId]: {
          ...state,
          checklist: state.checklist.map(item =>
            item.id === checkId ? { ...item, comment } : item
          ),
        },
      };
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setPhotos(prev => [...prev, ev.target!.result as string]); };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const inter = interventions.find(i => i.id === selectedIntervention);
  const client = inter ? clients.find(c => c.id === inter.client_id) : null;
  const tech = inter ? technicians.find(t => t.id === inter.technician_id) : null;

  const handleSelectIntervention = (id: string) => {
    setSelectedIntervention(id);
    const found = interventions.find(i => i.id === id);
    if (found) {
      const ids: string[] = (found as any).machine_ids?.length
        ? (found as any).machine_ids
        : found.machine_id ? [found.machine_id] : [];
      setSelectedMachineIds(ids);
      const newStates: Record<string, MachineAuditState> = {};
      ids.forEach(mid => { newStates[mid] = createDefaultMachineState(); });
      setMachineStates(newStates);
      const newOpen: Record<string, boolean> = {};
      ids.forEach(mid => { newOpen[mid] = true; });
      setOpenMachines(newOpen);
    }
  };

  const clientMachines = inter ? machines.filter(m => m.client_id === inter.client_id) : [];

  const toggleMachine = (machineId: string) => {
    setSelectedMachineIds(prev => {
      const next = prev.includes(machineId) ? prev.filter(id => id !== machineId) : [...prev, machineId];
      if (!prev.includes(machineId)) {
        setMachineStates(s => ({ ...s, [machineId]: createDefaultMachineState() }));
        setOpenMachines(o => ({ ...o, [machineId]: true }));
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!selectedIntervention) return;

    // Build per-machine checklist data
    const machineAudits = selectedMachineIds.map(mid => {
      const state = machineStates[mid] || createDefaultMachineState();
      const machine = machines.find(m => m.id === mid);
      return {
        machine_id: mid,
        machine_name: machine?.name || "",
        etat_general: state.etatGeneral,
        securite: state.securite,
        proprete: state.proprete,
        usure: state.usure,
        checklist: state.checklist,
        observations: state.observations,
      };
    });

    addAudit.mutate({
      intervention_id: selectedIntervention,
      technician_id: inter?.technician_id || null,
      date: new Date().toISOString().split('T')[0],
      etat_general: machineAudits[0]?.etat_general || "bon",
      securite: machineAudits[0]?.securite || "conforme",
      proprete: machineAudits[0]?.proprete || "bon",
      usure: machineAudits[0]?.usure || "faible",
      recommandations,
      observations: machineAudits[0]?.observations || "",
      photos,
      checklist: machineAudits as any,
      machine_ids: selectedMachineIds,
    }, {
      onSuccess: () => {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        setSelectedIntervention("");
        setSelectedMachineIds([]);
        setMachineStates({});
        setPhotos([]);
        setRecommandations("");
      }
    });
  };

  const getMachineState = (mid: string) => machineStates[mid] || createDefaultMachineState();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Formulaire d'audit</h1>
        <p className="page-subtitle">Formulaire standard pour tous les techniciens</p>
      </div>

      {submitted && (
        <Card className="p-4 mb-4 bg-success/10 border-success/20 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" />
          <span className="text-sm font-medium text-success">Audit enregistré avec succès !</span>
        </Card>
      )}

      <Card className="p-5 mb-4">
        <h2 className="font-semibold mb-3">Sélection de l'intervention</h2>
        <Select value={selectedIntervention} onValueChange={handleSelectIntervention}>
          <SelectTrigger><SelectValue placeholder="Choisir une intervention..." /></SelectTrigger>
          <SelectContent>
            {interventions.map(i => {
              const c = clients.find(cl => cl.id === i.client_id);
              return <SelectItem key={i.id} value={i.id}>{i.date} – {c?.name} – {i.description}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        {inter && (
          <div className="mt-3 text-sm text-muted-foreground grid grid-cols-2 gap-2">
            <span>Client: {client?.name}</span>
            <span>Technicien: {tech?.name}</span>
            <span>Date: {inter.date}</span>
          </div>
        )}
      </Card>

      {inter && (
        <Card className="p-5 mb-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            Machines auditées ({selectedMachineIds.length})
          </h2>
          {clientMachines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune machine pour ce client</p>
          ) : (
            <div className="space-y-1.5">
              {clientMachines.map(m => (
                <label key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer text-sm">
                  <Checkbox
                    checked={selectedMachineIds.includes(m.id)}
                    onCheckedChange={() => toggleMachine(m.id)}
                  />
                  <span>{m.name}</span>
                  {m.model && <span className="text-xs text-muted-foreground">({m.model})</span>}
                </label>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Per-machine audit sections */}
      {selectedMachineIds.map(mid => {
        const machine = machines.find(m => m.id === mid);
        if (!machine) return null;
        const state = getMachineState(mid);
        const isOpen = openMachines[mid] !== false;

        return (
          <Collapsible key={mid} open={isOpen} onOpenChange={v => setOpenMachines(o => ({ ...o, [mid]: v }))}>
            <Card className="p-5 mb-4 border-primary/20">
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full text-left">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" />
                    {machine.name}
                    {machine.model && <span className="text-xs text-muted-foreground font-normal">({machine.model})</span>}
                  </h2>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {/* État */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>État général</Label>
                    <Select value={state.etatGeneral} onValueChange={v => updateMachineState(mid, { etatGeneral: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bon">Bon</SelectItem>
                        <SelectItem value="moyen">Moyen</SelectItem>
                        <SelectItem value="mauvais">Mauvais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sécurité</Label>
                    <Select value={state.securite} onValueChange={v => updateMachineState(mid, { securite: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conforme">Conforme</SelectItem>
                        <SelectItem value="non-conforme">Non conforme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Propreté</Label>
                    <Select value={state.proprete} onValueChange={v => updateMachineState(mid, { proprete: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bon">Bon</SelectItem>
                        <SelectItem value="moyen">Moyen</SelectItem>
                        <SelectItem value="mauvais">Mauvais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Usure</Label>
                    <Select value={state.usure} onValueChange={v => updateMachineState(mid, { usure: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faible">Faible</SelectItem>
                        <SelectItem value="moyenne">Moyenne</SelectItem>
                        <SelectItem value="elevee">Élevée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Checklist de vérification</h3>
                  <div className="space-y-2">
                    {state.checklist.map(item => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Checkbox checked={item.checked} onCheckedChange={() => toggleMachineCheck(mid, item.id)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <label className="text-sm font-medium cursor-pointer" onClick={() => toggleMachineCheck(mid, item.id)}>{item.label}</label>
                          <Input placeholder="Commentaire..." className="mt-1 h-8 text-xs" value={item.comment} onChange={e => updateMachineCheckComment(mid, item.id, e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observations per machine */}
                <div>
                  <Label>Observations</Label>
                  <Textarea value={state.observations} onChange={e => updateMachineState(mid, { observations: e.target.value })} rows={2} placeholder="Observations spécifiques à cette machine..." />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      <Card className="p-5 mb-4">
        <h2 className="font-semibold mb-3">Photos</h2>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mb-3"><Camera className="w-4 h-4 mr-1" /> Ajouter des photos</Button>
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border">
                <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-32 object-cover" />
                <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 mb-6">
        <h2 className="font-semibold mb-3">Recommandations générales</h2>
        <Textarea value={recommandations} onChange={e => setRecommandations(e.target.value)} rows={3} placeholder="Recommandations globales pour l'ensemble de l'audit..." />
      </Card>

      <Button onClick={handleSubmit} className="w-full" size="lg" disabled={addAudit.isPending || !selectedIntervention || selectedMachineIds.length === 0}>
        {addAudit.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
        Soumettre l'audit
      </Button>
    </div>
  );
}
