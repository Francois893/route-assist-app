import { useAuth, useProfile } from "@/hooks/use-auth";

export function useTrackingInfo() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return {
    modified_by: user?.id ?? null,
    modified_by_name: profile?.name ?? "",
  };
}
