import { useInterventions, useDevis, useTechnicians } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Clock, TrendingUp, ShoppingCart, Users, Loader2 } from "lucide-react";

export default function TechniciansPage() {
  const { data: technicians = [], isLoading: lt } = useTechnicians();
  const { data: interventions = [], isLoading: li } = useInterventions();
  const { data: devis = [], isLoading: ld } = useDevis();

  if (lt || li || ld) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const HOURLY_RATE = 45;

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
    return { name: tech.name.split(' ')[0], fullName: tech.name, speciality: tech.speciality, interventions: techInterventions.length, travelTime: totalTravelMin, workTime: totalWorkMin, travelCost, revenue, additionalSales, margin: revenue - travelCost };
  });

  const chartData = techData.map(t => ({ name: t.name, 'Coûts déplacement': t.travelCost, 'Revenus interventions': t.revenue, 'Ventes additionnelles': t.additionalSales }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Performance techniciens</h1>
        <p className="page-subtitle">Comparatif coûts, revenus et ventes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="stat-card"><div className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /><div><p className="text-lg font-bold">{technicians.length}</p><p className="text-xs text-muted-foreground">Techniciens</p></div></div></Card>
        <Card className="stat-card"><div className="flex items-center gap-2"><Clock className="w-5 h-5 text-warning" /><div><p className="text-lg font-bold">{techData.reduce((s, t) => s + t.travelTime, 0)} min</p><p className="text-xs text-muted-foreground">Temps trajet total</p></div></div></Card>
        <Card className="stat-card"><div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-success" /><div><p className="text-lg font-bold">{techData.reduce((s, t) => s + t.revenue, 0).toLocaleString()}€</p><p className="text-xs text-muted-foreground">Revenus totaux</p></div></div></Card>
        <Card className="stat-card"><div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-info" /><div><p className="text-lg font-bold">{techData.reduce((s, t) => s + t.additionalSales, 0).toLocaleString()}€</p><p className="text-xs text-muted-foreground">Ventes additionnelles</p></div></div></Card>
      </div>

      <Card className="p-5 mb-6">
        <h2 className="font-semibold mb-4">Comparatif par technicien</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => `${value.toLocaleString()}€`} />
            <Legend />
            <Bar dataKey="Coûts déplacement" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Revenus interventions" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Ventes additionnelles" fill="hsl(210, 100%, 50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Technicien</th>
                <th className="text-left px-4 py-3 font-medium">Spécialité</th>
                <th className="text-center px-4 py-3 font-medium">Interventions</th>
                <th className="text-center px-4 py-3 font-medium">Temps trajet</th>
                <th className="text-center px-4 py-3 font-medium">Temps travail</th>
                <th className="text-right px-4 py-3 font-medium">Coûts dépl.</th>
                <th className="text-right px-4 py-3 font-medium">Revenus</th>
                <th className="text-right px-4 py-3 font-medium">Ventes add.</th>
                <th className="text-right px-4 py-3 font-medium">Marge</th>
              </tr>
            </thead>
            <tbody>
              {techData.map(t => (
                <tr key={t.fullName} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{t.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.speciality}</td>
                  <td className="px-4 py-3 text-center">{t.interventions}</td>
                  <td className="px-4 py-3 text-center">{t.travelTime} min</td>
                  <td className="px-4 py-3 text-center">{t.workTime} min</td>
                  <td className="px-4 py-3 text-right text-destructive font-medium">{t.travelCost.toLocaleString()}€</td>
                  <td className="px-4 py-3 text-right text-success font-medium">{t.revenue.toLocaleString()}€</td>
                  <td className="px-4 py-3 text-right text-info font-medium">{t.additionalSales.toLocaleString()}€</td>
                  <td className="px-4 py-3 text-right font-bold">{t.margin.toLocaleString()}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
