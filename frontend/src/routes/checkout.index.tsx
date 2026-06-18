import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Wallet, Building2, CheckCircle2, Truck, Lock } from "lucide-react";
import { PageShell } from "@/components/site-layout";
import { useCart } from "@/hooks/use-cart";
import { formatVND, productBatches } from "@/lib/mock-data";
import { useCropLock } from "@/hooks/use-croplock";
import { CropLockBanner } from "@/components/croplock-banner";
import { computePrice, estimateDistanceKm, needsColdStorageFor, type BuyerType } from "@/lib/pricing";
import { PriceBreakdownCard } from "@/components/price-breakdown";


export const Route = createFileRoute("/checkout/")({
  head: () => ({ meta: [{ title: "Thanh toán – AgriConnect" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const nav = useNavigate();
  const { items, total, clear } = useCart();
  const { lock, create, release, expired } = useCropLock();
  const [pay, setPay] = useState("cod");
  const [done, setDone] = useState(false);
  const [buyerType, setBuyerType] = useState<BuyerType>("individual");
  const shipping = items.length ? 30000 : 0;

  const breakdown = useMemo(() => {
    const qtyKg = items.reduce((s, i) => s + i.qty, 0);
    if (qtyKg === 0) return null;
    const farmGate = Math.round(items.reduce((s, i) => s + i.pricePerKg * i.qty, 0) / qtyKg);
    const isRescue = items.some((i) => {
      const batchId = i.id.split("::")[1];
      const b = productBatches.find((x) => x.id === batchId);
      return b?.rescueStatus === "rescuing";
    });
    const needsCold = items.some((i) => needsColdStorageFor(i.name));
    const avgDistance = Math.round(
      items.reduce((s, i) => s + estimateDistanceKm(i.location) * i.qty, 0) / qtyKg,
    );
    return computePrice({
      farmGatePrice: farmGate,
      qtyKg,
      isRescue,
      distanceKm: avgDistance,
      needsColdStorage: needsCold,
      buyerType,
    });
  }, [items, buyerType]);


  useEffect(() => {
    if (items.length > 0 && !lock) {
      create(items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, pricePerKg: i.pricePerKg })));
    }
  }, [items, lock, create]);

  function submit() {
    if (expired) return;
    setDone(true);
    release();
    setTimeout(() => clear(), 500);
  }

  if (done) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">Đặt hàng thành công!</h1>
          <p className="mt-2 text-muted-foreground">Mã đơn: <span className="font-mono font-semibold text-foreground">#DH-{Math.floor(Math.random() * 9000 + 1000)}</span></p>
          <p className="mt-1 text-sm text-muted-foreground">Chúng tôi sẽ liên hệ và giao hàng trong 24-48h.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/orders" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Theo dõi đơn hàng</Link>
            <Link to="/products" className="rounded-full border border-border px-5 py-3 text-sm font-semibold">Tiếp tục mua</Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Thanh toán</h1>
        <p className="mt-1 text-sm text-muted-foreground">Thanh toán mô phỏng – không thật. Đơn hàng đang được giữ chỗ bằng CropLock.</p>

        <div className="mt-6"><CropLockBanner /></div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <Section title="Thông tin giao hàng">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Họ tên" placeholder="Nguyễn Văn A" />
                <Field label="Số điện thoại" placeholder="09xx xxx xxx" />
                <Field label="Email" placeholder="email@example.com" />
                <Field label="Tỉnh / Thành" placeholder="TP. Hồ Chí Minh" />
                <div className="sm:col-span-2"><Field label="Địa chỉ chi tiết" placeholder="Số nhà, đường, phường/xã, quận/huyện" /></div>
              </div>
            </Section>

            <Section title="Phương thức thanh toán">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { id: "cod", l: "Tiền mặt khi nhận", i: Wallet },
                  { id: "bank", l: "Chuyển khoản", i: Building2 },
                  { id: "card", l: "Thẻ tín dụng", i: CreditCard },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPay(p.id)}
                    className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${
                      pay === p.id ? "border-primary bg-primary-soft/30" : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <p.i className={`h-5 w-5 ${pay === p.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-sm font-semibold">{p.l}</div>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Phương thức vận chuyển">
              <div className="flex items-center gap-3 rounded-xl border border-primary bg-primary-soft/30 p-4">
                <Truck className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">Giao hàng tiêu chuẩn</div>
                  <div className="text-xs text-muted-foreground">Nhận hàng trong 24-48h</div>
                </div>
                <div className="text-sm font-semibold">{formatVND(shipping)}</div>
              </div>
            </Section>

            {breakdown && (
              <PriceBreakdownCard breakdown={breakdown} buyerType={buyerType} onBuyerTypeChange={setBuyerType} />
            )}
          </div>


          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-lg font-semibold">Đơn hàng ({items.length})</h3>
            <ul className="mt-4 space-y-3">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-3">
                  <img src={it.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{it.name}</div>
                    <div className="text-xs text-muted-foreground">{it.qty} kg × {formatVND(it.pricePerKg)}</div>
                  </div>
                  <div className="text-sm font-semibold">{formatVND(it.qty * it.pricePerKg)}</div>
                </li>
              ))}
            </ul>
            <div className="my-4 border-t border-border" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính (giá vườn)</span><span>{formatVND(total)}</span></div>
              {breakdown && breakdown.totalSubsidy > 0 && (
                <div className="flex justify-between text-primary"><span>Trợ giá & ưu đãi</span><span>− {formatVND(breakdown.totalSubsidy)}</span></div>
              )}
              {breakdown && (
                <div className="flex justify-between"><span className="text-muted-foreground">Logistics & lưu kho</span><span>{formatVND(breakdown.totalLogistics)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Vận chuyển giao tận nơi</span><span>{formatVND(shipping)}</span></div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold">Tổng cộng</span>
                <span className="text-lg font-bold text-primary">{formatVND((breakdown?.finalTotal ?? total) + shipping)}</span>
              </div>
            </div>

            <button
              onClick={submit}
              disabled={!items.length || expired}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
            >
              <Lock className="h-4 w-4" /> {expired ? "CropLock đã hết hạn" : "Xác nhận đặt hàng"}
            </button>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input placeholder={placeholder} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
    </div>
  );
}
