
-- Add maintenance interval to machines
ALTER TABLE public.machines ADD COLUMN maintenance_interval_days integer NOT NULL DEFAULT 365;

-- Create app settings table for notification preferences
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by everyone" ON public.app_settings FOR SELECT TO public USING (true);
CREATE POLICY "Settings insertable by everyone" ON public.app_settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Settings updatable by everyone" ON public.app_settings FOR UPDATE TO public USING (true);

-- Insert default settings
INSERT INTO public.app_settings (key, value) VALUES 
  ('notification_email', ''),
  ('notification_phone', '');
