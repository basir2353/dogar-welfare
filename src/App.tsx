import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { useEffect } from "react";
import { isAxiosError } from "axios";
import { AppShell } from "@/components/layouts/app-shell";
import { AdminShell } from "@/components/layouts/admin-shell";
import { AuthPersistGate } from "@/components/auth-persist-gate";
import { mapUserMeToProfile } from "@/utils/profile-map";
import { LandingPage } from "@/pages/landing-page";
import { MatrimonialPage } from "@/pages/matrimonial-page";
import { MatrimonialProfilePage } from "@/pages/matrimonial-profile-page";
import { CommunityPage } from "@/pages/community-page";
import { DonationsPage } from "@/pages/donations-page";
import { ChatPage } from "@/pages/chat-page";
import { AdminDashboardPage } from "@/pages/admin/admin-dashboard-page";
import { AdminCampaignsPage } from "@/pages/admin/admin-campaigns-page";
import { AdminModerationPage } from "@/pages/admin/admin-moderation-page";
import { AdminMembersPage } from "@/pages/admin/admin-members-page";
import { AdminCommunityPage } from "@/pages/admin/admin-community-page";
import { AdminProfileOptionsPage } from "@/pages/admin/admin-profile-options-page";
import { AdminLandingPage } from "@/pages/admin/admin-landing-page";
import { SystemAdminPage } from "@/pages/system-admin-page";
import { AboutPage } from "@/pages/about-page";
import { AdminAboutPage } from "@/pages/admin-about-page";
import { AuthPage } from "@/pages/auth-page";
import { AdminAuthPage } from "@/pages/admin-auth-page";
import { ProfileSetupPage } from "@/pages/profile-setup-page";
import { MyProfilePage } from "@/pages/my-profile-page";
import { useAuthStore } from "@/store/auth-store";
import { setAuthToken } from "@/utils/api";
import { api } from "@/utils/api";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) {
    const needStaffLogin =
      location.pathname.startsWith("/admin") || location.pathname.startsWith("/system-admin");
    return <Navigate to={needStaffLogin ? "/auth/admin" : "/auth"} replace state={{ from: location }} />;
  }
  return children;
}

function ProfileCompletedRoute({ children }: { children: ReactElement }) {
  const role = useAuthStore((s) => s.user?.role);
  const profile = useAuthStore((s) => s.profile);
  const bypassProfile = role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR";
  if (bypassProfile) {
    return children;
  }
  if (!profile?.fullName || !profile?.city) {
    return <Navigate to="/profile/setup" replace />;
  }
  return children;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const user = useAuthStore((s) => s.user);
  const allowed = ["ADMIN", "MODERATOR", "SUPER_ADMIN"].includes(user?.role ?? "");
  if (!allowed) {
    return <Navigate to="/auth/admin" replace />;
  }
  return children;
}

function SystemAdminRoute({ children }: { children: ReactElement }) {
  const user = useAuthStore((s) => s.user);
  const allowed = user?.role === "SUPER_ADMIN";
  if (!allowed) {
    return <Navigate to="/auth/admin" replace />;
  }
  return children;
}

function App() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setProfile = useAuthStore((s) => s.setProfile);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    setAuthToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    const syncProfile = async () => {
      if (!accessToken) return;
      try {
        const { data } = await api.get("/users/me");
        if (data.success && data.data) {
          const mapped = mapUserMeToProfile(data.data);
          if (mapped) {
            setProfile(mapped);
          }
        }
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 401) {
          clearSession();
          return;
        }
      }
    };
    void syncProfile();
  }, [accessToken, setProfile, clearSession]);

  return (
    <BrowserRouter>
      <AuthPersistGate>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/admin" element={<AdminAuthPage />} />
        <Route path="/profile/setup" element={<ProtectedRoute><ProfileSetupPage /></ProtectedRoute>} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<LandingPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="donations" element={<DonationsPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="matrimonial" element={<MatrimonialPage />} />
          <Route path="matrimonial/:userId" element={<MatrimonialProfilePage />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfileCompletedRoute>
                  <MyProfilePage />
                </ProfileCompletedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="chat"
            element={
              <ProtectedRoute>
                <ProfileCompletedRoute>
                  <ChatPage />
                </ProfileCompletedRoute>
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <ProfileCompletedRoute>
                <AdminRoute>
                  <AdminShell />
                </AdminRoute>
              </ProfileCompletedRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="campaigns" element={<AdminCampaignsPage />} />
          <Route path="moderation" element={<AdminModerationPage />} />
          <Route path="members" element={<AdminMembersPage />} />
          <Route path="community" element={<AdminCommunityPage />} />
          <Route path="profile-options" element={<AdminProfileOptionsPage />} />
          <Route path="landing" element={<AdminLandingPage />} />
          <Route path="about" element={<AdminAboutPage />} />
        </Route>
        <Route
          path="/system-admin"
          element={
            <ProtectedRoute>
              <ProfileCompletedRoute>
                <SystemAdminRoute>
                  <AdminShell />
                </SystemAdminRoute>
              </ProfileCompletedRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<SystemAdminPage />} />
        </Route>
      </Routes>
      </AuthPersistGate>
    </BrowserRouter>
  );
}

export default App;
