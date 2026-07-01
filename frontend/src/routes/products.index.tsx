import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Flame,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import type { Crop, CropBatch } from "@/api/cropApi";
import { PageShell } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { useCropBatches, useCrops } from "@/hooks/use-crops";
import { getCropImage } from "@/lib/crop-images";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Nông sản - AgriConnect" },
      { name: "description", content: "Khám phá nông sản tươi từ dữ liệu backend AgriConnect." },
    ],
  }),
  component: ProductsList,
});

type ProductItem = {
  id: string;
  crop: Crop | undefined;
  batch: CropBatch;
  name: string;
  image?: string;
  location: string;
  price: number;
  currentQuantity: number;
  initialQuantity: number;
  urgency: "normal" | "high" | "rescue";
};

function ProductsList() {
  const cropsQuery = useCrops();
  const batchesQuery = useCropBatches();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tất cả");
  const [reg, setReg] = useState("Tất cả khu vực");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(100000);

  const crops = useMemo(() => cropsQuery.data ?? [], [cropsQuery.data]);
  const batches = useMemo(() => batchesQuery.data ?? [], [batchesQuery.data]);
  const cropById = useMemo(() => new Map(crops.map((crop) => [crop.id, crop])), [crops]);
  const items = useMemo(
    () =>
      batches
        .filter((batch) => batch.status === "available")
        .map((batch): ProductItem => {
          const crop = cropById.get(batch.cropId);
          const name = crop?.name ?? `Nông sản #${batch.cropId}`;
          return {
            id: String(batch.id),
            crop,
            batch,
            name,
            image: getCropImage(name),
            location: formatBatchAddress(batch),
            price: Number(batch.unitPrice),
            currentQuantity: Number(batch.currentQuantity),
            initialQuantity: Number(batch.initialQuantity),
            urgency: Number(batch.currentQuantity) <= 0 ? "high" : "normal",
          };
        }),
    [batches, cropById],
  );
  const categories = useMemo(
    () => ["Tất cả", ...Array.from(new Set(crops.map((crop) => crop.name)))],
    [crops],
  );
  const regions = useMemo(
    () => [
      "Tất cả khu vực",
      ...Array.from(new Set(batches.map((batch) => batch.province).filter(Boolean))),
    ],
    [batches],
  );
  const loading = cropsQuery.isPending || batchesQuery.isPending;
  const failed = cropsQuery.isError || batchesQuery.isError;

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (q && !item.name.toLowerCase().includes(q.toLowerCase())) return false;
        if (cat !== "Tất cả" && item.name !== cat) return false;
        if (reg !== "Tất cả khu vực" && item.batch.province !== reg) return false;
        if (urgentOnly && item.urgency === "normal") return false;
        if (item.price > maxPrice) return false;
        return true;
      }),
    [items, q, cat, reg, urgentOnly, maxPrice],
  );

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl">Khám phá nông sản</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tìm kiếm nông sản tươi từ các lô thật trong backend.
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-card">
            <Search className="ml-2 h-5 w-5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm dưa hấu, thanh long, xoài..."
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Loại nông sản</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCat(category)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      cat === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground/70 hover:bg-primary-soft"
                    }`}
                  >
                    {category}
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
                {regions.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Giá tối đa</span>
                <span className="text-primary">{maxPrice.toLocaleString("vi-VN")}đ</span>
              </label>
              <input
                type="range"
                min={0}
                max={100000}
                step={1000}
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
              <span className="text-sm font-medium">
                Chỉ hiển thị nông sản giải cứu / cần bán nhanh
              </span>
            </label>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Tìm thấy <span className="font-semibold text-foreground">{filtered.length}</span> lô
              nông sản
            </div>
          </div>

          {failed && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center">
              <AlertCircle className="mx-auto h-9 w-9 text-destructive" />
              <h2 className="mt-3 font-semibold">Không thể tải nông sản</h2>
              <Button
                className="mt-4 rounded-full"
                onClick={() => {
                  void cropsQuery.refetch();
                  void batchesQuery.refetch();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Tải lại
              </Button>
            </div>
          )}

          {loading && <div className="h-72 animate-pulse rounded-2xl bg-muted" />}

          {!loading && !failed && filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
              Không tìm thấy nông sản phù hợp. Thử điều chỉnh bộ lọc.
            </div>
          ) : null}

          {!loading && !failed && filtered.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <ProductBatchCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function ProductBatchCard({ item }: { item: ProductItem }) {
  const sold = Math.max(item.initialQuantity - item.currentQuantity, 0);
  const pct =
    item.initialQuantity > 0 ? Math.min(100, Math.round((sold / item.initialQuantity) * 100)) : 0;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link
        to="/categories/$id"
        params={{ id: String(item.batch.cropId) }}
        className="relative block aspect-[4/3] overflow-hidden bg-primary-soft"
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl font-bold text-primary">
            #{item.batch.cropId}
          </div>
        )}
        {item.urgency === "rescue" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground shadow-soft">
            <AlertTriangle className="h-3 w-3" /> Giải cứu
          </span>
        )}
        {item.urgency === "high" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground shadow-soft">
            <Flame className="h-3 w-3" /> Cần bán nhanh
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          Lô #{item.batch.id}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          to="/categories/$id"
          params={{ id: String(item.batch.cropId) }}
          className="line-clamp-1 text-base font-semibold hover:text-primary"
        >
          {item.name}
        </Link>
        <div className="flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {item.location || "Chưa có địa chỉ"}
        </div>
        <div className="text-xs text-muted-foreground">Nông dân: {item.batch.farmerName}</div>
        <div className="mt-1 flex items-end justify-between">
          <div>
            <div className="text-lg font-bold text-primary">
              {formatVND(item.price)}
              <span className="text-xs font-normal text-muted-foreground">/{item.batch.unit}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Còn {formatNumber(item.currentQuantity)} {item.batch.unit}
            </div>
          </div>
          <div className="text-right text-xs font-medium text-muted-foreground">{pct}% đã bán</div>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </article>
  );
}

function formatBatchAddress(batch: CropBatch) {
  if (
    batch.addressDetail &&
    [batch.ward, batch.district, batch.province].some((part) =>
      part ? batch.addressDetail?.includes(part) : false,
    )
  ) {
    return batch.addressDetail;
  }
  return [batch.addressDetail, batch.ward, batch.district, batch.province]
    .filter(Boolean)
    .join(", ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
