import { useState, useEffect } from "react";
import { useAppSettings, useUpdateSetting } from "@/hooks/use-settings";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Settings, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (settings) {
      setEmail(settings.notification_email || "");
      setPhone(settings.notification_phone || "");
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: "notification_email", value: email }),
        updateSetting.mutateAsync({ key: "notification_phone", value: phone }),
      ]);
      toast({ title: "Paramètres sauvegardés" });
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">Configuration des notifications de rappel maintenance</p>
      </div>

      <Card className="p-6 max-w-lg">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Notifications de rappel</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="flex items-center gap-1.5 mb-1.5">
              <Mail className="w-3.5 h-3.5" /> Email de notification
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="phone" className="flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3.5 h-3.5" /> Numéro de téléphone (SMS)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+33612345678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Format international requis (ex: +33612345678)</p>
          </div>

          <Button onClick={handleSave} disabled={updateSetting.isPending} className="w-full">
            {updateSetting.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Sauvegarder
          </Button>
        </div>
      </Card>
    </div>
  );
}
