import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Package,
  Search,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

import type { CropBatch } from "@/api/cropApi";
import type { UserProfile } from "@/api/userApi";
import { PageShell } from "@/components/site-layout";
import { useCropBatches, useCrops } from "@/hooks/use-crops";
import { useOrders } from "@/hooks/use-orders";
import { useRescueRegistrations } from "@/hooks/use-rescue-registrations";
import { useUsers } from "@/hooks/use-user-profile";
import { getCropImage } from "@/lib/crop-images";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Quan tri he thong - AgriConnect" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [userSearch, setUserSearch] = useState("");
  const usersQuery = useUsers();
  const batchesQuery = useCropBatches();
  const cropsQuery = useCrops();
  const ordersQuery = useOrders();
  const rescueQuery = useRescueRegistrations();

  const users = usersQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const crops = cropsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const rescueRequests = rescueQuery.data ?? [];
  const pendingRescue = rescueRequests.filter((request) => request.status === "PENDING").length;
  const totalTransactions = orders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);
  const recentUsers = users
    .filter((user) => {
      const query = userSearch.trim().toLowerCase();
      if (!query) return true;
      return [user.fullName, user.email, user.role, user.status].some((value) =>
        value?.toLowerCase().includes(query),
      );
    })
    .sort((a, b) => b.id - a.id)
    .slice(0, 8);
  const isLoading =
    usersQuery.isLoading ||
    batchesQuery.isLoading ||
    cropsQuery.isLoading ||
    ordersQuery.isLoading ||
    rescueQuery.isLoading;
  const isError =
    usersQuery.isError ||
    batchesQuery.isError ||
    cropsQuery.isError ||
    ordersQuery.isError ||
    rescueQuery.isError;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Bang quan tri
            </div>
            <h1 className="mt-1 text-3xl font-bold">Tong quan he thong</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Du lieu nguoi dung, lo nong san, don hang va yeu cau giai cuu tu backend.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/subsidy"
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-card px-5 py-3 text-sm font-semibold text-primary shadow-soft hover:bg-primary-soft"
            >
              <HeartHandshake className="h-4 w-4" /> Tinh gia an sinh
            </Link>
            <Link
              to="/admin/rescue-requests"
              className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground shadow-soft"
            >
              <AlertTriangle className="h-4 w-4" /> Duyet giai cuu
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive-foreground/20 px-1 text-[10px] font-bold">
                {pendingRescue}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {isError && (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Khong tai duoc du lieu quan tri tu backend.
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              i: Users,
              l: "Nguoi dung",
              v: users.length.toLocaleString("vi-VN"),
              sub: `${countByRole(users, "FARMER")} nong dan, ${countByRole(users, "BUYER")} nguoi mua`,
            },
            {
              i: Package,
              l: "Lo nong san",
              v: batches.length.toLocaleString("vi-VN"),
              sub: `${availableBatches(batches)} lo con hang`,
            },
            {
              i: AlertTriangle,
              l: "Yeu cau giai cuu",
              v: rescueRequests.length.toLocaleString("vi-VN"),
              sub: `${pendingRescue} dang cho duyet`,
            },
            {
              i: TrendingUp,
              l: "Tong giao dich",
              v: formatVND(totalTransactions),
              sub: `${orders.length} don hang`,
            },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <s.i className="h-5 w-5" />
              </div>
              <div className="mt-4 text-3xl font-bold">{isLoading ? "..." : s.v}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-xs font-medium text-primary">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <h2 className="text-lg font-semibold">Nguoi dung gan day</h2>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Tim theo ten..."
                  className="bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3">Nguoi dung</th>
                    <th className="px-5 py-3">Vai tro</th>
                    <th className="px-5 py-3">Lien he</th>
                    <th className="px-5 py-3">Trang thai</th>
                    <th className="px-5 py-3 text-right">Thao tac</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                            {initial(user.fullName)}
                          </div>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              #{user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{user.email}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            className="rounded-lg p-2 text-primary hover:bg-primary-soft"
                            title="Duyet"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                            title="Khoa"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                        Khong co nguoi dung phu hop.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-lg font-semibold">Lo nong san moi</h2>
            <p className="text-sm text-muted-foreground">Danh sach lay truc tiep tu backend.</p>
            <div className="mt-4 space-y-3">
              {batches
                .slice(-5)
                .reverse()
                .map((batch) => {
                  const cropName =
                    crops.find((crop) => crop.id === batch.cropId)?.name ??
                    `Nong san #${batch.cropId}`;
                  return (
                    <div
                      key={batch.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <img
                        src={getCropImage(cropName)}
                        alt=""
                        loading="lazy"
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{cropName}</div>
                        <div className="text-xs text-muted-foreground">
                          {batch.farmerName ?? `Farmer #${batch.farmerId}`} - {batch.province}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-semibold text-primary">
                          {batch.currentQuantity} {batch.unit}
                        </div>
                        <div className="text-muted-foreground">Lo #{batch.id}</div>
                      </div>
                    </div>
                  );
                })}
              {!isLoading && batches.length === 0 && (
                <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  Chua co lo nong san.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function countByRole(users: UserProfile[], role: UserProfile["role"]) {
  return users.filter((user) => user.role === role).length;
}

function availableBatches(batches: CropBatch[]) {
  return batches.filter(
    (batch) => batch.status === "available" && Number(batch.currentQuantity) > 0,
  ).length;
}

function roleLabel(role: UserProfile["role"]) {
  return role === "FARMER"
    ? "Nong dan"
    : role === "BUYER"
      ? "Nguoi mua"
      : role === "LOGISTICS"
        ? "Van chuyen"
        : "Quan tri";
}

function initial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "?";
}

function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
