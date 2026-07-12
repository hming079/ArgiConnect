import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertCircle, ArrowRight, HeartHandshake, Leaf, MapPin, RefreshCw, ShieldCheck, ShoppingBasket, Sprout, TrendingUp, Truck, Users } from "lucide-react";
import type { Crop, CropBatch } from "@/api/cropApi";
import { PageShell } from "@/components/site-layout";
import { useCropBatches, useCrops } from "@/hooks/use-crops";
import { getCropImage } from "@/lib/crop-images";
import heroImg from "@/assets/hero-farm.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriConnect – Điều phối và giải cứu nông sản Việt" },
      { name: "description", content: "Nền tảng kết nối trực tiếp nông dân với người mua, giảm thất thoát và hỗ trợ giải cứu nông sản khẩn cấp." },
      { property: "og:title", content: "AgriConnect – Điều phối và giải cứu nông sản Việt" },
      { property: "og:description", content: "Kết nối nông dân và người mua nhanh chóng, minh bạch, bền vững." },
    ],
  }),
  component: Home,
});

type BatchCardItem = {
  id: string;
  batch: CropBatch;
  crop?: Crop;
  name: string;
  image?: string;
  location: string;
  price: number;
  currentQuantity: number;
  initialQuantity: number;
};

function Home() {
  const cropsQuery = useCrops();
  const batchesQuery = useCropBatches();
  const crops = useMemo(() => cropsQuery.data ?? [], [cropsQuery.data]);
  const batches = useMemo(() => batchesQuery.data ?? [], [batchesQuery.data]);
  const cropById = useMemo(() => new Map(crops.map((crop) => [crop.id, crop])), [crops]);
  const availableItems = useMemo(
    () =>
      batches
        .filter((batch) => batch.status === "available")
        .map((batch): BatchCardItem => {
          const crop = cropById.get(batch.cropId);
          const name = crop?.name ?? `NÃ´ng sáº£n #${batch.cropId}`;
          return {
            id: String(batch.id),
            batch,
            crop,
            name,
            image: getCropImage(name),
            location: formatBatchAddress(batch),
            price: Number(batch.unitPrice),
            currentQuantity: Number(batch.currentQuantity),
            initialQuantity: Number(batch.initialQuantity),
          };
        }),
    [batches, cropById],
  );
  const featured = availableItems.slice(0, 4);
  const campaignItems = availableItems
    .filter((item) => item.currentQuantity > 0)
    .slice()
    .sort((a, b) => b.currentQuantity - a.currentQuantity)
    .slice(0, 2);
  const soldQuantity = availableItems.reduce(
    (sum, item) => sum + Math.max(item.initialQuantity - item.currentQuantity, 0),
    0,
  );
  const loading = cropsQuery.isPending || batchesQuery.isPending;
  const failed = cropsQuery.isError || batchesQuery.isError;
  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${heroImg})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur">
              <Leaf className="h-3.5 w-3.5" /> Vì nông sản Việt không bị bỏ phí
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Kết nối ruộng vườn <br /> đến tận tay người mua
            </h1>
            <p className="mt-5 max-w-xl text-base text-primary-foreground/90 sm:text-lg">
              AgriConnect giúp nông dân tìm đầu ra nhanh chóng khi nông sản dư thừa,
              đồng thời mang đến nguồn nông sản tươi ngon, giá hợp lý cho người mua trên toàn quốc.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/farmer" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-soft transition hover:opacity-95">
                <Sprout className="h-4 w-4" /> Đăng nông sản
              </Link>
              <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-soft transition hover:bg-white/95">
                <ShoppingBasket className="h-4 w-4" /> Tìm nông sản <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 rounded-2xl bg-white/10 p-5 backdrop-blur">
              {[
                { v: uniqueCount(batches.map((batch) => batch.farmerId)).toLocaleString("vi-VN"), l: "Nông dân" },
                { v: formatTons(soldQuantity), l: "Đã tiêu thụ" },
                { v: availableItems.length.toLocaleString("vi-VN"), l: "Lô đang bán" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold sm:text-3xl">{s.v}</div>
                  <div className="text-xs text-primary-foreground/80">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative">
              <img src={heroImg} alt="Vườn nông sản Việt Nam" width={1536} height={1024} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-soft" />
              {/* <div className="absolute -bottom-6 -left-6 w-64 rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Giải cứu hôm nay</div>
                    <div className="text-sm font-semibold">200 tấn dưa hấu Long An</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-destructive" style={{ width: "65%" }} />
                </div>
                <div className="mt-1 text-right text-xs text-muted-foreground">65% đã tiêu thụ</div>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {failed && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" /> Không thể tải dữ liệu từ backend
            </div>
            <button
              onClick={() => {
                void cropsQuery.refetch();
                void batchesQuery.refetch();
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-semibold text-foreground"
            >
              <RefreshCw className="h-4 w-4" /> Tải lại
            </button>
          </div>
        </section>
      )}

      {/* CAMPAIGNS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-destructive">Chiến dịch nổi bật</div>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Đang cần bạn chung tay</h2>
          </div>
          <Link to="/products" className="text-sm font-medium text-primary hover:underline">Xem tất cả →</Link>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {loading &&
            [0, 1].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-3xl bg-muted" />
            ))}
          {!loading &&
            campaignItems.map((item) => {
              const sold = Math.max(item.initialQuantity - item.currentQuantity, 0);
              const progress = progressPercent(sold, item.initialQuantity);
              return (
                <div key={item.id} className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                  <div className="grid md:grid-cols-[1fr_1.2fr]">
                    <div className="aspect-[4/3] overflow-hidden bg-primary-soft md:aspect-auto">
                      {item.image ? (
                        <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="grid h-full place-items-center text-4xl font-bold text-primary">#{item.batch.cropId}</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 p-6">
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                        Đang diễn ra
                      </span>
                      <h3 className="text-lg font-bold leading-snug">
                        Giải cứu {formatNumber(item.currentQuantity)} {item.batch.unit} {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Lô #{item.batch.id} từ {item.location || item.batch.province}, nông dân {item.batch.farmerName}.
                      </p>
                      <div className="mt-auto">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Tiến độ</span>
                          <span className="font-semibold text-foreground">{progress}%</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                        <Link to="/categories/$id" params={{ id: String(item.batch.cropId) }} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                          Ủng hộ ngay <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          {!loading && campaignItems.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground md:col-span-2">
              Chưa có lô nông sản khả dụng từ backend.
            </div>
          )}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Nông sản nổi bật</div>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Tươi ngon từ vườn</h2>
          </div>
          <Link to="/products" className="text-sm font-medium text-primary hover:underline">Xem tất cả →</Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading &&
            [0, 1, 2, 3].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-2xl bg-muted" />
            ))}
          {!loading && featured.map((item) => <BackendProductCard key={item.id} item={item} />)}
          {!loading && featured.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground sm:col-span-2 lg:col-span-4">
              Chưa có nông sản nổi bật từ backend.
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-leaf-pattern p-8 sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Cách AgriConnect hoạt động</h2>
            <p className="mt-3 text-muted-foreground">Đơn giản trong 3 bước – kết nối thẳng từ nông trại đến bàn ăn.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { i: Sprout, t: "Nông dân đăng bài", d: "Đăng thông tin nông sản, mức độ khẩn cấp, hình ảnh và giá đề xuất." },
              { i: Users, t: "Người mua tìm và đặt", d: "Lọc theo khu vực, loại nông sản, đặt hàng trực tiếp với nông dân." },
              { i: Truck, t: "Giao hàng tận nơi", d: "Theo dõi đơn hàng, nhận hàng tươi và minh bạch nguồn gốc." },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-card p-6 shadow-card">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <s.i className="h-6 w-6" />
                </div>
                <div className="mt-4 text-xs font-semibold text-primary">BƯỚC {i + 1}</div>
                <h3 className="mt-1 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { i: ShieldCheck, t: "Minh bạch nguồn gốc", d: "Thông tin nông dân, vườn trồng và ngày thu hoạch rõ ràng." },
            { i: TrendingUp, t: "Giá tận gốc", d: "Loại bỏ trung gian, giá hợp lý cho cả nông dân và người mua." },
            { i: HeartHandshake, t: "Hỗ trợ giải cứu", d: "Ưu tiên hiển thị nông sản cần giải cứu khẩn cấp." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/30 text-accent-foreground">
                <f.i className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function BackendProductCard({ item }: { item: BatchCardItem }) {
  const sold = Math.max(item.initialQuantity - item.currentQuantity, 0);
  const pct = progressPercent(sold, item.initialQuantity);

  return (
    <Link
      to="/categories/$id"
      params={{ id: String(item.batch.cropId) }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-primary-soft">
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
        <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          Lô #{item.batch.id}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-base font-semibold">{item.name}</h3>
        <div className="flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {item.location || "Chưa có địa chỉ"}
        </div>
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
    </Link>
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

function progressPercent(value: number, total: number) {
  return total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
}

function formatTons(value: number) {
  return `${formatNumber(value / 1000)} tấn`;
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function uniqueCount(values: Array<number | string>) {
  return new Set(values).size;
}
