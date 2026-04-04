import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  name: string;
  poste: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        qc.invalidateQueries({ queryKey: ["profile"] });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [qc]);

  return { user, loading };
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
}

export function computeRole(poste: string): string {
  const lower = poste.toLowerCase();
  if (lower.includes("directeur") || lower.includes("responsable")) {
    return "admin";
  }
  return "user";
}

export async function updateProfile(userId: string, name: string, poste: string) {
  const role = computeRole(poste);
  const { error } = await supabase
    .from("profiles")
    .update({ name, poste, role })
    .eq("id", userId);
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
