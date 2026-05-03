import { useState } from "react";
import client from "../api/client";

type Method = "post" | "put" | "patch" | "delete";

function formatError(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        const text = Array.isArray(messages) ? messages.join(", ") : String(messages);
        return `${field}: ${text}`;
      })
      .join(" | ");
  }
  return fallback;
}

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
      setError(formatError(e?.response?.data, e?.message ?? "Erreur"));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
