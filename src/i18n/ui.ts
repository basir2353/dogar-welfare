/**
 * English source copy for the translation API. Every string is passed through
 * `useTranslate` or `useTranslatedText` in components so Urdu/Punjabi (Shahmukhi) can render.
 */
export const UI = {
  appName: "Dogar Welfare",
  searchPlaceholder: "Search people, campaigns, posts...",
  viewProfile: "View Profile",
  completeProfile: "Complete Profile",
  logout: "Logout",
  navRishta: "Rishta",
  navCommunity: "Community",
  navDonations: "Donations",
  navChat: "Chat",
  navAbout: "About us",
  navContact: "Contact us",
  navAdmin: "Admin",
  navSystemAdmin: "System admin",
  signIn: "Sign in",
  signUp: "Sign up",
  browseWithoutAccount: "Continue browsing without an account",
  guestBrowseHint:
    "Browse campaigns, profiles, and community posts without signing in. Sign in only when you want to donate, post, chat, or send interest.",
  signInToAction: "Sign in to continue",
  signInToDonate: "Sign in to donate",
  signInToPost: "Sign in to create a post",
  signInToInterest: "Sign in to send interest or chat",
  signInOptional: "Optional — sign in when you need an account",

  footerOrg: "Dogar Welfare Organization",
  footerTagline: "Trusted families, stronger communities, verified welfare impact.",
  footerTrust: "Trust badges",
  footerTrustList: "Verified campaigns • Safe matchmaking • Moderated community",
  footerLegal: "Legal",
  footerLegalList: "Privacy policy • Terms • community guidelines",

  aboutLoading: "Loading…",
  aboutLoadError:
    "Could not load live About content from the server. Default text is shown below. Check that the API is running and Prisma migrations are applied (SiteAbout table).",
  aboutExplore: "Find Rishta",

  homeLoadError: "Could not load the home page. Check that the API is running and the database is configured.",
  homeLoading: "Loading…",
  yourProfile: "Your profile",
  yourProfileHint: "View or edit your details at any time.",
  myProfile: "My profile",
  noFeaturedProfiles: "No verified member profiles to show yet. Complete and verify profiles to list them here.",
  totalRaisedPkr: "Total raised (PKR)",
  supporters: "Supporters (unique donors)",
  activeCampaigns: "Active campaigns",
  noCampaignsHint: "No active campaigns yet. Admins can create them from the dashboard.",
  noCommunityPosts: "No community posts yet.",
  openCommunity: "Open community",
  writeCommentPlaceholder: "Write a comment…",
  sendComment: "Send",
  expandComments: "Show comments",
  hideComments: "Hide comments",
  like: "Like",
  unlike: "Remove like",

  campaignVerified: "Verified",
  donateNow: "Donate Now"
} as const;

export type UIKey = keyof typeof UI;
