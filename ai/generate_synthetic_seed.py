#!/usr/bin/env python3
"""
Tạo dữ liệu lặp lại được (repeatable synthetic seed data) cho AgriConnect.

Đầu ra (Outputs):
  - File SQL chứa lệnh chèn dữ liệu mẫu (PostgreSQL seed SQL) cho các bảng hiện có trong ứng dụng.
  - File CSV thống kê số liệu hàng ngày theo tỉnh/thành và loại nông sản dùng cho công tác phân tích và dự báo.

Công cụ này đọc file ai/data.csv để làm trọng số sản lượng theo tỉnh thành.
Chương trình không phụ thuộc vào bất kỳ thư viện bên thứ ba nào (chỉ dùng Python tiêu chuẩn).
"""
# psql -h localhost -p 5433 -U postgres -d agriconnect -f ai\output\agriconnect_synthetic_seed.sql
from __future__ import annotations

import argparse
import csv
import math
import random
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any, Callable


DEFAULT_SEED = 20260704
DEFAULT_END_DATE = date(2026, 7, 4)
PASSWORD_HASH = "$2a$10$Ti66l7NNNHiefTWtBJsubuguVw78pccN/YFz3cMO5t5GlDtdq1ApO"

TARGET_CROPS = 10
TARGET_FARMERS = 200
TARGET_BUYERS = 1_000
TARGET_LOGISTICS = 40
TARGET_ADMINS = 5
TARGET_BATCHES = 3_000
TARGET_ORDERS = 20_000
TARGET_SHIPMENTS = 10_000


@dataclass(frozen=True)
class CropDef:
    id: int
    name: str
    description: str
    storage_days: int
    unit: str
    base_price: int
    avg_batch_kg: int
    season_months: tuple[int, ...]


@dataclass
class User:
    id: int
    full_name: str
    email: str
    phone: str
    role: str
    status: str
    province: str


@dataclass
class Batch:
    id: int
    crop_id: int
    farmer_id: int
    initial_quantity: Decimal
    current_quantity: Decimal
    unit_price: Decimal
    unit: str
    harvest_date: date
    expiry_date: date
    province: str
    district: str
    ward: str
    address_detail: str
    status: str
    created_at: datetime
    updated_at: datetime


@dataclass
class Order:
    id: int
    buyer_id: int
    total_amount: Decimal
    status: str
    order_date: datetime
    created_at: datetime


@dataclass
class OrderItem:
    id: int
    order_id: int
    batch_id: int
    quantity: Decimal
    unit_price: Decimal
    subtotal: Decimal


@dataclass
class Shipment:
    id: int
    order_id: int
    logistics_user_id: int
    pickup_address: str
    delivery_address: str
    status: str
    shipped_at: datetime | None
    delivered_at: datetime | None


@dataclass
class CropLock:
    id: int
    batch_id: int
    buyer_id: int
    quantity: Decimal
    status: str
    locked_at: datetime
    expired_at: datetime


@dataclass
class RescuePoint:
    id: int
    name: str
    province: str
    district: str
    ward: str
    address_detail: str
    status: str
    created_at: datetime
    updated_at: datetime


@dataclass
class RescueRegistration:
    id: int
    batch_id: int
    rescue_point_id: int
    approved_by: int | None
    status: str
    submitted_at: datetime
    approved_at: datetime | None


CROP_DEFS = [
    CropDef(1, "Nho", "Nho tươi theo sản lượng tỉnh/thành từ data.csv.", 10, "kg", 38000, 3_500, (1, 2, 3, 8, 9)),
    CropDef(2, "Xoài", "Xoài cát, xoài keo, xoài tượng theo mùa vụ miền Nam.", 12, "kg", 22000, 6_000, (2, 3, 4, 5, 6)),
    CropDef(3, "Thanh long", "Thanh long ruột trắng và ruột đỏ.", 18, "kg", 12000, 8_000, (4, 5, 6, 7, 8, 9)),
    CropDef(4, "Dứa", "Dứa thơm/khóm từ các vùng trồng lớn.", 14, "kg", 9000, 7_000, (3, 4, 5, 6, 11, 12)),
    CropDef(5, "Sầu riêng", "Sầu riêng Ri6 và Monthong.", 7, "kg", 62000, 3_000, (5, 6, 7, 8, 9)),
    CropDef(6, "Mít", "Mít Thái và mít nghệ.", 8, "kg", 11000, 6_500, (4, 5, 6, 7, 8)),
    CropDef(7, "Ổi", "Ổi lê và ổi ruột đỏ.", 9, "kg", 15000, 4_500, (1, 2, 6, 7, 8, 11, 12)),
    CropDef(8, "Bưởi", "Bưởi da xanh, năm roi.", 20, "kg", 28000, 4_000, (8, 9, 10, 11, 12, 1)),
    CropDef(9, "Chôm chôm", "Chôm chôm Java và chôm chôm nhãn.", 6, "kg", 16000, 5_000, (5, 6, 7, 8)),
    CropDef(10, "Rau cải", "Rau cải và rau lá ngắn ngày.", 5, "kg", 14000, 2_500, tuple(range(1, 13))),
]

DEFAULT_PROVINCE_WEIGHTS = {
    "Lâm Đồng": 1200.0,
    "Đồng Tháp": 900.0,
    "Tiền Giang": 850.0,
    "Long An": 800.0,
    "Đồng Nai": 760.0,
    "An Giang": 700.0,
    "Cần Thơ": 650.0,
    "Bình Thuận": 630.0,
    "Đắk Lắk": 600.0,
    "Gia Lai": 560.0,
    "Tây Ninh": 520.0,
    "Khánh Hòa": 500.0,
    "Hà Nội": 420.0,
    "Thanh Hóa": 400.0,
    "Nghệ An": 380.0,
    "Hồ Chí Minh": 360.0,
}

DEMAND_PROVINCE_WEIGHTS = {
    "Hồ Chí Minh": 1.65,
    "Hà Nội": 1.55,
    "Đà Nẵng": 1.25,
    "Cần Thơ": 1.20,
    "Hải Phòng": 1.15,
    "Đồng Nai": 1.10,
    "Bình Dương": 1.10,
}

FIRST_NAMES = [
    "Nguyễn Văn", "Trần Thị", "Lê Văn", "Phạm Thị", "Hoàng Văn", "Võ Thị",
    "Đặng Văn", "Bùi Thị", "Đỗ Văn", "Phan Thị", "Huỳnh Văn", "Ngô Thị",
]
LAST_NAMES = [
    "An", "Bình", "Châu", "Dũng", "Giang", "Hoa", "Khang", "Linh", "Minh",
    "Ngân", "Phúc", "Quang", "Tâm", "Thảo", "Trang", "Tuấn", "Vy",
]
DISTRICTS = ["Huyện 1", "Huyện 2", "Huyện 3", "Thị xã Trung Tâm", "Thành phố"]
WARDS = ["Xã Đông Xanh", "Xã Phú Nông", "Phường Chợ Mới", "Xã Hòa Bình", "Phường An Lạc"]


def ascii_slug(value: str) -> str:
    replacements = {
        "Đ": "D", "đ": "d", "ă": "a", "â": "a", "ê": "e", "ô": "o", "ơ": "o", "ư": "u",
        "á": "a", "à": "a", "ả": "a", "ã": "a", "ạ": "a",
        "ắ": "a", "ằ": "a", "ẳ": "a", "ẵ": "a", "ặ": "a",
        "ấ": "a", "ầ": "a", "ẩ": "a", "ẫ": "a", "ậ": "a",
        "é": "e", "è": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e",
        "ế": "e", "ề": "e", "ể": "e", "ễ": "e", "ệ": "e",
        "í": "i", "ì": "i", "ỉ": "i", "ĩ": "i", "ị": "i",
        "ó": "o", "ò": "o", "ỏ": "o", "õ": "o", "ọ": "o",
        "ố": "o", "ồ": "o", "ổ": "o", "ỗ": "o", "ộ": "o",
        "ớ": "o", "ờ": "o", "ở": "o", "ỡ": "o", "ợ": "o",
        "ú": "u", "ù": "u", "ủ": "u", "ũ": "u", "ụ": "u",
        "ứ": "u", "ừ": "u", "ử": "u", "ữ": "u", "ự": "u",
        "ý": "y", "ỳ": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y",
    }
    for src, dst in replacements.items():
        value = value.replace(src, dst)
    return re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-").lower()


def q2(value: float | Decimal) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def parse_vn_number(value: str) -> float:
    value = value.strip().replace(".", "").replace(",", ".")
    try:
        return float(value)
    except ValueError:
        return 0.0


def normalize_province(name: str) -> str:
    name = name.strip()
    aliases = {
        "Thành phố Hồ Chí Minh": "Hồ Chí Minh",
        "TP. Hồ Chí Minh": "Hồ Chí Minh",
        "Ho Chi Minh": "Hồ Chí Minh",
        "Đăk Lăk": "Đắk Lắk",
        "Dak Lak": "Đắk Lắk",
        "Khánh Hoà": "Khánh Hòa",
        "Thanh Hoá": "Thanh Hóa",
        "Bà Rịa - Vũng Tàu": "Bà Rịa - Vũng Tàu",
        "Thừa Thiên Huế": "Thừa Thiên Huế",
    }
    if name in aliases:
        return aliases[name]
    return name


def parse_production_csv(path: Path) -> dict[str, dict[str, float]]:
    by_crop: dict[str, dict[str, float]] = {}
    current_crop: str | None = None
    crop_header = re.compile(r"^Sản lượng\s+(.+?)\s*\(tấn\)")
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        for raw_line in handle:
            parts = [part.strip() for part in raw_line.rstrip("\n").split("\t")]
            if not parts or not any(parts):
                continue
            match = crop_header.match(parts[0])
            if match:
                current_crop = ascii_slug(match.group(1).strip())
                by_crop[current_crop] = {}
                continue
            if current_crop and len(parts) >= 3 and parts[0].isdigit():
                province = normalize_province(parts[1])
                amount = parse_vn_number(parts[2])
                if amount > 0:
                    by_crop[current_crop][province] = amount
    return by_crop


def weighted_choice(rng: random.Random, weighted_items: list[tuple[Any, float]]) -> Any:
    total = sum(max(0.0, weight) for _, weight in weighted_items)
    if total <= 0:
        return weighted_items[rng.randrange(len(weighted_items))][0]
    pick = rng.random() * total
    upto = 0.0
    for item, weight in weighted_items:
        upto += max(0.0, weight)
        if upto >= pick:
            return item
    return weighted_items[-1][0]


def production_weights_for_crop(production: dict[str, dict[str, float]], crop_name: str) -> dict[str, float]:
    key = ascii_slug(crop_name)
    if key in production:
        return production[key]
    if crop_name == "Rau cải":
        return DEFAULT_PROVINCE_WEIGHTS
    return DEFAULT_PROVINCE_WEIGHTS


def random_datetime(rng: random.Random, day: date, start_hour: int = 6, end_hour: int = 21) -> datetime:
    seconds = rng.randrange((end_hour - start_hour) * 3600)
    return datetime.combine(day, time(start_hour)) + timedelta(seconds=seconds)


def season_factor(crop: CropDef, day: date) -> float:
    if day.month in crop.season_months:
        return 1.45
    near = any(((day.month - month) % 12 in (1, 11)) for month in crop.season_months)
    return 0.9 if near else 0.45


def demand_factor(day: date, crop: CropDef, price_ratio: float, province: str) -> float:
    factor = 1.0
    if day.weekday() >= 5:
        factor *= 1.22
    holidays = {
        date(2026, 1, 1), date(2026, 2, 16), date(2026, 2, 17), date(2026, 2, 18),
        date(2026, 2, 19), date(2026, 2, 20), date(2026, 4, 30), date(2026, 5, 1),
        date(2025, 9, 2),
    }
    if day in holidays:
        factor *= 1.55
    if province in DEMAND_PROVINCE_WEIGHTS:
        factor *= DEMAND_PROVINCE_WEIGHTS[province]
    factor *= max(0.35, min(1.85, 1.15 - 0.75 * (price_ratio - 1.0)))
    if crop.name in {"Sầu riêng", "Bưởi", "Nho"} and day.month in (1, 2):
        factor *= 1.25
    if crop.name == "Rau cải" and day.month in (11, 12, 1):
        factor *= 1.20
    return factor


def make_users(rng: random.Random, provinces: list[str]) -> tuple[list[User], dict[str, list[User]]]:
    users: list[User] = []
    by_role: dict[str, list[User]] = defaultdict(list)
    user_id = 1

    def add(role: str, index: int, province: str, status: str = "ACTIVE") -> None:
        nonlocal user_id
        name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        email = f"{role.lower()}.{index:04d}@synthetic.agriconnect.vn"
        phone = f"09{rng.randrange(10_000_000, 99_999_999)}"
        user = User(user_id, name, email, phone, role, status, province)
        users.append(user)
        by_role[role].append(user)
        user_id += 1

    province_weights = [(p, DEMAND_PROVINCE_WEIGHTS.get(p, 1.0)) for p in provinces]
    for i in range(TARGET_ADMINS):
        add("ADMIN", i + 1, "Hồ Chí Minh")
    for i in range(TARGET_LOGISTICS):
        add("LOGISTICS", i + 1, weighted_choice(rng, province_weights))
    for i in range(TARGET_FARMERS):
        add("FARMER", i + 1, rng.choice(provinces), "ACTIVE" if rng.random() > 0.03 else "INACTIVE")
    for i in range(TARGET_BUYERS):
        add("BUYER", i + 1, weighted_choice(rng, province_weights), "ACTIVE" if rng.random() > 0.02 else "INACTIVE")
    return users, by_role


def make_crops() -> list[CropDef]:
    return CROP_DEFS[:TARGET_CROPS]


def make_rescue_points(rng: random.Random, provinces: list[str], end_date: date) -> list[RescuePoint]:
    top_provinces = sorted(
        provinces,
        key=lambda p: DEFAULT_PROVINCE_WEIGHTS.get(p, 100.0) * DEMAND_PROVINCE_WEIGHTS.get(p, 1.0),
        reverse=True,
    )[:15]
    points: list[RescuePoint] = []
    pid = 1
    for province in top_provinces:
        for slot in range(2):
            created = datetime.combine(end_date - timedelta(days=rng.randrange(200, 520)), time(8))
            points.append(
                RescuePoint(
                    pid,
                    f"Điểm giải cứu {province} {slot + 1}",
                    province,
                    rng.choice(DISTRICTS),
                    rng.choice(WARDS),
                    f"{rng.randrange(1, 299)} Đường Nông Sản, {province}",
                    "ACTIVE" if rng.random() > 0.08 else "INACTIVE",
                    created,
                    created,
                )
            )
            pid += 1
    return points


def make_batches(
    rng: random.Random,
    crops: list[CropDef],
    farmers: list[User],
    production: dict[str, dict[str, float]],
    start_date: date,
    end_date: date,
) -> tuple[list[Batch], dict[tuple[date, str, int], dict[str, Decimal]]]:
    farmers_by_province: dict[str, list[User]] = defaultdict(list)
    for farmer in farmers:
        farmers_by_province[farmer.province].append(farmer)

    batches: list[Batch] = []
    daily: dict[tuple[date, str, int], dict[str, Decimal]] = defaultdict(lambda: defaultdict(Decimal))
    crop_weights = [(crop, 1.0 + len(crop.season_months) / 12) for crop in crops]
    days = (end_date - start_date).days + 1
    for bid in range(1, TARGET_BATCHES + 1):
        crop = weighted_choice(rng, crop_weights)
        crop_prod = production_weights_for_crop(production, crop.name)
        province = weighted_choice(rng, list(crop_prod.items()))
        farmer_pool = farmers_by_province.get(province) or farmers
        farmer = rng.choice(farmer_pool)
        harvest = start_date + timedelta(days=rng.randrange(days))
        sf = season_factor(crop, harvest)
        quantity = q2(max(150.0, rng.lognormvariate(math.log(crop.avg_batch_kg * sf), 0.55)))
        price_noise = rng.uniform(0.82, 1.22)
        seasonal_price = 1.12 if sf < 1.0 else 0.92
        price = q2(max(1_000, crop.base_price * price_noise * seasonal_price))
        expiry = harvest + timedelta(days=crop.storage_days)
        created = random_datetime(rng, harvest - timedelta(days=rng.randrange(3, 18)), 7, 18)
        batch = Batch(
            bid,
            crop.id,
            farmer.id,
            quantity,
            quantity,
            price,
            crop.unit,
            harvest,
            expiry,
            province,
            rng.choice(DISTRICTS),
            rng.choice(WARDS),
            f"Lô {bid}, vườn {farmer.full_name}, {province}",
            "available",
            created,
            created,
        )
        batches.append(batch)
        daily[(harvest, province, crop.id)]["harvest_kg"] += quantity
        daily[(harvest, province, crop.id)]["price_sum"] += price
        daily[(harvest, province, crop.id)]["price_count"] += Decimal(1)
    return batches, daily


def choose_order_batch(
    rng: random.Random,
    batches: list[Batch],
    crops_by_id: dict[int, CropDef],
    order_day: date,
    buyer_province: str,
) -> Batch | None:
    candidates: list[tuple[Batch, float]] = []
    for batch in batches:
        if batch.current_quantity <= 0:
            continue
        if batch.harvest_date > order_day or batch.expiry_date < order_day:
            continue
        crop = crops_by_id[batch.crop_id]
        price_ratio = float(batch.unit_price) / crop.base_price
        weight = demand_factor(order_day, crop, price_ratio, buyer_province)
        if batch.province == buyer_province:
            weight *= 1.25
        weight *= min(3.0, max(0.2, float(batch.current_quantity) / crop.avg_batch_kg))
        candidates.append((batch, weight))
    if not candidates:
        return None
    return weighted_choice(rng, candidates)


def make_orders_and_locks(
    rng: random.Random,
    crops: list[CropDef],
    batches: list[Batch],
    buyers: list[User],
    logistics_users: list[User],
    start_date: date,
    end_date: date,
    daily: dict[tuple[date, str, int], dict[str, Decimal]],
) -> tuple[list[Order], list[OrderItem], list[CropLock], list[Shipment]]:
    crops_by_id = {crop.id: crop for crop in crops}
    orders: list[Order] = []
    items: list[OrderItem] = []
    locks: list[CropLock] = []
    shipments: list[Shipment] = []
    order_id = item_id = lock_id = shipment_id = 1
    days = (end_date - start_date).days + 1
    successful_orders: list[tuple[Order, OrderItem, Batch]] = []

    for _ in range(TARGET_ORDERS):
        order_day = start_date + timedelta(days=rng.randrange(days))
        buyer = rng.choice(buyers)
        batch = choose_order_batch(rng, batches, crops_by_id, order_day, buyer.province)
        if batch is None:
            continue
        crop = crops_by_id[batch.crop_id]
        price_ratio = float(batch.unit_price) / crop.base_price
        demand = demand_factor(order_day, crop, price_ratio, buyer.province)
        desired = rng.lognormvariate(math.log(45 * demand), 0.8)
        if buyer.province in ("Hồ Chí Minh", "Hà Nội", "Đà Nẵng"):
            desired *= rng.uniform(1.1, 2.0)
        quantity = q2(min(float(batch.current_quantity), max(5.0, desired)))
        if quantity <= 0:
            continue

        order_at = random_datetime(rng, order_day)
        cancelled = rng.random() < 0.045
        if cancelled:
            status = "CANCELLED"
            # Đơn hàng bị hủy sẽ không làm trừ lượng tồn kho.
        else:
            batch.current_quantity = q2(batch.current_quantity - quantity)
            if batch.current_quantity < 0:
                batch.current_quantity = Decimal("0.00")
            age_days = (end_date - order_day).days
            if age_days <= 1:
                status = weighted_choice(rng, [("PENDING", 0.5), ("CONFIRMED", 0.35), ("PACKING", 0.15)])
            elif age_days <= 3:
                status = weighted_choice(rng, [("CONFIRMED", 0.25), ("PACKING", 0.30), ("SHIPPING", 0.30), ("DELIVERED", 0.15)])
            else:
                status = weighted_choice(rng, [("DELIVERED", 0.88), ("SHIPPING", 0.08), ("CANCELLED", 0.04)])
            if status == "CANCELLED":
                batch.current_quantity = q2(batch.current_quantity + quantity)

        subtotal = q2(quantity * batch.unit_price)
        order = Order(order_id, buyer.id, subtotal, status, order_at, order_at)
        item = OrderItem(item_id, order_id, batch.id, quantity, batch.unit_price, subtotal)
        orders.append(order)
        items.append(item)
        daily[(order_day, batch.province, batch.crop_id)]["demand_kg"] += quantity
        daily[(order_day, batch.province, batch.crop_id)]["orders_count"] += Decimal(1)
        daily[(order_day, batch.province, batch.crop_id)]["price_sum"] += batch.unit_price
        daily[(order_day, batch.province, batch.crop_id)]["price_count"] += Decimal(1)
        if status != "CANCELLED":
            successful_orders.append((order, item, batch))
            if rng.random() < 0.24:
                locked_at = order_at - timedelta(hours=rng.randrange(1, 18), minutes=rng.randrange(0, 60))
                locks.append(CropLock(lock_id, batch.id, buyer.id, quantity, "CONVERTED", locked_at, locked_at + timedelta(hours=24)))
                lock_id += 1
        order_id += 1
        item_id += 1

    # Thêm các khoá lô (crop locks) đang hoạt động/hết hạn nhưng không chuyển thành đơn đặt hàng.
    recent_batches = [b for b in batches if b.current_quantity > 20 and b.expiry_date >= end_date - timedelta(days=7)]
    for _ in range(1_200):
        if not recent_batches:
            break
        batch = rng.choice(recent_batches)
        buyer = rng.choice(buyers)
        qty = q2(min(float(batch.current_quantity), rng.uniform(5, 80)))
        if qty <= 0:
            continue
        locked_at = random_datetime(rng, end_date - timedelta(days=rng.randrange(0, 25)), 7, 21)
        active = locked_at >= datetime.combine(end_date - timedelta(days=1), time())
        status = "ACTIVE" if active and rng.random() < 0.35 else "EXPIRED"
        if status == "ACTIVE":
            batch.current_quantity = q2(batch.current_quantity - qty)
        locks.append(CropLock(lock_id, batch.id, buyer.id, qty, status, locked_at, locked_at + timedelta(hours=24)))
        lock_id += 1

    shippable = [(o, i, b) for (o, i, b) in successful_orders if o.status != "CANCELLED"]
    rng.shuffle(shippable)
    for order, item, batch in shippable[:TARGET_SHIPMENTS]:
        shipped_at = order.order_date + timedelta(hours=rng.randrange(4, 48))
        delayed = rng.random() < 0.14
        delivery_days = rng.randrange(1, 4) + (rng.randrange(2, 6) if delayed else 0)
        delivered_at = shipped_at + timedelta(days=delivery_days, hours=rng.randrange(0, 8))
        if order.status == "DELIVERED":
            shipment_status = "DELIVERED"
        elif order.status == "SHIPPING":
            shipment_status = "SHIPPING"
            delivered_at = None
        elif order.status == "PACKING":
            shipment_status = "PACKING"
            delivered_at = None
        else:
            shipment_status = weighted_choice(rng, [("PENDING", 0.5), ("CONFIRMED", 0.5)])
            shipped_at = None
            delivered_at = None
        logistics = rng.choice(logistics_users)
        shipments.append(
            Shipment(
                shipment_id,
                order.id,
                logistics.id,
                batch.address_detail,
                f"{rng.randrange(1, 250)} Đường Khách Hàng, {rng.choice([batch.province, logistics.province])}",
                shipment_status,
                shipped_at,
                delivered_at,
            )
        )
        shipment_id += 1

    for batch in batches:
        if batch.current_quantity <= 0:
            batch.current_quantity = Decimal("0.00")
            batch.status = "sold_out"
        elif batch.expiry_date < end_date:
            batch.status = "expired"
            daily[(batch.expiry_date, batch.province, batch.crop_id)]["expired_kg"] += batch.current_quantity
        else:
            batch.status = "available"
        batch.updated_at = datetime.combine(min(end_date, batch.expiry_date), time(18))

    return orders, items, locks, shipments


def make_rescue_registrations(
    rng: random.Random,
    batches: list[Batch],
    crops_by_id: dict[int, CropDef],
    rescue_points: list[RescuePoint],
    admins: list[User],
    end_date: date,
    daily: dict[tuple[date, str, int], dict[str, Decimal]],
) -> list[RescueRegistration]:
    points_by_province: dict[str, list[RescuePoint]] = defaultdict(list)
    for point in rescue_points:
        points_by_province[point.province].append(point)
    registrations: list[RescueRegistration] = []
    rid = 1
    candidates = []
    for batch in batches:
        crop = crops_by_id[batch.crop_id]
        price_ratio = float(batch.unit_price) / crop.base_price
        unsold_ratio = float(batch.current_quantity / batch.initial_quantity) if batch.initial_quantity > 0 else 0
        days_to_expiry = (batch.expiry_date - end_date).days
        rescue_score = unsold_ratio * 0.55 + max(0, 1.0 - price_ratio) * 0.45
        if days_to_expiry <= 5:
            rescue_score += 0.25
        if rescue_score > 0.35:
            candidates.append((batch, rescue_score))
    candidates.sort(key=lambda item: item[1], reverse=True)

    for batch, score in candidates[:900]:
        points = points_by_province.get(batch.province) or rescue_points
        submitted_day = max(batch.harvest_date, min(end_date, batch.expiry_date) - timedelta(days=rng.randrange(1, 5)))
        submitted_at = random_datetime(rng, submitted_day, 8, 19)
        if score > 0.7:
            status = weighted_choice(rng, [("APPROVED", 0.78), ("PENDING", 0.15), ("REJECTED", 0.07)])
        else:
            status = weighted_choice(rng, [("APPROVED", 0.55), ("PENDING", 0.25), ("REJECTED", 0.20)])
        approved_at = submitted_at + timedelta(hours=rng.randrange(4, 48)) if status != "PENDING" else None
        approved_by = rng.choice(admins).id if status != "PENDING" else None
        point = rng.choice(points)
        registrations.append(RescueRegistration(rid, batch.id, point.id, approved_by, status, submitted_at, approved_at))
        daily[(submitted_day, batch.province, batch.crop_id)]["rescue_registrations"] += Decimal(1)
        rid += 1
    return registrations


def copy_escape(value: Any) -> str:
    if value is None:
        return r"\N"
    if isinstance(value, Decimal):
        return f"{value:.2f}"
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, date):
        return value.isoformat()
    text = str(value)
    return text.replace("\\", "\\\\").replace("\t", "\\t").replace("\n", "\\n").replace("\r", "\\r")


def write_copy(handle, table: str, columns: list[str], rows: list[Any], row_fn: Callable[[Any], list[Any]]) -> None:
    handle.write(f"COPY {table} ({', '.join(columns)}) FROM stdin WITH (FORMAT text);\n")
    for row in rows:
        handle.write("\t".join(copy_escape(v) for v in row_fn(row)) + "\n")
    handle.write("\\.\n\n")


def write_sql(
    path: Path,
    users: list[User],
    crops: list[CropDef],
    batches: list[Batch],
    rescue_points: list[RescuePoint],
    registrations: list[RescueRegistration],
    orders: list[Order],
    items: list[OrderItem],
    locks: list[CropLock],
    shipments: list[Shipment],
    truncate: bool,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("-- Được tạo tự động bởi lệnh ai/generate_synthetic_seed.py\n")
        handle.write("-- Mật khẩu cho các người dùng được tạo trùng khớp với chuỗi băm (hash) demo dùng trong V2__insert_users.sql.\n")
        handle.write("BEGIN;\n\n")
        if truncate:
            handle.write(
                "TRUNCATE TABLE shipments, crop_locks, order_items, orders, rescue_registrations, "
                "rescue_points, crop_batches, crops, users RESTART IDENTITY CASCADE;\n\n"
            )

        write_copy(handle, "users", ["id", "full_name", "email", "password_hash", "phone", "role", "status", "created_at", "updated_at"], users,
                   lambda u: [u.id, u.full_name, u.email, PASSWORD_HASH, u.phone, u.role, u.status, "2025-01-01 00:00:00", "2026-07-04 00:00:00"])
        write_copy(handle, "crops", ["id", "name", "description", "storage_days", "default_unit", "created_at", "updated_at"], crops,
                   lambda c: [c.id, c.name, c.description, c.storage_days, c.unit, "2025-01-01 00:00:00", "2026-07-04 00:00:00"])
        write_copy(handle, "crop_batches", ["id", "crop_id", "farmer_id", "initial_quantity", "current_quantity", "unit_price", "unit", "harvest_date", "expiry_date", "province", "district", "ward", "address_detail", "status", "created_at", "updated_at"], batches,
                   lambda b: [b.id, b.crop_id, b.farmer_id, b.initial_quantity, b.current_quantity, b.unit_price, b.unit, b.harvest_date, b.expiry_date, b.province, b.district, b.ward, b.address_detail, b.status, b.created_at, b.updated_at])
        write_copy(handle, "rescue_points", ["id", "name", "province", "address_detail", "status", "created_at", "updated_at", "district", "ward"], rescue_points,
                   lambda p: [p.id, p.name, p.province, p.address_detail, p.status, p.created_at, p.updated_at, p.district, p.ward])
        write_copy(handle, "rescue_registrations", ["id", "batch_id", "rescue_point_id", "approved_by", "status", "submitted_at", "approved_at"], registrations,
                   lambda r: [r.id, r.batch_id, r.rescue_point_id, r.approved_by, r.status, r.submitted_at, r.approved_at])
        write_copy(handle, "orders", ["id", "buyer_id", "total_amount", "status", "order_date", "created_at"], orders,
                   lambda o: [o.id, o.buyer_id, o.total_amount, o.status, o.order_date, o.created_at])
        write_copy(handle, "order_items", ["id", "order_id", "batch_id", "quantity", "unit_price", "subtotal"], items,
                   lambda i: [i.id, i.order_id, i.batch_id, i.quantity, i.unit_price, i.subtotal])
        write_copy(handle, "crop_locks", ["id", "batch_id", "buyer_id", "quantity", "status", "locked_at", "expired_at"], locks,
                   lambda l: [l.id, l.batch_id, l.buyer_id, l.quantity, l.status, l.locked_at, l.expired_at])
        write_copy(handle, "shipments", ["id", "order_id", "logistics_user_id", "pickup_address", "delivery_address", "status", "shipped_at", "delivered_at"], shipments,
                   lambda s: [s.id, s.order_id, s.logistics_user_id, s.pickup_address, s.delivery_address, s.status, s.shipped_at, s.delivered_at])

        for table in ["users", "crops", "crop_batches", "rescue_points", "rescue_registrations", "orders", "order_items", "crop_locks", "shipments"]:
            handle.write(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}), 1), true);\n")
        handle.write("\nCOMMIT;\n")


def write_daily_stats(path: Path, daily: dict[tuple[date, str, int], dict[str, Decimal]], crops_by_id: dict[int, CropDef], start_date: date, end_date: date, provinces: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow([
            "date", "province", "crop_id", "crop_name", "harvest_kg", "demand_kg",
            "orders_count", "rescue_registrations", "expired_kg", "average_price",
        ])
        day = start_date
        while day <= end_date:
            for province in provinces:
                for crop_id, crop in crops_by_id.items():
                    row = daily.get((day, province, crop_id), {})
                    price_count = row.get("price_count", Decimal(0))
                    avg_price = q2(row.get("price_sum", Decimal(0)) / price_count) if price_count else Decimal(0)
                    writer.writerow([
                        day.isoformat(),
                        province,
                        crop_id,
                        crop.name,
                        q2(row.get("harvest_kg", Decimal(0))),
                        q2(row.get("demand_kg", Decimal(0))),
                        int(row.get("orders_count", Decimal(0))),
                        int(row.get("rescue_registrations", Decimal(0))),
                        q2(row.get("expired_kg", Decimal(0))),
                        avg_price,
                    ])
            day += timedelta(days=1)


def build_dataset(args: argparse.Namespace) -> None:
    rng = random.Random(args.seed)
    end_date = date.fromisoformat(args.end_date)
    start_date = end_date - timedelta(days=364)
    csv_path = Path(args.source_csv)
    production = parse_production_csv(csv_path)
    crops = make_crops()
    all_provinces = sorted(set(DEFAULT_PROVINCE_WEIGHTS) | {province for weights in production.values() for province in weights})
    users, by_role = make_users(rng, all_provinces)
    rescue_points = make_rescue_points(rng, all_provinces, end_date)
    batches, daily = make_batches(rng, crops, by_role["FARMER"], production, start_date, end_date)
    orders, order_items, locks, shipments = make_orders_and_locks(
        rng, crops, batches, by_role["BUYER"], by_role["LOGISTICS"], start_date, end_date, daily
    )
    registrations = make_rescue_registrations(
        rng, batches, {crop.id: crop for crop in crops}, rescue_points, by_role["ADMIN"], end_date, daily
    )

    write_sql(
        Path(args.output_sql),
        users,
        crops,
        batches,
        rescue_points,
        registrations,
        orders,
        order_items,
        locks,
        shipments,
        truncate=not args.no_truncate,
    )
    write_daily_stats(Path(args.daily_stats_csv), daily, {crop.id: crop for crop in crops}, start_date, end_date, all_provinces)

    print(f"Đã ghi dữ liệu ra file: {args.output_sql}")
    print(f"Đã ghi số liệu thống kê ra file: {args.daily_stats_csv}")
    print(
        "Tổng quan số dòng: "
        f"users={len(users)}, crops={len(crops)}, batches={len(batches)}, "
        f"orders={len(orders)}, order_items={len(order_items)}, shipments={len(shipments)}, "
        f"locks={len(locks)}, rescue_points={len(rescue_points)}, registrations={len(registrations)}"
    )


def parse_args() -> argparse.Namespace:
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Tạo dữ liệu lặp lại được (synthetic seed data) cho AgriConnect.")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--end-date", default=DEFAULT_END_DATE.isoformat(), help="Ngày kết thúc (bao gồm) cho 12 tháng lịch sử.")
    parser.add_argument("--source-csv", default=str(root / "data.csv"))
    parser.add_argument("--output-sql", default=str(root / "output" / "agriconnect_synthetic_seed.sql"))
    parser.add_argument("--daily-stats-csv", default=str(root / "output" / "daily_province_crop_stats.csv"))
    parser.add_argument("--no-truncate", action="store_true", help="Không chạy lệnh TRUNCATE/RESTART IDENTITY trước khi chèn lệnh INSERT.")
    return parser.parse_args()


if __name__ == "__main__":
    build_dataset(parse_args())
