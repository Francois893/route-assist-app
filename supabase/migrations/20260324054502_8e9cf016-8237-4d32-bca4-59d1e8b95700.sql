ALTER TABLE public.interventions DROP CONSTRAINT IF EXISTS interventions_status_check;

ALTER TABLE public.interventions
ADD CONSTRAINT interventions_status_check
CHECK (status = ANY (ARRAY['a-planifier'::text, 'planifiee'::text, 'en-cours'::text, 'terminee'::text]));