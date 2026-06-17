import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Bookmark,
  Globe,
  Hash,
  ImageIcon,
  Link2,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  Users
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { PostCard, type PostReaction } from "@/components/cards/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { api, publicApi } from "@/utils/api";
import { useAuthStore } from "@/store/auth-store";
import { userPrefs } from "@/lib/user-prefs";
import { extractHashtags, splitCommunityPostBodyAndLink, type CommunityReactionType } from "@/shared";
import type { AxiosError } from "axios";

const MAX_POST_CHARS = 7800;

type CommunityPostApi = {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string | null;
  author?: {
    email?: string;
    profile?: {
      fullName?: string;
    };
  };
  likes?: Array<{ userId: string; reactionType?: CommunityReactionType }>;
  comments?: Array<{ id: string; authorName: string; content: string }>;
};

type PostView = {
  id: string;
  authorId: string;
  author: string;
  content: string;
  imageUrl?: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  myReaction?: CommunityReactionType;
  reactions: PostReaction[];
  commentItems: Array<{ id: string; authorName: string; content: string }>;
};

type TrendingTag = { tag: string; count: number; posts: number };

type FeedSort = "recent" | "trending" | "comments";
type FeedTab = "all" | "saved";

export function CommunityPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [searchParams, setSearchParams] = useSearchParams();
  const [author, setAuthor] = useState(profile?.fullName ?? "Member");
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<PostView[]>([]);
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [sort, setSort] = useState<FeedSort>("recent");
  const [feedTab, setFeedTab] = useState<FeedTab>("all");
  const [activeHashtag, setActiveHashtag] = useState(() => searchParams.get("tag") ?? "");
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);
  const [commentBusyId, setCommentBusyId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkVersion, setBookmarkVersion] = useState(0);
  const [editPost, setEditPost] = useState<PostView | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
  const createPostLabel = useTranslate("Create Post");
  const signInToPost = useTranslate(UI.signInToPost);
  const signInLabel = useTranslate(UI.signIn);

  const mapPosts = (rows: CommunityPostApi[]) => {
    const uid = useAuthStore.getState().user?.userId;
    return rows.map((post) => {
      const likes = post.likes ?? [];
      const commentRows = post.comments ?? [];
      const mine = uid ? likes.find((l) => l.userId === uid) : undefined;
      return {
        id: post.id,
        authorId: post.authorId,
        author: post.author?.profile?.fullName ?? post.author?.email ?? "Member",
        content: post.content,
        imageUrl: post.imageUrl,
        likeCount: likes.length,
        commentCount: commentRows.length,
        likedByMe: Boolean(mine),
        myReaction: mine?.reactionType,
        reactions: likes.map((l) => ({ userId: l.userId, reactionType: l.reactionType })),
        commentItems: commentRows.map((c) => ({
          id: c.id,
          authorName: c.authorName,
          content: c.content
        }))
      };
    });
  };

  const syncTagParam = useCallback(
    (tag: string) => {
      const next = new URLSearchParams(searchParams);
      if (tag) {
        next.set("tag", tag);
      } else {
        next.delete("tag");
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    const tag = searchParams.get("tag") ?? "";
    setActiveHashtag(tag);
  }, [searchParams]);

  const loadTrending = useCallback(async () => {
    try {
      const client = user ? api : publicApi;
      const path = user ? "/community/hashtags/trending" : "/public/community/hashtags/trending";
      const { data } = await client.get(path);
      if (data.success) {
        setTrending(data.data as TrendingTag[]);
      }
    } catch {
      setTrending([]);
    }
  }, [user]);

  const loadPosts = useCallback(async () => {
    try {
      const client = user ? api : publicApi;
      const basePath = user ? "/community/posts" : "/public/community/posts";
      const params: Record<string, string> = {};
      if (sort !== "recent") params.sort = sort;
      if (activeHashtag) params.hashtag = activeHashtag;
      const { data } = await client.get(basePath, { params });
      if (data.success) {
        setPosts(mapPosts(data.data as CommunityPostApi[]));
      }
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Unable to load posts from backend. Ensure backend API is running.");
    }
  }, [user, sort, activeHashtag]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPosts(), loadTrending()]);
    setRefreshing(false);
    setMessage("Feed refreshed.");
    setTimeout(() => setMessage(""), 2500);
  };

  useEffect(() => {
    void loadPosts();
    void loadTrending();
    const interval = setInterval(() => {
      void loadPosts();
      void loadTrending();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadPosts, loadTrending]);

  const displayedPosts = useMemo(() => {
    if (feedTab !== "saved") return posts;
    const saved = new Set(userPrefs.get().bookmarkedPosts);
    return posts.filter((p) => saved.has(p.id));
  }, [posts, feedTab, bookmarkVersion]);

  const handleImagePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      if (value) {
        setImageUrlInput("");
        setImageDataUrl(value);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReaction = async (postId: string, likedByMe: boolean, reactionType: CommunityReactionType) => {
    setLikeBusyId(postId);
    setMessage("");
    try {
      if (likedByMe) {
        await api.delete(`/community/posts/${postId}/like`);
      } else {
        await api.post(`/community/posts/${postId}/like`, { reactionType });
      }
      await loadPosts();
      await loadTrending();
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Could not update reaction. Try again.");
    } finally {
      setLikeBusyId(null);
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    setCommentBusyId(postId);
    setMessage("");
    try {
      await api.post(`/community/posts/${postId}/comments`, { content: text });
      await loadPosts();
      await loadTrending();
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Could not post your comment. Try again.");
      throw error;
    } finally {
      setCommentBusyId(null);
    }
  };

  const createPost = async () => {
    if (!content.trim() || content.length > MAX_POST_CHARS) return;
    try {
      setMessage("");
      const payload: { content: string; imageUrl?: string; linkUrl?: string } = {
        content: content.trim()
      };
      const trimmedLink = linkUrl.trim();
      if (trimmedLink) {
        payload.linkUrl = trimmedLink;
      }
      const trimmedImage = imageDataUrl.trim() || imageUrlInput.trim();
      if (trimmedImage) {
        payload.imageUrl = trimmedImage;
      }
      await api.post("/community/posts", payload);
      setContent("");
      setLinkUrl("");
      setImageDataUrl("");
      setImageUrlInput("");
      setAuthor(profile?.fullName ?? author);
      setMessage("Post created successfully.");
      void loadPosts();
      void loadTrending();
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Unable to create post.");
    }
  };

  const applyHashtag = (tag: string) => {
    const next = activeHashtag === tag ? "" : tag;
    setActiveHashtag(next);
    syncTagParam(next);
  };

  const openEdit = (post: PostView) => {
    const { body, linkUrl: storedLink } = splitCommunityPostBodyAndLink(post.content);
    setEditPost(post);
    setEditContent(body);
    setEditLink(storedLink ?? "");
  };

  const saveEdit = async () => {
    if (!editPost || !editContent.trim()) return;
    setEditBusy(true);
    try {
      const payload: { content: string; imageUrl?: string; linkUrl?: string } = {
        content: editContent.trim()
      };
      if (editLink.trim()) payload.linkUrl = editLink.trim();
      if (editPost.imageUrl) payload.imageUrl = editPost.imageUrl;
      await api.patch(`/community/posts/${editPost.id}`, payload);
      setEditPost(null);
      setMessage("Post updated.");
      await loadPosts();
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Could not update post.");
    } finally {
      setEditBusy(false);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await api.delete(`/community/posts/${postId}`);
      setDeleteConfirmId(null);
      setMessage("Post deleted.");
      await loadPosts();
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Could not delete post.");
    }
  };

  const sharePost = (postId: string) => {
    const url = `${window.location.origin}/community?post=${postId}`;
    void navigator.clipboard.writeText(url);
    setMessage("Link copied to clipboard.");
    setTimeout(() => setMessage(""), 2500);
  };

  const handleContentChange = (value: string) => {
    if (value.length <= MAX_POST_CHARS) {
      setContent(value);
    }
    const hashMatch = value.match(/#([\w\u0600-\u06FF]*)$/);
    if (hashMatch) {
      const partial = hashMatch[1].toLowerCase();
      const suggestions = trending
        .map((t) => t.tag)
        .filter((tag) => tag.startsWith(partial) && tag !== partial)
        .slice(0, 5);
      setHashtagSuggestions(suggestions);
    } else {
      setHashtagSuggestions([]);
    }
  };

  const insertHashtag = (tag: string) => {
    const next = content.replace(/#([\w\u0600-\u06FF]*)$/, `#${tag} `);
    setContent(next);
    setHashtagSuggestions([]);
  };

  const charsLeft = MAX_POST_CHARS - content.length;
  const myUserId = user?.userId;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={feedTab === "all" ? "primary" : "outline"}
            onClick={() => setFeedTab("all")}
          >
            All posts
          </Button>
          {user ? (
            <Button
              type="button"
              size="sm"
              variant={feedTab === "saved" ? "primary" : "outline"}
              onClick={() => setFeedTab("saved")}
              className="gap-1.5"
            >
              <Bookmark className="h-3.5 w-3.5" />
              Saved
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant={sort === "recent" ? "primary" : "outline"}
            onClick={() => setSort("recent")}
          >
            Latest
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sort === "trending" ? "primary" : "outline"}
            onClick={() => setSort("trending")}
            className="gap-1.5"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Trending
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sort === "comments" ? "primary" : "outline"}
            onClick={() => setSort("comments")}
            className="gap-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Most commented
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
          >
            <RefreshCw className={cnRefresh(refreshing)} />
            Refresh
          </Button>
          {activeHashtag ? (
            <Badge className="gap-1 bg-primary/15 text-primary">
              #{activeHashtag}
              <button
                type="button"
                className="ml-1 hover:opacity-70"
                onClick={() => applyHashtag(activeHashtag)}
              >
                ×
              </button>
            </Badge>
          ) : null}
        </div>

        {user ? (
          <>
            <Card className="glass border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">Who can see your post?</p>
                  <p className="mt-1 text-xs text-subtle">
                    Posts are visible to all verified Dogar Welfare members — similar to a family-friendly Facebook group.
                    Use respectful language and #hashtags so others can find your update.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="glass overflow-hidden p-0">
              <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                  {(profile?.fullName ?? author).slice(0, 1).toUpperCase()}
                </div>
                <p className="text-sm font-medium">Create a post</p>
              </div>
              <div className="space-y-3 p-4">
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="What's on your mind? Use #hashtags to join trending topics."
                    className="min-h-28 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
                  />
                  {hashtagSuggestions.length > 0 ? (
                    <ul className="absolute bottom-full left-0 z-10 mb-1 w-full rounded-xl border border-border bg-card p-1 shadow-lg">
                      {hashtagSuggestions.map((tag) => (
                        <li key={tag}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/30"
                            onClick={() => insertHashtag(tag)}
                          >
                            <Hash className="h-3.5 w-3.5 text-primary" />
                            {tag}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="flex items-center justify-between text-xs text-subtle">
                  <span>
                    {extractHashtags(content).length > 0
                      ? `${extractHashtags(content).length} hashtag(s)`
                      : "Tip: type # to see suggestions"}
                  </span>
                  <span className={charsLeft < 200 ? "text-secondary" : ""}>
                    {content.length}/{MAX_POST_CHARS}
                  </span>
                </div>
                {(imageDataUrl || imageUrlInput) ? (
                  <img
                    src={imageDataUrl || imageUrlInput}
                    alt=""
                    className="max-h-40 rounded-xl border border-border object-contain"
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-subtle hover:bg-muted/30">
                    <ImageIcon className="h-4 w-4" />
                    Photo
                    <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" onChange={handleImagePick} />
                  </label>
                  <div className="flex flex-1 items-center gap-2">
                    <Link2 className="h-4 w-4 shrink-0 text-subtle" />
                    <Input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="Add link (optional)"
                      className="h-9 text-xs"
                    />
                  </div>
                  <Button className="gap-2" size="sm" onClick={() => void createPost()} disabled={!content.trim() || content.length > MAX_POST_CHARS}>
                    <PlusCircle className="h-4 w-4" /> {createPostLabel}
                  </Button>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card className="glass flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-subtle">{signInToPost}</p>
            <Link to="/auth">
              <Button variant="primary" size="sm">{signInLabel}</Button>
            </Link>
          </Card>
        )}

        {displayedPosts.map((post) => (
          <PostCard
            key={post.id}
            postId={user ? post.id : undefined}
            authorId={post.authorId}
            myUserId={myUserId}
            author={post.author}
            content={post.content}
            imageUrl={post.imageUrl}
            likes={post.likeCount}
            comments={post.commentCount}
            likedByMe={post.likedByMe}
            myReaction={post.myReaction}
            reactions={post.reactions}
            commentsList={post.commentItems}
            isBookmarked={userPrefs.isPostBookmarked(post.id)}
            onReaction={
              user
                ? (reactionType) =>
                    void handleReaction(post.id, post.likedByMe && post.myReaction === reactionType, reactionType)
                : undefined
            }
            likePending={likeBusyId === post.id}
            onAddComment={user ? (text) => handleAddComment(post.id, text) : undefined}
            commentSubmitPending={commentBusyId === post.id}
            onHashtagClick={applyHashtag}
            onEdit={post.authorId === myUserId ? () => openEdit(post) : undefined}
            onDelete={post.authorId === myUserId ? () => setDeleteConfirmId(post.id) : undefined}
            onBookmark={
              user
                ? () => {
                    userPrefs.toggleBookmarkPost(post.id);
                    setBookmarkVersion((v) => v + 1);
                  }
                : undefined
            }
            onShare={() => sharePost(post.id)}
            onReport={
              user
                ? () => {
                    userPrefs.reportPost(post.id);
                    setMessage("Post reported. Our moderators will review it.");
                    setTimeout(() => setMessage(""), 3500);
                  }
                : undefined
            }
          />
        ))}
        {feedTab === "saved" && displayedPosts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-subtle">
            No bookmarked posts yet. Tap the bookmark icon on any post to save it here.
          </p>
        ) : null}
        {message ? <p className="text-sm text-subtle">{message}</p> : null}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="glass p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Trending hashtags</h2>
          </div>
          {trending.length === 0 ? (
            <p className="mt-3 text-sm text-subtle">No hashtags yet. Start one with #DogarWelfare</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {trending.map((item, i) => (
                <li key={item.tag}>
                  <button
                    type="button"
                    onClick={() => applyHashtag(item.tag)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted/30 ${
                      activeHashtag === item.tag ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-faint">{i + 1}</span>
                      <Hash className="h-3.5 w-3.5" />
                      {item.tag}
                    </span>
                    <span className="text-xs text-subtle">{item.posts} posts</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="glass p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <h2 className="font-semibold">Community tips</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-subtle">
            <li>• Use #hashtags so others can find your post</li>
            <li>• React with love, support, or celebrate — not just likes</li>
            <li>• Share welfare updates and family news respectfully</li>
          </ul>
        </Card>
      </aside>

      <Modal open={Boolean(editPost)} title="Edit post" onClose={() => setEditPost(null)}>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="min-h-32 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
        />
        <Input
          className="mt-3"
          placeholder="Link (optional)"
          value={editLink}
          onChange={(e) => setEditLink(e.target.value)}
        />
        <p className="mt-2 text-xs text-subtle">{editContent.length}/{MAX_POST_CHARS}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditPost(null)}>Cancel</Button>
          <Button onClick={() => void saveEdit()} disabled={editBusy || !editContent.trim()}>
            {editBusy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(deleteConfirmId)} title="Delete post?" onClose={() => setDeleteConfirmId(null)}>
        <p className="text-sm text-subtle">This cannot be undone. Your post will be removed from the community feed.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            variant="primary"
            className="bg-secondary hover:bg-secondary/90"
            onClick={() => deleteConfirmId && void deletePost(deleteConfirmId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function cnRefresh(spinning: boolean) {
  return spinning ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5";
}
