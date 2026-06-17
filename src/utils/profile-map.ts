import type { UserProfile } from "@/store/auth-store";

/** Shape of `GET /users/me` (Prisma user + profile + matrimonial). */
export type MeResponse = {
  id: string;
  email: string;
  profile: {
    fullName: string;
    city: string;
    bio: string | null;
    avatarUrl: string | null;
  } | null;
  matrimonial: {
    age: number;
    sect: string | null;
    profession: string | null;
    education: string | null;
    maritalStatus: string | null;
    incomeRange: string | null;
    aboutFamily: string | null;
  } | null;
};

export function mapUserMeToProfile(data: MeResponse | null | undefined): UserProfile | undefined {
  if (!data?.profile) {
    return undefined;
  }
  const p = data.profile;
  const m = data.matrimonial;
  return {
    fullName: p.fullName,
    city: p.city,
    bio: p.bio ?? undefined,
    profilePhotoUrl: p.avatarUrl ?? undefined,
    age: m != null && m.age != null ? String(m.age) : undefined,
    sect: m?.sect ?? undefined,
    profession: m?.profession ?? undefined,
    education: m?.education ?? undefined,
    maritalStatus: m?.maritalStatus ?? undefined,
    monthlyIncome: m?.incomeRange ?? undefined,
    fatherName: m?.aboutFamily ?? undefined
  };
}
