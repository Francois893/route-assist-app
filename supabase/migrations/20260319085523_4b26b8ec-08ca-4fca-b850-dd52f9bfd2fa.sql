
-- Add machine_ids array column to interventions
ALTER TABLE public.interventions ADD COLUMN machine_ids uuid[] DEFAULT '{}';

-- Migrate existing machine_id data into machine_ids
UPDATE public.interventions SET machine_ids = ARRAY[machine_id] WHERE machine_id IS NOT NULL;

-- Add machine_ids array column to audits
ALTER TABLE public.audits ADD COLUMN machine_ids uuid[] DEFAULT '{}';
