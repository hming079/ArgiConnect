// =================================================================
// Phân hệ "Tính Giá An sinh & Trợ phí"
// Module tính giá tự động cho lô nông sản, bao gồm trợ giá, phí
// logistics, phụ thu khoảng cách, lưu kho lạnh, chiết khấu mua sỉ
// và ưu đãi cho tổ chức an sinh / bếp ăn từ thiện.
// =================================================================

export type BuyerType = "individual" | "bulk" | "welfare";

export const buyerTypeLabels: Record<BuyerType, string> = {
  individual: "Cá nhân",
  bulk: "Mua sỉ / Doanh nghiệp",
  welfare: "Tổ chức an sinh / Bếp ăn từ thiện",
};

export interface PricingInput {
  /** Giá tại vườn (đ/kg) */
  farmGatePrice: number;
  /** Sản lượng đặt (kg) */
  qtyKg: number;
  /** Có nằm trong chương trình giải cứu hay không */
  isRescue: boolean;
  /** Khoảng cách vận chuyển ước tính (km) */
  distanceKm: number;
  /** Có cần lưu kho lạnh không (rau lá, sầu riêng, thủy sản, ...) */
  needsColdStorage: boolean;
  /** Loại người mua – quyết định ưu đãi an sinh */
  buyerType: BuyerType;
}

export interface PriceLine {
  key: string;
  label: string;
  /** Giá trị tính trên 1 kg (đ) – dương là cộng, âm là trừ */
  perKg: number;
  /** Tổng tiền (đ) */
  total: number;
  kind: "add" | "sub" | "base";
  note?: string;
}

export interface PriceBreakdown {
  qtyKg: number;
  lines: PriceLine[];
  /** Giá cuối / kg sau mọi điều chỉnh */
  finalPerKg: number;
  /** Tổng đơn hàng (đ) */
  finalTotal: number;
  /** Tổng trợ giá đã áp dụng (đ) – chương trình giải cứu */
  totalSubsidy: number;
  /** Tổng chi phí logistics + lưu kho (đ) */
  totalLogistics: number;
}

// Hằng số cấu hình – tách ra để dashboard admin dùng lại
export const PRICING_CONFIG = {
  // Trợ giá tại điểm giải cứu: -5% giá vườn
  rescueSubsidyRate: 0.05,
  // Phí logistics nội bộ
  logisticsBasePerKg: 800,
  // Phụ thu khoảng cách: 50đ/kg cho mỗi 100km
  distanceSurchargePer100KmPerKg: 50,
  // Phí lưu kho lạnh
  coldStoragePerKg: 300,
  // Chiết khấu mua số lượng lớn
  bulkTier1Kg: 100, // >= 100kg
  bulkTier1Rate: 0.03,
  bulkTier2Kg: 500, // >= 500kg
  bulkTier2Rate: 0.05,
  // Ưu đãi tổ chức an sinh
  welfareDiscountRate: 0.08,
  // Ưu đãi doanh nghiệp mua sỉ
  bulkBuyerDiscountRate: 0.02,
};

/** Ước lượng khoảng cách dựa trên tỉnh thành nguồn (km tới TP.HCM trung tâm) */
export function estimateDistanceKm(location: string): number {
  const l = location.toLowerCase();
  if (l.includes("long an")) return 60;
  if (l.includes("tiền giang")) return 80;
  if (l.includes("đồng nai")) return 50;
  if (l.includes("bình thuận")) return 200;
  if (l.includes("lâm đồng")) return 300;
  if (l.includes("đắk lắk")) return 350;
  if (l.includes("cần thơ")) return 170;
  if (l.includes("đà nẵng")) return 850;
  if (l.includes("hà nội")) return 1600;
  return 120;
}

/** Tính giá đầy đủ cho một lô đặt mua */
export function computePrice(input: PricingInput): PriceBreakdown {
  const { farmGatePrice, qtyKg, isRescue, distanceKm, needsColdStorage, buyerType } = input;
  const C = PRICING_CONFIG;
  const lines: PriceLine[] = [];

  // 1. Giá tại vườn (base)
  lines.push({
    key: "farm",
    label: "Giá tại vườn",
    perKg: farmGatePrice,
    total: farmGatePrice * qtyKg,
    kind: "base",
    note: "Giá nông dân công bố",
  });

  // 2. Trợ giá tại điểm giải cứu
  if (isRescue) {
    const subsidyPerKg = -Math.round(farmGatePrice * C.rescueSubsidyRate);
    lines.push({
      key: "rescue",
      label: "Trợ giá tại điểm giải cứu",
      perKg: subsidyPerKg,
      total: subsidyPerKg * qtyKg,
      kind: "sub",
      note: `Chương trình giải cứu (-${(C.rescueSubsidyRate * 100).toFixed(0)}%)`,
    });
  }

  // 3. Phí logistics nội bộ
  lines.push({
    key: "logi",
    label: "Phí logistics nội bộ",
    perKg: C.logisticsBasePerKg,
    total: C.logisticsBasePerKg * qtyKg,
    kind: "add",
    note: "Bốc xếp, điều phối",
  });

  // 4. Phụ thu khoảng cách
  const distSurcharge =
    Math.ceil(distanceKm / 100) * C.distanceSurchargePer100KmPerKg;
  lines.push({
    key: "dist",
    label: "Phụ thu vận chuyển",
    perKg: distSurcharge,
    total: distSurcharge * qtyKg,
    kind: "add",
    note: `${distanceKm} km · ${C.distanceSurchargePer100KmPerKg}đ/kg mỗi 100km`,
  });

  // 5. Phí lưu kho lạnh
  if (needsColdStorage) {
    lines.push({
      key: "cold",
      label: "Phí lưu kho lạnh",
      perKg: C.coldStoragePerKg,
      total: C.coldStoragePerKg * qtyKg,
      kind: "add",
      note: "Bảo quản 2-8°C",
    });
  }

  // Tạm tính trước khi chiết khấu
  const subtotalPerKg = lines.reduce((s, l) => s + l.perKg, 0);

  // 6. Chiết khấu mua số lượng lớn
  let bulkRate = 0;
  if (qtyKg >= C.bulkTier2Kg) bulkRate = C.bulkTier2Rate;
  else if (qtyKg >= C.bulkTier1Kg) bulkRate = C.bulkTier1Rate;
  if (bulkRate > 0) {
    const bulkPerKg = -Math.round(subtotalPerKg * bulkRate);
    lines.push({
      key: "bulk",
      label: "Chiết khấu mua số lượng lớn",
      perKg: bulkPerKg,
      total: bulkPerKg * qtyKg,
      kind: "sub",
      note: `${qtyKg.toLocaleString("vi-VN")} kg · -${(bulkRate * 100).toFixed(0)}%`,
    });
  }

  // 7. Ưu đãi tổ chức an sinh / mua sỉ doanh nghiệp
  if (buyerType === "welfare") {
    const perKg = -Math.round(subtotalPerKg * C.welfareDiscountRate);
    lines.push({
      key: "welfare",
      label: "Ưu đãi tổ chức an sinh",
      perKg,
      total: perKg * qtyKg,
      kind: "sub",
      note: `Bếp ăn từ thiện · -${(C.welfareDiscountRate * 100).toFixed(0)}%`,
    });
  } else if (buyerType === "bulk") {
    const perKg = -Math.round(subtotalPerKg * C.bulkBuyerDiscountRate);
    lines.push({
      key: "biz",
      label: "Ưu đãi doanh nghiệp",
      perKg,
      total: perKg * qtyKg,
      kind: "sub",
      note: `Khách doanh nghiệp · -${(C.bulkBuyerDiscountRate * 100).toFixed(0)}%`,
    });
  }

  const finalPerKg = lines.reduce((s, l) => s + l.perKg, 0);
  const finalTotal = finalPerKg * qtyKg;
  const totalSubsidy = -lines
    .filter((l) => l.kind === "sub")
    .reduce((s, l) => s + l.total, 0);
  const totalLogistics = lines
    .filter((l) => ["logi", "dist", "cold"].includes(l.key))
    .reduce((s, l) => s + l.total, 0);

  return { qtyKg, lines, finalPerKg, finalTotal, totalSubsidy, totalLogistics };
}

// ===== Số liệu mock cho dashboard admin =====
export const subsidyStats = {
  totalSubsidyVnd: 1_286_400_000,
  totalLogisticsVnd: 2_142_000_000,
  totalColdStorageVnd: 384_500_000,
  welfareOrders: 482,
  totalOrders: 6_180,
};

export const subsidyByRegion = [
  { region: "Long An", subsidy: 312_000_000, orders: 1240, avgDiscountPct: 11.2 },
  { region: "Đồng Nai", subsidy: 248_000_000, orders: 980, avgDiscountPct: 10.6 },
  { region: "Bình Thuận", subsidy: 186_000_000, orders: 720, avgDiscountPct: 8.9 },
  { region: "Tiền Giang", subsidy: 152_000_000, orders: 640, avgDiscountPct: 7.4 },
  { region: "Lâm Đồng", subsidy: 128_000_000, orders: 520, avgDiscountPct: 9.1 },
  { region: "Đắk Lắk", subsidy: 96_000_000, orders: 410, avgDiscountPct: 6.8 },
  { region: "Cần Thơ", subsidy: 84_400_000, orders: 380, avgDiscountPct: 6.2 },
];

export const priceVsRescue = [
  { name: "Dưa hấu", farm: 4500, rescue: 4275 },
  { name: "Mít Thái", farm: 9000, rescue: 8550 },
  { name: "Thanh long", farm: 12000, rescue: 11400 },
  { name: "Xoài cát", farm: 28000, rescue: 26600 },
  { name: "Sầu riêng", farm: 65000, rescue: 61750 },
  { name: "Rau củ", farm: 18000, rescue: 17100 },
];

export const logisticsByRegion = [
  { region: "Long An", logistics: 520_000_000, cold: 62_000_000 },
  { region: "Đồng Nai", logistics: 410_000_000, cold: 48_000_000 },
  { region: "Bình Thuận", logistics: 360_000_000, cold: 71_000_000 },
  { region: "Tiền Giang", logistics: 280_000_000, cold: 42_000_000 },
  { region: "Lâm Đồng", logistics: 240_000_000, cold: 96_000_000 },
  { region: "Đắk Lắk", logistics: 184_000_000, cold: 35_000_000 },
  { region: "Cần Thơ", logistics: 148_000_000, cold: 30_500_000 },
];

export function needsColdStorageFor(category: string): boolean {
  const c = category.toLowerCase();
  return c.includes("rau") || c.includes("thủy") || c.includes("sầu") || c.includes("nấm");
}
