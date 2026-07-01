import { useEffect, useMemo, useState } from "react";

import {
  getVietnamProvinces,
  getVietnamWards,
  type VietnamProvince,
  type VietnamWard,
} from "@/services/addressApi";

export interface VietnamAddressParts {
  detailAddress: string;
  provinceName: string;
  wardName: string;
  fullAddress: string;
}

interface VietnamAddressSelectProps {
  value: string;
  onChange: (value: string, parts: VietnamAddressParts) => void;
  initialProvinceName?: string | null;
  initialWardName?: string | null;
  required?: boolean;
}

export function VietnamAddressSelect({
  value,
  onChange,
  initialProvinceName,
  initialWardName,
  required,
}: VietnamAddressSelectProps) {
  const [provinces, setProvinces] = useState<VietnamProvince[]>([]);
  const [wards, setWards] = useState<VietnamWard[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [detailAddress, setDetailAddress] = useState(
    stripKnownAddressParts(value, initialWardName, initialProvinceName),
  );
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [error, setError] = useState("");

  const selectedProvince = useMemo(
    () => provinces.find((province) => String(province.code) === provinceCode),
    [provinceCode, provinces],
  );
  const selectedWard = useMemo(
    () => wards.find((ward) => String(ward.code) === wardCode),
    [wardCode, wards],
  );

  useEffect(() => {
    let alive = true;
    setLoadingProvinces(true);
    setError("");
    getVietnamProvinces()
      .then((items) => {
        if (!alive) return;
        setProvinces(items);
        if (initialProvinceName) {
          const matched = items.find((item) => item.name === initialProvinceName);
          if (matched) {
            setProvinceCode((current) => current || String(matched.code));
          }
        }
      })
      .catch(() => {
        if (alive) setError("Khong tai duoc danh sach tinh/thanh.");
      })
      .finally(() => {
        if (alive) setLoadingProvinces(false);
      });
    return () => {
      alive = false;
    };
  }, [initialProvinceName]);

  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      setWardCode("");
      return;
    }

    let alive = true;
    setLoadingWards(true);
    setError("");
    getVietnamWards(Number(provinceCode))
      .then((items) => {
        if (!alive) return;
        setWards(items);
        if (initialWardName) {
          const matched = items.find((item) => item.name === initialWardName);
          setWardCode(matched ? String(matched.code) : "");
        } else {
          setWardCode("");
        }
      })
      .catch(() => {
        if (alive) setError("Khong tai duoc danh sach phuong/xa.");
      })
      .finally(() => {
        if (alive) setLoadingWards(false);
      });
    return () => {
      alive = false;
    };
  }, [initialWardName, provinceCode]);

  function emit(next: {
    detailAddress?: string;
    province?: VietnamProvince | null;
    ward?: VietnamWard | null;
    fullAddress?: string;
  }) {
    const detail = next.detailAddress ?? detailAddress;
    const province = next.province === undefined ? selectedProvince : next.province;
    const ward = next.ward === undefined ? selectedWard : next.ward;
    const fullAddress =
      next.fullAddress ?? [detail.trim(), ward?.name, province?.name].filter(Boolean).join(", ");
    onChange(fullAddress, {
      detailAddress: detail,
      provinceName: province?.name ?? "",
      wardName: ward?.name ?? "",
      fullAddress,
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Tinh / thanh</span>
          <select
            required={required}
            value={provinceCode}
            disabled={loadingProvinces}
            onChange={(event) => {
              const code = event.target.value;
              const province = provinces.find((item) => String(item.code) === code) ?? null;
              setProvinceCode(code);
              setWardCode("");
              emit({ province, ward: null });
            }}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{loadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành"}</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Phường / xã</span>
          <select
            value={wardCode}
            disabled={!provinceCode || loadingWards}
            onChange={(event) => {
              const code = event.target.value;
              const ward = wards.find((item) => String(item.code) === code) ?? null;
              setWardCode(code);
              emit({ ward });
            }}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">
              {loadingWards ? "Dang tai..." : provinceCode ? "Chọn phường/xã" : "Chọn tỉnh trước"}
            </option>
            {wards.map((ward) => (
              <option key={ward.code} value={ward.code}>
                {ward.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-xs font-semibold text-muted-foreground">Địa chỉ chi tiết</span>
        <input
          value={detailAddress}
          onChange={(event) => {
            const detail = event.target.value;
            setDetailAddress(detail);
            emit({ detailAddress: detail });
          }}
          placeholder="Số nhà, tên đường..."
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-xs font-semibold text-muted-foreground">Địa chỉ đầy đủ</span>
        <input
          required={required}
          value={value}
          onChange={(event) =>
            emit({
              fullAddress: event.target.value,
            })
          }
          placeholder="Có thể sửa thủ công địa chỉ đầy đủ"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </label>
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

function stripKnownAddressParts(
  value: string,
  wardName?: string | null,
  provinceName?: string | null,
) {
  let detail = value.trim();
  for (const part of [provinceName, wardName]) {
    if (!part) continue;
    detail = detail.replace(new RegExp(`,?\\s*${escapeRegExp(part)}\\s*$`), "").trim();
  }
  return detail;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
