import { useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { AdminPost } from "./types";

export function AdminCommunityPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/admin/community/posts");
      if (data.success) {
        setPosts(data.data as AdminPost[]);
      }
    } catch {
      setMessage("Unable to load community posts.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const removePost = async (postId: string) => {
    try {
      await api.delete(`/admin/community/posts/${postId}`);
      void load();
    } catch {
      setMessage("Unable to remove post.");
    }
  };

  return (
    <div>
      <AdminPageHeader title="Community" subtitle="Review recent posts and remove content that breaks guidelines." />
      {message ? <p className="mb-4 text-sm text-secondary">{message}</p> : null}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/12 text-secondary">
            <MessagesSquare className="h-4 w-4" />
          </div>
          <p className="text-lg font-semibold">Recent posts ({posts.length})</p>
        </div>
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="font-medium">{post.author?.profile?.fullName ?? post.author?.email ?? "Member"}</p>
              <p className="mt-1 text-sm text-subtle">{post.content}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => void removePost(post.id)}>
                Remove post
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
