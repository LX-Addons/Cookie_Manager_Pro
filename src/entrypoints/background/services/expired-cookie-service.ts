import type { Settings } from "@/types";
import { ScheduleInterval } from "@/types";
import { SCHEDULE_INTERVAL_MAP } from "@/lib/store";
import { cleanupExpiredCookies } from "@/utils/cleanup/cookie-ops";

export class ExpiredCookieService {
  private shouldPerformCleanup(settings: Settings, now: number): boolean {
    if (settings.scheduleInterval === ScheduleInterval.DISABLED) return false;
    const lastCleanup = settings.lastScheduledCleanup || 0;
    const interval = SCHEDULE_INTERVAL_MAP[settings.scheduleInterval];
    return now - lastCleanup >= interval;
  }

  private async doExpiredCookiesCleanup(
    settings: Settings,
    checkTimeWindow = false,
    now?: number
  ): Promise<void> {
    if (!settings.enableAutoCleanup || !settings.cleanupExpiredCookies) return;

    if (checkTimeWindow && now !== undefined) {
      if (!this.shouldPerformCleanup(settings, now)) return;
    }

    try {
      const count = await cleanupExpiredCookies();
      if (count > 0) {
        console.log(`Cleaned up ${count} expired cookies${checkTimeWindow ? "" : " on startup"}`);
      }
    } catch (e) {
      console.error("Failed to cleanup expired cookies:", e);
    }
  }

  async runExpiredCookiesCleanup(
    settings: Settings,
    checkTimeWindow = false,
    now?: number
  ): Promise<void> {
    await this.doExpiredCookiesCleanup(settings, checkTimeWindow, now);
  }
}
