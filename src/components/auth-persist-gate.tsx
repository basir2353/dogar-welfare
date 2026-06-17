import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth-store";

/**
 * Zustand `persist` reads localStorage after the first paint. Without this gate,
 * `user` is briefly undefined and protected routes redirect to /auth even when
 * a session is stored.
 */
export function AuthPersistGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setReady(true);
    }
    return useAuthStore.persist.onFinishHydration(() => {
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-subtle">
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
