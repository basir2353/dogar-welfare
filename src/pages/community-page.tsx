import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { Hash, ImageIcon, Link2, PlusCircle, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PostCard } from "@/components/cards/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, publicApi } from "@/utils/api";
import { useAuthStore } from "@/store/auth-store";
import type { AxiosError } from "axios";

type CommunityPostApi = {
  id: string;
  content: string;
  imageUrl?: string | null;
  author?: {
    email?: string;
    profile?: {
      fullName?: string;
    };
  };
  likes?: Array<{ userId: string }>;
  comments?: Array<{ id: string; authorName: string; content: string }>;
};

type PostView = {
  id: string;
  author: string;
  content: string;
  imageUrl?: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  commentItems: Array<{ id: string; authorName: string; content: string }>;
};

type TrendingTag = { tag: string; count: number; posts: number };

type FeedSort = "recent" | "trending";

export function CommunityPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [author, setAuthor] = useState(profile?.fullName ?? "Member");
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<PostView[]>([]);
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [sort, setSort] = useState<FeedSort>("recent");
  const [activeHashtag, setActiveHashtag] = useState("");
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);
  const [commentBusyId, setCommentBusyId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [message, setMessage] = useState("");
  const createPostLabel = useTranslate("Create Post");
  const signInToPost = useTranslate(UI.signInToPost);
  const signInLabel = useTranslate(UI.signIn);

  const mapPosts = (rows: CommunityPostApi[]) => {
    const uid = useAuthStore.getState().user?.userId;
    return rows.map((post) => {
      const likes = post.likes ?? [];
      const commentRows = post.comments ?? [];
      return {
        id: post.id,
        author: post.author?.profile?.fullName ?? post.author?.email ?? "Member",
        content: post.content,
        imageUrl: post.imageUrl,
        likeCount: likes.length,
        commentCount: commentRows.length,
        likedByMe: uid ? likes.some((l) => l.userId === uid) : false,
        commentItems: commentRows.map((c) => ({
          id: c.id,
          authorName: c.authorName,
          content: c.content
        }))
      };
    });
  };

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
      if (sort === "trending") params.sort = "trending";
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

  useEffect(() => {
    void loadPosts();
    void loadTrending();
    const interval = setInterval(() => {
      void loadPosts();
      void loadTrending();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadPosts, loadTrending]);

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

  const handleToggleLike = async (postId: string, likedByMe: boolean) => {
    setLikeBusyId(postId);
    setMessage("");
    try {
      if (likedByMe) {
        await api.delete(`/community/posts/${postId}/like`);
      } else {
        await api.post(`/community/posts/${postId}/like`);
      }
      await loadPosts();
      await loadTrending();
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Could not update like. Try again.");
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
    if (!content.trim()) return;
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
    setActiveHashtag((cur) => (cur === tag ? "" : tag));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-2">
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
          {activeHashtag ? (
            <Badge className="gap-1 bg-primary/15 text-primary">
              #{activeHashtag}
              <button type="button" className="ml-1 hover:opacity-70" onClick={() => setActiveHashtag("")}>
                ×
              </button>
            </Badge>
          ) : null}
        </div>

        {user ? (
          <Card className="glass overflow-hidden p-0">
            <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                {(profile?.fullName ?? author).slice(0, 1).toUpperCase()}
              </div>
              <p className="text-sm font-medium">Create a post</p>
            </div>
            <div className="space-y-3 p-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Use #hashtags to join trending topics."
                className="min-h-28 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
              />
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
                <Button className="gap-2" size="sm" onClick={() => void createPost()}>
                  <PlusCircle className="h-4 w-4" /> {createPostLabel}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="glass flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-subtle">{signInToPost}</p>
            <Link to="/auth">
              <Button variant="primary" size="sm">{signInLabel}</Button>
            </Link>
          </Card>
        )}

        {posts.map((post) => (
          <PostCard
            key={post.id}
            postId={user ? post.id : undefined}
            author={post.author}
            content={post.content}
            imageUrl={post.imageUrl}
            likes={post.likeCount}
            comments={post.commentCount}
            likedByMe={post.likedByMe}
            commentsList={post.commentItems}
            onToggleLike={user ? () => void handleToggleLike(post.id, post.likedByMe) : undefined}
            likePending={likeBusyId === post.id}
            onAddComment={user ? (text) => handleAddComment(post.id, text) : undefined}
            commentSubmitPending={commentBusyId === post.id}
            onHashtagClick={applyHashtag}
          />
        ))}
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
            <li>• Like and comment to boost trending topics</li>
            <li>• Share welfare updates and family news respectfully</li>
          </ul>
        </Card>
      </aside>
    </div>
  );
}
