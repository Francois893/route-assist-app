import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { updateProfile } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  userId: string;
}

export default function ProfileSetupPage({ userId }: Props) {
  const [name, setName] = useState("");
  const [poste, setPoste] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !poste.trim()) return;
    setLoading(true);
    try {
      await updateProfile(userId, name.trim(), poste.trim());
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profil enregistré" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">Complétez votre profil</h1>
          <p className="text-sm text-muted-foreground mt-1">Renseignez votre nom et votre poste</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Jean Dupont" />
          </div>
          <div>
            <Label htmlFor="poste">Poste</Label>
            <Input id="poste" value={poste} onChange={e => setPoste(e.target.value)} required placeholder="Technicien, Directeur, Responsable..." />
            <p className="text-xs text-muted-foreground mt-1">
              Les postes contenant "directeur" ou "responsable" auront le rôle administrateur.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Enregistrer
          </Button>
        </form>
      </Card>
    </div>
  );
}
