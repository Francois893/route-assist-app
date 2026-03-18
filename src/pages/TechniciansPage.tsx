import { useState } from "react";
import { useInterventions, useDevis, useTechnicians } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Clock, TrendingUp, ShoppingCart, Users, Loader2, Pencil, Home, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function TechniciansPage() {
  const { data: technicians = [], isLoading: lt } = useTechnicians();
  const { data: interventions = [], isLoading: li } = useInterventions();
  const { data: devis = [], isLoading: ld } = useDevis();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', speciality: '',
    home_address: '', home_latitude: '' as string, home_longitude: '' as string
  });
  const [saving, setSaving] = useState(false);

  if (lt || li || ld) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const HOURLY_RATE = 45;

  const openEdit = (tech: any) => {
    setEditId(tech.id);
    setForm({
      name: tech.name || '',
      email: tech.email || '',
      phone: tech.phone || '',
      speciality: tech.speciality || '',
      home_address: tech.home_address || '',
      home_latitude: tech.home_latitude?.toString() || '',
      home_longitude: tech.home_longitude?.toString() || '',
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editId || !form.name) return;
    setSaving(true);
    await supabase.from("technicians").update({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      speciality: form.speciality || null,
      home_address: form.home_address || '',
      home_latitude: form.home_latitude ? parseFloat(form.home_latitude) : null,
      home_longitude: form.home_longitude ? parseFloat(form.home_longitude) : null,
    }).eq("id", editId);
    setSaving(false);
    setEditOpen(false);
    qc.invalidateQueries({ queryKey: ["technicians"] });
  };

  const techData = technicians.map(tech => {
    const techInterventions = interventions.filter(i => i.technician_id === tech.id);
    const totalTravelMin = techInterventions.reduce((s, i) => s + (i.travel_time || 0), 0);
    const totalWorkMin = techInterventions.reduce((s, i) => s + (i.duration || 0), 0);
    const travelCost = Math.round((totalTravelMin / 60) * HOURLY_RATE);
    const revenue = Math.round((totalWorkMin / 60) * HOURLY_RATE * 1.8);
    const techDevis = devis.filter(d => {
      const inter = interventions.find(i => i.id === d.intervention_id);
      return inter?.technician_id === tech.id;
    });
    const additionalSales = techDevis.filter(d => d.status === 'accepte').reduce((s, d) => s + Number(d.montant), 0);
    return { ...tech, interventionCount: techInterventions.length, travelTime: totalTravelMin, workTime: totalWorkMin, travelCost, revenue, additionalSales, margin: revenue - travelCost };
  });

  const chartData = techData.map(t => ({ name: t.name.split(' ')[0], 'Coûts déplacement': t.travelCost, 'Revenus interventions': t.revenue, 'Ventes additionnelles': t.additionalSales }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Performance techniciens</h1>
        <p className="page-subtitle">Comparatif coûts, revenus et ventes</p>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Modifier le technicien</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            </div>
            <div><Label>Spécialité</Label><Input value={form.speciality} onChange={e => setForm({...form, speciality: e.target.value})} /></div>
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Home className="w-4 h-4 text-primary" /> Adresse de domicile</h3>
              <div className="space-y-3">
                <div><Label>Adresse complète</Label><Input placeholder="12 rue de la Paix, 69001 Lyon" value={form.home_address} onChange={e => setForm({...form, home_address: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Latitude</Label><Input type="number" step="any" placeholder="45.7640" value={form.home_latitude} onChange={e => setForm({...form, home_latitude: e.target.value})} /></div>
                  <div><Label>Longitude</Label><Input type="number" step="any" placeholder="4.8357" value={form.home_longitude} onChange={e => setForm({...form, home_longitude: e.target.value})} /></div>
                </div>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <Card className="stat-card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div><div><p className="text-lg font-bold">{technicians.length}</p><p className="text-xs text-muted-foreground">Techniciens</p></div></div></Card>
        <Card className="stat-card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center"><Clock className="w-5 h-5 text-warning" /></div><div><p className="text-lg font-bold">{techData.reduce((s, t) => s + t.travelTime, 0)} min</p><p className="text-xs text-muted-foreground">Temps trajet total</p></div></div></Card>
        <Card className="stat-card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success" /></div><div><p className="text-lg font-bold">{techData.reduce((s, t) => s + t.revenue, 0).toLocaleString()}€</p><p className="text-xs text-muted-foreground">Revenus totaux</p></div></div></Card>
        <Card className="stat-card"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-info" /></div><div><p className="text-lg font-bold">{techData.reduce((s, t) => s + t.additionalSales, 0).toLocaleString()}€</p><p className="text-xs text-muted-foreground">Ventes additionnelles</p></div></div></Card>
      </div>

      <Card className="p-6 mb-8 rounded-2xl">
        <h2 className="font-semibold mb-5">Comparatif par technicien</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(215, 12%, 55%)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'hsl(215, 12%, 55%)' }} />
            <Tooltip contentStyle={{ background: 'hsl(220, 18%, 13%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '12px', color: 'hsl(210, 20%, 92%)' }} formatter={(value: number) => `${value.toLocaleString()}€`} />
            <Legend />
            <Bar dataKey="Coûts déplacement" fill="hsl(0, 72%, 51%)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Revenus interventions" fill="hsl(152, 60%, 42%)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Ventes additionnelles" fill="hsl(210, 80%, 55%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {techData.map(t => (
          <Card key={t.id} className="p-5 rounded-2xl hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                  {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">{t.speciality}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => openEdit(t)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>

            {t.home_address && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 px-1">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="truncate">{t.home_address}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/50 rounded-xl p-2.5">
                <p className="text-xs text-muted-foreground">Interventions</p>
                <p className="text-sm font-bold mt-0.5">{t.interventionCount}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-2.5">
                <p className="text-xs text-muted-foreground">Trajet</p>
                <p className="text-sm font-bold mt-0.5">{t.travelTime}m</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-2.5">
                <p className="text-xs text-muted-foreground">Travail</p>
                <p className="text-sm font-bold mt-0.5">{t.workTime}m</p>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Coûts dépl.</span>
                <span className="text-destructive font-medium">{t.travelCost.toLocaleString()}€</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Revenus</span>
                <span className="text-success font-medium">{t.revenue.toLocaleString()}€</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Ventes add.</span>
                <span className="text-info font-medium">{t.additionalSales.toLocaleString()}€</span>
              </div>
              <div className="flex justify-between text-xs border-t border-border pt-1.5">
                <span className="font-medium">Marge</span>
                <span className="font-bold">{t.margin.toLocaleString()}€</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
