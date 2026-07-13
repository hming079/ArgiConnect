import axiosClient from "./axiosClient";
import { normalizePage, unwrapPage, type PageParams, type PageResponse } from "./pagination";

export type RescueRegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface RescueRegistration { id: number; batchId: number; rescuePointId: number; approvedBy: number | null; status: RescueRegistrationStatus; submittedAt: string | null; approvedAt: string | null; }
export type RescueRegistrationInput = Pick<RescueRegistration, "batchId" | "rescuePointId">;
export interface RescueRegistrationFilters { batchId?: number; rescuePointId?: number; status?: RescueRegistrationStatus; cropId?: number; farmerName?: string; quantitySort?: "ASC" | "DESC"; }

export async function getRescueRegistrations(filters?: RescueRegistrationFilters) { return unwrapPage((await axiosClient.get<RescueRegistration[] | PageResponse<RescueRegistration>>("/rescue-registrations", { params: { ...filters, size: 100 } })).data); }
export async function getRescueRegistrationsPage(filters?: RescueRegistrationFilters, pagination?: PageParams) {
  const page = pagination?.page ?? 0;
  const size = pagination?.size ?? 20;
  return normalizePage((await axiosClient.get<RescueRegistration[] | PageResponse<RescueRegistration>>("/rescue-registrations", { params: { ...filters, page, size } })).data, page, size);
}
export async function getMyRescueRegistrations() { return unwrapPage((await axiosClient.get<RescueRegistration[] | PageResponse<RescueRegistration>>("/rescue-registrations/my", { params: { size: 100 } })).data); }
export async function getMyRescueRegistrationsPage(pagination?: PageParams) {
  const page = pagination?.page ?? 0;
  const size = pagination?.size ?? 20;
  return normalizePage((await axiosClient.get<RescueRegistration[] | PageResponse<RescueRegistration>>("/rescue-registrations/my", { params: { page, size } })).data, page, size);
}
export async function getRescueRegistration(id: number) { return (await axiosClient.get<RescueRegistration>(`/rescue-registrations/${id}`)).data; }
export async function createRescueRegistration(data: RescueRegistrationInput) { return (await axiosClient.post<RescueRegistration>("/rescue-registrations", data)).data; }
export async function updateRescueRegistration(id: number, data: RescueRegistrationInput) { return (await axiosClient.put<RescueRegistration>(`/rescue-registrations/${id}`, data)).data; }
export async function updateMyRescueRegistration(id: number, rescuePointId: number) { return (await axiosClient.put<RescueRegistration>(`/rescue-registrations/my/${id}`, { rescuePointId })).data; }
export async function reviewRescueRegistration(id: number, decision: "approve" | "reject") { return (await axiosClient.patch<RescueRegistration>(`/rescue-registrations/${id}/${decision}`)).data; }
export async function deleteRescueRegistration(id: number) { await axiosClient.delete(`/rescue-registrations/${id}`); }
export async function deleteMyRescueRegistration(id: number) { await axiosClient.delete(`/rescue-registrations/my/${id}`); }
