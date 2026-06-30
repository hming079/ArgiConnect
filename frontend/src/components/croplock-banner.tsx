import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Timer, X } from "lucide-react";

import { deleteCropLock } from "@/api/cropLockApi";
import { updateOrderStatus } from "@/api/orderApi";
import { useCropLock } from "@/hooks/use-croplock";

export function CropLockBanner() {
  const { lock, minutes, seconds, expired, release } = useCropLock();
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  if (!lock) return null;

  const ordered = lock.status === "ORDERED";
  const pct = Math.max(0, Math.min(100, ((20 * 60 - (minutes * 60 + seconds)) / (20 * 60)) * 100));
  const totalQty = lock.items.reduce((sum, item) => sum + item.qty, 0);

  async function cancelLock() {
    if (cancelling) return;
    const currentLock = lock;
    if (!currentLock) return;
    setCancelling(true);
    setError("");
    try {
      if (currentLock.status === "ORDERED" && currentLock.orderId) {
        await updateOrderStatus(Number(currentLock.orderId), "CANCELLED");
      } else {
        await Promise.allSettled((currentLock.backendLockIds ?? []).map((id) => deleteCropLock(id)));
      }
      release();
    } catch (exception) {
      setError(getErrorMessage(exception));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className={`overflow-hidden rounded-2xl border ${expired ? "border-destructive bg-destructive/10" : ordered ? "border-primary bg-primary-soft/40" : "border-accent bg-accent/10"} p-4 shadow-card`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-full ${expired ? "bg-destructive text-destructive-foreground" : ordered ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
          <Lock className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            CropLock - {ordered ? "Dang giu cho don hang" : "Dang giu hang"}
          </div>
          <div className="text-sm">
            He thong dang giu <span className="font-semibold">{totalQty} kg</span>
            {ordered ? " trong don hang cua ban" : " trong gio cua ban"}. Ma:{" "}
            <span className="font-mono font-semibold">{ordered ? lock.orderId : lock.id}</span>
          </div>
        </div>
        {ordered ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              to="/checkout"
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Tiep tuc xac nhan
            </Link>
            <button
              type="button"
              onClick={() => void cancelLock()}
              disabled={cancelling}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-destructive/30 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" /> {cancelling ? "Dang huy" : "Huy don"}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" /> Con lai
              </div>
              <div className={`font-mono text-2xl font-bold tabular-nums ${expired ? "text-destructive" : "text-accent"}`}>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
            </div>
          </div>
        )}
      </div>
      {!ordered && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
          <div className={`h-full transition-all ${expired ? "bg-destructive" : "bg-accent"}`} style={{ width: `${100 - pct}%` }} />
        </div>
      )}
      {error && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "Khong the huy CropLock.";
}
