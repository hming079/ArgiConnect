import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { Crop, CropBatch } from "@/api/cropApi";
import type { RescueRegistrationStatus } from "@/api/rescueRegistrationApi";
import { PaginationControls } from "@/components/pagination-controls";
import { PageShell } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { useCropBatches, useCrops } from "@/hooks/use-crops";
import {
  useRescueRegistrationsPage,
  useReviewRescueRegistration,
} from "@/hooks/use-rescue-registrations";
import { useRescuePoints } from "@/hooks/use-rescue-points";
import { getCropImage } from "@/lib/crop-images";

export const Route = createFileRoute("/admin/rescue-requests")({
  head: () => ({ meta: [{ title: "Duyệt yêu cầu giải cứu – AgriConnect" }] }),
  component: AdminRescueRequests,
});

type Filter = "ALL" | RescueRegistrationStatus;

function AdminRescueRequests() {
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const registrationsQuery = useRescueRegistrationsPage(
    filter === "ALL" ? undefined : { status: filter },
    { page: page - 1, size: pageSize },
  );
  const batchesQuery = useCropBatches();
  const cropsQuery = useCrops();
  const pointsQuery = useRescuePoints();
  const review = useReviewRescueRegistration();
  const [error, setError] = useState("");
  const registrations = registrationsQuery.data?.content ?? [];
  const totalRegistrations = registrationsQuery.data?.totalElements ?? registrations.length;
  const batches = batchesQuery.data ?? [];
  const crops = cropsQuery.data ?? [];
  const points = pointsQuery.data ?? [];
  const list = registrations;
  useEffect(() => {
    setPage(1);
  }, [filter]);
  useEffect(() => {
    if (registrationsQuery.isFetching) return;
    const totalPages = Math.max(1, Math.ceil(totalRegistrations / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [page, pageSize, registrationsQuery.isFetching, totalRegistrations]);
  const pagedList = list;
  const pendingCount =
    filter === "PENDING"
      ? totalRegistrations
      : registrations.filter((item) => item.status === "PENDING").length;
  const loading =
    registrationsQuery.isPending ||
    batchesQuery.isPending ||
    cropsQuery.isPending ||
    pointsQuery.isPending;
  const failed =
    registrationsQuery.isError || batchesQuery.isError || cropsQuery.isError || pointsQuery.isError;

  async function decide(id: number, decision: "approve" | "reject") {
    try {
      setError("");
      await review.mutateAsync({ id, decision });
      setPage(1);
    } catch {
      setError("Không thể cập nhật yêu cầu. Vui lòng thử lại.");
    }
  }

  function changePage(nextPage: number) {
    const totalPages = Math.max(1, Math.ceil(totalRegistrations / pageSize));
    setPage(Math.min(Math.max(1, nextPage), totalPages));
  }

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Quản trị
          </Link>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Phê duyệt
              </div>
              <h1 className="mt-1 text-3xl font-bold">Đăng ký giải cứu</h1>
              <p className="mt-1 text-muted-foreground">
                Có <strong className="text-destructive">{pendingCount}</strong> đăng ký đang chờ xử
                lý.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${filter === value ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}
                >
                  {value === "PENDING"
                    ? "Chờ duyệt"
                    : value === "APPROVED"
                      ? "Đã duyệt"
                      : value === "REJECTED"
                        ? "Từ chối"
                        : "Tất cả"}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {failed && (
          <Button
            onClick={() => {
              void registrationsQuery.refetch();
              void batchesQuery.refetch();
              void cropsQuery.refetch();
              void pointsQuery.refetch();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Tải lại
          </Button>
        )}
        {loading && <div className="h-64 animate-pulse rounded-2xl bg-muted" />}
        {!loading && (
          <div className="space-y-4">
            {pagedList.map((registration) => {
              const batch = batches.find((item) => item.id === registration.batchId);
              const crop = batch ? crops.find((item) => item.id === batch.cropId) : undefined;
              const point = points.find((item) => item.id === registration.rescuePointId);
              return (
                <article
                  key={registration.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_auto]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          Đăng ký #{registration.id}
                        </span>
                        <StatusChip status={registration.status} />
                      </div>
                      <CropSummary batch={batch} crop={crop} />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Gửi: {formatDate(registration.submittedAt)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-4">
                      <div className="text-xs font-semibold text-muted-foreground">
                        Điểm giải cứu đề xuất
                      </div>
                      <div className="mt-2 flex items-start gap-2 text-sm font-medium">
                        <MapPin className="mt-0.5 h-4 w-4 text-primary" />{" "}
                        <span>
                          {point?.name ?? `Điểm #${registration.rescuePointId}`}
                          <span className="mt-1 block text-xs font-normal text-muted-foreground">
                            {point ? formatPointAddress(point) : ""}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex min-w-40 flex-col gap-2">
                      {registration.status === "PENDING" ? (
                        <>
                          <Button
                            disabled={review.isPending}
                            onClick={() => void decide(registration.id, "approve")}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Chấp nhận
                          </Button>
                          <Button
                            variant="destructive"
                            disabled={review.isPending}
                            onClick={() => void decide(registration.id, "reject")}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Từ chối
                          </Button>
                        </>
                      ) : (
                        <div className="text-center text-xs text-muted-foreground">
                          Xử lý: {formatDate(registration.approvedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
            {totalRegistrations === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
                Không có đăng ký nào.
              </div>
            )}
            {totalRegistrations > 0 && (
              <PaginationControls
                totalItems={totalRegistrations}
                page={page}
                pageSize={pageSize}
                onPageChange={changePage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function StatusChip({ status }: { status: RescueRegistrationStatus }) {
  const styles = {
    PENDING: "bg-accent/20 text-accent-foreground",
    APPROVED: "bg-primary-soft text-primary",
    REJECTED: "bg-destructive/15 text-destructive",
  };
  const labels = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(value),
      )
    : "—";
}

function CropSummary({ batch, crop }: { batch?: CropBatch; crop?: Crop }) {
  const image = crop ? getCropImage(crop.name) : undefined;

  if (!batch) return <p className="mt-2 text-sm text-muted-foreground">Đang tải thông tin lô</p>;

  return (
    <div className="mt-3 flex items-center gap-3">
      {image ? (
        <img src={image} alt={crop?.name ?? ""} className="h-12 w-12 rounded-lg object-cover" />
      ) : (
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
          #{batch.cropId}
        </div>
      )}
      <div>
        <h3 className="text-lg font-bold">{crop?.name ?? `Nông sản #${batch.cropId}`}</h3>
        <p className="text-sm text-muted-foreground">
          Lô #{batch.id} · {batch.currentQuantity} / {batch.initialQuantity} {batch.unit} · Nông
          dân: {batch.farmerName}
        </p>
      </div>
    </div>
  );
}

function formatPointAddress(point: {
  addressDetail: string;
  ward: string | null;
  district: string | null;
  province: string;
}) {
  if (
    point.addressDetail &&
    [point.ward, point.district, point.province].some((part) =>
      part ? point.addressDetail.includes(part) : false,
    )
  ) {
    return point.addressDetail;
  }
  return [point.addressDetail, point.ward, point.district, point.province]
    .filter(Boolean)
    .join(", ");
}
