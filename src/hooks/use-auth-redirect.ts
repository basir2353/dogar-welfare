import { useNavigate, useLocation } from "react-router-dom";

/** Navigate to member sign-in, preserving the page the user came from. */
export function useAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  return () => navigate("/auth", { state: { from: location } });
}

/** After login, return to the page the user tried to visit, or home. */
export function authReturnPath(state: unknown): string {
  if (state && typeof state === "object" && "from" in state) {
    const from = (state as { from?: { pathname?: string; search?: string; hash?: string } }).from;
    if (from?.pathname && from.pathname !== "/auth" && from.pathname !== "/auth/admin") {
      return `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;
    }
  }
  return "/";
}
