const KEY = "dogar-user-prefs";

export type UserPrefs = {
  savedProfiles: string[];
  bookmarkedPosts: string[];
  mutedChats: string[];
  chatWallpaper: "default" | "teal" | "warm" | "dark";
  reportedPosts: string[];
  comparedProfiles: string[];
  rishtaViewMode: "grid" | "list";
  rishtaSort: "score" | "age" | "recent";
};

const defaults: UserPrefs = {
  savedProfiles: [],
  bookmarkedPosts: [],
  mutedChats: [],
  chatWallpaper: "default",
  reportedPosts: [],
  comparedProfiles: [],
  rishtaViewMode: "grid",
  rishtaSort: "score"
};

function read(): UserPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) as Partial<UserPrefs> };
  } catch {
    return { ...defaults };
  }
}

function write(prefs: UserPrefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export const userPrefs = {
  get(): UserPrefs {
    return read();
  },
  toggleSavedProfile(userId: string): boolean {
    const p = read();
    const has = p.savedProfiles.includes(userId);
    p.savedProfiles = has ? p.savedProfiles.filter((id) => id !== userId) : [...p.savedProfiles, userId];
    write(p);
    return !has;
  },
  isProfileSaved(userId: string) {
    return read().savedProfiles.includes(userId);
  },
  toggleBookmarkPost(postId: string): boolean {
    const p = read();
    const has = p.bookmarkedPosts.includes(postId);
    p.bookmarkedPosts = has ? p.bookmarkedPosts.filter((id) => id !== postId) : [...p.bookmarkedPosts, postId];
    write(p);
    return !has;
  },
  isPostBookmarked(postId: string) {
    return read().bookmarkedPosts.includes(postId);
  },
  toggleMuteChat(conversationId: string): boolean {
    const p = read();
    const has = p.mutedChats.includes(conversationId);
    p.mutedChats = has ? p.mutedChats.filter((id) => id !== conversationId) : [...p.mutedChats, conversationId];
    write(p);
    return !has;
  },
  isChatMuted(conversationId: string) {
    return read().mutedChats.includes(conversationId);
  },
  setChatWallpaper(wallpaper: UserPrefs["chatWallpaper"]) {
    const p = read();
    p.chatWallpaper = wallpaper;
    write(p);
  },
  reportPost(postId: string) {
    const p = read();
    if (!p.reportedPosts.includes(postId)) {
      p.reportedPosts = [...p.reportedPosts, postId];
      write(p);
    }
  },
  toggleCompareProfile(userId: string): string[] {
    const p = read();
    const has = p.comparedProfiles.includes(userId);
    let next = has ? p.comparedProfiles.filter((id) => id !== userId) : [...p.comparedProfiles, userId];
    if (next.length > 3) next = next.slice(-3);
    p.comparedProfiles = next;
    write(p);
    return next;
  },
  setRishtaViewMode(mode: UserPrefs["rishtaViewMode"]) {
    const p = read();
    p.rishtaViewMode = mode;
    write(p);
  },
  setRishtaSort(sort: UserPrefs["rishtaSort"]) {
    const p = read();
    p.rishtaSort = sort;
    write(p);
  }
};
