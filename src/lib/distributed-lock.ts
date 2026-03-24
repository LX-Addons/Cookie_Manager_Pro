import { storage } from "wxt/utils/storage";

type StorageKey = `local:${string}` | `session:${string}` | `sync:${string}` | `managed:${string}`;

const DEFAULT_LOCK_TIMEOUT_MS = 60 * 1000;

const memoryLocks = new Map<string, { lockId: string; expiresAt: number }>();

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

  private isLockExpired(lock: { expiresAt: number }): boolean {
    return lock.expiresAt <= Date.now();
  }

  async acquire(): Promise<boolean> {
    const now = Date.now();
    const memoryLock = memoryLocks.get(this.lockKey);

    if (memoryLock && !this.isLockExpired(memoryLock)) {
      return false;
    }

    const storageLock = await storage.getItem<LockData>(this.lockKey);
    if (storageLock && !this.isLockExpired({ expiresAt: storageLock.expiresAt })) {
      memoryLocks.set(this.lockKey, {
        lockId: storageLock.lockId,
        expiresAt: storageLock.expiresAt,
      });
      return false;
    }

    const lockData: LockData = {
      lockId: this.lockId,
      acquiredAt: now,
      expiresAt: now + this.timeoutMs,
    };

    memoryLocks.set(this.lockKey, {
      lockId: this.lockId,
      expiresAt: lockData.expiresAt,
    });

    await storage.setItem(this.lockKey, lockData);

    return true;
  }

  async release(): Promise<boolean> {
    const memoryLock = memoryLocks.get(this.lockKey);

    if (!memoryLock || memoryLock.lockId !== this.lockId) {
      return false;
    }

    memoryLocks.delete(this.lockKey);
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
    const memoryLock = memoryLocks.get(this.lockKey);

    if (memoryLock && !this.isLockExpired(memoryLock)) {
      return true;
    }

    const storageLock = await storage.getItem<LockData>(this.lockKey);
    if (!storageLock || this.isLockExpired({ expiresAt: storageLock.expiresAt })) {
      memoryLocks.delete(this.lockKey);
      return false;
    }

    memoryLocks.set(this.lockKey, {
      lockId: storageLock.lockId,
      expiresAt: storageLock.expiresAt,
    });
    return true;
  }
}

export function createCleanupLock(): DistributedLock {
  return new DistributedLock("scheduled-cleanup", 2 * 60 * 1000);
}
