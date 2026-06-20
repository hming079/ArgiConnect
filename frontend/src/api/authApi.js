import axiosClient from "./axiosClient";

export const login = async (data) => {
  const res = await axiosClient.post("/auth/login", data);
  return res.data;
};

export const register = async (data) => {
  const res = await axiosClient.post("/auth/register", data);
  return res.data;
};