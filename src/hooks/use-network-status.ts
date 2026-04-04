import { useEffect, useState, useCallback, useRef } from "react";
import { syncQueue, getQueue } from "@/lib/offline-queue";
import { useQueryClient } from "@tanstack/react-query";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    try { return navigator.onLine; } catch { return true; }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);
  const qc = useQueryClient();

  const refreshPending = useCallback(async () => {
    const q = await getQueue();
    setPendingCount(q.length);
  }, []);

  const doSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const { synced } = await syncQueue();
      if (synced > 0) {
        // Refresh all data after sync
        qc.invalidateQueries();
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await refreshPending();
    }
  }, [qc, refreshPending]);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      doSync();
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    refreshPending();

    // Initial sync if we start online
    if (navigator.onLine) doSync();

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [doSync, refreshPending]);

  return { isOnline, isSyncing, pendingCount, refreshPending };
}
