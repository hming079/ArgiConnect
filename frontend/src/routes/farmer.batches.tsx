import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Edit,
  Eye,
  MapPin,
  Plus,
  RefreshCw,
} from "lucide-react";

import type { Crop, CropBatch, CropBatchStatus } from "@/api/cropApi";
import type { RescueRegistrationStatus } from "@/api/rescueRegistrationApi";
import { PageShell } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { useCropBatches, useCrops } from "@/hooks/use-crops";
import { useMyRescueRegistrations } from "@/hooks/use-rescue-registrations";
import { getCropImage } from "@/lib/crop-images";

export const Route = createFileRoute("/farmer/batches")({
  head: () => ({ meta: [{ title: "Quản lý lô nông sản - AgriConnect" }] }),
  component: BatchesPage,
});

function BatchesPage() {
  const batchesQuery = useCropBatches(undefined, true);
  const cropsQuery = useCrops();
  const registrationsQuery = useMyRescueRegistrations();
  const batches = batchesQuery.data ?? [];
  const crops = cropsQuery.data ?? [];
  const registrations = registrationsQuery.data ?? [];
  const loading = batchesQuery.isPending || cropsQuery.isPending || registrationsQuery.isPending;
  const failed = batchesQuery.isError || cropsQuery.isError || registrationsQuery.isError;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/farmer" className="text-sm text-primary hover:underline">
              ← Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Quản lý lô nông sản</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi các lô nông sản thật từ backend và trạng thái đăng ký giải cứu.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/categories">
              <Plus className="h-4 w-4" /> Tạo lô mới
            </Link>
          </Button>
        </div>

        {failed && (
          <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center">
            <AlertCircle className="mx-auto h-9 w-9 text-destructive" />
            <h2 className="mt-3 font-semibold">Không thể tải lô nông sản</h2>
            <Button
              className="mt-4 rounded-full"
              onClick={() => {
                void batchesQuery.refetch();
                void cropsQuery.refetch();
                void registrationsQuery.refetch();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Tải lại
            </Button>
          </div>
        )}

        {loading && <div className="mt-8 h-72 animate-pulse rounded-2xl bg-muted" />}

        {!loading && !failed && batches.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Bạn chưa có lô nông sản nào.
          </div>
        )}

        {!loading && !failed && batches.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {batches.map((batch) => {
              const crop = crops.find((item) => item.id === batch.cropId);
              const registration = registrations.find((item) => item.batchId === batch.id);
              return (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  crop={crop}
                  rescueStatus={registration?.status}
                />
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function BatchCard({
  batch,
  crop,
  rescueStatus,
}: {
  batch: CropBatch;
  crop?: Crop;
  rescueStatus?: RescueRegistrationStatus;
}) {
  const cropName = crop?.name ?? `Nông sản #${batch.cropId}`;
  const image = getCropImage(cropName);
  const current = Number(batch.currentQuantity);
  const initial = Number(batch.initialQuantity);
  const sold = Math.max(initial - current, 0);
  const pct = initial > 0 ? Math.min(100, Math.round((sold / initial) * 100)) : 0;
  const isRescue = rescueStatus === "APPROVED";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="relative aspect-[16/10] overflow-hidden bg-primary-soft">
        {image ? (
          <img src={image} alt={cropName} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-4xl font-bold text-primary">
            #{batch.cropId}
          </div>
        )}
        {isRescue && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
            <AlertTriangle className="h-3 w-3" /> Giải cứu
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2 py-1 font-mono text-[10px] font-semibold backdrop-blur">
          #{batch.id}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{cropName}</h3>
            <div className="mt-1 text-xs text-muted-foreground">
              Trạng thái: {statusLabel(batch.status)}
            </div>
          </div>
          {rescueStatus && <RescueBadge status={rescueStatus} />}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-start gap-1">
            <MapPin className="mt-0.5 h-3 w-3" /> {formatBatchAddress(batch) || "Chưa có địa chỉ"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {batch.harvestDate}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3">
          <div>
            <div className="text-[10px] text-muted-foreground">Giá bán</div>
            <div className="text-sm font-bold text-primary">
              {formatVND(Number(batch.unitPrice))}/{batch.unit}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Tồn kho</div>
            <div className="text-sm font-bold">
              {formatNumber(current)} {batch.unit}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {formatNumber(sold)} / {formatNumber(initial)} {batch.unit}
            </span>
            <span className="font-semibold text-primary">{pct}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 rounded-full" asChild>
            <Link to="/categories/$id" params={{ id: String(batch.cropId) }}>
              <Eye className="h-3.5 w-3.5" /> Xem
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 rounded-full" asChild>
            <Link to="/categories/$id" params={{ id: String(batch.cropId) }}>
              <Edit className="h-3.5 w-3.5" /> Sửa
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RescueBadge({ status }: { status: RescueRegistrationStatus }) {
  const label = status === "APPROVED" ? "Đã duyệt" : status === "PENDING" ? "Chờ duyệt" : "Từ chối";
  const tone =
    status === "APPROVED"
      ? "bg-primary-soft text-primary"
      : status === "PENDING"
        ? "bg-accent/20 text-accent-foreground"
        : "bg-destructive/15 text-destructive";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function statusLabel(status: CropBatchStatus) {
  const labels: Record<CropBatchStatus, string> = {
    available: "Còn hàng",
    sold_out: "Đã bán hết",
    expired: "Hết hạn",
    cancelled: "Đã hủy",
  };
  return labels[status] ?? status;
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
