import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { login as loginRequest } from "@/api/authApi";
import type { LoginRequest, LoginResponse } from "@/api/authApi";
import { notifyAuthChanged } from "@/lib/auth";

const DEFAULT_ERROR_MESSAGE = "Email hoặc mật khẩu chưa đúng. Vui lòng thử lại.";

function getLoginErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return DEFAULT_ERROR_MESSAGE;

  const responseMessage = error.response?.data;
  return typeof responseMessage === "string" && responseMessage.trim()
    ? responseMessage
    : DEFAULT_ERROR_MESSAGE;
}

export function useLogin() {
  const mutation = useMutation<LoginResponse, unknown, LoginRequest>({
    mutationFn: (credentials) => loginRequest(credentials),
    onSuccess: ({ accessToken }) => {
      localStorage.setItem("token", accessToken);
      notifyAuthChanged();
    },
  });

  return {
    ...mutation,
    login: mutation.mutateAsync,
    errorMessage: mutation.error ? getLoginErrorMessage(mutation.error) : "",
  };
}
