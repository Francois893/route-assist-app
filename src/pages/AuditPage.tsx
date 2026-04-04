import { useState, useRef, useMemo } from "react";
import { useClients, useMachines, useInterventions, useTechnicians, useAddAudit, useAddMachine } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { defaultAuditChecklist } from "@/lib/mock-data";
import { Camera, CheckCircle, X, Loader2, Wrench, ChevronDown, Plus } from "lucide-react";
import type { AuditChecklistItem, AuditItemStatus } from "@/lib/types";
import { toast } from "sonner";

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

const STATUS_COLORS: Record<AuditItemStatus, { bg: string; border: string; label: string }> = {
  'ok': { bg: 'bg-green-500', border: 'border-green-500', label: 'OK' },
  'attention': { bg: 'bg-yellow-500', border: 'border-yellow-500', label: 'Attention' },
  'danger': { bg: 'bg-red-500', border: 'border-red-500', label: 'Danger' },
  'non-verifie': { bg: 'bg-muted', border: 'border-muted-foreground/30', label: '—' },
};

function StatusButton({ status, active, onClick }: { status: AuditItemStatus; active: boolean; onClick: () => void }) {
  const s = STATUS_COLORS[status];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-7 h-7 rounded-md border-2 transition-all ${s.bg} ${active ? 'ring-2 ring-offset-1 ring-foreground scale-110' : 'opacity-40 hover:opacity-70'}`}
      title={s.label}
    />
  );
}

export default function AuditPage() {
  const { data: clients = [] } = useClients();
  const { data: machines = [] } = useMachines();
  const { data: interventions = [] } = useInterventions();
  const { data: technicians = [] } = useTechnicians();
  const addAudit = useAddAudit();
  const addMachine = useAddMachine();
  const [selectedIntervention, setSelectedIntervention] = useState("");
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);
  const [machineStates, setMachineStates] = useState<Record<string, MachineAuditState>>({});
  const [recommandations, setRecommandations] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [openMachines, setOpenMachines] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showNewMachineForm, setShowNewMachineForm] = useState(false);
  const [newMachineName, setNewMachineName] = useState("");
  const [newMachineType, setNewMachineType] = useState<string>("piston");
  const [newMachineSerial, setNewMachineSerial] = useState("");
  const [newMachineModel, setNewMachineModel] = useState("");

  const updateMachineState = (machineId: string, update: Partial<MachineAuditState>) => {
    setMachineStates(prev => ({
      ...prev,
      [machineId]: { ...(prev[machineId] || createDefaultMachineState()), ...update },
    }));
  };

  const setItemStatus = (machineId: string, checkId: string, status: AuditItemStatus) => {
    setMachineStates(prev => {
      const state = prev[machineId] || createDefaultMachineState();
      return {
        ...prev,
        [machineId]: {
          ...state,
          checklist: state.checklist.map(item =>
            item.id === checkId ? { ...item, status, checked: status !== 'non-verifie' } : item
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

  const handleAddNewMachine = () => {
    if (!newMachineName.trim() || !inter) return;
    addMachine.mutate({
      client_id: inter.client_id,
      name: newMachineName.trim(),
      model: newMachineModel.trim(),
      serial_number: newMachineSerial.trim(),
      install_date: new Date().toISOString().split('T')[0],
      status: "operational",
      type: newMachineType,
    }, {
      onSuccess: (data) => {
        setSelectedMachineIds(prev => [...prev, data.id]);
        setMachineStates(s => ({ ...s, [data.id]: createDefaultMachineState() }));
        setOpenMachines(o => ({ ...o, [data.id]: true }));
        setNewMachineName("");
        setNewMachineSerial("");
        setNewMachineType("piston");
        setShowNewMachineForm(false);
        toast.success(`Machine "${data.name}" ajoutée au client et à l'audit`);
      },
    });
  };

  const handleSubmit = () => {
    if (!selectedIntervention) return;
    const machineAudits = selectedMachineIds.map(mid => {
      const state = machineStates[mid] || createDefaultMachineState();
      const machine = machines.find(m => m.id === mid);
      return {
        machine_id: mid,
        machine_name: machine?.name || "",
        machine_type: machine?.type || "",
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

  /** Get filtered checklist items for a machine based on its type */
  const getFilteredChecklist = (machineId: string) => {
    const state = getMachineState(machineId);
    const machine = machines.find(m => m.id === machineId);
    const machineType = machine?.type as 'piston' | 'engrenage' | undefined;

    return state.checklist.filter(item => {
      if (!item.machineType) return true; // universal items
      if (item.machineType === machineType) return true;
      return false;
    });
  };

  /** Group checklist items by category */
  const groupByCategory = (items: AuditChecklistItem[]) => {
    const groups: { category: string; items: AuditChecklistItem[] }[] = [];
    items.forEach(item => {
      const last = groups[groups.length - 1];
      if (last && last.category === item.category) {
        last.items.push(item);
      } else {
        groups.push({ category: item.category, items: [item] });
      }
    });
    return groups;
  };

  const SECTION_ACCESSORIES_CATEGORIES = ['Applicateur', 'Tuyaux', 'Pistolet'];

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
          {clientMachines.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {clientMachines.map(m => (
                <label key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer text-sm">
                  <Checkbox checked={selectedMachineIds.includes(m.id)} onCheckedChange={() => toggleMachine(m.id)} />
                  <span>{m.name}</span>
                  {m.type && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize">{m.type}</span>}
                </label>
              ))}
            </div>
          )}
          {!showNewMachineForm ? (
            <Button variant="outline" size="sm" onClick={() => setShowNewMachineForm(true)} className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-1" /> Ajouter une machine découverte
            </Button>
          ) : (
            <div className="border border-dashed border-primary/30 rounded-lg p-4 space-y-3 bg-muted/20">
              <h3 className="text-sm font-medium">Nouvelle machine</h3>
              <div>
                <Label className="text-xs">Nom de la machine *</Label>
                <Input value={newMachineName} onChange={e => setNewMachineName(e.target.value)} placeholder="Ex: Hotmelt H200" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">N° de série</Label>
                <Input value={newMachineSerial} onChange={e => setNewMachineSerial(e.target.value)} placeholder="Ex: SN-12345" className="h-9" />
              </div>
              <div>
                <Label className="text-xs mb-2 block">Type de machine *</Label>
                <RadioGroup value={newMachineType} onValueChange={setNewMachineType} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="piston" id="type-piston" />
                    <Label htmlFor="type-piston" className="text-sm cursor-pointer">Piston</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="engrenage" id="type-engrenage" />
                    <Label htmlFor="type-engrenage" className="text-sm cursor-pointer">Engrenage</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddNewMachine} disabled={!newMachineName.trim() || addMachine.isPending}>
                  {addMachine.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                  Ajouter
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewMachineForm(false)}>Annuler</Button>
              </div>
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
        const filteredChecklist = getFilteredChecklist(mid);
        const grouped = groupByCategory(filteredChecklist);

        return (
          <Collapsible key={mid} open={isOpen} onOpenChange={v => setOpenMachines(o => ({ ...o, [mid]: v }))}>
            <Card className="p-5 mb-4 border-primary/20">
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full text-left">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" />
                    {machine.name}
                    {machine.type && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize">{machine.type}</span>}
                  </h2>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {/* État général selectors */}
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

                {/* Checklist grouped by category */}
                <div className="space-y-4">
                  {grouped.map((group, gi) => {
                    const isAccessory = SECTION_ACCESSORIES_CATEGORIES.includes(group.category);
                    const isFirstAccessory = isAccessory && (gi === 0 || !SECTION_ACCESSORIES_CATEGORIES.includes(grouped[gi - 1].category));

                    return (
                      <div key={group.category}>
                        {isFirstAccessory && (
                          <div className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 rounded py-1.5 mb-3">
                            Accessoires
                          </div>
                        )}
                        <div className="mb-1">
                          <h3 className="text-sm font-semibold text-foreground bg-muted/30 px-3 py-1.5 rounded-t-lg border-b border-border">
                            {group.category}
                          </h3>
                          <div className="border border-t-0 rounded-b-lg divide-y divide-border">
                            {group.items.map(item => (
                              <div key={item.id} className="flex items-center gap-2 px-3 py-2">
                                <span className="text-sm flex-1 min-w-0">{item.label}</span>
                                <div className="flex gap-1.5 shrink-0">
                                  <StatusButton status="ok" active={item.status === 'ok'} onClick={() => setItemStatus(mid, item.id, 'ok')} />
                                  <StatusButton status="attention" active={item.status === 'attention'} onClick={() => setItemStatus(mid, item.id, 'attention')} />
                                  <StatusButton status="danger" active={item.status === 'danger'} onClick={() => setItemStatus(mid, item.id, 'danger')} />
                                </div>
                                <Input
                                  placeholder="Commentaire"
                                  className="h-7 text-xs w-28 sm:w-40 shrink-0"
                                  value={item.comment}
                                  onChange={e => updateMachineCheckComment(mid, item.id, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

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
