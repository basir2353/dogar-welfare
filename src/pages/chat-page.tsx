import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { io } from "socket.io-client";
import { api, getSocketBaseUrl, resolveMediaUrl } from "@/utils/api";
import { useAuthStore } from "@/store/auth-store";

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
};

type ChatMessage = {
  id: string;
  body: string;
  imageUrl?: string | null;
  senderId: string;
  conversationId: string;
};

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const myUserId = useAuthStore((s) => s.user?.userId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [chatError, setChatError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setMessages(data.data as ChatMessage[]);
        }
      } catch {
        setMessages([]);
      }
    };
    void loadMessages();
  }, [activeConversationId]);

  useEffect(() => {
    if (!socket || !activeConversationId) return;

    socket.emit("join:conversation", activeConversationId);
    const handler = (message: ChatMessage) => {
      if (message.conversationId === activeConversationId) {
        setMessages((prev) => [...prev, message]);
      }
    };
    socket.on("message:new", handler);
    return () => {
      socket.off("message:new", handler);
    };
  }, [socket, activeConversationId]);

  const sendMessage = () => {
    if (!socket || !activeConversationId || !text.trim()) return;
    socket.emit("message:send", {
      conversationId: activeConversationId,
      body: text.trim()
    });
    setText("");
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

  return (
    <div className="space-y-3">
      {chatError ? <p className="text-sm text-secondary">{chatError}</p> : null}
      <div className="grid h-[75vh] gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="glass space-y-3 overflow-y-auto p-2">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => setActiveConversationId(conversation.id)}
            className="w-full rounded-2xl bg-muted/40 p-3 text-left text-sm hover:bg-muted"
          >
            {otherName(conversation)}
          </button>
        ))}
      </Card>
      <Card className="glass flex flex-col p-2 md:p-4">
        {activeConversationId && myUserId ? (
          <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
            {(() => {
              const c = conversations.find((x) => x.id === activeConversationId);
              const ou = c ? otherUserId(c) : undefined;
              if (!ou) return null;
              return (
                <Button variant="outline" className="text-xs" onClick={() => navigate(`/matrimonial/${ou}`)}>
                  View rishta profile
                </Button>
              );
            })()}
          </div>
        ) : null}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.map((message) => {
            const own = message.senderId === myUserId;
            return (
              <div
                key={message.id}
                className={`flex w-full ${own ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] space-y-2 rounded-2xl p-3 text-sm ${
                    own ? "bg-primary/20 text-foreground" : "bg-muted text-on-muted"
                  }`}
                >
                  {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}
                  {message.imageUrl ? (
                    <a href={resolveMediaUrl(message.imageUrl)} target="_blank" rel="noopener noreferrer">
                      <img
                        src={resolveMediaUrl(message.imageUrl)}
                        alt=""
                        className="max-h-64 w-full max-w-sm rounded-lg object-contain"
                      />
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
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
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            Image
          </Button>
          <Input
            className="min-w-[12rem] flex-1"
            placeholder="Type message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </Card>
    </div>
    </div>
  );
}
