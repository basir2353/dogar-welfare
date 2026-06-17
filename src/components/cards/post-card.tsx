import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Bookmark,
  BookmarkCheck,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  PartyPopper,
  Pencil,
  Share2,
  ThumbsUp,
  Trash2,
  HeartHandshake
} from "lucide-react";
import { splitCommunityPostBodyAndLink, type CommunityReactionType, COMMUNITY_REACTION_TYPES } from "@/shared";
import { PostContentWithHashtags } from "@/components/community/post-content";
import { Card } from "@/components/ui/card";
import { useTranslatedText } from "@/hooks/use-translated-content";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTranslate } from "@/hooks/use-translate";
import { UI } from "@/i18n/ui";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type CommentItem = { id: string; authorName: string; content: string };

export type PostReaction = { userId: string; reactionType?: CommunityReactionType };

const REACTION_META: Record<CommunityReactionType, { icon: typeof Heart; label: string }> = {
  like: { icon: ThumbsUp, label: "Like" },
  love: { icon: Heart, label: "Love" },
  support: { icon: HeartHandshake, label: "Support" },
  celebrate: { icon: PartyPopper, label: "Celebrate" }
};

type PostCardProps = {
  author: string;
  content: string;
  imageUrl?: string | null;
  likes: number;
  comments: number;
  ctaTo?: string;
  ctaLabel?: string;
  postId?: string;
  authorId?: string;
  myUserId?: string;
  likedByMe?: boolean;
  myReaction?: CommunityReactionType;
  reactions?: PostReaction[];
  onReaction?: (reactionType: CommunityReactionType) => void | Promise<void>;
  onToggleLike?: () => void | Promise<void>;
  likePending?: boolean;
  commentsList?: CommentItem[];
  onAddComment?: (text: string) => void | Promise<void>;
  commentSubmitPending?: boolean;
  onHashtagClick?: (tag: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  isBookmarked?: boolean;
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
  authorId,
  myUserId,
  likedByMe = false,
  myReaction,
  reactions = [],
  onReaction,
  onToggleLike,
  likePending = false,
  commentsList = [],
  onAddComment,
  commentSubmitPending = false,
  onHashtagClick,
  onEdit,
  onDelete,
  onBookmark,
  onShare,
  onReport,
  isBookmarked = false
}: PostCardProps) {
  const { body, linkUrl } = splitCommunityPostBodyAndLink(content);
  const tAuthor = useTranslatedText(author);
  const tBody = useTranslatedText(body);
  const showImage = Boolean(imageUrl?.trim());
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [reactionOpen, setReactionOpen] = useState(false);

  const labelLike = useTranslate(UI.like);
  const labelUnlike = useTranslate(UI.unlike);
  const phComment = useTranslate(UI.writeCommentPlaceholder);
  const sendLabel = useTranslate(UI.sendComment);
  const showCommentsA11y = useTranslate(UI.expandComments);
  const hideCommentsA11y = useTranslate(UI.hideComments);

  const interactive = Boolean(postId && (onReaction || onToggleLike));
  const canComment = Boolean(postId && onAddComment);
  const isOwn = Boolean(authorId && myUserId && authorId === myUserId);
  const hasActions = Boolean(onBookmark || onShare || onReport || (isOwn && (onEdit || onDelete)));

  const reactionCounts = COMMUNITY_REACTION_TYPES.reduce(
    (acc, type) => {
      acc[type] = reactions.filter((r) => (r.reactionType ?? "like") === type).length;
      return acc;
    },
    {} as Record<CommunityReactionType, number>
  );
  const totalReactions = reactions.length || likes;
  const activeReaction = myReaction ?? (likedByMe ? "like" : undefined);
  const ActiveIcon = activeReaction ? REACTION_META[activeReaction].icon : Heart;

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

  const handleReaction = (type: CommunityReactionType) => {
    setReactionOpen(false);
    if (onReaction) {
      void onReaction(type);
    } else {
      void onToggleLike?.();
    }
  };

  const authorInitial = author.trim().slice(0, 1).toUpperCase() || "M";

  return (
    <motion.div whileHover={{ scale: 1.01 }}>
      <Card className="glass">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
              {authorInitial}
            </div>
            <p className="truncate text-sm font-semibold">{tAuthor}</p>
          </div>
          {hasActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-xl p-1.5 text-subtle hover:bg-muted/30"
                  aria-label="Post actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onBookmark ? (
                  <DropdownMenuItem onClick={onBookmark}>
                    {isBookmarked ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
                    {isBookmarked ? "Remove bookmark" : "Bookmark"}
                  </DropdownMenuItem>
                ) : null}
                {onShare ? (
                  <DropdownMenuItem onClick={onShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Copy link
                  </DropdownMenuItem>
                ) : null}
                {isOwn && onEdit ? (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit post
                  </DropdownMenuItem>
                ) : null}
                {isOwn && onDelete ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-secondary">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete post
                    </DropdownMenuItem>
                  </>
                ) : null}
                {!isOwn && onReport ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onReport}>
                      <Flag className="mr-2 h-4 w-4" />
                      Report post
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

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
            {totalReactions > 0 ? (
              <div className="flex flex-wrap gap-2">
                {COMMUNITY_REACTION_TYPES.filter((t) => reactionCounts[t] > 0).map((type) => {
                  const Icon = REACTION_META[type].icon;
                  return (
                    <span key={type} className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-2 py-0.5">
                      <Icon className="h-3 w-3" />
                      {reactionCounts[type]}
                    </span>
                  );
                })}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  disabled={likePending}
                  aria-pressed={Boolean(activeReaction)}
                  aria-label={activeReaction ? labelUnlike : labelLike}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-1 py-0.5 transition-colors",
                    "hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    likePending && "pointer-events-none opacity-60",
                    activeReaction && "text-primary"
                  )}
                  onClick={() => {
                    if (onReaction) {
                      if (activeReaction) {
                        void onReaction(activeReaction);
                      } else {
                        setReactionOpen((o) => !o);
                      }
                    } else {
                      void onToggleLike?.();
                    }
                  }}
                  onMouseEnter={() => onReaction && setReactionOpen(true)}
                  onMouseLeave={() => setReactionOpen(false)}
                >
                  <ActiveIcon
                    className={cn("h-4 w-4 transition-colors", activeReaction && "fill-primary text-primary")}
                    aria-hidden
                  />
                  <span className="min-w-[1.25ch] text-foreground/90 tabular-nums">{totalReactions}</span>
                </button>
                {reactionOpen && onReaction ? (
                  <div
                    className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-lg"
                    onMouseEnter={() => setReactionOpen(true)}
                    onMouseLeave={() => setReactionOpen(false)}
                  >
                    {COMMUNITY_REACTION_TYPES.map((type) => {
                      const Icon = REACTION_META[type].icon;
                      const selected = activeReaction === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          title={REACTION_META[type].label}
                          className={cn(
                            "rounded-xl p-2 transition hover:scale-110 hover:bg-muted/40",
                            selected && "bg-primary/15 text-primary"
                          )}
                          onClick={() => handleReaction(type)}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
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
              {onBookmark ? (
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-xl px-1 py-0.5 hover:bg-muted/25",
                    isBookmarked && "text-primary"
                  )}
                  onClick={onBookmark}
                  aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
                >
                  {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                </button>
              ) : null}
              {onShare ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-xl px-1 py-0.5 hover:bg-muted/25"
                  onClick={onShare}
                  aria-label="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              ) : null}
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
