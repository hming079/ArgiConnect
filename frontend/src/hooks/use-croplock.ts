import { useEffect, useState, useCallback } from "react";

const KEY = "agriconnect-croplock";
const DURATION_MS = 20 * 60 * 1000;

export interface CropLock {
  id: string;
  expiresAt: number;
  status?: "LOCKED" | "ORDERED";
  backendLockIds?: number[];
  orderId?: string;
  orderedAt?: number;
  items: { id: string; name: string; qty: number; pricePerKg: number }[];
}

function read(): CropLock | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const lock = JSON.parse(raw) as CropLock;
    if (lock.status !== "ORDERED" && lock.expiresAt <= Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return lock;
  } catch {
    return null;
  }
}

function write(lock: CropLock | null) {
  if (typeof window === "undefined") return;
  if (lock) localStorage.setItem(KEY, JSON.stringify(lock));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("croplock-changed"));
}

export function useCropLock() {
  const [lock, setLock] = useState<CropLock | null>(null);
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const refresh = () => {
      const l = read();
      setLock(l);
      setRemaining(l ? Math.max(0, l.expiresAt - Date.now()) : 0);
    };
    refresh();
    const t = setInterval(refresh, 1000);
    window.addEventListener("croplock-changed", refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("croplock-changed", refresh);
    };
  }, []);

  const create = useCallback((items: CropLock["items"]) => {
    const l: CropLock = {
      id: "CL-" + Math.floor(Math.random() * 90000 + 10000),
      expiresAt: Date.now() + DURATION_MS,
      status: "LOCKED",
      items,
    };
    write(l);
    return l;
  }, []);

  const release = useCallback(() => write(null), []);

  const attachBackendLocks = useCallback((backendLockIds: number[]) => {
    const current = read();
    if (!current) return null;
    const next: CropLock = { ...current, backendLockIds };
    write(next);
    return next;
  }, []);

  const attachToOrder = useCallback((orderId: string) => {
    const current = read();
    if (!current) return null;
    const next: CropLock = {
      ...current,
      status: "ORDERED",
      orderId,
      orderedAt: Date.now(),
    };
    write(next);
    return next;
  }, []);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const expired = !!lock && lock.status !== "ORDERED" && remaining === 0;

  return { lock, remaining, minutes, seconds, expired, create, release, attachBackendLocks, attachToOrder };
}
