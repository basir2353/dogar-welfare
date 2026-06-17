import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAuthToken } from "@/utils/api";

export type UserProfile = {
  fullName: string;
  city: string;
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  age?: string;
  maritalStatus?: string;
  childrenCount?: string;
  childrenDetails?: string;
  religion?: string;
  sect?: string;
  caste?: string;
  nationality?: string;
  motherTongue?: string;
  phone?: string;
  whatsapp?: string;
  emailContact?: string;
  address?: string;
  education?: string;
  profession?: string;
  monthlyIncome?: string;
  companyName?: string;
  height?: string;
  weight?: string;
  bloodGroup?: string;
  disability?: string;
  fatherName?: string;
  motherName?: string;
  familyType?: string;
  siblings?: string;
  preferredCity?: string;
  preferredAgeRange?: string;
  preferredProfession?: string;
  profilePhotoUrl?: string;
  hobbies?: string;
  languagesKnown?: string;
  smoking?: string;
  relocateWillingness?: string;
};

type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  user?: { userId: string; email: string; role: string };
  profile?: UserProfile;
  setSession: (session: AuthState["user"] & { accessToken: string; refreshToken: string }) => void;
  /** After POST /auth/refresh — updates tokens without replacing user. */
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setProfile: (profile: UserProfile) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      setSession: (session) => {
        setAuthToken(session.accessToken);
        set({
          user: { userId: session.userId, email: session.email, role: session.role },
          accessToken: session.accessToken,
          refreshToken: session.refreshToken
        });
      },
      setTokens: (tokens) => {
        setAuthToken(tokens.accessToken);
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      },
      setProfile: (profile) => {
        set({ profile });
      },
      clearSession: () => {
        setAuthToken(undefined);
        set({ user: undefined, accessToken: undefined, refreshToken: undefined, profile: undefined });
      }
    }),
    {
      name: "dogar-auth"
    }
  )
);
