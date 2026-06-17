import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Copy,
  Forward,
  ImageIcon,
  MoreVertical,
  Paperclip,
  Palette,
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { io } from "socket.io-client";
import { api, getSocketBaseUrl, resolveMediaUrl } from "@/utils/api";
import { useAuthStore } from "@/store/auth-store";
import { userPrefs } from "@/lib/user-prefs";
import { formatRelativeTime, packReplyMessage, parseChatMessage } from "@/lib/chat-message";

const CHAT_READ_KEY = "dogar-chat-last-read";
const EMOJI_QUICK = ["😊", "👍", "❤️", "🤲", "🎉", "😂", "🙏", "✨"];

const WALLPAPER_CLASS: Record<string, string> = {
  default: "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgNDBoNDBWNHoiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDMiLz48L3N2Zz4=')]",
  teal: "bg-gradient-to-br from-teal-950/20 via-card to-primary/5",
  warm: "bg-gradient-to-br from-amber-950/15 via-card to-orange-900/10",
  dark: "bg-gradient-to-b from-zinc-900/40 to-card"
};

type ConversationMember = {
  userId: string;
  user?: {
    id?: string;
    email?: string;
    profile?: { fullName?: string };
  };
};

type Conversation = {
  id: string;
  members?: ConversationMember[];
  messages?: Array<{ id: string; body: string; createdAt?: string; senderId: string }>;
};

type ChatMessage = {
  id: string;
  body: string;
  imageUrl?: string | null;
  senderId: string;
  conversationId: string;
  createdAt?: string;
};

function readLastReadMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CHAT_READ_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeLastRead(conversationId: string, iso: string) {
  const map = readLastReadMap();
  map[conversationId] = iso;
  localStorage.setItem(CHAT_READ_KEY, JSON.stringify(map));
}

function formatMessageTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function avatarInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function previewText(body: string) {
  const parsed = parseChatMessage(body);
  const text = parsed.body || body;
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const myUserId = useAuthStore((s) => s.user?.userId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");
  const [chatError, setChatError] = useState("");
  const [convSearch, setConvSearch] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [wallpaper, setWallpaper] = useState(userPrefs.get().chatWallpaper);
  const [prefsVersion, setPrefsVersion] = useState(0);
  const [messageReactions, setMessageReactions] = useState<Record<string, string>>({});
  const [lastTap, setLastTap] = useState<{ id: string; at: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const socket = useMemo(() => {
    if (!accessToken) return null;
    return io(getSocketBaseUrl(), {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection: true
    });
  }, [accessToken]);

  const loadConversations = useCallback(async (preferId?: string) => {
    try {
      setChatError("");
      const { data } = await api.get("/chat/conversations");
      if (data.success) {
        const payload = data.data as Conversation[];
        setConversations(payload);
        if (preferId && payload.some((c) => c.id === preferId)) {
          setActiveConversationId(preferId);
        } else if (payload.length > 0) {
          setActiveConversationId((cur) => (cur && payload.some((c) => c.id === cur) ? cur : payload[0].id));
        } else {
          setActiveConversationId("");
        }
      }
    } catch {
      setConversations([]);
      setChatError("Could not load conversations. Check that you are signed in and the API is running.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadConversations();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadConversations]);

  const withUserId = searchParams.get("with");
  useEffect(() => {
    if (!withUserId || !accessToken) {
      return;
    }
    if (myUserId && withUserId === myUserId) {
      setSearchParams({}, { replace: true });
      setChatError("You cannot open a chat with yourself.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setChatError("");
        const { data } = await api.post("/chat/conversations", { memberUserId: withUserId });
        if (!data.success || cancelled) {
          return;
        }
        const conv = data.data as { id: string };
        setSearchParams({}, { replace: true });
        await loadConversations(conv.id);
      } catch {
        if (!cancelled) {
          setSearchParams({}, { replace: true });
          setChatError("Could not open a chat with that user.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [withUserId, accessToken, myUserId, loadConversations, setSearchParams]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversationId) return;
      try {
        const { data } = await api.get(`/chat/conversations/${activeConversationId}/messages`);
        if (data.success) {
          const rows = data.data as ChatMessage[];
          setMessages(rows);
          const last = rows[rows.length - 1];
          if (last?.createdAt) {
            writeLastRead(activeConversationId, last.createdAt);
          }
        }
      } catch {
        setMessages([]);
      }
    };
    void loadMessages();
    setMsgSearch("");
    setReplyTo(null);
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUserId]);

  useEffect(() => {
    if (!socket || !activeConversationId) return;

    socket.emit("join:conversation", activeConversationId);

    const onMessage = (message: ChatMessage) => {
      if (message.conversationId === activeConversationId) {
        setMessages((prev) => [...prev, message]);
        if (message.createdAt) {
          writeLastRead(activeConversationId, message.createdAt);
        }
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === message.conversationId
            ? { ...c, messages: [{ id: message.id, body: message.body, createdAt: message.createdAt, senderId: message.senderId }] }
            : c
        )
      );
    };
    const onTypingStart = (payload: { userId?: string }) => {
      if (payload?.userId && payload.userId !== myUserId) {
        setTypingUserId(payload.userId);
      }
    };
    const onTypingStop = (payload: { userId?: string }) => {
      if (payload?.userId === typingUserId) {
        setTypingUserId(null);
      }
    };

    socket.on("message:new", onMessage);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [socket, activeConversationId, myUserId, typingUserId]);

  const emitTyping = () => {
    if (!socket || !activeConversationId) return;
    socket.emit("typing:start", activeConversationId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing:stop", activeConversationId);
    }, 2000);
  };

  const sendMessage = () => {
    if (!socket || !activeConversationId || !text.trim()) return;
    let body = text.trim();
    if (replyTo) {
      const preview = parseChatMessage(replyTo.body).body || replyTo.body || "Message";
      body = packReplyMessage(replyTo.id, preview, body);
    }
    socket.emit("message:send", {
      conversationId: activeConversationId,
      body
    });
    socket.emit("typing:stop", activeConversationId);
    setText("");
    setReplyTo(null);
  };

  const otherMember = (c: Conversation | undefined) =>
    c?.members?.find((m) => m.userId && m.userId !== myUserId) ?? c?.members?.[0];
  const otherName = (c: Conversation) => {
    const o = otherMember(c);
    return o?.user?.profile?.fullName?.trim() || o?.user?.email || "Conversation";
  };
  const otherUserId = (c: Conversation) => otherMember(c)?.userId;

  const uploadAndSendImage = async (file: File) => {
    if (!socket || !activeConversationId) return;
    const body = new FormData();
    body.append("file", file);
    const { data: res } = await api.post("/chat/upload", body, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    const url = res.success ? (res.data as { url?: string })?.url : undefined;
    if (url) {
      socket.emit("message:send", { conversationId: activeConversationId, imageUrl: url });
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const activeName = activeConv ? otherName(activeConv) : "Messages";
  const isMuted = useMemo(
    () => (activeConversationId ? userPrefs.isChatMuted(activeConversationId) : false),
    [activeConversationId, prefsVersion]
  );

  const filteredConversations = useMemo(() => {
    const q = convSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => otherName(c).toLowerCase().includes(q));
  }, [conversations, convSearch, myUserId]);

  const visibleMessages = useMemo(() => {
    const q = msgSearch.trim().toLowerCase();
    return messages.filter((m) => {
      if (hiddenMessageIds.has(m.id)) return false;
      if (!q) return true;
      const parsed = parseChatMessage(m.body);
      return parsed.body.toLowerCase().includes(q) || parsed.replyPreview?.toLowerCase().includes(q);
    });
  }, [messages, msgSearch, hiddenMessageIds]);

  const isUnread = (c: Conversation) => {
    const last = c.messages?.[0];
    if (!last?.createdAt || last.senderId === myUserId) return false;
    const readAt = readLastReadMap()[c.id];
    if (!readAt) return true;
    return new Date(last.createdAt).getTime() > new Date(readAt).getTime();
  };

  const handleMessageTap = (message: ChatMessage) => {
    const now = Date.now();
    if (lastTap?.id === message.id && now - lastTap.at < 400) {
      setMessageReactions((prev) => ({ ...prev, [message.id]: "❤️" }));
      setLastTap(null);
    } else {
      setLastTap({ id: message.id, at: now });
    }
  };

  const copyMessage = (body: string) => {
    const parsed = parseChatMessage(body);
    void navigator.clipboard.writeText(parsed.body);
  };

  const forwardMessage = (body: string) => {
    const parsed = parseChatMessage(body);
    void navigator.clipboard.writeText(`[Forwarded] ${parsed.body}`);
  };

  const setWallpaperChoice = (choice: "default" | "teal" | "warm" | "dark") => {
    userPrefs.setChatWallpaper(choice);
    setWallpaper(choice);
    setPrefsVersion((v) => v + 1);
  };

  let lastDay = "";

  return (
    <div className="space-y-3">
      {chatError ? <p className="text-sm text-secondary">{chatError}</p> : null}
      <div className="grid h-[80vh] gap-0 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg lg:grid-cols-[340px_1fr]">
        <aside className="flex flex-col border-b border-border/50 lg:border-b-0 lg:border-r">
          <div className="border-b border-border/50 bg-primary/5 px-4 py-4">
            <h1 className="text-lg font-semibold">Chats</h1>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input
                className="h-9 pl-9 text-sm"
                placeholder="Search conversations"
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {filteredConversations.map((conversation) => {
              const name = otherName(conversation);
              const active = conversation.id === activeConversationId;
              const lastMsg = conversation.messages?.[0];
              const muted = userPrefs.isChatMuted(conversation.id);
              const unread = isUnread(conversation);
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                    active ? "bg-primary/15" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                    {avatarInitial(name)}
                    {unread ? (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{name}</p>
                      {muted ? <VolumeX className="h-3 w-3 shrink-0 text-faint" /> : null}
                    </div>
                    <p className="truncate text-xs text-subtle">
                      {lastMsg?.body ? previewText(lastMsg.body) : "No messages yet"}
                    </p>
                  </div>
                  {lastMsg?.createdAt ? (
                    <span className="shrink-0 text-[10px] text-faint">{formatRelativeTime(lastMsg.createdAt)}</span>
                  ) : null}
                </button>
              );
            })}
            {filteredConversations.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-subtle">No conversations yet</p>
            ) : null}
          </div>
        </aside>

        <section className={`flex min-h-0 flex-col ${WALLPAPER_CLASS[wallpaper] ?? WALLPAPER_CLASS.default}`}>
          {activeConversationId ? (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-border/50 bg-card/95 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                    {avatarInitial(activeName)}
                  </div>
                  <div>
                    <p className="font-semibold">{activeName}</p>
                    {typingUserId ? (
                      <p className="text-xs text-accent">typing…</p>
                    ) : (
                      <p className="text-xs text-subtle">{isMuted ? "Muted" : "Private chat"}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const ou = activeConv ? otherUserId(activeConv) : undefined;
                    if (!ou) return null;
                    return (
                      <Button variant="outline" className="hidden text-xs sm:inline-flex" onClick={() => navigate(`/matrimonial/${ou}`)}>
                        View profile
                      </Button>
                    );
                  })()}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="rounded-xl p-2 text-subtle hover:bg-muted/40" aria-label="More options">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          userPrefs.toggleMuteChat(activeConversationId);
                          setPrefsVersion((v) => v + 1);
                        }}
                      >
                        {isMuted ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                        {isMuted ? "Unmute" : "Mute conversation"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setWallpaperChoice("default")}>
                        <Palette className="mr-2 h-4 w-4" /> Default wallpaper
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setWallpaperChoice("teal")}>Teal wallpaper</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setWallpaperChoice("warm")}>Warm wallpaper</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setWallpaperChoice("dark")}>Dark wallpaper</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              <div className="border-b border-border/40 bg-card/80 px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
                  <Input
                    className="h-8 pl-9 text-xs"
                    placeholder="Search in this chat"
                    value={msgSearch}
                    onChange={(e) => setMsgSearch(e.target.value)}
                  />
                  {msgSearch ? (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-muted/40"
                      onClick={() => setMsgSearch("")}
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
                {visibleMessages.map((message) => {
                  const own = message.senderId === myUserId;
                  const day = formatDayLabel(message.createdAt);
                  const showDay = day && day !== lastDay;
                  if (showDay) lastDay = day;
                  const parsed = parseChatMessage(message.body);
                  const reaction = messageReactions[message.id];

                  return (
                    <div key={message.id}>
                      {showDay ? (
                        <p className="my-3 text-center text-xs text-faint">{day}</p>
                      ) : null}
                      <div className={`group flex w-full ${own ? "justify-end" : "justify-start"}`}>
                        <div className="relative max-w-[78%]">
                          <div
                            className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                              own
                                ? "rounded-br-md bg-primary text-on-primary"
                                : "rounded-bl-md bg-card text-foreground"
                            }`}
                            onClick={() => handleMessageTap(message)}
                          >
                            {parsed.replyPreview ? (
                              <div
                                className={`mb-2 border-l-2 pl-2 text-xs ${
                                  own ? "border-on-primary/50 text-on-primary/80" : "border-primary/40 text-subtle"
                                }`}
                              >
                                {parsed.replyPreview}
                              </div>
                            ) : null}
                            {parsed.body ? <p className="whitespace-pre-wrap">{parsed.body}</p> : null}
                            {message.imageUrl ? (
                              <a href={resolveMediaUrl(message.imageUrl)} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={resolveMediaUrl(message.imageUrl)}
                                  alt=""
                                  className="mt-1 max-h-64 w-full max-w-sm rounded-lg object-contain"
                                />
                              </a>
                            ) : null}
                            <p className={`mt-1 text-right text-[10px] ${own ? "text-on-primary/80" : "text-faint"}`}>
                              {formatMessageTime(message.createdAt)}
                              <span className="ml-1.5">{formatRelativeTime(message.createdAt)}</span>
                            </p>
                          </div>
                          {reaction ? (
                            <span className="absolute -bottom-2 right-2 rounded-full bg-card px-1.5 py-0.5 text-sm shadow">
                              {reaction}
                            </span>
                          ) : null}
                          <div className={`mt-0.5 flex gap-1 opacity-0 transition group-hover:opacity-100 ${own ? "justify-end" : ""}`}>
                            <button type="button" className="rounded p-1 text-[10px] text-faint hover:bg-muted/40" onClick={() => setReplyTo(message)}>
                              <Reply className="h-3 w-3" />
                            </button>
                            <button type="button" className="rounded p-1 text-[10px] text-faint hover:bg-muted/40" onClick={() => copyMessage(message.body)}>
                              <Copy className="h-3 w-3" />
                            </button>
                            <button type="button" className="rounded p-1 text-[10px] text-faint hover:bg-muted/40" onClick={() => forwardMessage(message.body)}>
                              <Forward className="h-3 w-3" />
                            </button>
                            {own ? (
                              <button
                                type="button"
                                className="rounded p-1 text-[10px] text-faint hover:bg-muted/40"
                                onClick={() => setHiddenMessageIds((s) => new Set([...s, message.id]))}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {msgSearch && visibleMessages.length === 0 ? (
                  <p className="text-center text-xs text-subtle">No messages match your search.</p>
                ) : null}
                {typingUserId ? (
                  <p className="text-xs text-accent">typing…</p>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              {replyTo ? (
                <div className="flex items-center gap-2 border-t border-border/50 bg-muted/20 px-4 py-2">
                  <Reply className="h-4 w-4 shrink-0 text-primary" />
                  <p className="min-w-0 flex-1 truncate text-xs text-subtle">
                    Replying to: {parseChatMessage(replyTo.body).body || replyTo.body}
                  </p>
                  <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              <footer className="border-t border-border/50 bg-card/95 px-3 py-3 backdrop-blur">
                <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
                  {EMOJI_QUICK.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="rounded-lg px-2 py-1 text-lg hover:bg-muted/40"
                      onClick={() => setText((t) => `${t}${emoji}`)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    className="rounded-full p-2 text-subtle hover:bg-muted/40"
                    aria-label="Emoji"
                    onClick={() => setText((t) => `${t}😊`)}
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadAndSendImage(f);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-full p-2 text-subtle hover:bg-muted/40"
                    aria-label="Attach image"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-border bg-background px-3 py-2">
                    <Input
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                      placeholder={replyTo ? "Reply…" : "Type a message"}
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        emitTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-10 w-10 shrink-0 rounded-full p-0"
                    onClick={sendMessage}
                    disabled={!text.trim()}
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 hidden text-center text-[10px] text-faint sm:block">
                  Enter to send · Shift+Enter for new line · Double-tap a bubble to ❤️ · <ImageIcon className="inline h-3 w-3" /> attach photos
                </p>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center text-subtle">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Send className="h-7 w-7" />
              </div>
              <p className="font-medium text-foreground">Select a conversation</p>
              <p className="max-w-sm text-sm">Send rishta interest from a profile to start chatting here.</p>
              <Card className="glass max-w-md p-4 text-left">
                <p className="text-sm font-medium text-foreground">Chat tips</p>
                <ul className="mt-2 space-y-1 text-xs text-subtle">
                  <li>• Reply to messages using the quote bar</li>
                  <li>• Search within a thread from the bar above messages</li>
                  <li>• Mute conversations from the ⋮ menu</li>
                  <li>• Double-tap a message to react with ❤️</li>
                  <li>• Forward copies text with a [Forwarded] prefix</li>
                </ul>
              </Card>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
