export type KpiPayload = {
  totalUsers: number;
  totalPosts: number;
  totalCampaigns: number;
  totalDonations: number;
  newContactMessages?: number;
  totalContactMessages?: number;
};

export type MatrimonialWithImages = {
  age?: number | null;
  sect?: string | null;
  profession?: string | null;
  education?: string | null;
  maritalStatus?: string | null;
  incomeRange?: string | null;
  aboutFamily?: string | null;
  heightCm?: number | null;
  images?: Array<{ id: string; url: string; sortOrder: number; isBanner: boolean }>;
};

export type ModerationItem = {
  id: string;
  fullName: string;
  city: string;
  bio?: string | null;
  createdAt?: string;
  user?: { email?: string; id?: string; role?: string; createdAt?: string };
  matrimonial?: MatrimonialWithImages | null;
};

export type AllMemberRow = ModerationItem & { verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED" };

export type AdminPost = {
  id: string;
  content: string;
  author?: { email?: string; profile?: { fullName?: string } };
};

export type LandingContent = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaFindRishta: string;
  ctaCommunity: string;
  ctaDonate: string;
  howItWorksTitle: string;
  howItWorksSteps: string[];
  featuredProfilesTitle: string;
  donationImpactTitle: string;
  communityPreviewTitle: string;
};
