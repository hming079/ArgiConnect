export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export function login(data: LoginRequest): Promise<LoginResponse>;
export function register(data: unknown): Promise<unknown>;
