import { createContext, ReactNode, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import client from "../api/client";

type LoadingContextValue = {
  activeRequests: number;
  isLoading: boolean;
};

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [activeRequests, setActiveRequests] = useState(0);
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const increment = () => setActiveRequests((count) => count + 1);
    const decrement = () => setActiveRequests((count) => Math.max(0, count - 1));

    const requestInterceptor = client.interceptors.request.use(
      (config) => {
        increment();
        return config;
      },
      (error) => {
        decrement();
        return Promise.reject(error);
      },
    );

    const responseInterceptor = client.interceptors.response.use(
      (response) => {
        decrement();
        return response;
      },
      (error) => {
        decrement();
        return Promise.reject(error);
      },
    );

    return () => {
      client.interceptors.request.eject(requestInterceptor);
      client.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    if (activeRequests <= 0) {
      setVisible(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(timer);
  }, [activeRequests]);

  const value = useMemo(() => ({
    activeRequests,
    isLoading: visible,
  }), [activeRequests, visible]);

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) throw new Error("useLoading must be used within LoadingProvider");
  return context;
}
