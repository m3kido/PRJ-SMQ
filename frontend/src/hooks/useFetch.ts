import { useCallback, useEffect, useState } from "react";
import client from "../api/client";

export function useFetch<T>(path: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    client
      .get(path)
      .then((resp) => {
        if (!active) return;
        setData(resp.data);
        setError(null);
      })
      .catch((e) => {
        if (!active) return;
        setError(e?.message ?? "Erreur de chargement");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, version, ...deps]);

  return { data, loading, error, refetch };
}
