import cron from 'node-cron';
import { db } from './db';
import { sendLowStockAlertEmail } from './mail';

let lastAlertTimestamp: number = 0;
// Avoid spamming emails more than once every 15 minutes unless new items drop
let alertedItemIds = new Set<string>();

export async function checkAndAlertLowStock(force = false): Promise<{ checked: number; lowCount: number; alerted: boolean; items: any[] }> {
  const allItems = db.inventory.find();
  const lowItems = allItems.filter((i) => i.stock < i.threshold);

  if (lowItems.length === 0) {
    alertedItemIds.clear();
    return { checked: allItems.length, lowCount: 0, alerted: false, items: [] };
  }

  // Check if there are newly low items
  const newlyLow = lowItems.filter((i) => !alertedItemIds.has(i.id));
  const timeSinceLastAlert = Date.now() - lastAlertTimestamp;

  // Send if force requested, or newly dropped items, or at least 15 minutes passed
  if (force || newlyLow.length > 0 || timeSinceLastAlert > 15 * 60 * 1000) {
    console.log(`[Stock Cron] Found ${lowItems.length} items below threshold (< 20). Triggering admin notification.`);
    await sendLowStockAlertEmail(lowItems);
    lastAlertTimestamp = Date.now();
    alertedItemIds = new Set(lowItems.map((i) => i.id));
    return { checked: allItems.length, lowCount: lowItems.length, alerted: true, items: lowItems };
  }

  return { checked: allItems.length, lowCount: lowItems.length, alerted: false, items: lowItems };
}

export function startInventoryCron() {
  console.log('[Stock Cron] Initializing automated inventory threshold monitor (schedule: every 5 minutes)...');

  // Check every 5 minutes: '*/5 * * * *'
  const task = cron.schedule('*/5 * * * *', async () => {
    try {
      await checkAndAlertLowStock(false);
    } catch (err) {
      console.error('[Stock Cron] Error executing stock threshold check:', err);
    }
  });

  // Run an initial light check on server boot after 3 seconds
  setTimeout(() => {
    checkAndAlertLowStock(false).catch((e) => console.error('[Stock Cron] Initial check error:', e));
  }, 3000);

  return task;
}
