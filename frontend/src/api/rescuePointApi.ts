import axiosClient from "./axiosClient";

export type RescuePointStatus = "ACTIVE" | "INACTIVE";

export interface RescuePoint {
  id: number;
  name: string;
  province: string;
  address: string;
  status: RescuePointStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export type RescuePointInput = Pick<RescuePoint, "name" | "province" | "address" | "status">;

export async function getRescuePoints() {
  const response = await axiosClient.get<RescuePoint[]>("/rescue-points");
  return response.data;
}

export async function createRescuePoint(data: RescuePointInput) {
  const response = await axiosClient.post<RescuePoint>("/rescue-points", data);
  return response.data;
}

export async function updateRescuePoint(id: number, data: RescuePointInput) {
  const response = await axiosClient.put<RescuePoint>(`/rescue-points/${id}`, data);
  return response.data;
}

export async function deleteRescuePoint(id: number) {
  await axiosClient.delete(`/rescue-points/${id}`);
}
