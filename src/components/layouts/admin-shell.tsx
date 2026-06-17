import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ExternalLink,
  Shield,
  LogOut,
  Home,
  Megaphone,
  UserCheck,
  UsersRound,
  MessagesSquare,
  Tags,
  Sparkles,
  Search
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useMemo } from "react";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-primary text-on-primary shadow-md shadow-primary/25"
      : "text-foreground/75 hover:bg-muted/15 hover:text-foreground"
  );

const pillClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
    isActive ? "border-primary bg-primary text-on-primary" : "border-border bg-card text-subtle"
  );

const sectionTitle = (path: string): string => {
  if (path === "/admin" || path === "/admin/") return "Dashboard";
  if (path.startsWith("/admin/campaigns")) return "Campaigns";
  if (path.startsWith("/admin/moderation")) return "Moderation";
  if (path.startsWith("/admin/members")) return "Members";
  if (path.startsWith("/admin/community")) return "Community";
  if (path.startsWith("/admin/profile-options")) return "Biradri options";
  if (path.startsWith("/admin/landing")) return "Landing copy";
  if (path.startsWith("/admin/about")) return "About page";
  if (path.startsWith("/system-admin")) return "System admin";
  return "Admin";
};

export function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const clearSession = useAuthStore((s) => s.clearSession);
  const isSystem = location.pathname.startsWith("/system-admin");
  const canEditCms = role === "ADMIN" || role === "SUPER_ADMIN";
  const title = useMemo(() => sectionTitle(location.pathname), [location.pathname]);

  const logout = () => {
    clearSession();
    navigate("/auth/admin", { replace: true });
  };

  const NavItems = (
    <>
      <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">Overview</p>
      <NavLink to="/admin" end className={({ isActive }) => cn(linkClass({ isActive: isActive && !isSystem }))}>
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        Dashboard
      </NavLink>
      <p className="mt-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">Operations</p>
      <NavLink to="/admin/campaigns" className={linkClass}>
        <Megaphone className="h-4 w-4 shrink-0" />
        Campaigns
      </NavLink>
      <NavLink to="/admin/moderation" className={linkClass}>
        <UserCheck className="h-4 w-4 shrink-0" />
        Moderation
      </NavLink>
      <NavLink to="/admin/members" className={linkClass}>
        <UsersRound className="h-4 w-4 shrink-0" />
        Members
      </NavLink>
      <NavLink to="/admin/community" className={linkClass}>
        <MessagesSquare className="h-4 w-4 shrink-0" />
        Community
      </NavLink>
      {canEditCms ? (
        <>
          <p className="mt-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">Site content</p>
          <NavLink to="/admin/profile-options" className={linkClass}>
            <Tags className="h-4 w-4 shrink-0" />
            Biradri options
          </NavLink>
          <NavLink to="/admin/landing" className={linkClass}>
            <Sparkles className="h-4 w-4 shrink-0" />
            Landing copy
          </NavLink>
          <NavLink to="/admin/about" className={linkClass}>
            <FileText className="h-4 w-4 shrink-0" />
            About page
          </NavLink>
        </>
      ) : null}
      {role === "SUPER_ADMIN" ? (
        <>
          <p className="mt-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">System</p>
          <NavLink to="/system-admin" className={linkClass}>
            <Shield className="h-4 w-4 shrink-0" />
            System admin
          </NavLink>
        </>
      ) : null}
      <div className="mt-6 border-t border-border/60 pt-4">
        <a
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-faint transition-colors hover:bg-muted/10 hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Member site
        </a>
      </div>
    </>
  );

  const MobilePills = (
    <nav className="flex gap-2 overflow-x-auto pb-1 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <NavLink to="/admin" end className={({ isActive }) => cn(pillClass({ isActive: isActive && !isSystem }))}>
        Home
      </NavLink>
      <NavLink to="/admin/campaigns" className={pillClass}>
        Campaigns
      </NavLink>
      <NavLink to="/admin/moderation" className={pillClass}>
        Queue
      </NavLink>
      <NavLink to="/admin/members" className={pillClass}>
        Members
      </NavLink>
      <NavLink to="/admin/community" className={pillClass}>
        Posts
      </NavLink>
      {canEditCms ? (
        <>
          <NavLink to="/admin/profile-options" className={pillClass}>
            Biradri
          </NavLink>
          <NavLink to="/admin/landing" className={pillClass}>
            Landing
          </NavLink>
          <NavLink to="/admin/about" className={pillClass}>
            About
          </NavLink>
        </>
      ) : null}
      {role === "SUPER_ADMIN" ? (
        <NavLink to="/system-admin" className={pillClass}>
          System
        </NavLink>
      ) : null}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/[0.04]">
      <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col p-3 md:p-5">
        <div className="flex min-h-[calc(100dvh-1.5rem)] flex-1 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-card md:flex-row md:rounded-3xl">
          <aside className="hidden w-60 shrink-0 flex-col border-border/80 bg-card/50 md:flex md:border-r">
            <div className="border-b border-border/60 px-4 py-5">
              <Link to="/admin" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary">D</div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">Dogar Welfare</p>
                  <p className="text-sm font-bold text-foreground">Admin portal</p>
                </div>
              </Link>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-6 pt-2">{NavItems}</nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col bg-background/30">
            <header className="sticky top-0 z-10 border-b border-border/80 bg-card/85 px-4 py-3 backdrop-blur-md md:px-6 md:py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link to="/admin" className="mb-2 flex items-center gap-2 md:hidden">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-on-primary">D</div>
                    <span className="text-sm font-bold">Admin portal</span>
                  </Link>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">Admin</p>
                  <h2 className="truncate text-lg font-bold text-foreground md:text-xl">{title}</h2>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <div className="relative hidden min-w-[180px] sm:block md:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                    <input
                      readOnly
                      className="w-full rounded-xl border border-border/80 bg-background/60 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Search admin…"
                    />
                  </div>
                  <Link to="/" className="hidden lg:inline">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Home className="h-4 w-4" />
                      View site
                    </Button>
                  </Link>
                  <LanguageSwitcher />
                  <ThemeToggle />
                  <Button size="sm" variant="ghost" onClick={logout} className="gap-1 text-subtle">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              </div>
              <div className="mt-3 md:hidden">{MobilePills}</div>
            </header>
            <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
