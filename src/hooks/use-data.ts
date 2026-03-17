import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbClient = Tables<"clients">;
export type DbMachine = Tables<"machines">;
export type DbIntervention = Tables<"interventions">;
export type DbDevis = Tables<"devis">;
export type DbTechnician = Tables<"technicians">;
export type DbAudit = Tables<"audits">;

// ---- Clients ----
export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useAddClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Omit<DbClient, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("clients").insert(client).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

// ---- Machines ----
export function useMachines(clientId?: string) {
  return useQuery({
    queryKey: ["machines", clientId],
    queryFn: async () => {
      let q = supabase.from("machines").select("*").order("name");
      if (clientId) q = q.eq("client_id", clientId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useAddMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (machine: Omit<DbMachine, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("machines").insert(machine).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["machines"] }),
  });
}

export function useUpdateMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<DbMachine> & { id: string }) => {
      const { error } = await supabase.from("machines").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["machines"] }),
  });
}

// ---- Technicians ----
export function useTechnicians() {
  return useQuery({
    queryKey: ["technicians"],
    queryFn: async () => {
      const { data, error } = await supabase.from("technicians").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

// ---- Interventions ----
export function useInterventions(clientId?: string) {
  return useQuery({
    queryKey: ["interventions", clientId],
    queryFn: async () => {
      let q = supabase.from("interventions").select("*").order("date", { ascending: false });
      if (clientId) q = q.eq("client_id", clientId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useAddIntervention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inter: Omit<DbIntervention, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("interventions").insert(inter).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interventions"] }),
  });
}

export function useUpdateIntervention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<DbIntervention> & { id: string }) => {
      const { error } = await supabase.from("interventions").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interventions"] }),
  });
}

// ---- Devis ----
export function useDevis() {
  return useQuery({
    queryKey: ["devis"],
    queryFn: async () => {
      const { data, error } = await supabase.from("devis").select("*").order("date_creation", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddDevis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (devis: Omit<DbDevis, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("devis").insert(devis).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devis"] }),
  });
}

export function useUpdateDevis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<DbDevis> & { id: string }) => {
      const { error } = await supabase.from("devis").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devis"] }),
  });
}

// ---- Audits ----
export function useAddAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (audit: Omit<DbAudit, "id" | "created_at">) => {
      const { data, error } = await supabase.from("audits").insert(audit).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audits"] }),
  });
}
