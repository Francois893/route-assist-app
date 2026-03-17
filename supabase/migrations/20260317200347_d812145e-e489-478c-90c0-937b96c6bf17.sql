-- Create updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Technicians table
CREATE TABLE public.technicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  speciality TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Technicians are viewable by everyone" ON public.technicians FOR SELECT USING (true);
CREATE POLICY "Technicians can be inserted by everyone" ON public.technicians FOR INSERT WITH CHECK (true);
CREATE POLICY "Technicians can be updated by everyone" ON public.technicians FOR UPDATE USING (true);
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON public.technicians FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  city TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients are viewable by everyone" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Clients can be inserted by everyone" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Clients can be updated by everyone" ON public.clients FOR UPDATE USING (true);
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Machines table
CREATE TABLE public.machines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT DEFAULT '',
  serial_number TEXT DEFAULT '',
  install_date DATE,
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'hors-service')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Machines are viewable by everyone" ON public.machines FOR SELECT USING (true);
CREATE POLICY "Machines can be inserted by everyone" ON public.machines FOR INSERT WITH CHECK (true);
CREATE POLICY "Machines can be updated by everyone" ON public.machines FOR UPDATE USING (true);
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON public.machines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Interventions table
CREATE TABLE public.interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'preventive' CHECK (type IN ('preventive', 'corrective', 'audit')),
  status TEXT NOT NULL DEFAULT 'planifiee' CHECK (status IN ('planifiee', 'en-cours', 'terminee')),
  description TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  travel_time INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interventions are viewable by everyone" ON public.interventions FOR SELECT USING (true);
CREATE POLICY "Interventions can be inserted by everyone" ON public.interventions FOR INSERT WITH CHECK (true);
CREATE POLICY "Interventions can be updated by everyone" ON public.interventions FOR UPDATE USING (true);
CREATE TRIGGER update_interventions_updated_at BEFORE UPDATE ON public.interventions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Devis table
CREATE TABLE public.devis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  numero_offre TEXT NOT NULL,
  montant NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'en-attente' CHECK (status IN ('en-attente', 'accepte', 'refuse')),
  date_creation DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Devis are viewable by everyone" ON public.devis FOR SELECT USING (true);
CREATE POLICY "Devis can be inserted by everyone" ON public.devis FOR INSERT WITH CHECK (true);
CREATE POLICY "Devis can be updated by everyone" ON public.devis FOR UPDATE USING (true);
CREATE TRIGGER update_devis_updated_at BEFORE UPDATE ON public.devis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audits table
CREATE TABLE public.audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  etat_general TEXT DEFAULT 'bon',
  securite TEXT DEFAULT 'conforme',
  proprete TEXT DEFAULT 'bon',
  usure TEXT DEFAULT 'faible',
  recommandations TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  photos TEXT[] DEFAULT '{}',
  checklist JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audits are viewable by everyone" ON public.audits FOR SELECT USING (true);
CREATE POLICY "Audits can be inserted by everyone" ON public.audits FOR INSERT WITH CHECK (true);

-- Storage bucket for audit photos
INSERT INTO storage.buckets (id, name, public) VALUES ('audit-photos', 'audit-photos', true);
CREATE POLICY "Audit photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'audit-photos');
CREATE POLICY "Anyone can upload audit photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audit-photos');