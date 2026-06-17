import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { CircleUser, Search } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageSwitcher } from "../ui/language-switcher";
import { Footer } from "./footer";
import { useAuthStore } from "@/store/auth-store";
import { buttonVariants } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";
import { BrandLogoLink } from "@/components/brand/brand-logo-link";

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.user?.role);
  const profile = useAuthStore((s) => s.profile);
  const clearSession = useAuthStore((s) => s.clearSession);
  const appName = useTranslate(UI.appName);
  const searchPh = useTranslate(UI.searchPlaceholder);
  const viewProfile = useTranslate(UI.viewProfile);
  const completeProfile = useTranslate(UI.completeProfile);
  const logoutLabel = useTranslate(UI.logout);
  const signInLabel = useTranslate(UI.signIn);
  const signUpLabel = useTranslate(UI.signUp);
  const labelRishta = useTranslate(UI.navRishta);
  const labelCommunity = useTranslate(UI.navCommunity);
  const labelDonations = useTranslate(UI.navDonations);
  const labelChat = useTranslate(UI.navChat);
  const labelAbout = useTranslate(UI.navAbout);
  const labelContact = useTranslate(UI.navContact);
  const labelAdmin = useTranslate(UI.navAdmin);
  const labelSystemAdmin = useTranslate(UI.navSystemAdmin);
  const adminNavItem =
    role === "SUPER_ADMIN"
      ? { to: "/system-admin", label: labelSystemAdmin }
      : role && ["ADMIN", "MODERATOR"].includes(role)
        ? { to: "/admin", label: labelAdmin }
        : null;
  const nav = [
    { to: "/matrimonial", label: labelRishta },
    { to: "/community", label: labelCommunity },
    { to: "/donations", label: labelDonations },
    { to: "/chat", label: labelChat },
    { to: "/about", label: labelAbout },
    { to: "/contact", label: labelContact },
    ...(adminNavItem ? [adminNavItem] : [])
  ];
  const hideChrome = location.pathname.startsWith("/profile/setup") || location.pathname.startsWith("/auth");

  const logout = () => {
    const isStaff = role && ["ADMIN", "MODERATOR", "SUPER_ADMIN"].includes(role);
    clearSession();
    navigate(isStaff ? "/auth/admin" : "/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {!hideChrome ? (
        <header className="sticky top-0 z-30 border-b border-border/80 bg-card/90 shadow-sm backdrop-blur-md">
          <div className="container flex h-16 items-center gap-3">
            <BrandLogoLink title={appName} showTitle className="max-w-[min(100%,16rem)] shrink-0" />
            <div className="mx-auto hidden max-w-md flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 md:flex">
              <Search className="h-4 w-4 shrink-0 text-faint" />
              <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder={searchPh} />
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-2">
              <nav className="hidden gap-1 lg:gap-2 md:flex">
                {nav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "whitespace-nowrap rounded-xl px-2 py-2 text-sm transition-colors lg:px-3",
                      location.pathname.startsWith(item.to)
                        ? "bg-primary/12 text-primary dark:text-primary"
                        : "text-foreground/85 hover:bg-muted/25"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="flex shrink-0 items-center gap-1.5">
                <ThemeToggle />
                <LanguageSwitcher variant="icon" />
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-9 w-9 shrink-0 rounded-full p-0"
                      )}
                      aria-label={profile?.fullName && profile?.city ? viewProfile : completeProfile}
                    >
                      <CircleUser className="h-5 w-5" aria-hidden />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={profile?.fullName && profile?.city ? "/profile" : "/profile/setup"}>
                          {profile?.fullName && profile?.city ? viewProfile : completeProfile}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-secondary" onSelect={() => logout()}>
                        {logoutLabel}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      to="/auth"
                      state={{ from: location }}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "whitespace-nowrap")}
                    >
                      {signInLabel}
                    </Link>
                    <Link
                      to="/auth"
                      state={{ from: location, mode: "signup" }}
                      className={cn(buttonVariants({ variant: "primary", size: "sm" }), "whitespace-nowrap")}
                    >
                      {signUpLabel}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      ) : null}
      <main className="container py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!hideChrome ? <Footer /> : null}
    </div>
  );
}
