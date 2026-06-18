import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MapPin, Clock, Building2, ShoppingCart, AlertTriangle, Package } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { rescuePoints, productBatches, categoryRich, formatVND, batchStatusLabel } from "@/lib/mock-data";
import { useCart } from "@/hooks/use-cart";

export const Route = createFileRoute("/rescue-points/$id")({
  head: ({ params }) => ({
    meta: [{ title: `${rescuePoints.find((p) => p.id === params.id)?.name ?? "Điểm giải cứu"} – AgriConnect` }],
  }),
  loader: ({ params }) => {
    const point = rescuePoints.find((p) => p.id === params.id);
    if (!point) throw notFound();
    return { point };
  },
  component: RescuePointDetail,
  notFoundComponent: () => (
    <PageShell><div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Không tìm thấy điểm giải cứu</h1>
      <Link to="/rescue-points" className="mt-4 inline-block text-primary hover:underline">← Quay lại</Link>
    </div></PageShell>
  ),
});

function RescuePointDetail() {
  const { id } = Route.useParams();
  const point = rescuePoints.find((p) => p.id === id)!;
  const { add } = useCart();

  const pointBatches = productBatches.filter((b) => b.rescuePointId === id);
  // group by category
  const groups = new Map<string, typeof pointBatches>();
  for (const b of pointBatches) {
    const cat = Object.values(categoryRich).find((c) => c.productIds.includes(b.productId));
    if (!cat) continue;
    const arr = groups.get(cat.id) ?? [];
    arr.push(b);
    groups.set(cat.id, arr);
  }
  const groupIds = Array.from(groups.keys());
  const [activeCat, setActiveCat] = useState<string | null>(groupIds[0] ?? null);
  const activeBatches = activeCat ? groups.get(activeCat) ?? [] : [];
  const activeCategory = activeCat ? categoryRich[activeCat] : null;

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link to="/rescue-points" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Điểm giải cứu
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{point.name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {point.address}</span>
            <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" /> {point.org}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {point.hours}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Sản lượng tiếp nhận</div>
            <div className="mt-1 text-2xl font-bold">{point.receivedKg.toLocaleString("vi-VN")} kg</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Đã tiêu thụ</div>
            <div className="mt-1 text-2xl font-bold text-primary">{point.soldKg.toLocaleString("vi-VN")} kg</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Loại nông sản</div>
            <div className="mt-1 text-2xl font-bold">{groupIds.length}</div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="mt-10">
          <h2 className="text-xl font-bold">Nông sản tại điểm giải cứu</h2>
          {groupIds.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Hiện chưa có lô nông sản nào tại điểm này.
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {groupIds.map((gid) => {
                  const c = categoryRich[gid];
                  const sel = gid === activeCat;
                  return (
                    <button
                      key={gid}
                      onClick={() => setActiveCat(gid)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <img src={c.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                      {c.name}
                      <span className={`rounded-full px-1.5 text-[10px] font-bold ${sel ? "bg-primary-foreground/20" : "bg-muted"}`}>
                        {groups.get(gid)!.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Batch grid */}
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeBatches.map((b) => {
                  const remaining = b.quantityKg - b.soldKg;
                  const st = batchStatusLabel(b);
                  return (
                    <div key={b.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                      <div className="flex items-start justify-between">
                        <div className="font-mono text-xs text-muted-foreground">{b.id}</div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          st.tone === "destructive" ? "bg-destructive/15 text-destructive" : "bg-primary-soft text-primary"
                        }`}>
                          <AlertTriangle className="-mt-0.5 mr-0.5 inline h-2.5 w-2.5" /> {st.label}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{b.farmerAvatar}</span>
                        <div>
                          <div className="text-sm font-semibold">{b.farmer}</div>
                          <div className="text-xs text-muted-foreground">{b.location}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <div className="text-[10px] uppercase text-muted-foreground">Còn lại</div>
                          <div className="font-bold">{remaining.toLocaleString("vi-VN")} kg</div>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2">
                          <div className="text-[10px] uppercase text-muted-foreground">Giá bán</div>
                          <div className="font-bold">{formatVND(b.pricePerKg)}/kg</div>
                        </div>
                        <div className="col-span-2 rounded-lg bg-muted/50 p-2">
                          <div className="text-[10px] uppercase text-muted-foreground">Thu hoạch</div>
                          <div className="font-medium">{b.harvestDate}</div>
                        </div>
                      </div>
                      {remaining > 0 && activeCategory && (
                        <button
                          onClick={() => add({ id: b.id, name: `Lô ${b.id} · ${activeCategory.name}`, image: activeCategory.image, pricePerKg: b.pricePerKg, location: b.location, qty: 10 })}
                          className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> Thêm vào giỏ · Theo dõi CropLock
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
