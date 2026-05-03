import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8500/api";

const client = axios.create({
  baseURL: API_BASE,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refreshToken");
      if (!refresh) throw error;
      try {
        const resp = await client.post("/auth/token/refresh/", { refresh });
        const newAccess = resp.data.access;
        localStorage.setItem("accessToken", newAccess);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return client(original);
      } catch (e) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        throw e;
      }
    }
    throw error;
  }
);

export default client;
