import type { ComponentType } from "react";
import watermelon from "@/assets/p-watermelon.jpg";
import dragonfruit from "@/assets/p-dragonfruit.jpg";
import mango from "@/assets/p-mango.jpg";
import jackfruit from "@/assets/p-jackfruit.jpg";
import durian from "@/assets/p-durian.jpg";
import vegetables from "@/assets/p-vegetables.jpg";

export type Urgency = "normal" | "high" | "rescue";

export interface Product {
  id: string;
  name: string;
  image: string;
  category: string;
  pricePerKg: number;
  quantityKg: number;
  soldKg: number;
  location: string;
  harvestDate: string;
  description: string;
  urgency: Urgency;
  farmer: { name: string; avatar: string; phone: string; joined: string };
}

export const products: Product[] = [
  {
    id: "dh-001",
    name: "Dưa hấu Long An",
    image: watermelon,
    category: "Trái cây",
    pricePerKg: 4500,
    quantityKg: 12000,
    soldKg: 7800,
    location: "Long An",
    harvestDate: "2026-06-01",
    description:
      "Dưa hấu ruột đỏ, độ ngọt 12 brix, thu hoạch trực tiếp tại vườn. Gia đình đang cần giải cứu do thương lái hủy đơn đột ngột.",
    urgency: "rescue",
    farmer: { name: "Nguyễn Văn Tâm", avatar: "T", phone: "0901 234 567", joined: "2024" },
  },
  {
    id: "tl-002",
    name: "Thanh long ruột đỏ",
    image: dragonfruit,
    category: "Trái cây",
    pricePerKg: 12000,
    quantityKg: 5000,
    soldKg: 2100,
    location: "Bình Thuận",
    harvestDate: "2026-06-03",
    description:
      "Thanh long ruột đỏ canh tác theo tiêu chuẩn VietGAP. Trái đều, vị ngọt thanh, vỏ căng bóng.",
    urgency: "high",
    farmer: { name: "Trần Thị Hồng", avatar: "H", phone: "0912 345 678", joined: "2023" },
  },
  {
    id: "xo-003",
    name: "Xoài cát Hòa Lộc",
    image: mango,
    category: "Trái cây",
    pricePerKg: 28000,
    quantityKg: 3000,
    soldKg: 1200,
    location: "Tiền Giang",
    harvestDate: "2026-05-28",
    description:
      "Xoài cát Hòa Lộc chính gốc, thịt vàng, hạt nhỏ, không xơ. Thu hoạch đúng độ chín cây.",
    urgency: "normal",
    farmer: { name: "Lê Hoàng Phúc", avatar: "P", phone: "0987 654 321", joined: "2022" },
  },
  {
    id: "mi-004",
    name: "Mít Thái siêu sớm",
    image: jackfruit,
    category: "Trái cây",
    pricePerKg: 9000,
    quantityKg: 8000,
    soldKg: 5600,
    location: "Đồng Nai",
    harvestDate: "2026-06-02",
    description: "Mít Thái múi to, giòn ngọt. Vườn đang vào vụ rộ, cần đầu ra nhanh.",
    urgency: "rescue",
    farmer: { name: "Phạm Quốc Hùng", avatar: "Q", phone: "0934 111 222", joined: "2024" },
  },
  {
    id: "sr-005",
    name: "Sầu riêng Ri6",
    image: durian,
    category: "Trái cây",
    pricePerKg: 65000,
    quantityKg: 2000,
    soldKg: 450,
    location: "Đắk Lắk",
    harvestDate: "2026-05-30",
    description: "Sầu riêng Ri6 cơm vàng, hạt lép, vị béo ngọt đậm đà. Cắt tại vườn, giao trong 24h.",
    urgency: "normal",
    farmer: { name: "Y Bhem Niê", avatar: "Y", phone: "0978 555 666", joined: "2023" },
  },
  {
    id: "rc-006",
    name: "Rau cải hữu cơ Đà Lạt",
    image: vegetables,
    category: "Rau củ",
    pricePerKg: 18000,
    quantityKg: 1500,
    soldKg: 900,
    location: "Lâm Đồng",
    harvestDate: "2026-06-04",
    description: "Rau cải xanh trồng hữu cơ tại Đà Lạt, không thuốc trừ sâu, giao trong ngày.",
    urgency: "high",
    farmer: { name: "Đặng Thị Mai", avatar: "M", phone: "0945 777 888", joined: "2024" },
  },
];

export const categories = ["Tất cả", "Trái cây", "Rau củ", "Lúa gạo", "Thủy sản"];
export const regions = ["Tất cả khu vực", "Long An", "Bình Thuận", "Tiền Giang", "Đồng Nai", "Đắk Lắk", "Lâm Đồng"];

export interface CategoryInfo {
  id: string;
  name: string;
  group: "Trái cây" | "Rau củ" | "Cây công nghiệp" | "Lúa gạo" | "Thủy sản";
  image: string;
  itemCount: number;
  desc: string;
}

export const categoryList: CategoryInfo[] = [
  { id: "c-watermelon", name: "Dưa hấu", group: "Trái cây", image: watermelon, itemCount: 24, desc: "Dưa hấu ruột đỏ, ruột vàng các vùng." },
  { id: "c-dragon", name: "Thanh long", group: "Trái cây", image: dragonfruit, itemCount: 18, desc: "Thanh long ruột trắng và ruột đỏ Bình Thuận." },
  { id: "c-mango", name: "Xoài", group: "Trái cây", image: mango, itemCount: 32, desc: "Xoài cát, xoài keo, xoài tượng các loại." },
  { id: "c-jack", name: "Mít", group: "Trái cây", image: jackfruit, itemCount: 15, desc: "Mít Thái, mít tố nữ, mít nghệ." },
  { id: "c-durian", name: "Sầu riêng", group: "Trái cây", image: durian, itemCount: 12, desc: "Ri6, Monthong, Musang King." },
  { id: "c-veg", name: "Rau cải", group: "Rau củ", image: vegetables, itemCount: 41, desc: "Rau hữu cơ Đà Lạt, miền Tây." },
  { id: "c-coffee", name: "Cà phê", group: "Cây công nghiệp", image: durian, itemCount: 9, desc: "Cà phê Robusta, Arabica Tây Nguyên." },
  { id: "c-rice", name: "Gạo ST25", group: "Lúa gạo", image: vegetables, itemCount: 7, desc: "Gạo thơm các vùng miền Tây." },
];

export const categoryGroups = ["Tất cả", "Trái cây", "Rau củ", "Cây công nghiệp", "Lúa gạo", "Thủy sản"] as const;

export const stats = {
  farmers: 12480,
  tonsSold: 8635,
  activeCampaigns: 47,
  buyers: 38200,
};

export const campaigns = [
  {
    id: "c1",
    title: "Giải cứu 200 tấn dưa hấu Long An",
    desc: "Hỗ trợ bà con nông dân Long An tiêu thụ dưa hấu sau ảnh hưởng từ thương lái.",
    progress: 65,
    image: watermelon,
    location: "Long An",
    needKg: 200000,
    committedKg: 130000,
    deadline: "2026-06-15",
    farmers: 42,
  },
  {
    id: "c2",
    title: "Chiến dịch mít Thái Đồng Nai",
    desc: "Kết nối tiêu thụ 80 tấn mít Thái đang vào vụ rộ tại Đồng Nai.",
    progress: 42,
    image: jackfruit,
    location: "Đồng Nai",
    needKg: 80000,
    committedKg: 33600,
    deadline: "2026-06-20",
    farmers: 17,
  },
  {
    id: "c3",
    title: "Cứu vườn thanh long Bình Thuận",
    desc: "Hỗ trợ tiêu thụ 50 tấn thanh long ruột đỏ ảnh hưởng do xuất khẩu chậm.",
    progress: 28,
    image: dragonfruit,
    location: "Bình Thuận",
    needKg: 50000,
    committedKg: 14000,
    deadline: "2026-06-25",
    farmers: 11,
  },
];

export const buyerOrders = [
  { id: "DH-1042", product: "Dưa hấu Long An", qty: 50, total: 225000, status: "Đang giao", date: "2026-06-02" },
  { id: "DH-1038", product: "Thanh long ruột đỏ", qty: 20, total: 240000, status: "Đã giao", date: "2026-05-29" },
  { id: "DH-1031", product: "Xoài cát Hòa Lộc", qty: 10, total: 280000, status: "Đã giao", date: "2026-05-25" },
  { id: "DH-1025", product: "Sầu riêng Ri6", qty: 5, total: 325000, status: "Đã hủy", date: "2026-05-20" },
];

export const farmerPosts = [
  { id: "P-201", name: "Dưa hấu Long An", qty: 12000, sold: 7800, orders: 38, status: "Đang bán", urgency: "rescue" as Urgency },
  { id: "P-198", name: "Mít Thái siêu sớm", qty: 8000, sold: 5600, orders: 22, status: "Đang bán", urgency: "rescue" as Urgency },
  { id: "P-190", name: "Bưởi da xanh", qty: 3000, sold: 3000, orders: 14, status: "Đã bán hết", urgency: "normal" as Urgency },
  { id: "P-180", name: "Chôm chôm Java", qty: 2500, sold: 1100, orders: 9, status: "Đang bán", urgency: "high" as Urgency },
];

export const farmerSalesChart = [
  { m: "T1", v: 320 }, { m: "T2", v: 480 }, { m: "T3", v: 410 },
  { m: "T4", v: 620 }, { m: "T5", v: 780 }, { m: "T6", v: 950 },
];

export const adminUsers = [
  { id: "U-001", name: "Nguyễn Văn Tâm", role: "Nông dân", region: "Long An", status: "Hoạt động" },
  { id: "U-002", name: "Trần Thị Hồng", role: "Nông dân", region: "Bình Thuận", status: "Hoạt động" },
  { id: "U-003", name: "Công ty TNHH Xanh Sạch", role: "Người mua", region: "TP. HCM", status: "Hoạt động" },
  { id: "U-004", name: "Lê Hoàng Phúc", role: "Nông dân", region: "Tiền Giang", status: "Chờ duyệt" },
  { id: "U-005", name: "Siêu thị FreshMart", role: "Người mua", region: "Hà Nội", status: "Hoạt động" },
];

// ===== Batches (Lô nông sản) =====
export interface Batch {
  id: string;
  name: string;
  category: string;
  image: string;
  quantityKg: number;
  soldKg: number;
  harvestDate: string;
  location: string;
  expectedPrice: number;
  urgency: Urgency;
  createdAt: string;
}

export const farmerBatches: Batch[] = [
  { id: "L-2026-0042", name: "Dưa hấu ruột đỏ lô 5", category: "Trái cây", image: watermelon, quantityKg: 12000, soldKg: 7800, harvestDate: "2026-06-01", location: "Long An", expectedPrice: 4500, urgency: "rescue", createdAt: "2026-05-28" },
  { id: "L-2026-0041", name: "Mít Thái lô A", category: "Trái cây", image: jackfruit, quantityKg: 8000, soldKg: 5600, harvestDate: "2026-06-02", location: "Đồng Nai", expectedPrice: 9000, urgency: "rescue", createdAt: "2026-05-27" },
  { id: "L-2026-0039", name: "Thanh long ruột đỏ lô 3", category: "Trái cây", image: dragonfruit, quantityKg: 5000, soldKg: 2100, harvestDate: "2026-06-03", location: "Bình Thuận", expectedPrice: 12000, urgency: "high", createdAt: "2026-05-25" },
  { id: "L-2026-0035", name: "Xoài cát lô 2", category: "Trái cây", image: mango, quantityKg: 3000, soldKg: 1200, harvestDate: "2026-05-28", location: "Tiền Giang", expectedPrice: 28000, urgency: "normal", createdAt: "2026-05-20" },
  { id: "L-2026-0030", name: "Rau cải hữu cơ lô tuần 22", category: "Rau củ", image: vegetables, quantityKg: 1500, soldKg: 900, harvestDate: "2026-06-04", location: "Lâm Đồng", expectedPrice: 18000, urgency: "high", createdAt: "2026-05-18" },
];

// ===== Rescue points (Điểm giải cứu) =====
export interface RescuePoint {
  id: string;
  name: string;
  address: string;
  org: string;
  hours: string;
  receivedKg: number;
  soldKg: number;
  lat: number; // 0-100 (relative map x)
  lng: number; // 0-100 (relative map y)
  status: "active" | "full";
}

export const rescuePoints: RescuePoint[] = [
  { id: "rp-1", name: "Điểm giải cứu Quận 1", address: "12 Nguyễn Huệ, Q.1, TP.HCM", org: "UBND Quận 1", hours: "07:00 - 20:00", receivedKg: 24000, soldKg: 19800, lat: 70, lng: 78, status: "active" },
  { id: "rp-2", name: "Điểm tiếp nhận Bình Thạnh", address: "55 Phan Đăng Lưu, Bình Thạnh, TP.HCM", org: "Đoàn TN Bình Thạnh", hours: "06:30 - 19:00", receivedKg: 18500, soldKg: 17200, lat: 66, lng: 76, status: "active" },
  { id: "rp-3", name: "Sân vận động Mỹ Đình", address: "Lê Đức Thọ, Nam Từ Liêm, Hà Nội", org: "Hội Nông dân HN", hours: "07:00 - 18:00", receivedKg: 32000, soldKg: 21000, lat: 55, lng: 22, status: "active" },
  { id: "rp-4", name: "Chợ đầu mối Đà Nẵng", address: "Hòa Cường, Hải Châu, Đà Nẵng", org: "Sở Công Thương ĐN", hours: "05:00 - 17:00", receivedKg: 12000, soldKg: 12000, lat: 64, lng: 50, status: "full" },
  { id: "rp-5", name: "Trường ĐH Cần Thơ", address: "Đường 3/2, Cần Thơ", org: "Hội SV ĐH Cần Thơ", hours: "08:00 - 21:00", receivedKg: 9500, soldKg: 6300, lat: 56, lng: 88, status: "active" },
  { id: "rp-6", name: "Công viên Biên Hùng", address: "Biên Hòa, Đồng Nai", org: "MTTQ Đồng Nai", hours: "06:00 - 19:00", receivedKg: 15800, soldKg: 11500, lat: 68, lng: 80, status: "active" },
];

// ===== Rescue zones (vùng dư thừa) =====
export interface RescueZone {
  id: string;
  name: string;
  product: string;
  surplusKg: number;
  urgency: Urgency;
  lat: number;
  lng: number;
}

export const rescueZones: RescueZone[] = [
  { id: "z1", name: "Long An", product: "Dưa hấu", surplusKg: 200000, urgency: "rescue", lat: 60, lng: 82 },
  { id: "z2", name: "Đồng Nai", product: "Mít Thái", surplusKg: 80000, urgency: "rescue", lat: 68, lng: 79 },
  { id: "z3", name: "Bình Thuận", product: "Thanh long", surplusKg: 50000, urgency: "high", lat: 74, lng: 70 },
  { id: "z4", name: "Tiền Giang", product: "Xoài cát", surplusKg: 12000, urgency: "high", lat: 56, lng: 84 },
  { id: "z5", name: "Đắk Lắk", product: "Sầu riêng", surplusKg: 18000, urgency: "normal", lat: 60, lng: 58 },
  { id: "z6", name: "Lâm Đồng", product: "Rau củ", surplusKg: 6000, urgency: "normal", lat: 66, lng: 64 },
];

// ===== Rescue registrations =====
export const rescueProgress = [
  { d: "T2", v: 12 }, { d: "T3", v: 28 }, { d: "T4", v: 35 },
  { d: "T5", v: 52 }, { d: "T6", v: 68 }, { d: "T7", v: 81 }, { d: "CN", v: 92 },
];

export const buyerRescueHistory = [
  { id: "RC-0301", campaign: "Giải cứu dưa hấu Long An", qty: 100, date: "2026-06-01", status: "Đang giao" },
  { id: "RC-0287", campaign: "Mít Thái Đồng Nai", qty: 50, date: "2026-05-28", status: "Hoàn thành" },
  { id: "RC-0254", campaign: "Thanh long Bình Thuận", qty: 30, date: "2026-05-20", status: "Hoàn thành" },
];

export function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "₫";
}

export type IconType = ComponentType<{ className?: string }>;

// ===== Product batches (mỗi loại nông sản có nhiều lô) =====
export interface ProductBatch {
  id: string;
  productId: string;
  farmer: string;
  farmerAvatar: string;
  location: string;
  harvestDate: string;
  quantityKg: number;
  soldKg: number;
  lockedKg: number;
  pricePerKg: number;
  rescueStatus: "none" | "pending" | "rescuing";
  rescuePointId?: string;
}

export const productBatches: ProductBatch[] = [
  { id: "L-DH-A12", productId: "dh-001", farmer: "Hộ Nguyễn Văn Tâm", farmerAvatar: "T", location: "Cần Đước, Long An", harvestDate: "2026-06-01", quantityKg: 5000, soldKg: 3200, lockedKg: 250, pricePerKg: 4500, rescueStatus: "rescuing", rescuePointId: "rp-1" },
  { id: "L-DH-B07", productId: "dh-001", farmer: "Hộ Trần Văn Bảy", farmerAvatar: "B", location: "Châu Thành, Long An", harvestDate: "2026-06-02", quantityKg: 4000, soldKg: 2100, lockedKg: 0, pricePerKg: 4700, rescueStatus: "rescuing", rescuePointId: "rp-2" },
  { id: "L-DH-C03", productId: "dh-001", farmer: "Hộ Lê Thị Cúc", farmerAvatar: "C", location: "Bến Lức, Long An", harvestDate: "2026-06-03", quantityKg: 3000, soldKg: 2500, lockedKg: 0, pricePerKg: 4600, rescueStatus: "pending" },
  { id: "L-TL-A04", productId: "tl-002", farmer: "Hộ Trần Thị Hồng", farmerAvatar: "H", location: "Hàm Thuận, Bình Thuận", harvestDate: "2026-06-03", quantityKg: 3000, soldKg: 1500, lockedKg: 100, pricePerKg: 12000, rescueStatus: "none" },
  { id: "L-TL-B02", productId: "tl-002", farmer: "Hộ Võ Văn Quang", farmerAvatar: "Q", location: "Bắc Bình, Bình Thuận", harvestDate: "2026-06-04", quantityKg: 2000, soldKg: 600, lockedKg: 0, pricePerKg: 11500, rescueStatus: "none" },
  { id: "L-XO-A01", productId: "xo-003", farmer: "Hộ Lê Hoàng Phúc", farmerAvatar: "P", location: "Cái Bè, Tiền Giang", harvestDate: "2026-05-28", quantityKg: 2000, soldKg: 900, lockedKg: 0, pricePerKg: 28000, rescueStatus: "none" },
  { id: "L-XO-B05", productId: "xo-003", farmer: "Hộ Nguyễn Thị Hoa", farmerAvatar: "H", location: "Cai Lậy, Tiền Giang", harvestDate: "2026-05-30", quantityKg: 1000, soldKg: 300, lockedKg: 0, pricePerKg: 27000, rescueStatus: "none" },
  { id: "L-MI-A09", productId: "mi-004", farmer: "Hộ Phạm Quốc Hùng", farmerAvatar: "Q", location: "Định Quán, Đồng Nai", harvestDate: "2026-06-02", quantityKg: 5000, soldKg: 3800, lockedKg: 150, pricePerKg: 9000, rescueStatus: "rescuing", rescuePointId: "rp-6" },
  { id: "L-MI-B02", productId: "mi-004", farmer: "Hộ Vũ Văn Long", farmerAvatar: "L", location: "Tân Phú, Đồng Nai", harvestDate: "2026-06-03", quantityKg: 3000, soldKg: 1800, lockedKg: 0, pricePerKg: 8800, rescueStatus: "pending" },
  { id: "L-SR-A01", productId: "sr-005", farmer: "Y Bhem Niê", farmerAvatar: "Y", location: "Krông Pắc, Đắk Lắk", harvestDate: "2026-05-30", quantityKg: 2000, soldKg: 450, lockedKg: 0, pricePerKg: 65000, rescueStatus: "none" },
  { id: "L-RC-A12", productId: "rc-006", farmer: "Hộ Đặng Thị Mai", farmerAvatar: "M", location: "Đơn Dương, Lâm Đồng", harvestDate: "2026-06-04", quantityKg: 1500, soldKg: 900, lockedKg: 50, pricePerKg: 18000, rescueStatus: "none" },
  // Lô của nông dân đang đăng nhập (anh Tâm) — phục vụ trang quản lý tồn kho theo loại nông sản
  { id: "L-DH-T01", productId: "dh-001", farmer: "Hộ Nguyễn Văn Tâm", farmerAvatar: "T", location: "Cần Đước, Long An", harvestDate: "2026-05-20", quantityKg: 4500, soldKg: 4500, lockedKg: 0, pricePerKg: 4500, rescueStatus: "none" },
  { id: "L-XO-T02", productId: "xo-003", farmer: "Hộ Nguyễn Văn Tâm", farmerAvatar: "T", location: "Cái Bè, Tiền Giang", harvestDate: "2026-06-05", quantityKg: 1500, soldKg: 200, lockedKg: 120, pricePerKg: 27000, rescueStatus: "none" },
  { id: "L-MI-T03", productId: "mi-004", farmer: "Hộ Nguyễn Văn Tâm", farmerAvatar: "T", location: "Định Quán, Đồng Nai", harvestDate: "2026-06-10", quantityKg: 2500, soldKg: 0, lockedKg: 0, pricePerKg: 8500, rescueStatus: "none" },
  { id: "L-TL-T04", productId: "tl-002", farmer: "Hộ Nguyễn Văn Tâm", farmerAvatar: "T", location: "Hàm Thuận, Bình Thuận", harvestDate: "2026-06-06", quantityKg: 2200, soldKg: 800, lockedKg: 0, pricePerKg: 11800, rescueStatus: "pending" },
  { id: "L-RC-T05", productId: "rc-006", farmer: "Hộ Nguyễn Văn Tâm", farmerAvatar: "T", location: "Đơn Dương, Lâm Đồng", harvestDate: "2026-05-25", quantityKg: 800, soldKg: 400, lockedKg: 0, pricePerKg: 18000, rescueStatus: "none" },
];

export const CURRENT_FARMER_NAME = "Hộ Nguyễn Văn Tâm";
export const CURRENT_FARMER_AVATAR = "T";

export function batchesByProduct(productId: string) {
  return productBatches.filter((b) => b.productId === productId);
}

export function farmerBatchesByCategory(catId: string) {
  return batchesByCategoryId(catId).filter((b) => b.farmer === CURRENT_FARMER_NAME);
}

export function batchExpiryDate(b: ProductBatch, shelfLifeDays: number) {
  const d = new Date(b.harvestDate);
  d.setDate(d.getDate() + shelfLifeDays);
  return d.toISOString().slice(0, 10);
}

export function isBatchInTransit(batchId: string) {
  return shipments.some((s) => s.batchId === batchId && s.status !== "delivered");
}

export function farmerBatchStatus(
  b: ProductBatch,
  shelfLifeDays: number,
  today = "2026-06-18",
): { label: string; tone: "primary" | "accent" | "destructive" | "muted" } {
  const remaining = b.quantityKg - b.soldKg;
  const expiry = batchExpiryDate(b, shelfLifeDays);
  if (today > expiry) return { label: "Hết hạn", tone: "destructive" };
  if (remaining <= 0) return { label: "Đã bán hết", tone: "muted" };
  if (isBatchInTransit(b.id)) return { label: "Đang vận chuyển", tone: "accent" };
  if (b.lockedKg > 0) return { label: "Đã khóa bởi CropLock", tone: "accent" };
  if (b.rescueStatus === "rescuing") return { label: "Đang giải cứu", tone: "destructive" };
  if (b.rescueStatus === "pending") return { label: "Chờ duyệt giải cứu", tone: "accent" };
  return { label: "Đang bán", tone: "primary" };
}

// ===== Đơn đăng ký giải cứu =====
export type RescueRequestStatus = "pending" | "approved" | "rejected";
export interface RescueRequest {
  id: string;
  batchId: string;
  productName: string;
  farmer: string;
  location: string;
  quantityKg: number;
  reason: string;
  urgency: Urgency;
  status: RescueRequestStatus;
  createdAt: string;
  assignedPointId?: string;
}

export const rescueRequests: RescueRequest[] = [
  { id: "YC-1042", batchId: "L-DH-C03", productName: "Dưa hấu Long An", farmer: "Hộ Lê Thị Cúc", location: "Bến Lức, Long An", quantityKg: 3000, reason: "Thương lái Trung Quốc hủy đơn đột ngột, hàng đã thu hoạch không kịp tiêu thụ.", urgency: "rescue", status: "pending", createdAt: "2026-06-04" },
  { id: "YC-1041", batchId: "L-MI-B02", productName: "Mít Thái Đồng Nai", farmer: "Hộ Vũ Văn Long", location: "Tân Phú, Đồng Nai", quantityKg: 3000, reason: "Vào vụ rộ, sản lượng vượt 60% so với dự kiến.", urgency: "high", status: "pending", createdAt: "2026-06-03" },
  { id: "YC-1038", batchId: "L-DH-A12", productName: "Dưa hấu Long An", farmer: "Hộ Nguyễn Văn Tâm", location: "Cần Đước, Long An", quantityKg: 5000, reason: "Mưa kéo dài làm quả nhanh chín, cần tiêu thụ trong 3 ngày.", urgency: "rescue", status: "approved", createdAt: "2026-06-01", assignedPointId: "rp-1" },
  { id: "YC-1035", batchId: "L-MI-A09", productName: "Mít Thái Đồng Nai", farmer: "Hộ Phạm Quốc Hùng", location: "Định Quán, Đồng Nai", quantityKg: 5000, reason: "Giá thương lái giảm sâu dưới giá thành.", urgency: "rescue", status: "approved", createdAt: "2026-05-30", assignedPointId: "rp-6" },
  { id: "YC-1030", batchId: "L-XO-B05", productName: "Xoài cát Hòa Lộc", farmer: "Hộ Nguyễn Thị Hoa", location: "Cai Lậy, Tiền Giang", quantityKg: 800, reason: "Sản lượng còn lại sau vụ.", urgency: "normal", status: "rejected", createdAt: "2026-05-28" },
];

// ===== Vận chuyển =====
export type ShipmentStatus =
  | "pickup_wait"
  | "picking_up"
  | "in_transit"
  | "at_rescue_point"
  | "out_for_delivery"
  | "delivered";

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  pickup_wait: "Chờ lấy hàng",
  picking_up: "Đang lấy hàng",
  in_transit: "Đang vận chuyển",
  at_rescue_point: "Đến điểm giải cứu",
  out_for_delivery: "Đang giao hàng",
  delivered: "Đã giao thành công",
};

export const shipmentStatusOrder: ShipmentStatus[] = [
  "pickup_wait",
  "picking_up",
  "in_transit",
  "at_rescue_point",
  "out_for_delivery",
  "delivered",
];

export interface Shipment {
  id: string;
  orderId: string;
  batchId: string;
  productName: string;
  from: string;
  to: string;
  carrier: string;
  createdAt: string;
  status: ShipmentStatus;
  quantityKg: number;
  eta: string;
  buyer: string;
}

export const shipments: Shipment[] = [
  { id: "VN-202606-001", orderId: "DH-1042", batchId: "L-DH-A12", productName: "Dưa hấu Long An", from: "Cần Đước, Long An", to: "Quận 1, TP.HCM", carrier: "GreenLogi", createdAt: "2026-06-02", status: "out_for_delivery", quantityKg: 50, eta: "2026-06-05", buyer: "Công ty Xanh Sạch" },
  { id: "VN-202606-002", orderId: "DH-1041", batchId: "L-MI-A09", productName: "Mít Thái Đồng Nai", from: "Định Quán, Đồng Nai", to: "Biên Hòa, Đồng Nai", carrier: "FastFresh", createdAt: "2026-06-02", status: "at_rescue_point", quantityKg: 200, eta: "2026-06-04", buyer: "Siêu thị FreshMart" },
  { id: "VN-202606-003", orderId: "DH-1040", batchId: "L-DH-B07", productName: "Dưa hấu Long An", from: "Châu Thành, Long An", to: "Bình Thạnh, TP.HCM", carrier: "GreenLogi", createdAt: "2026-06-03", status: "in_transit", quantityKg: 120, eta: "2026-06-05", buyer: "Trường mầm non Hoa Sen" },
  { id: "VN-202606-004", orderId: "DH-1039", batchId: "L-TL-A04", productName: "Thanh long ruột đỏ", from: "Hàm Thuận, Bình Thuận", to: "Quận 3, TP.HCM", carrier: "EcoTrans", createdAt: "2026-06-03", status: "picking_up", quantityKg: 80, eta: "2026-06-06", buyer: "Cửa hàng Nông Tươi" },
  { id: "VN-202606-005", orderId: "DH-1038", batchId: "L-XO-A01", productName: "Xoài cát Hòa Lộc", from: "Cái Bè, Tiền Giang", to: "Hà Nội", carrier: "VNFresh Air", createdAt: "2026-05-29", status: "delivered", quantityKg: 30, eta: "2026-05-30", buyer: "Siêu thị FreshMart" },
  { id: "VN-202606-006", orderId: "DH-1037", batchId: "L-MI-A09", productName: "Mít Thái Đồng Nai", from: "Định Quán, Đồng Nai", to: "Mỹ Đình, Hà Nội", carrier: "VNFresh Air", createdAt: "2026-06-01", status: "pickup_wait", quantityKg: 300, eta: "2026-06-06", buyer: "Hội Nông dân HN" },
];


// ===== Thông tin chi tiết loại nông sản =====
export interface CategoryRich {
  id: string;
  name: string;
  image: string;
  group: string;
  description: string;
  preservation: string;
  shelfLifeDays: number;
  transportDays: string;
  marketPriceVND: { min: number; max: number };
  demand: "Cao" | "Trung bình" | "Thấp";
  trend: "up" | "down" | "flat";
  productIds: string[];
}

export const categoryRich: Record<string, CategoryRich> = {
  "c-watermelon": { id: "c-watermelon", name: "Dưa hấu", image: watermelon, group: "Trái cây",
    description: "Dưa hấu là loại trái cây nhiệt đới với hàm lượng nước cao, vị ngọt mát, được trồng phổ biến ở miền Tây Nam Bộ. Vụ thu hoạch tập trung từ tháng 3 đến tháng 7.",
    preservation: "Bảo quản nơi khô ráo, thoáng mát, nhiệt độ 10–15°C. Tránh ánh nắng trực tiếp.",
    shelfLifeDays: 14, transportDays: "1–3 ngày trong điều kiện thoáng khí",
    marketPriceVND: { min: 4000, max: 8000 }, demand: "Cao", trend: "down",
    productIds: ["dh-001"] },
  "c-dragon": { id: "c-dragon", name: "Thanh long", image: dragonfruit, group: "Trái cây",
    description: "Thanh long ruột đỏ và trắng là đặc sản Bình Thuận, Long An, Tiền Giang. Quả giàu vitamin C và chất xơ.",
    preservation: "Nhiệt độ 5–10°C, độ ẩm 85–90%. Đóng gói tránh va đập.",
    shelfLifeDays: 21, transportDays: "2–5 ngày trong xe lạnh",
    marketPriceVND: { min: 10000, max: 22000 }, demand: "Trung bình", trend: "down",
    productIds: ["tl-002"] },
  "c-mango": { id: "c-mango", name: "Xoài", image: mango, group: "Trái cây",
    description: "Xoài cát Hòa Lộc – đặc sản Tiền Giang, ngọt đậm, ít xơ, được ưa chuộng trong và ngoài nước.",
    preservation: "Nhiệt độ 12–13°C cho xoài chín, 10°C cho xoài xanh.",
    shelfLifeDays: 18, transportDays: "2–4 ngày",
    marketPriceVND: { min: 22000, max: 45000 }, demand: "Cao", trend: "up",
    productIds: ["xo-003"] },
  "c-jack": { id: "c-jack", name: "Mít", image: jackfruit, group: "Trái cây",
    description: "Mít Thái siêu sớm cho năng suất cao, múi to giòn ngọt, trồng nhiều ở Đồng Nai, Tây Ninh.",
    preservation: "Nhiệt độ 10–13°C, tránh độ ẩm cao gây thối quả.",
    shelfLifeDays: 10, transportDays: "1–3 ngày",
    marketPriceVND: { min: 7000, max: 15000 }, demand: "Thấp", trend: "down",
    productIds: ["mi-004"] },
  "c-durian": { id: "c-durian", name: "Sầu riêng", image: durian, group: "Trái cây",
    description: "Sầu riêng Ri6, Monthong từ Tây Nguyên và miền Tây – mặt hàng xuất khẩu chiến lược.",
    preservation: "Nhiệt độ 14–16°C. Tránh kích sốc nhiệt làm sượng cơm.",
    shelfLifeDays: 7, transportDays: "1–2 ngày",
    marketPriceVND: { min: 55000, max: 95000 }, demand: "Cao", trend: "up",
    productIds: ["sr-005"] },
  "c-veg": { id: "c-veg", name: "Rau cải", image: vegetables, group: "Rau củ",
    description: "Rau cải hữu cơ Đà Lạt – chuẩn VietGAP, giàu vitamin và chất xơ.",
    preservation: "Nhiệt độ 0–4°C, độ ẩm cao 95%.",
    shelfLifeDays: 5, transportDays: "Trong ngày bằng xe lạnh",
    marketPriceVND: { min: 15000, max: 28000 }, demand: "Cao", trend: "flat",
    productIds: ["rc-006"] },
};

export function batchesByCategoryId(catId: string) {
  const cat = categoryRich[catId];
  if (!cat) return [];
  return productBatches.filter((b) => cat.productIds.includes(b.productId));
}

export function batchStatusLabel(b: ProductBatch): { label: string; tone: "primary" | "accent" | "destructive" | "muted" } {
  const remaining = b.quantityKg - b.soldKg;
  if (remaining <= 0) return { label: "Đã bán hết", tone: "muted" };
  if (b.rescueStatus === "rescuing") return { label: "Đang giải cứu", tone: "destructive" };
  if (b.lockedKg > 0) return { label: "Đang vận chuyển", tone: "accent" };
  return { label: "Đang bán", tone: "primary" };
}

// ===== Thống kê theo địa phương (cho dashboard điều phối) =====
export interface ProvinceStat {
  province: string;
  totalKg: number;
  inventoryKg: number;
  rescuingKg: number;
  consumedKg: number;
  inTransitKg: number;
  consumptionRateKgPerDay: number;
}

export const provinceStats: ProvinceStat[] = [
  { province: "Long An", totalKg: 220000, inventoryKg: 84000, rescuingKg: 60000, consumedKg: 68000, inTransitKg: 8000, consumptionRateKgPerDay: 9500 },
  { province: "Đồng Nai", totalKg: 120000, inventoryKg: 42000, rescuingKg: 35000, consumedKg: 38000, inTransitKg: 5000, consumptionRateKgPerDay: 6800 },
  { province: "Bình Thuận", totalKg: 80000, inventoryKg: 28000, rescuingKg: 22000, consumedKg: 27000, inTransitKg: 3000, consumptionRateKgPerDay: 4200 },
  { province: "Tiền Giang", totalKg: 45000, inventoryKg: 18000, rescuingKg: 8000, consumedKg: 17000, inTransitKg: 2000, consumptionRateKgPerDay: 2500 },
  { province: "Đắk Lắk", totalKg: 38000, inventoryKg: 22000, rescuingKg: 0, consumedKg: 14000, inTransitKg: 2000, consumptionRateKgPerDay: 1800 },
  { province: "Lâm Đồng", totalKg: 28000, inventoryKg: 11000, rescuingKg: 4000, consumedKg: 12000, inTransitKg: 1000, consumptionRateKgPerDay: 2100 },
];

export function daysToConsume(p: ProvinceStat) {
  const remaining = p.inventoryKg + p.rescuingKg;
  if (p.consumptionRateKgPerDay <= 0) return Infinity;
  return Math.round(remaining / p.consumptionRateKgPerDay);
}

export function congestionRisk(p: ProvinceStat): "high" | "medium" | "low" {
  const d = daysToConsume(p);
  if (d > 20) return "high";
  if (d > 10) return "medium";
  return "low";
}

// ===== Forecast =====
export const weeklyRescueSeries = [
  { w: "T22", surplus: 320, rescued: 180 },
  { w: "T23", surplus: 410, rescued: 260 },
  { w: "T24", surplus: 380, rescued: 290 },
  { w: "T25", surplus: 450, rescued: 340 },
  { w: "T26", surplus: 520, rescued: 410 },
  { w: "T27", surplus: 480, rescued: 420 },
];

export const monthlyRescueSeries = [
  { m: "T1", surplus: 1200, rescued: 700 },
  { m: "T2", surplus: 1450, rescued: 920 },
  { m: "T3", surplus: 1620, rescued: 1100 },
  { m: "T4", surplus: 1780, rescued: 1320 },
  { m: "T5", surplus: 2050, rescued: 1580 },
  { m: "T6", surplus: 1860, rescued: 1490 },
];

export const forecastInventoryWeekly = [
  { w: "T27", actual: 920, forecast: null as number | null },
  { w: "T28", actual: null as number | null, forecast: 880 },
  { w: "T29", actual: null as number | null, forecast: 1020 },
  { w: "T30", actual: null as number | null, forecast: 1180 },
];

// ===== Tỷ lệ giải cứu =====
export const rescueRateByProvince = provinceStats.map((p) => ({
  province: p.province,
  rate: Math.round((p.consumedKg / (p.consumedKg + p.rescuingKg + p.inventoryKg)) * 100),
}));

export const rescueRateByProduct = [
  { name: "Dưa hấu", rate: 72 },
  { name: "Mít Thái", rate: 65 },
  { name: "Thanh long", rate: 58 },
  { name: "Xoài cát", rate: 81 },
  { name: "Sầu riêng", rate: 88 },
  { name: "Rau cải", rate: 76 },
];

export const rescueRateByPoint = rescuePoints.map((p) => ({
  name: p.name,
  rate: Math.round((p.soldKg / p.receivedKg) * 100),
}));

// ===== Khả năng cung ứng theo vùng trồng =====
// dailyHarvestKg: sản lượng dự kiến thu hoạch mỗi ngày của vùng (kg/ngày)
export const dailyHarvestByProvince: Record<string, number> = {
  "Long An": 7500,
  "Đồng Nai": 4500,
  "Bình Thuận": 3000,
  "Tiền Giang": 1800,
  "Đắk Lắk": 1300,
  "Lâm Đồng": 950,
};

export interface SupplyCapacity {
  province: string;
  days: number;
  immediateKg: number;       // Tồn kho + đang giải cứu (sẵn sàng giao)
  incomingHarvestKg: number; // Sản lượng thu hoạch trong khoảng ngày
  expectedConsumptionKg: number; // Tiêu thụ dự kiến trong khoảng ngày
  totalSupplyKg: number;     // immediate + incoming
  netAvailableKg: number;    // total - expectedConsumption (>=0)
}

export function supplyCapacity(p: ProvinceStat, days: number): SupplyCapacity {
  const daily = dailyHarvestByProvince[p.province] ?? 0;
  const immediate = p.inventoryKg + p.rescuingKg;
  const incoming = daily * Math.max(0, days);
  const consumption = p.consumptionRateKgPerDay * Math.max(0, days);
  const total = immediate + incoming;
  return {
    province: p.province,
    days,
    immediateKg: immediate,
    incomingHarvestKg: incoming,
    expectedConsumptionKg: consumption,
    totalSupplyKg: total,
    netAvailableKg: Math.max(0, total - consumption),
  };
}

export function daysBetween(startISO: string, endISO: string) {
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  if (isNaN(s) || isNaN(e) || e < s) return 0;
  return Math.round((e - s) / 86_400_000) + 1;
}