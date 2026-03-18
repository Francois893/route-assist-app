ALTER TABLE public.technicians ADD COLUMN home_address text DEFAULT '';
ALTER TABLE public.technicians ADD COLUMN home_latitude double precision;
ALTER TABLE public.technicians ADD COLUMN home_longitude double precision;