import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Thermometer, Clock, Truck, Package, Calendar, MapPin, Plus,
  Edit3, RefreshCw, AlertTriangle, History, Activity, BarChart3, X,
} from "lucide-react";
import { PageShell } from "@/components/site-layout";
import {
  categoryRich, farmerBatchesByCategory, farmerBatchStatus, batchExpiryDate,
  formatVND, shipments, buyerOrders, CURRENT_FARMER_NAME, CURRENT_FARMER_AVATAR,
  type ProductBatch,
} from "@/lib/mock-data";

export const Route = createFileRoute("/categories/$id")({
  head: ({ params }) => ({
    meta: [{ title: `${categoryRich[params.id]?.name ?? "Loại nông sản"} – Quản lý lô (Nông dân)` }],
  }),
  loader: ({ params }) => {
    const cat = categoryRich[params.id];
    if (!cat) throw notFound();
    return { cat };
  },
  component: FarmerCategoryPage,
  notFoundComponent: () => (
    <PageShell><div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Không tìm thấy loại nông sản</h1>
      <Link to="/categories" className="mt-4 inline-block text-primary hover:underline">← Về danh mục</Link>
    </div></PageShell>
  ),
});

type Drawer =
  | { type: "create" }
  | { type: "edit"; batch: ProductBatch }
  | { type: "stock"; batch: ProductBatch }
  | { type: "rescue"; batch: ProductBatch }
  | { type: "orders"; batch: ProductBatch }
  | { type: "shipments"; batch: ProductBatch }
  | { type: "stats"; batch: ProductBatch }
  | null;

function FarmerCategoryPage() {
  const { id } = Route.useParams();
  const cat = categoryRich[id]!;
  const myBatches = farmerBatchesByCategory(id);
  const [drawer, setDrawer] = useState<Drawer>(null);

  const totalQty = myBatches.reduce((s, b) => s + b.quantityKg, 0);
  const remaining = myBatches.reduce((s, b) => s + (b.quantityKg - b.soldKg), 0);
  const sold = myBatches.reduce((s, b) => s + b.soldKg, 0);
  const locked = myBatches.reduce((s, b) => s + b.lockedKg, 0);
  const revenue = myBatches.reduce((s, b) => s + b.soldKg * b.pricePerKg, 0);

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/categories" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Danh mục
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview */}
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-border shadow-card">
            <img src={cat.image} alt={cat.name} className="aspect-[4/3] w-full object-cover" />
          </div>
          <div>
            <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{cat.group}</span>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{cat.name}</h1>
            <p className="mt-3 text-muted-foreground">{cat.description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InfoRow icon={Thermometer} label="Bảo quản" value={cat.preservation} />
              <InfoRow icon={Clock} label="Thời hạn sau thu hoạch" value={`${cat.shelfLifeDays} ngày`} />
              <InfoRow icon={Truck} label="Vận chuyển" value={cat.transportDays} />
            </div>
          </div>
        </div>

        {/* Inventory header */}
        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Package className="h-3.5 w-3.5" /> Quản lý tồn kho – {CURRENT_FARMER_NAME}
            </div>
            <h2 className="mt-1 text-2xl font-bold">Các lô {cat.name.toLowerCase()} của bạn</h2>
            <p className="text-sm text-muted-foreground">Chỉ hiển thị lô do bạn sở hữu. Tổng số: {myBatches.length} lô.</p>
          </div>
          <button onClick={() => setDrawer({ type: "create" })} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95">
            <Plus className="h-4 w-4" /> Tạo lô nông sản mới
          </button>
        </div>

        {/* Aggregate */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <BigStat label="Tổng sản lượng" value={`${totalQty.toLocaleString("vi-VN")} kg`} />
          <BigStat label="Đã bán" value={`${sold.toLocaleString("vi-VN")} kg`} tone="primary" />
          <BigStat label="Còn lại" value={`${remaining.toLocaleString("vi-VN")} kg`} />
          <BigStat label="Đang khóa CropLock" value={`${locked.toLocaleString("vi-VN")} kg`} tone="accent" />
          <BigStat label="Doanh thu ước tính" value={formatVND(revenue)} tone="primary" />
        </div>

        {/* Empty state */}
        {myBatches.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-semibold">Bạn chưa có lô nào thuộc loại {cat.name.toLowerCase()}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Tạo lô mới để bắt đầu quản lý tồn kho và đăng bán.</p>
            <button onClick={() => setDrawer({ type: "create" })} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              <Plus className="h-4 w-4" /> Tạo lô mới
            </button>
          </div>
        )}

        {/* Cards (mobile) */}
        {myBatches.length > 0 && (
          <div className="mt-5 grid gap-3 lg:hidden">
            {myBatches.map((b) => {
              const st = farmerBatchStatus(b, cat.shelfLifeDays);
              const rem = b.quantityKg - b.soldKg;
              return (
                <div key={b.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">{b.id}</div>
                      <div className="mt-0.5 text-sm font-semibold">{cat.name}</div>
                    </div>
                    <StatusPill st={st} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <Cell label="Số lượng" value={`${b.quantityKg.toLocaleString("vi-VN")} kg`} />
                    <Cell label="Còn lại" value={`${rem.toLocaleString("vi-VN")} kg`} />
                    <Cell label="Thu hoạch" value={b.harvestDate} />
                    <Cell label="Hết hạn" value={batchExpiryDate(b, cat.shelfLifeDays)} />
                    <Cell label="Giá" value={`${formatVND(b.pricePerKg)}/kg`} />
                    <Cell label="Địa chỉ" value={b.location} />
                  </div>
                  <RowActions onAction={(d) => setDrawer(d)} batch={b} />
                </div>
              );
            })}
          </div>
        )}

        {/* Table (desktop) */}
        {myBatches.length > 0 && (
          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Mã lô</th>
                  <th className="px-4 py-3 text-right">Số lượng</th>
                  <th className="px-4 py-3 text-right">Còn lại</th>
                  <th className="px-4 py-3 text-left">Thu hoạch</th>
                  <th className="px-4 py-3 text-left">Hết hạn</th>
                  <th className="px-4 py-3 text-left">Địa chỉ</th>
                  <th className="px-4 py-3 text-right">Giá / kg</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {myBatches.map((b) => {
                  const st = farmerBatchStatus(b, cat.shelfLifeDays);
                  const rem = b.quantityKg - b.soldKg;
                  const pct = Math.round((b.soldKg / b.quantityKg) * 100);
                  return (
                    <tr key={b.id} className="border-t border-border align-top">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs">{b.id}</div>
                        <div className="text-xs text-muted-foreground">ĐVT: kg</div>
                      </td>
                      <td className="px-4 py-3 text-right">{b.quantityKg.toLocaleString("vi-VN")}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold">{rem.toLocaleString("vi-VN")}</div>
                        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        {b.lockedKg > 0 && <div className="mt-1 text-[11px] text-accent-foreground">🔒 {b.lockedKg} kg đã khóa</div>}
                      </td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{b.harvestDate}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{batchExpiryDate(b, cat.shelfLifeDays)}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs"><MapPin className="h-3 w-3 text-muted-foreground" />{b.location}</span></td>
                      <td className="px-4 py-3 text-right font-semibold">{formatVND(b.pricePerKg)}</td>
                      <td className="px-4 py-3"><StatusPill st={st} /></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1">
                          <IconBtn icon={Edit3} title="Chỉnh sửa" onClick={() => setDrawer({ type: "edit", batch: b })} />
                          <IconBtn icon={RefreshCw} title="Cập nhật số lượng" onClick={() => setDrawer({ type: "stock", batch: b })} />
                          <IconBtn icon={AlertTriangle} title="Yêu cầu giải cứu" onClick={() => setDrawer({ type: "rescue", batch: b })} tone="destructive" />
                          <IconBtn icon={History} title="Lịch sử đơn" onClick={() => setDrawer({ type: "orders", batch: b })} />
                          <IconBtn icon={Truck} title="Shipment" onClick={() => setDrawer({ type: "shipments", batch: b })} />
                          <IconBtn icon={BarChart3} title="Thống kê" onClick={() => setDrawer({ type: "stats", batch: b })} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawer && <DrawerView drawer={drawer} catName={cat.name} onClose={() => setDrawer(null)} />}
    </PageShell>
  );
}

function RowActions({ batch, onAction }: { batch: ProductBatch; onAction: (d: Drawer) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      <SmallBtn icon={Edit3} label="Sửa" onClick={() => onAction({ type: "edit", batch })} />
      <SmallBtn icon={RefreshCw} label="Cập nhật" onClick={() => onAction({ type: "stock", batch })} />
      <SmallBtn icon={AlertTriangle} label="Giải cứu" onClick={() => onAction({ type: "rescue", batch })} tone="destructive" />
      <SmallBtn icon={History} label="Đơn" onClick={() => onAction({ type: "orders", batch })} />
      <SmallBtn icon={Truck} label="Shipment" onClick={() => onAction({ type: "shipments", batch })} />
      <SmallBtn icon={BarChart3} label="Thống kê" onClick={() => onAction({ type: "stats", batch })} />
    </div>
  );
}

function DrawerView({ drawer, catName, onClose }: { drawer: NonNullable<Drawer>; catName: string; onClose: () => void }) {
  const title =
    drawer.type === "create" ? `Tạo lô ${catName.toLowerCase()} mới` :
    drawer.type === "edit" ? `Chỉnh sửa lô ${drawer.batch.id}` :
    drawer.type === "stock" ? `Cập nhật sản lượng còn lại – ${drawer.batch.id}` :
    drawer.type === "rescue" ? `Gửi yêu cầu giải cứu – ${drawer.batch.id}` :
    drawer.type === "orders" ? `Lịch sử đơn hàng – ${drawer.batch.id}` :
    drawer.type === "shipments" ? `Shipment của lô ${drawer.batch.id}` :
    `Thống kê tiêu thụ – ${drawer.batch.id}`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/40 backdrop-blur-sm sm:place-items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full overflow-auto rounded-t-3xl bg-background p-6 shadow-soft sm:max-w-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5">
          {drawer.type === "create" && <CreateForm catName={catName} onClose={onClose} />}
          {drawer.type === "edit" && <EditForm batch={drawer.batch} onClose={onClose} />}
          {drawer.type === "stock" && <StockForm batch={drawer.batch} onClose={onClose} />}
          {drawer.type === "rescue" && <RescueForm batch={drawer.batch} onClose={onClose} />}
          {drawer.type === "orders" && <BatchOrders batch={drawer.batch} />}
          {drawer.type === "shipments" && <BatchShipments batch={drawer.batch} />}
          {drawer.type === "stats" && <BatchStats batch={drawer.batch} />}
        </div>
      </div>
    </div>
  );
}

function CreateForm({ catName, onClose }: { catName: string; onClose: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onClose(); }} className="grid gap-3 sm:grid-cols-2">
      <Field label="Tên lô" placeholder={`Lô ${catName} mới`} />
      <Field label="Sản lượng (kg)" type="number" placeholder="1000" />
      <Field label="Ngày thu hoạch" type="date" />
      <Field label="Giá dự kiến (đ/kg)" type="number" placeholder="10000" />
      <Field label="Địa chỉ sản xuất" placeholder="Xã, huyện, tỉnh" full />
      <SubmitBar primary="Tạo lô" onCancel={onClose} />
    </form>
  );
}

function EditForm({ batch, onClose }: { batch: ProductBatch; onClose: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onClose(); }} className="grid gap-3 sm:grid-cols-2">
      <Field label="Mã lô" defaultValue={batch.id} readOnly />
      <Field label="Địa chỉ" defaultValue={batch.location} />
      <Field label="Ngày thu hoạch" type="date" defaultValue={batch.harvestDate} />
      <Field label="Giá bán (đ/kg)" type="number" defaultValue={String(batch.pricePerKg)} />
      <SubmitBar primary="Lưu thay đổi" onCancel={onClose} />
    </form>
  );
}

function StockForm({ batch, onClose }: { batch: ProductBatch; onClose: () => void }) {
  const remaining = batch.quantityKg - batch.soldKg;
  return (
    <form onSubmit={(e) => { e.preventDefault(); onClose(); }} className="space-y-3">
      <div className="rounded-xl bg-muted/40 p-3 text-sm">
        Sản lượng ban đầu: <b>{batch.quantityKg.toLocaleString("vi-VN")} kg</b><br />
        Đã bán: <b>{batch.soldKg.toLocaleString("vi-VN")} kg</b> · Còn lại hiện tại: <b>{remaining.toLocaleString("vi-VN")} kg</b>
      </div>
      <Field label="Sản lượng còn lại thực tế (kg)" type="number" defaultValue={String(remaining)} />
      <Field label="Ghi chú điều chỉnh" placeholder="Hao hụt, hư hỏng, sai số khi cân..." />
      <SubmitBar primary="Cập nhật tồn kho" onCancel={onClose} />
    </form>
  );
}

function RescueForm({ batch, onClose }: { batch: ProductBatch; onClose: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onClose(); }} className="space-y-3">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
        Yêu cầu sẽ được gửi tới Admin để xét duyệt. Sau khi duyệt, lô <b>{batch.id}</b> sẽ được phân bổ về điểm giải cứu phù hợp.
      </div>
      <Field label="Sản lượng cần giải cứu (kg)" type="number" defaultValue={String(batch.quantityKg - batch.soldKg)} />
      <Field label="Mức độ khẩn cấp" defaultValue="Khẩn cấp" />
      <Field label="Lý do" placeholder="Thương lái hủy đơn, mưa kéo dài, vào vụ rộ..." />
      <SubmitBar primary="Gửi yêu cầu giải cứu" tone="destructive" onCancel={onClose} />
    </form>
  );
}

function BatchOrders({ batch }: { batch: ProductBatch }) {
  // demo: ánh xạ một vài đơn buyer cho lô đầu tiên
  const orders = buyerOrders.slice(0, 3).map((o, i) => ({ ...o, id: `${o.id}-${batch.id.slice(-3)}-${i}` }));
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>
          <th className="px-3 py-2 text-left">Mã đơn</th><th className="px-3 py-2 text-right">SL (kg)</th>
          <th className="px-3 py-2 text-right">Tổng</th><th className="px-3 py-2 text-left">Trạng thái</th>
        </tr></thead>
        <tbody>{orders.map((o) => (
          <tr key={o.id} className="border-t border-border">
            <td className="px-3 py-2 font-mono text-xs">{o.id}</td>
            <td className="px-3 py-2 text-right">{o.qty}</td>
            <td className="px-3 py-2 text-right">{formatVND(o.total)}</td>
            <td className="px-3 py-2"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{o.status}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function BatchShipments({ batch }: { batch: ProductBatch }) {
  const list = shipments.filter((s) => s.batchId === batch.id);
  if (list.length === 0) return <p className="text-sm text-muted-foreground">Chưa có shipment nào cho lô này.</p>;
  return (
    <ul className="space-y-2">
      {list.map((s) => (
        <li key={s.id} className="rounded-xl border border-border bg-card p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs">{s.id}</span>
            <span className="rounded-full bg-accent/30 px-2 py-0.5 text-xs">{s.status}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{s.from} → {s.to} · {s.quantityKg} kg · ETA {s.eta}</div>
          <div className="text-xs">Người nhận: <b>{s.buyer}</b> · Đơn vị VC: {s.carrier}</div>
        </li>
      ))}
    </ul>
  );
}

function BatchStats({ batch }: { batch: ProductBatch }) {
  const remaining = batch.quantityKg - batch.soldKg;
  const soldPct = Math.round((batch.soldKg / batch.quantityKg) * 100);
  const series = [12, 25, 18, 34, 41, 52, 38].map((v, i) => ({ d: `N${i + 1}`, v }));
  const max = Math.max(...series.map((s) => s.v));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-primary-soft p-3"><div className="text-xs text-primary">Đã bán</div><div className="text-lg font-bold text-primary">{batch.soldKg.toLocaleString("vi-VN")} kg</div></div>
        <div className="rounded-xl bg-muted p-3"><div className="text-xs">Còn lại</div><div className="text-lg font-bold">{remaining.toLocaleString("vi-VN")} kg</div></div>
        <div className="rounded-xl bg-accent/30 p-3"><div className="text-xs">Tỷ lệ tiêu thụ</div><div className="text-lg font-bold">{soldPct}%</div></div>
      </div>
      <div className="rounded-xl border border-border p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Activity className="h-3.5 w-3.5" /> Tiêu thụ 7 ngày gần nhất (kg)</div>
        <div className="flex h-32 items-end gap-2">
          {series.map((s) => (
            <div key={s.d} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-primary" style={{ height: `${(s.v / max) * 100}%` }} />
              <div className="text-[10px] text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- small UI bits ---------- */
function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

function BigStat({ label, value, tone = "muted" }: { label: string; value: string; tone?: "primary" | "accent" | "muted" }) {
  const cls = tone === "primary" ? "border-primary/30 bg-primary-soft" : tone === "accent" ? "border-accent/40 bg-accent/20" : "border-border bg-card";
  return (
    <div className={`rounded-2xl border p-4 shadow-card ${cls}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function StatusPill({ st }: { st: { label: string; tone: "primary" | "accent" | "destructive" | "muted" } }) {
  const cls = st.tone === "primary" ? "bg-primary-soft text-primary" : st.tone === "destructive" ? "bg-destructive/15 text-destructive" : st.tone === "accent" ? "bg-accent/30 text-accent-foreground" : "bg-muted text-muted-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{st.label}</span>;
}

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><span className="text-muted-foreground">{label}:</span> <b>{value}</b></div>;
}

function IconBtn({ icon: Icon, title, onClick, tone = "default" }: { icon: React.ComponentType<{ className?: string }>; title: string; onClick: () => void; tone?: "default" | "destructive" }) {
  const cls = tone === "destructive" ? "text-destructive hover:bg-destructive/10" : "text-foreground/70 hover:bg-muted";
  return <button title={title} onClick={onClick} className={`grid h-8 w-8 place-items-center rounded-lg ${cls}`}><Icon className="h-4 w-4" /></button>;
}

function SmallBtn({ icon: Icon, label, onClick, tone = "default" }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; tone?: "default" | "destructive" }) {
  const cls = tone === "destructive" ? "border-destructive/40 text-destructive" : "border-border text-foreground/80";
  return <button onClick={onClick} className={`inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium ${cls}`}><Icon className="h-3 w-3" />{label}</button>;
}

function Field({ label, full, ...rest }: { label: string; full?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input {...rest} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </label>
  );
}

function SubmitBar({ primary, tone = "primary", onCancel }: { primary: string; tone?: "primary" | "destructive"; onCancel: () => void }) {
  const cls = tone === "destructive" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground";
  return (
    <div className="sm:col-span-2 mt-1 flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="rounded-full border border-border bg-card px-4 py-2 text-sm">Hủy</button>
      <button type="submit" className={`rounded-full px-5 py-2 text-sm font-semibold ${cls}`}>{primary}</button>
    </div>
  );
}