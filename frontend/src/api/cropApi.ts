import axiosClient from "./axiosClient";
import { normalizePage, type PageParams, type PageResponse } from "./pagination";

export interface Crop {
  id: number;
  name: string;
  description: string | null;
  storageDays: number;
  defaultUnit: string;
}

export interface CropInput {
  name: string;
  description: string | null;
  storageDays: number;
  defaultUnit: string;
}

export type CropBatchStatus = "pending" | "available" | "sold_out" | "expired" | "cancelled";

export interface CropBatch {
  id: number;
  cropId: number;
  farmerId: number;
  farmerName: string;
  initialQuantity: number;
  currentQuantity: number;
  unitPrice: number;
  unit: string;
  harvestDate: string;
  expiryDate: string;
  province: string;
  district: string | null;
  ward: string | null;
  addressDetail: string | null;
  status: CropBatchStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export type CropBatchInput = Omit<
  CropBatch,
  "id" | "farmerId" | "farmerName" | "createdAt" | "updatedAt"
>;

export async function getCrops() {
  const response = await axiosClient.get<Crop[]>("/crops");
  return response.data;
}

export async function getCrop(id: number) {
  const response = await axiosClient.get<Crop>(`/crops/${id}`);
  return response.data;
}

export async function createCrop(data: CropInput) {
  const response = await axiosClient.post<Crop>("/crops", data);
  return response.data;
}

export async function updateCrop(id: number, data: CropInput) {
  const response = await axiosClient.put<Crop>(`/crops/${id}`, data);
  return response.data;
}

export async function deleteCrop(id: number) {
  await axiosClient.delete(`/crops/${id}`);
}

export interface CropBatchFilters {
  cropId?: number;
  farmerId?: number;
  status?: CropBatchStatus;
  province?: string;
  excludeExpired?: boolean;
}

export async function getCropBatches(cropId?: number, mine = false) {
  return getAllCropBatches(cropId !== undefined ? { cropId } : undefined, mine);
}

export async function getCropBatchesPage(filters?: CropBatchFilters, mine = false, pagination?: PageParams) {
  const page = pagination?.page ?? 0;
  const size = pagination?.size ?? 20;
  const response = await axiosClient.get<CropBatch[] | PageResponse<CropBatch>>(mine ? "/crop-batches/my" : "/crop-batches", {
    params: { ...filters, page, size },
  });
  return normalizePage(response.data, page, size);
}

async function getAllCropBatches(filters?: CropBatchFilters, mine = false) {
  const size = 100;
  const firstPage = await getCropBatchesPage(filters, mine, { page: 0, size });
  const batches = [...firstPage.content];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await getCropBatchesPage(filters, mine, { page, size });
    batches.push(...nextPage.content);
  }

  return batches;
}

export async function createCropBatch(data: CropBatchInput) {
  const response = await axiosClient.post<CropBatch>("/crop-batches", data);
  return response.data;
}

export async function updateCropBatch(id: number, data: CropBatchInput) {
  const response = await axiosClient.put<CropBatch>(`/crop-batches/${id}`, data);
  return response.data;
}

export async function deleteCropBatch(id: number) {
  await axiosClient.delete(`/crop-batches/${id}`);
}
