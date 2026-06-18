import { Lock, Timer } from "lucide-react";
import { useCropLock } from "@/hooks/use-croplock";

export function CropLockBanner() {
  const { lock, minutes, seconds, expired } = useCropLock();
  if (!lock) return null;
  const pct = Math.max(0, Math.min(100, ((20 * 60 - (minutes * 60 + seconds)) / (20 * 60)) * 100));
  return (
    <div className={`overflow-hidden rounded-2xl border ${expired ? "border-destructive bg-destructive/10" : "border-accent bg-accent/10"} p-4 shadow-card`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-full ${expired ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground"}`}>
          <Lock className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CropLock · Đang giữ hàng</div>
          <div className="text-sm">
            Hệ thống đang giữ <span className="font-semibold">{lock.items.reduce((s, i) => s + i.qty, 0)} kg</span> trong giỏ của bạn. Mã: <span className="font-mono font-semibold">{lock.id}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Timer className="h-3 w-3" /> Còn lại</div>
          <div className={`font-mono text-2xl font-bold tabular-nums ${expired ? "text-destructive" : "text-accent"}`}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
        <div className={`h-full transition-all ${expired ? "bg-destructive" : "bg-accent"}`} style={{ width: `${100 - pct}%` }} />
      </div>
    </div>
  );
}
