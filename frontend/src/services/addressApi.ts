const BASE_URL = "https://provinces.open-api.vn/api/v2";
const PROVINCES_CACHE_KEY = "agriconnect-address-provinces-v2";
const WARDS_CACHE_PREFIX = "agriconnect-address-wards-v2:";

export interface VietnamProvince {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
}

export interface VietnamWard {
  code: number;
  name: string;
  codename: string;
  division_type: string;
}

interface ProvinceWithWards extends VietnamProvince {
  wards?: VietnamWard[];
}

let provincesMemory: VietnamProvince[] | null = null;
const wardsMemory = new Map<number, VietnamWard[]>();

export async function getVietnamProvinces() {
  if (provincesMemory) return provincesMemory;

  const cached = readCache<VietnamProvince[]>(PROVINCES_CACHE_KEY);
  if (cached) {
    provincesMemory = cached;
    return cached;
  }

  const response = await fetch(`${BASE_URL}/`);
  if (!response.ok) throw new Error("Cannot load Vietnam provinces.");
  const data = (await response.json()) as ProvinceWithWards[];
  const provinces = data.map(({ wards: _wards, ...province }) => province);
  provincesMemory = provinces;
  writeCache(PROVINCES_CACHE_KEY, provinces);
  return provinces;
}

export async function getVietnamWards(provinceCode: number) {
  const cachedMemory = wardsMemory.get(provinceCode);
  if (cachedMemory) return cachedMemory;

  const cacheKey = `${WARDS_CACHE_PREFIX}${provinceCode}`;
  const cached = readCache<VietnamWard[]>(cacheKey);
  if (cached) {
    wardsMemory.set(provinceCode, cached);
    return cached;
  }

  const response = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
  if (!response.ok) throw new Error("Cannot load Vietnam wards.");
  const data = (await response.json()) as ProvinceWithWards;
  const wards = data.wards ?? [];
  wardsMemory.set(provinceCode, wards);
  writeCache(cacheKey, wards);
  return wards;
}

function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Memory cache still covers this session if localStorage is unavailable.
  }
}
