import { Link } from "@tanstack/react-router";
import { MapPin, Flame, AlertTriangle } from "lucide-react";
import type { Product } from "@/lib/mock-data";
import { formatVND } from "@/lib/mock-data";

export function ProductCard({ p }: { p: Product }) {
  const remaining = p.quantityKg - p.soldKg;
  const pct = Math.round((p.soldKg / p.quantityKg) * 100);

  return (
    <Link
      to="/products/$id"
      params={{ id: p.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {p.urgency === "rescue" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground shadow-soft">
            <AlertTriangle className="h-3 w-3" /> Giải cứu khẩn cấp
          </span>
        )}
        {p.urgency === "high" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground shadow-soft">
            <Flame className="h-3 w-3" /> Cần bán nhanh
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          {p.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-base font-semibold">{p.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {p.location}
        </div>
        <div className="mt-1 flex items-end justify-between">
          <div>
            <div className="text-lg font-bold text-primary">{formatVND(p.pricePerKg)}<span className="text-xs font-normal text-muted-foreground">/kg</span></div>
            <div className="text-xs text-muted-foreground">Còn {remaining.toLocaleString("vi-VN")} kg</div>
          </div>
          <div className="text-right text-xs font-medium text-muted-foreground">{pct}% đã bán</div>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}
