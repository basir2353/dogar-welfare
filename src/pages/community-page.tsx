import { useEffect, useState, type ChangeEvent } from "react";
import { PlusCircle } from "lucide-react";
import { PostCard } from "@/components/cards/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslate } from "@/hooks/use-translate";
import { Card } from "@/components/ui/card";
import { api } from "@/utils/api";
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

export function CommunityPage() {
  const profile = useAuthStore((s) => s.profile);
  const [author, setAuthor] = useState(profile?.fullName ?? "Member");
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState<PostView[]>([]);
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);
  const [commentBusyId, setCommentBusyId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [message, setMessage] = useState("");
  const createPostLabel = useTranslate("Create Post");

  const loadPosts = async () => {
    try {
      const { data } = await api.get("/community/posts");
      if (data.success) {
        const uid = useAuthStore.getState().user?.userId;
        const mapped = (data.data as CommunityPostApi[]).map((post) => {
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
        setPosts(mapped);
      }
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Unable to load posts from backend. Ensure backend API is running.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadPosts();
    }, 0);
    const interval = setInterval(() => {
      void loadPosts();
    }, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

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
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Unable to create post.");
    }
  };

  return (
    <div className="relative space-y-4">
      <Card className="glass">
        <p className="mb-3 text-sm font-medium text-foreground">Create Post</p>
        <div className="space-y-3">
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-24 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
          />
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Link (optional) — https://… or mailto:…"
          />
          <div className="space-y-2">
            <label className="block text-xs text-faint">Picture (optional)</label>
            <Input
              value={imageUrlInput}
              onChange={(e) => {
                setImageUrlInput(e.target.value);
                if (e.target.value.trim()) setImageDataUrl("");
              }}
              placeholder="Image URL (https://…)"
            />
            <Input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleImagePick} />
            {imageDataUrl ? (
              <img src={imageDataUrl} alt="" className="h-28 max-w-full rounded-xl border border-border object-contain" />
            ) : null}
          </div>
          <div className="flex justify-end">
            <Button className="gap-2" onClick={() => void createPost()}>
              <PlusCircle className="h-4 w-4" /> {createPostLabel}
            </Button>
          </div>
        </div>
      </Card>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          postId={post.id}
          author={post.author}
          content={post.content}
          imageUrl={post.imageUrl}
          likes={post.likeCount}
          comments={post.commentCount}
          likedByMe={post.likedByMe}
          commentsList={post.commentItems}
          onToggleLike={() => void handleToggleLike(post.id, post.likedByMe)}
          likePending={likeBusyId === post.id}
          onAddComment={(text) => handleAddComment(post.id, text)}
          commentSubmitPending={commentBusyId === post.id}
        />
      ))}
      {message ? <p className="text-sm text-subtle">{message}</p> : null}
    </div>
  );
}
