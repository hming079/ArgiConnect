import axiosClient from "./axiosClient";
import type { UserRole } from "@/lib/auth";

export type UserStatus = "ACTIVE" | "INACTIVE";
export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
}
export async function getUsers() {
  return (await axiosClient.get<UserProfile[]>("/users")).data;
}
export async function getMyProfile() {
  return (await axiosClient.get<UserProfile>("/users/me")).data;
}
export async function getVisibleBuyers() {
  return (await axiosClient.get<UserProfile[]>("/users/visible-buyers")).data;
}
export async function updateUserStatus(id: number, status: UserStatus) {
  return (await axiosClient.patch<UserProfile>(`/users/${id}/status`, undefined, { params: { status } })).data;
}
