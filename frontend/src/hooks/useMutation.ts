import { useState } from "react";
import client from "../api/client";

type Method = "post" | "put" | "patch" | "delete";

export function useMutation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (method: Method, url: string, data?: any) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await client.request<T>({ method, url, data });
      return resp.data;
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Erreur");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
