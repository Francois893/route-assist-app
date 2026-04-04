import { useNetworkStatus } from "@/hooks/use-network-status";
import { Wifi, WifiOff, Loader2, CloudOff } from "lucide-react";

export function NetworkStatusBar() {
  const { isOnline, isSyncing, pendingCount } = useNetworkStatus();

  if (isOnline && !isSyncing && pendingCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors"
      style={{
        background: !isOnline
          ? "hsl(var(--destructive))"
          : isSyncing
            ? "hsl(var(--primary))"
            : "hsl(var(--accent))",
        color: !isOnline || isSyncing
          ? "hsl(var(--destructive-foreground))"
          : "hsl(var(--accent-foreground))",
      }}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          Mode hors ligne
          {pendingCount > 0 && <span>· {pendingCount} modification{pendingCount > 1 ? "s" : ""} en attente</span>}
        </>
      ) : isSyncing ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Synchronisation en cours…
        </>
      ) : pendingCount > 0 ? (
        <>
          <CloudOff className="w-3.5 h-3.5" />
          {pendingCount} modification{pendingCount > 1 ? "s" : ""} en attente
        </>
      ) : null}
    </div>
  );
}
