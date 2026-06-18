import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Calendar, ChevronLeft, AlertTriangle, ShoppingCart, Package, BarChart3 } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { products, batchesByProduct, formatVND, rescuePoints } from "@/lib/mock-data";
import { useCart } from "@/hooks/use-cart";
import { computePrice, estimateDistanceKm, needsColdStorageFor, type BuyerType } from "@/lib/pricing";
import { PriceBreakdownCard } from "@/components/price-breakdown";



export const Route = createFileRoute("/products/$id")({
  loader: ({ params }) => {
    const product = products.find((p) => p.id === params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name} – AgriConnect` },
      { name: "description", content: loaderData?.product.description.slice(0, 150) ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Không tìm thấy nông sản</h1>
        <Link to="/products" className="mt-4 inline-block text-primary">← Quay lại</Link>
      </div>
    </PageShell>
  ),
  errorComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center"><h1 className="text-2xl font-bold">Đã xảy ra lỗi</h1></div>
    </PageShell>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { product: p } = Route.useLoaderData();
  const batches = batchesByProduct(p.id);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [compare, setCompare] = useState(false);
  const [buyerType, setBuyerType] = useState<BuyerType>("individual");
  const { add } = useCart();

  const nav = useNavigate();

  const totalQty = Object.values(selected).reduce((s, n) => s + n, 0);
  const totalValue = Object.entries(selected).reduce((s, [id, q]) => {
    const b = batches.find((x) => x.id === id);
    return s + (b ? b.pricePerKg * q : 0);
  }, 0);

  const pricingQty = totalQty > 0 ? totalQty : 100;
  const pricingFarmGate = totalQty > 0 ? Math.round(totalValue / totalQty) : batches[0]?.pricePerKg ?? 0;
  const selectedBatches = Object.entries(selected)
    .filter(([, q]) => q > 0)
    .map(([id]) => batches.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  const refBatch = selectedBatches[0] ?? batches[0];
  const isRescue = (selectedBatches.length ? selectedBatches : [refBatch]).some((b) => b?.rescueStatus === "rescuing");
  const distanceKm = estimateDistanceKm(refBatch?.location ?? "");
  const breakdown = computePrice({
    farmGatePrice: pricingFarmGate,
    qtyKg: pricingQty,
    isRescue,
    distanceKm,
    needsColdStorage: needsColdStorageFor(p.category),
    buyerType,
  });

  function addSelectedToCart(go = false) {
    Object.entries(selected).forEach(([id, qty]) => {
      const b = batches.find((x) => x.id === id);
      if (!b || qty <= 0) return;
      add({ id: `${p.id}::${b.id}`, name: `${p.name} — Lô ${b.id}`, image: p.image, pricePerKg: b.pricePerKg, location: b.location, qty });
    });
    if (go) nav({ to: "/cart" });
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Quay lại danh sách
        </Link>
      </div>

      {/* Product header */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{p.category}</span>
            <span className="rounded-full border border-border px-3 py-1 text-xs">Đơn vị: kg</span>
            <span className="rounded-full border border-border px-3 py-1 text-xs">{batches.length} lô đang bán</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{p.name}</h1>
          <p className="mt-3 leading-relaxed text-foreground/80">{p.description}</p>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <Mini label="Tổng tồn kho" value={`${batches.reduce((s, b) => s + (b.quantityKg - b.soldKg - b.lockedKg), 0).toLocaleString("vi-VN")} kg`} />
            <Mini label="Giá thấp nhất" value={formatVND(Math.min(...batches.map((b) => b.pricePerKg)))} />
            <Mini label="Lô đang giải cứu" value={String(batches.filter((b) => b.rescueStatus === "rescuing").length)} />
          </div>
        </div>
      </div>

      {/* Batches list */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold inline-flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> Các lô nông sản</h2>
            <p className="text-sm text-muted-foreground">Chọn một hoặc nhiều lô từ các hộ nông dân khác nhau.</p>
          </div>
          <button onClick={() => setCompare((c) => !c)} className={`inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium ${compare ? "border-primary text-primary bg-primary-soft" : "border-border"}`}>
            <BarChart3 className="h-4 w-4" /> So sánh
          </button>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Mã lô</th>
                <th className="px-4 py-3 text-left">Nông dân</th>
                <th className="px-4 py-3 text-left">Địa điểm</th>
                <th className="px-4 py-3 text-left">Thu hoạch</th>
                <th className="px-4 py-3 text-right">Tồn kho</th>
                <th className="px-4 py-3 text-right">Giá</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right">SL mua (kg)</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const remaining = b.quantityKg - b.soldKg - b.lockedKg;
                const point = b.rescuePointId ? rescuePoints.find((rp) => rp.id === b.rescuePointId) : null;
                return (
                  <tr key={b.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{b.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{b.farmerAvatar}</span>
                        <span className="font-medium">{b.farmer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{b.location}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.harvestDate}</td>
                    <td className="px-4 py-3 text-right font-semibold">{remaining.toLocaleString("vi-VN")} kg</td>
                    <td className="px-4 py-3 text-right font-bold text-primary">{formatVND(b.pricePerKg)}</td>
                    <td className="px-4 py-3">
                      <RescueChip s={b.rescueStatus} />
                      {point && <div className="mt-1 text-[11px] text-muted-foreground">→ {point.name}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        max={remaining}
                        value={selected[b.id] ?? 0}
                        onChange={(e) => setSelected((s) => ({ ...s, [b.id]: Math.max(0, Math.min(remaining, +e.target.value)) }))}
                        className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-right text-sm outline-none focus:border-primary"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-3 lg:hidden">
          {batches.map((b) => {
            const remaining = b.quantityKg - b.soldKg - b.lockedKg;
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">{b.id}</span>
                  <RescueChip s={b.rescueStatus} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{b.farmerAvatar}</span>
                  <div>
                    <div className="text-sm font-semibold">{b.farmer}</div>
                    <div className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{b.location}</div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div><div className="text-muted-foreground">Thu hoạch</div><div className="font-medium">{b.harvestDate}</div></div>
                  <div><div className="text-muted-foreground">Tồn</div><div className="font-semibold">{remaining}kg</div></div>
                  <div><div className="text-muted-foreground">Giá</div><div className="font-bold text-primary">{formatVND(b.pricePerKg)}</div></div>
                </div>
                <input type="number" min={0} max={remaining} value={selected[b.id] ?? 0} onChange={(e) => setSelected((s) => ({ ...s, [b.id]: +e.target.value }))} placeholder="Nhập số kg muốn mua" className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            );
          })}
        </div>

        {compare && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-primary bg-card p-5 shadow-card">
            <h3 className="font-semibold">So sánh lô đã chọn</h3>
            {Object.keys(selected).filter((k) => selected[k] > 0).length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Chọn số lượng ở các lô để so sánh.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(selected).filter(([, q]) => q > 0).map(([id, q]) => {
                  const b = batches.find((x) => x.id === id)!;
                  return (
                    <div key={id} className="rounded-xl border border-border p-3">
                      <div className="font-mono text-xs">{b.id}</div>
                      <div className="text-sm font-semibold">{b.farmer}</div>
                      <div className="text-xs text-muted-foreground">{b.location}</div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span>{q} kg × {formatVND(b.pricePerKg)}</span>
                        <span className="font-bold text-primary">{formatVND(q * b.pricePerKg)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Price breakdown – Tính giá an sinh & trợ phí */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="text-lg font-bold">Cách hệ thống tính giá</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              AgriConnect cộng dồn giá tại vườn, phí logistics, phụ thu khoảng cách và phí lưu kho lạnh,
              sau đó áp dụng <span className="font-semibold text-primary">trợ giá chương trình giải cứu</span>,
              chiết khấu mua sỉ và ưu đãi cho tổ chức an sinh.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>• Khoảng cách ước tính: <span className="font-semibold">{distanceKm} km</span></li>
              <li>• Lưu kho lạnh: <span className="font-semibold">{needsColdStorageFor(p.category) ? "Có" : "Không"}</span></li>
              <li>• Trạng thái giải cứu: <span className="font-semibold">{isRescue ? "Đang giải cứu" : "Thương mại thường"}</span></li>
              <li>• {totalQty > 0 ? `${selectedBatches.length} lô được chọn` : "Hiển thị ví dụ với 100 kg – chọn số lượng để tính chính xác"}</li>
            </ul>
          </div>
          <PriceBreakdownCard breakdown={breakdown} buyerType={buyerType} onBuyerTypeChange={setBuyerType} />
        </div>


        {/* Sticky action bar */}
        <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-4 text-sm">
            <div><span className="text-muted-foreground">Đã chọn: </span><span className="font-semibold">{totalQty} kg</span></div>
            <div><span className="text-muted-foreground">Tạm tính: </span><span className="text-lg font-bold text-primary">{formatVND(totalValue)}</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => addSelectedToCart(false)} disabled={totalQty === 0} className="inline-flex items-center gap-2 rounded-full border border-primary bg-card px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50">
              <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ
            </button>
            <button onClick={() => addSelectedToCart(true)} disabled={totalQty === 0} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50">
              Đặt hàng ngay
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold text-primary">{value}</div>
    </div>
  );
}

function RescueChip({ s }: { s: "none" | "pending" | "rescuing" }) {
  if (s === "rescuing") return <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground"><AlertTriangle className="h-3 w-3" />Đang giải cứu</span>;
  if (s === "pending") return <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">Chờ duyệt giải cứu</span>;
  return <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">Đang bán</span>;
}
