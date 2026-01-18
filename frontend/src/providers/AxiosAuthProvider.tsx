// AxiosAuthProvider.tsx
import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";

export function AxiosAuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    const interceptor = apiClient.interceptors.request.use(async (config) => {
      if (!isSignedIn) return config;

      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    return () => apiClient.interceptors.request.eject(interceptor);
  }, [getToken, isSignedIn]);

  if (!isLoaded) {
    return <>loading...</>; // or a loading spinner
  }

  return <>{children}</>;
}
