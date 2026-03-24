import type { Settings } from "@/types";
import { ScheduleInterval } from "@/types";
import {
  storage,
  LAST_SCHEDULED_CLEANUP_KEY,
  LAST_EXPIRED_COOKIE_CLEANUP_KEY,
  SCHEDULE_INTERVAL_MAP,
} from "@/lib/store";

export function shouldPerformCleanup(
  settings: Settings,
  lastCleanup: number,
  now: number
): boolean {
  if (settings.scheduleInterval === ScheduleInterval.DISABLED) return false;
  const interval = SCHEDULE_INTERVAL_MAP[settings.scheduleInterval];
  return now - lastCleanup >= interval;
}

export async function shouldPerformCleanupWithStorage(
  settings: Settings,
  now: number
): Promise<boolean> {
  if (settings.scheduleInterval === ScheduleInterval.DISABLED) return false;
  const lastCleanup = (await storage.getItem<number>(LAST_SCHEDULED_CLEANUP_KEY)) || 0;
  return shouldPerformCleanup(settings, lastCleanup, now);
}

export async function shouldPerformExpiredCookieCleanupWithStorage(
  settings: Settings,
  now: number
): Promise<boolean> {
  if (settings.scheduleInterval === ScheduleInterval.DISABLED) return false;
  const lastCleanup = (await storage.getItem<number>(LAST_EXPIRED_COOKIE_CLEANUP_KEY)) || 0;
  return shouldPerformCleanup(settings, lastCleanup, now);
}

export async function updateExpiredCookieCleanupTimestamp(now: number): Promise<void> {
  await storage.setItem(LAST_EXPIRED_COOKIE_CLEANUP_KEY, now);
}
