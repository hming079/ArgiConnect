import { Receipt, Sparkles, Truck, Snowflake, MapPin, Tag, HeartHandshake, Leaf } from "lucide-react";
import { formatVND } from "@/lib/mock-data";
import { buyerTypeLabels, type BuyerType, type PriceBreakdown } from "@/lib/pricing";

const iconMap: Record<string, typeof Leaf> = {
  farm: Leaf,
  rescue: Sparkles,
  logi: Truck,
  dist: MapPin,
  cold: Snowflake,
  bulk: Tag,
  welfare: HeartHandshake,
  biz: HeartHandshake,
};

interface Props {
  breakdown: PriceBreakdown;
  buyerType: BuyerType;
  onBuyerTypeChange?: (t: BuyerType) => void;
  title?: string;
  compact?: boolean;
}

export function PriceBreakdownCard({ breakdown, buyerType, onBuyerTypeChange, title = "Tính Giá An sinh & Trợ phí", compact }: Props) {
  const { lines, qtyKg, finalPerKg, finalTotal, totalSubsidy } = breakdown;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-to-r from-primary-soft/60 to-accent/20 p-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">{title}</h3>
            <p className="text-[11px] text-muted-foreground">Tự động tính trợ giá, logistics và ưu đãi an sinh</p>
          </div>
        </div>
        {totalSubsidy > 0 && (
          <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
            Tiết kiệm {formatVND(totalSubsidy)}
          </span>
        )}
      </div>

      {onBuyerTypeChange && (
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Loại người mua</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(buyerTypeLabels) as BuyerType[]).map((t) => (
              <button
                key={t}
                onClick={() => onBuyerTypeChange(t)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  buyerType === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {buyerTypeLabels[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="divide-y divide-border">
        {lines.map((l) => {
          const Icon = iconMap[l.key] ?? Leaf;
          const isSub = l.kind === "sub";
          return (
            <li key={l.key} className="flex items-center gap-3 px-4 py-2.5">
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                isSub ? "bg-primary-soft text-primary" : l.kind === "base" ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{l.label}</span>
                  {isSub && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Trợ giá</span>}
                </div>
                {!compact && l.note && <div className="truncate text-[11px] text-muted-foreground">{l.note}</div>}
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold tabular-nums ${isSub ? "text-primary" : ""}`}>
                  {isSub ? "−" : ""}{formatVND(Math.abs(l.total))}
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  {isSub ? "−" : ""}{formatVND(Math.abs(l.perKg))}/kg
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border bg-gradient-to-r from-primary/5 to-accent/10 px-4 py-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground">Tổng cộng ({qtyKg.toLocaleString("vi-VN")} kg)</div>
            <div className="text-[11px] text-muted-foreground">Đơn giá cuối: <span className="font-semibold text-foreground">{formatVND(finalPerKg)}/kg</span></div>
          </div>
          <div className="text-2xl font-bold text-primary tabular-nums">{formatVND(finalTotal)}</div>
        </div>
      </div>
    </div>
  );
}
