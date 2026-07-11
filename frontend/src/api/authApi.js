import axiosClient from "./axiosClient";

export const login = async (data) => {
  const res = await axiosClient.post("/auth/login", data);
  return res.data;
};

export const register = async (data) => {
  const res = await axiosClient.post("/auth/register", data);
  return res.data;
};

export const changePassword = async (data) => {
  const res = await axiosClient.post("/auth/change-password", data);
  return res.data;
};

export const forgotPassword = async (data) => {
  const res = await axiosClient.post("/auth/forgot-password", data);
  return res.data;
};

export const resetPassword = async (data) => {
  const res = await axiosClient.post("/auth/reset-password", data);
  return res.data;
};
