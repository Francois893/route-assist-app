import { get, set, del } from "idb-keyval";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

const IDB_KEY = "followapp_query_cache";

/**
 * Creates an IndexedDB-based persister for TanStack Query.
 * This allows query data to survive page reloads and work offline.
 */
export function createIDBPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await set(IDB_KEY, client);
      } catch (err) {
        console.warn("[idb-persister] Failed to persist", err);
      }
    },
    restoreClient: async () => {
      try {
        return await get<PersistedClient>(IDB_KEY);
      } catch {
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await del(IDB_KEY);
      } catch {}
    },
  };
}
