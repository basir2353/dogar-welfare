export const CHAT_REPLY_MARKER = "\n\n__REPLY__\n" as const;

export type ParsedChatMessage = {
  body: string;
  replyToId?: string;
  replyPreview?: string;
};

export function packReplyMessage(replyToId: string, replyPreview: string, body: string): string {
  const preview = replyPreview.slice(0, 120);
  return `${body.trim()}${CHAT_REPLY_MARKER}${replyToId}\n${preview}`;
}

export function parseChatMessage(stored: string): ParsedChatMessage {
  const idx = stored.lastIndexOf(CHAT_REPLY_MARKER);
  if (idx === -1) return { body: stored };
  const tail = stored.slice(idx + CHAT_REPLY_MARKER.length);
  const nl = tail.indexOf("\n");
  if (nl === -1) return { body: stored };
  const replyToId = tail.slice(0, nl).trim();
  const replyPreview = tail.slice(nl + 1).trim();
  if (!replyToId) return { body: stored };
  return { body: stored.slice(0, idx).trimEnd(), replyToId, replyPreview };
}

export function formatRelativeTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}
