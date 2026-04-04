import { get, set, del } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";

const QUEUE_KEY = "followapp_offline_queue";

export interface OfflineMutation {
  id: string;
  table: string;
  type: "insert" | "update";
  payload: Record<string, unknown>;
  /** For updates: the row id */
  rowId?: string;
  createdAt: number;
}

export async function getQueue(): Promise<OfflineMutation[]> {
  try {
    return (await get(QUEUE_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function addToQueue(mutation: Omit<OfflineMutation, "id" | "createdAt">) {
  const queue = await getQueue();
  queue.push({
    ...mutation,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  });
  await set(QUEUE_KEY, queue);
}

export async function clearQueue() {
  await del(QUEUE_KEY);
}

export async function removeFromQueue(id: string) {
  const queue = await getQueue();
  await set(QUEUE_KEY, queue.filter((m) => m.id !== id));
}

/**
 * Replay all queued mutations against Supabase.
 * Returns the count of successfully synced items.
 */
export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const mutation of queue) {
    try {
      if (mutation.type === "insert") {
        const { error } = await (supabase.from as any)(mutation.table).insert(mutation.payload);
        if (error) throw error;
      } else if (mutation.type === "update" && mutation.rowId) {
        const { error } = await (supabase.from as any)(mutation.table)
          .update(mutation.payload)
          .eq("id", mutation.rowId);
        if (error) throw error;
      }
      await removeFromQueue(mutation.id);
      synced++;
    } catch (err) {
      console.warn("[offline-sync] Failed to sync mutation", mutation.id, err);
      failed++;
    }
  }

  return { synced, failed };
}
