import axiosClient from "./axiosClient";
import type { UserRole } from "@/lib/auth";

export type UserStatus = "ACTIVE" | "INACTIVE";
export interface UserProfile { id: number; fullName: string; email: string; phone: string | null; role: UserRole; status: UserStatus; }
export async function getMyProfile() { return (await axiosClient.get<UserProfile>("/users/me")).data; }
