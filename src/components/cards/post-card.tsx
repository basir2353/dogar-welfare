import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { splitCommunityPostBodyAndLink } from "@/shared";
import { PostContentWithHashtags } from "@/components/community/post-content";
import { Card } from "@/components/ui/card";
import { useTranslatedText } from "@/hooks/use-translated-content";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";
import { Input } from "@/components/ui/input";

type CommentItem = { id: string; authorName: string; content: string };

type PostCardProps = {
  author: string;
  content: string;
  imageUrl?: string | null;
  likes: number;
  comments: number;
  /** e.g. landing preview — link-styled CTA, avoids nested `<a><button>`. */
  ctaTo?: string;
  ctaLabel?: string;
  /** When set, like / comment controls are shown (community feed). */
  postId?: string;
  likedByMe?: boolean;
  onToggleLike?: () => void | Promise<void>;
  likePending?: boolean;
  commentsList?: CommentItem[];
  onAddComment?: (text: string) => void | Promise<void>;
  commentSubmitPending?: boolean;
  onHashtagClick?: (tag: string) => void;
};

export function PostCard({
  author,
  content,
  imageUrl,
  likes,
  comments,
  ctaTo,
  ctaLabel,
  postId,
  likedByMe = false,
  onToggleLike,
  likePending = false,
  commentsList = [],
  onAddComment,
  commentSubmitPending = false,
  onHashtagClick
}: PostCardProps) {
  const { body, linkUrl } = splitCommunityPostBodyAndLink(content);
  const tAuthor = useTranslatedText(author);
  const tBody = useTranslatedText(body);
  const showImage = Boolean(imageUrl?.trim());
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const labelLike = useTranslate(UI.like);
  const labelUnlike = useTranslate(UI.unlike);
  const phComment = useTranslate(UI.writeCommentPlaceholder);
  const sendLabel = useTranslate(UI.sendComment);
  const showCommentsA11y = useTranslate(UI.expandComments);
  const hideCommentsA11y = useTranslate(UI.hideComments);

  const interactive = Boolean(postId && onToggleLike);
  const canComment = Boolean(postId && onAddComment);

  const submitComment = async () => {
    if (!onAddComment) return;
    const next = draft.trim();
    if (!next) return;
    try {
      await onAddComment(next);
      setDraft("");
    } catch {
      /* error surfaced by parent */
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.01 }}>
      <Card className="glass">
        <p className="text-sm font-semibold">{tAuthor}</p>
        <PostContentWithHashtags
          text={tBody}
          className="mt-2 whitespace-pre-wrap text-sm text-foreground/95"
          onHashtagClick={onHashtagClick}
        />
        {linkUrl ? (
          <p className="mt-2 text-sm">
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/90"
            >
              {linkUrl}
            </a>
          </p>
        ) : null}
        {showImage ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-border/60 bg-black/20">
            <img src={imageUrl!} alt="" className="max-h-72 w-full object-contain" />
          </div>
        ) : null}

        {interactive ? (
          <div className="mt-4 space-y-3 text-xs text-subtle">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={likePending}
                aria-pressed={likedByMe}
                aria-label={likedByMe ? labelUnlike : labelLike}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-1 py-0.5 transition-colors",
                  "hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  likePending && "pointer-events-none opacity-60"
                )}
                onClick={() => {
                  void onToggleLike?.();
                }}
              >
                <Heart
                  className={cn("h-4 w-4 transition-colors", likedByMe && "fill-primary text-primary")}
                  aria-hidden
                />
                <span className="min-w-[1.25ch] text-foreground/90 tabular-nums">{likes}</span>
              </button>
              {canComment ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl px-1 py-0.5 transition-colors hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-expanded={commentsOpen}
                  aria-label={commentsOpen ? hideCommentsA11y : showCommentsA11y}
                  onClick={() => setCommentsOpen((o) => !o)}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  <span className="min-w-[1.25ch] text-foreground/90 tabular-nums">{comments}</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {comments}
                </span>
              )}
            </div>
            {commentsOpen && canComment ? (
              <div className="space-y-2 border-t border-border/60 pt-3">
                {commentsList.length > 0 ? (
                  <ul className="space-y-2 text-sm text-foreground/90">
                    {commentsList.map((c) => (
                      <li key={c.id} className="rounded-lg bg-background/30 px-2 py-1.5">
                        <span className="font-medium text-foreground/95">{c.authorName}</span>
                        <p className="whitespace-pre-wrap text-subtle">{c.content}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-faint">—</p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        void submitComment();
                      }
                    }}
                    placeholder={phComment}
                    disabled={commentSubmitPending}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "primary", size: "sm" }),
                      "w-full shrink-0 sm:w-auto"
                    )}
                    disabled={commentSubmitPending || !draft.trim()}
                    onClick={() => void submitComment()}
                  >
                    {sendLabel}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-4 text-xs text-subtle">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {likes}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {comments}
            </span>
          </div>
        )}

        {ctaTo && ctaLabel ? (
          <Link
            to={ctaTo}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-3 inline-flex w-full justify-center"
            )}
          >
            {ctaLabel}
          </Link>
        ) : null}
      </Card>
    </motion.div>
  );
}
