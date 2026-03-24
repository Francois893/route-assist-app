
-- Inventory table: each row = one item in one location
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  designation text NOT NULL DEFAULT '',
  location_type text NOT NULL DEFAULT 'atelier', -- 'atelier' or 'technician'
  technician_id uuid REFERENCES public.technicians(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- History of quantity changes
CREATE TABLE public.inventory_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  old_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  note text DEFAULT ''
);

-- RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory viewable by everyone" ON public.inventory FOR SELECT TO public USING (true);
CREATE POLICY "Inventory insertable by everyone" ON public.inventory FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Inventory updatable by everyone" ON public.inventory FOR UPDATE TO public USING (true);

CREATE POLICY "Inventory history viewable by everyone" ON public.inventory_history FOR SELECT TO public USING (true);
CREATE POLICY "Inventory history insertable by everyone" ON public.inventory_history FOR INSERT TO public WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
