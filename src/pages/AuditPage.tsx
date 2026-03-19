import { useState, useRef } from "react";
import { useClients, useMachines, useInterventions, useTechnicians, useAddAudit } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultAuditChecklist } from "@/lib/mock-data";
import { Camera, CheckCircle, X, Loader2, Wrench } from "lucide-react";
import type { AuditChecklistItem } from "@/lib/types";

export default function AuditPage() {
  const { data: clients = [] } = useClients();
  const { data: machines = [] } = useMachines();
  const { data: interventions = [] } = useInterventions();
  const { data: technicians = [] } = useTechnicians();
  const addAudit = useAddAudit();
  const [selectedIntervention, setSelectedIntervention] = useState("");
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);
  const [etatGeneral, setEtatGeneral] = useState("bon");
  const [securite, setSecurite] = useState("conforme");
  const [proprete, setProprete] = useState("bon");
  const [usure, setUsure] = useState("faible");
  const [recommandations, setRecommandations] = useState("");
  const [observations, setObservations] = useState("");
  const [checklist, setChecklist] = useState<AuditChecklistItem[]>(defaultAuditChecklist.map(c => ({ ...c })));
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleCheck = (id: string) => setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  const updateComment = (id: string, comment: string) => setChecklist(prev => prev.map(item => item.id === id ? { ...item, comment } : item));

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

  // When selecting an intervention, pre-fill machines from it
  const handleSelectIntervention = (id: string) => {
    setSelectedIntervention(id);
    const found = interventions.find(i => i.id === id);
    if (found) {
      const ids: string[] = (found as any).machine_ids?.length
        ? (found as any).machine_ids
        : found.machine_id ? [found.machine_id] : [];
      setSelectedMachineIds(ids);
    }
  };

  // Get machines for the selected intervention's client
  const clientMachines = inter ? machines.filter(m => m.client_id === inter.client_id) : [];

  const toggleMachine = (machineId: string) => {
    setSelectedMachineIds(prev =>
      prev.includes(machineId) ? prev.filter(id => id !== machineId) : [...prev, machineId]
    );
  };

  const handleSubmit = () => {
    if (!selectedIntervention) return;
    addAudit.mutate({
      intervention_id: selectedIntervention,
      technician_id: inter?.technician_id || null,
      date: new Date().toISOString().split('T')[0],
      etat_general: etatGeneral,
      securite,
      proprete,
      usure,
      recommandations,
      observations,
      photos,
      checklist: checklist as any,
      machine_ids: selectedMachineIds,
    }, {
      onSuccess: () => {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        setSelectedIntervention("");
        setSelectedMachineIds([]);
        setChecklist(defaultAuditChecklist.map(c => ({ ...c })));
        setPhotos([]);
        setObservations("");
        setRecommandations("");
      }
    });
  };

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

      {/* Machine selection for audit */}
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

      <Card className="p-5 mb-4">
        <h2 className="font-semibold mb-3">État général</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>État général</Label><Select value={etatGeneral} onValueChange={setEtatGeneral}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bon">Bon</SelectItem><SelectItem value="moyen">Moyen</SelectItem><SelectItem value="mauvais">Mauvais</SelectItem></SelectContent></Select></div>
          <div><Label>Sécurité</Label><Select value={securite} onValueChange={setSecurite}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="conforme">Conforme</SelectItem><SelectItem value="non-conforme">Non conforme</SelectItem></SelectContent></Select></div>
          <div><Label>Propreté</Label><Select value={proprete} onValueChange={setProprete}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bon">Bon</SelectItem><SelectItem value="moyen">Moyen</SelectItem><SelectItem value="mauvais">Mauvais</SelectItem></SelectContent></Select></div>
          <div><Label>Usure</Label><Select value={usure} onValueChange={setUsure}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="faible">Faible</SelectItem><SelectItem value="moyenne">Moyenne</SelectItem><SelectItem value="elevee">Élevée</SelectItem></SelectContent></Select></div>
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <h2 className="font-semibold mb-3">Checklist de vérification</h2>
        <div className="space-y-3">
          {checklist.map(item => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Checkbox checked={item.checked} onCheckedChange={() => toggleCheck(item.id)} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <label className="text-sm font-medium cursor-pointer" onClick={() => toggleCheck(item.id)}>{item.label}</label>
                <Input placeholder="Commentaire..." className="mt-1 h-8 text-xs" value={item.comment} onChange={e => updateComment(item.id, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </Card>

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
        <h2 className="font-semibold mb-3">Observations et recommandations</h2>
        <div className="space-y-3">
          <div><Label>Observations</Label><Textarea value={observations} onChange={e => setObservations(e.target.value)} rows={3} /></div>
          <div><Label>Recommandations</Label><Textarea value={recommandations} onChange={e => setRecommandations(e.target.value)} rows={3} /></div>
        </div>
      </Card>

      <Button onClick={handleSubmit} className="w-full" size="lg" disabled={addAudit.isPending || !selectedIntervention}>
        {addAudit.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
        Soumettre l'audit
      </Button>
    </div>
  );
}
