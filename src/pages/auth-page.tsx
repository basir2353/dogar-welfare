import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { publicApi } from "@/utils/api";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import { mapUserMeToProfile } from "@/utils/profile-map";
import { authReturnPath } from "@/hooks/use-auth-redirect";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [form, setForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    fullName: "",
    city: ""
  });
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const browseWithoutAccount = useTranslate(UI.browseWithoutAccount);

  useEffect(() => {
    const signupMode = (location.state as { mode?: string } | null)?.mode;
    if (signupMode === "signup") {
      setMode("signup");
    }
  }, [location.state]);

  const afterAuthPath = () => authReturnPath(location.state);

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
      if (data.success) {
        setSession(data.data);
        try {
          const me = await publicApi.get("/users/me", {
            headers: {
              Authorization: `Bearer ${data.data.accessToken}`
            }
          });
          if (me.data.success && me.data.data) {
            const mapped = mapUserMeToProfile(me.data.data);
            if (mapped) {
              setProfile(mapped);
            }
            if (mapped?.fullName?.trim() && mapped?.city?.trim()) {
              navigate(afterAuthPath(), { replace: true });
            } else {
              navigate("/profile/setup", { replace: true });
            }
            return;
          }
        } catch {
          // If profile fetch fails, setup flow will collect it.
        }
        navigate("/profile/setup", { replace: true });
        return;
      } else {
        setError("Login failed.");
      }
    } catch (error) {
      const backendMessage =
        (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setError(backendMessage ?? "Unable to login. Please check backend/API.");
    } finally {
      setLoading(false);
    }
  };

  const signup = async () => {
    if (!signupForm.fullName.trim() || !signupForm.city.trim() || !signupForm.email.trim() || !signupForm.password) {
      setError("All signup fields are required.");
      return;
    }
    if (signupForm.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await publicApi.post("/auth/register", signupForm);
      if (data.success) {
        setSession(data.data);
        setProfile({ fullName: signupForm.fullName, city: signupForm.city });
      } else {
        setError("Signup failed.");
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      const backendMessage = axiosError?.response?.data?.error?.message;

      // If user already exists, auto-login with entered credentials.
      if (axiosError?.response?.status === 409) {
        try {
          const loginRes = await publicApi.post("/auth/login", {
            email: signupForm.email,
            password: signupForm.password
          });
          if (loginRes.data.success) {
            setSession(loginRes.data.data);
            setProfile({ fullName: signupForm.fullName, city: signupForm.city });
            return;
          }
        } catch {
          // Fall through to normal error handling below.
        }
      }

      setError(backendMessage ?? "Unable to signup. Please check backend/API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname !== "/auth") {
      return;
    }
    if (!user) {
      return;
    }
    if (user.role === "SUPER_ADMIN") {
      navigate("/system-admin", { replace: true });
      return;
    }
    if (["ADMIN", "MODERATOR"].includes(user.role)) {
      navigate("/admin", { replace: true });
      return;
    }
    if (profile?.fullName?.trim() && profile?.city?.trim()) {
      navigate(afterAuthPath(), { replace: true });
    } else {
      navigate("/profile/setup", { replace: true });
    }
  }, [user, profile, navigate, location.pathname, location.state]);

  return (
    <div className="mx-auto max-w-lg py-20">
      <Card className="glass">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Member access</p>
        <h1 className="mt-3 text-3xl font-bold">{mode === "login" ? "Sign in" : "Sign up & create your profile"}</h1>
        <p className="mt-2 text-sm text-subtle">
          Sign in is optional for browsing. Use an account when you want to donate, post, chat, or send rishta interest.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant={mode === "login" ? "primary" : "outline"} onClick={() => setMode("login")}>Login</Button>
          <Button variant={mode === "signup" ? "primary" : "outline"} onClick={() => setMode("signup")}>Sign Up</Button>
        </div>
        {mode === "login" ? (
          <div className="mt-5 space-y-3">
            <Input value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} placeholder="Your email" />
            <Input type="password" value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} placeholder="Password" />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <Input value={signupForm.fullName} onChange={(e) => setSignupForm((v) => ({ ...v, fullName: e.target.value }))} placeholder="Full name" />
            <Input value={signupForm.city} onChange={(e) => setSignupForm((v) => ({ ...v, city: e.target.value }))} placeholder="City" />
            <Input value={signupForm.email} onChange={(e) => setSignupForm((v) => ({ ...v, email: e.target.value }))} placeholder="Email" />
            <Input type="password" value={signupForm.password} onChange={(e) => setSignupForm((v) => ({ ...v, password: e.target.value }))} placeholder="Password" />
          </div>
        )}
        {error ? <p className="mt-4 text-sm text-amber-300">{error}</p> : null}
        <Button onClick={mode === "login" ? login : signup} disabled={loading} className="mt-5 w-full">
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Sign up & continue"}
        </Button>
        <p className="mt-5 text-center text-sm text-faint">
          <Link to="/" className="text-amber-200/90 underline-offset-2 hover:underline">
            {browseWithoutAccount}
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-faint">
          Admin or moderator?{" "}
          <Link to="/auth/admin" className="text-amber-200/90 underline-offset-2 hover:underline">
            Staff sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
