import { storage } from "wxt/utils/storage";

type StorageKey = `local:${string}` | `session:${string}` | `sync:${string}` | `managed:${string}`;

const DEFAULT_LOCK_TIMEOUT_MS = 60 * 1000;

interface LockData {
  lockId: string;
  acquiredAt: number;
  expiresAt: number;
}

export class DistributedLock {
  private readonly lockKey: StorageKey;
  private readonly timeoutMs: number;
  private readonly lockId: string;
  private releasePromise: Promise<boolean> | null = null;

  constructor(name: string, timeoutMs: number = DEFAULT_LOCK_TIMEOUT_MS) {
    this.lockKey = `local:lock:${name}` as StorageKey;
    this.timeoutMs = timeoutMs;
    this.lockId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  async acquire(): Promise<boolean> {
    const now = Date.now();
    const existingLock = await storage.getItem<LockData>(this.lockKey);

    if (existingLock) {
      if (existingLock.expiresAt > now) {
        return false;
      }
    }

    const lockData: LockData = {
      lockId: this.lockId,
      acquiredAt: now,
      expiresAt: now + this.timeoutMs,
    };

    await storage.setItem(this.lockKey, lockData);

    const verifyLock = await storage.getItem<LockData>(this.lockKey);
    if (!verifyLock || verifyLock.lockId !== this.lockId) {
      return false;
    }

    return true;
  }

  async release(): Promise<boolean> {
    const existingLock = await storage.getItem<LockData>(this.lockKey);

    if (!existingLock || existingLock.lockId !== this.lockId) {
      return false;
    }

    await storage.removeItem(this.lockKey);
    return true;
  }

  async withLock<T>(fn: () => Promise<T>): Promise<{ acquired: boolean; result?: T }> {
    const acquired = await this.acquire();

    if (!acquired) {
      return { acquired: false };
    }

    try {
      const result = await fn();
      return { acquired: true, result };
    } finally {
      this.releasePromise = this.release();
      await this.releasePromise;
    }
  }

  async isLocked(): Promise<boolean> {
    const existingLock = await storage.getItem<LockData>(this.lockKey);

    if (!existingLock) {
      return false;
    }

    if (existingLock.expiresAt <= Date.now()) {
      await storage.removeItem(this.lockKey);
      return false;
    }

    return true;
  }
}

export function createCleanupLock(): DistributedLock {
  return new DistributedLock("scheduled-cleanup", 2 * 60 * 1000);
}
