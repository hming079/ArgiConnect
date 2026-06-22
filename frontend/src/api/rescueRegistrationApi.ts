import axiosClient from "./axiosClient";

export type RescueRegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface RescueRegistration { id: number; batchId: number; rescuePointId: number; approvedBy: number | null; status: RescueRegistrationStatus; submittedAt: string | null; approvedAt: string | null; }
export type RescueRegistrationInput = Pick<RescueRegistration, "batchId" | "rescuePointId" | "status">;
export interface RescueRegistrationFilters { batchId?: number; rescuePointId?: number; status?: RescueRegistrationStatus; }

export async function getRescueRegistrations(filters?: RescueRegistrationFilters) { return (await axiosClient.get<RescueRegistration[]>("/rescue-registrations", { params: filters })).data; }
export async function getMyRescueRegistrations() { return (await axiosClient.get<RescueRegistration[]>("/rescue-registrations/my")).data; }
export async function getRescueRegistration(id: number) { return (await axiosClient.get<RescueRegistration>(`/rescue-registrations/${id}`)).data; }
export async function createRescueRegistration(data: RescueRegistrationInput) { return (await axiosClient.post<RescueRegistration>("/rescue-registrations", data)).data; }
export async function updateRescueRegistration(id: number, data: RescueRegistrationInput) { return (await axiosClient.put<RescueRegistration>(`/rescue-registrations/${id}`, data)).data; }
export async function updateMyRescueRegistration(id: number, rescuePointId: number) { return (await axiosClient.put<RescueRegistration>(`/rescue-registrations/my/${id}`, { rescuePointId })).data; }
export async function reviewRescueRegistration(id: number, decision: "approve" | "reject") { return (await axiosClient.patch<RescueRegistration>(`/rescue-registrations/${id}/${decision}`)).data; }
export async function deleteRescueRegistration(id: number) { await axiosClient.delete(`/rescue-registrations/${id}`); }
export async function deleteMyRescueRegistration(id: number) { await axiosClient.delete(`/rescue-registrations/my/${id}`); }
