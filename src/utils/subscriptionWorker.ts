// src/utils/subscriptionWorker.ts
// Background Subscription Worker for Auto-Sync & Server Deduplication

import { useConfigStore, V2RayConfig } from '../store/configStore';
import { parseMultiFormatContent } from './clashParser';

export async function runSubscriptionAutoSync(): Promise<{ updatedSubs: number; totalConfigs: number }> {
  const store = useConfigStore.getState();
  const { subscriptions, refreshSubscription } = store;

  let updatedCount = 0;
  for (const sub of subscriptions) {
    if (sub.autoUpdate) {
      const success = await refreshSubscription(sub.id);
      if (success) updatedCount++;
    }
  }

  // Run server deduplication (removes duplicate host+port configs)
  deduplicateServerConfigs();

  const finalConfigs = useConfigStore.getState().configs;
  return {
    updatedSubs: updatedCount,
    totalConfigs: finalConfigs.length,
  };
}

export function deduplicateServerConfigs(): number {
  const store = useConfigStore.getState();
  const { configs, deleteConfig } = store;

  const seenKeys = new Set<string>();
  const duplicatesToRemove: string[] = [];

  for (const config of configs) {
    const key = `${config.protocol}://${config.address}:${config.port}/${config.uuid || config.password || ''}`;
    if (seenKeys.has(key)) {
      duplicatesToRemove.push(config.id);
    } else {
      seenKeys.add(key);
    }
  }

  for (const id of duplicatesToRemove) {
    deleteConfig(id);
  }

  return duplicatesToRemove.length;
}
