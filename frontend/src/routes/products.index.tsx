import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { ProductCard } from "@/components/product-card";
import { products, categories, regions } from "@/lib/mock-data";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Nông sản – AgriConnect" },
      { name: "description", content: "Khám phá nông sản tươi từ nông dân Việt. Lọc theo khu vực, loại nông sản và mức độ khẩn cấp." },
    ],
  }),
  component: ProductsList,
});

function ProductsList() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tất cả");
  const [reg, setReg] = useState("Tất cả khu vực");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(100000);

  const filtered = useMemo(() => products.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== "Tất cả" && p.category !== cat) return false;
    if (reg !== "Tất cả khu vực" && p.location !== reg) return false;
    if (urgentOnly && p.urgency === "normal") return false;
    if (p.pricePerKg > maxPrice) return false;
    return true;
  }), [q, cat, reg, urgentOnly, maxPrice]);

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl">Khám phá nông sản</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tìm kiếm nông sản tươi từ vườn trên toàn quốc. Ưu tiên những mặt hàng đang cần giải cứu.
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-card">
            <Search className="ml-2 h-5 w-5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm dưa hấu, thanh long, sầu riêng…"
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        {/* Filters */}
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Loại nông sản</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      cat === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:bg-primary-soft"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Khu vực</label>
              <select
                value={reg}
                onChange={(e) => setReg(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {regions.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Giá tối đa</span>
                <span className="text-primary">{maxPrice.toLocaleString("vi-VN")}₫/kg</span>
              </label>
              <input
                type="range" min={1000} max={100000} step={1000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="mt-2 w-full accent-[oklch(0.52_0.16_145)]"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
              <input
                type="checkbox"
                checked={urgentOnly}
                onChange={(e) => setUrgentOnly(e.target.checked)}
                className="h-4 w-4 accent-[oklch(0.62_0.22_30)]"
              />
              <span className="text-sm font-medium">Chỉ hiển thị nông sản giải cứu / cần bán nhanh</span>
            </label>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Tìm thấy <span className="font-semibold text-foreground">{filtered.length}</span> sản phẩm
            </div>
            <select className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none">
              <option>Mới nhất</option>
              <option>Giá thấp đến cao</option>
              <option>Mức độ khẩn cấp</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
              Không tìm thấy nông sản phù hợp. Thử điều chỉnh bộ lọc.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
