import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { publicApi } from "@/utils/api";
import { Link, useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";

const isStaffRole = (role: string) => ["ADMIN", "MODERATOR", "SUPER_ADMIN"].includes(role);

export function AdminAuthPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await publicApi.post("/auth/login", form);
      if (!data.success || !data.data) {
        setError("Login failed.");
        return;
      }
      const role = data.data.role as string;
      if (!isStaffRole(role)) {
        setError("This portal is for administrators and moderators only. Please use the member sign-in page.");
        return;
      }
      setSession(data.data);
      try {
        const me = await publicApi.get("/users/me", {
          headers: { Authorization: `Bearer ${data.data.accessToken}` }
        });
        if (me.data.success && me.data.data?.profile) {
          setProfile({
            fullName: me.data.data.profile.fullName,
            city: me.data.data.profile.city,
            bio: me.data.data.profile.bio ?? undefined
          });
        }
      } catch {
        // Optional profile
      }
      if (role === "SUPER_ADMIN") {
        navigate("/system-admin", { replace: true });
      } else {
        navigate("/admin", { replace: true });
      }
    } catch (err) {
      const backendMessage = (err as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setError(backendMessage ?? "Unable to sign in. Check the API and your credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (isStaffRole(user.role)) {
      if (user.role === "SUPER_ADMIN") {
        navigate("/system-admin", { replace: true });
      } else {
        navigate("/admin", { replace: true });
      }
    } else {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="mx-auto max-w-lg py-20">
      <Card className="glass border-amber-500/20">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/90">Staff only</p>
        <h1 className="mt-3 text-3xl font-bold">Admin &amp; moderator sign-in</h1>
        <p className="mt-2 text-sm text-subtle">
          Use the credentials issued to your organization. Member accounts have a separate sign-in.
        </p>
        <div className="mt-5 space-y-3">
          <Input
            value={form.email}
            onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
            placeholder="Your work email"
            autoComplete="username"
          />
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
            placeholder="Password"
            autoComplete="current-password"
          />
        </div>
        {error ? <p className="mt-4 text-sm text-amber-300">{error}</p> : null}
        <Button onClick={() => void login()} disabled={loading} className="mt-5 w-full">
          {loading ? "Signing in…" : "Sign in to dashboard"}
        </Button>
        <p className="mt-6 text-center text-sm text-faint">
          Not staff?{" "}
          <Link to="/auth" className="text-primary underline-offset-2 hover:underline">
            Member sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
