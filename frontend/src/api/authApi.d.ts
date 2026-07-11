export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export function login(data: LoginRequest): Promise<LoginResponse>;
export interface RegisterRequest { fullName: string; email: string; password: string; role: "FARMER" | "BUYER"; }
export interface ForgotPasswordResponse { message: string; resetToken: string | null; }
export function register(data: RegisterRequest): Promise<string>;
export function changePassword(data: { currentPassword: string; newPassword: string }): Promise<string>;
export function forgotPassword(data: { email: string }): Promise<ForgotPasswordResponse>;
export function resetPassword(data: { token: string; newPassword: string }): Promise<string>;
