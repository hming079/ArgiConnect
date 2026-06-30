import axiosClient from "./axiosClient";

export type CropLockStatus = "ACTIVE" | "EXPIRED" | "CONVERTED";
export interface CropLock { id: number; batchId: number; buyerId: number; quantity: number; status: CropLockStatus; lockedAt: string | null; expiredAt: string; }
export type CropLockInput = Pick<CropLock, "batchId" | "quantity" | "expiredAt"> & { status?: CropLockStatus; buyerId?: number };
export interface CropLockFilters { batchId?: number; buyerId?: number; status?: CropLockStatus; }

export async function getCropLocks(filters?: CropLockFilters) { return (await axiosClient.get<CropLock[]>("/crop-locks", { params: filters })).data; }
export async function getCropLock(id: number) { return (await axiosClient.get<CropLock>(`/crop-locks/${id}`)).data; }
export async function createCropLock(data: CropLockInput) { return (await axiosClient.post<CropLock>("/crop-locks", data)).data; }
export async function updateCropLock(id: number, data: CropLockInput) { return (await axiosClient.put<CropLock>(`/crop-locks/${id}`, data)).data; }
export async function deleteCropLock(id: number) { await axiosClient.delete(`/crop-locks/${id}`); }
