import axiosClient from "./axiosClient";

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

export async function getCropBatches(cropId?: number, mine = false) {
  const response = await axiosClient.get<CropBatch[]>(mine ? "/crop-batches/my" : "/crop-batches", {
    params: !mine && cropId !== undefined ? { cropId } : undefined,
  });
  return mine && cropId !== undefined
    ? response.data.filter((batch) => batch.cropId === cropId)
    : response.data;
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
