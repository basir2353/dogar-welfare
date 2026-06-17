import { useEffect, useMemo, useState } from "react";
import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { AxiosError } from "axios";

type ContactStatus = "NEW" | "READ" | "REPLIED" | "ARCHIVED";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
};

const STATUS_LABEL: Record<ContactStatus, string> = {
  NEW: "New",
  READ: "Read",
  REPLIED: "Replied",
  ARCHIVED: "Archived"
};

const STATUS_STYLE: Record<ContactStatus, string> = {
  NEW: "bg-primary/15 text-primary",
  READ: "bg-muted/30 text-foreground",
  REPLIED: "bg-accent/15 text-accent",
  ARCHIVED: "bg-faint/20 text-subtle"
};

export function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<ContactStatus | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const params = filter === "ALL" ? {} : { status: filter };
      const { data } = await api.get("/admin/contact-messages", { params });
      if (data.success) {
        setMessages(data.data as ContactMessage[]);
      }
    } catch {
      setNotice("Unable to load contact messages. Run Prisma migrations if the ContactMessage table is missing.");
    }
  };

  useEffect(() => {
    void load();
  }, [filter]);

  const selected = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? messages[0] ?? null,
    [messages, selectedId]
  );

  useEffect(() => {
    if (messages.length > 0 && !selectedId) {
      setSelectedId(messages[0].id);
    }
  }, [messages, selectedId]);

  const setStatus = async (id: string, status: ContactStatus) => {
    try {
      await api.patch(`/admin/contact-messages/${id}`, { status });
      setNotice(`Marked as ${STATUS_LABEL[status].toLowerCase()}.`);
      void load();
    } catch {
      setNotice("Could not update message status.");
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this contact message permanently?")) return;
    try {
      await api.delete(`/admin/contact-messages/${id}`);
      if (selectedId === id) setSelectedId(null);
      void load();
    } catch {
      setNotice("Could not delete message.");
    }
  };

  const openMessage = async (msg: ContactMessage) => {
    setSelectedId(msg.id);
    if (msg.status === "NEW") {
      try {
        await api.patch(`/admin/contact-messages/${msg.id}`, { status: "READ" });
        void load();
      } catch (err) {
        const code = (err as AxiosError)?.response?.status;
        if (code !== 404) setNotice("Could not mark message as read.");
      }
    }
  };

  const newCount = messages.filter((m) => m.status === "NEW").length;

  return (
    <div>
      <AdminPageHeader
        title="Contact messages"
        subtitle="Messages submitted from the public Contact us page. Mark as read, replied, or archive when handled."
      />
      {notice ? <p className="mb-4 text-sm text-accent">{notice}</p> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(["ALL", "NEW", "READ", "REPLIED", "ARCHIVED"] as const).map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={filter === s ? "primary" : "outline"}
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? "All" : STATUS_LABEL[s]}
            {s === "NEW" && newCount > 0 ? ` (${newCount})` : ""}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="max-h-[70vh] overflow-y-auto rounded-2xl border border-border/80 bg-card p-3 shadow-sm">
          {messages.length === 0 ? (
            <p className="p-4 text-sm text-subtle">No contact messages yet.</p>
          ) : (
            <ul className="space-y-2">
              {messages.map((msg) => (
                <li key={msg.id}>
                  <button
                    type="button"
                    onClick={() => void openMessage(msg)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selected?.id === msg.id ? "border-primary/50 bg-primary/10" : "border-border/60 hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{msg.name}</p>
                      <Badge className={STATUS_STYLE[msg.status]}>{STATUS_LABEL[msg.status]}</Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-subtle">{msg.subject}</p>
                    <p className="mt-1 text-[10px] text-faint">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{selected.subject}</h2>
                  <p className="mt-1 text-sm text-subtle">
                    From <span className="font-medium text-foreground">{selected.name}</span>
                    {" · "}
                    <a href={`mailto:${selected.email}`} className="text-primary hover:underline">
                      {selected.email}
                    </a>
                    {selected.phone ? ` · ${selected.phone}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-faint">Received {new Date(selected.createdAt).toLocaleString()}</p>
                </div>
                <Badge className={STATUS_STYLE[selected.status]}>{STATUS_LABEL[selected.status]}</Badge>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{selected.message}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void setStatus(selected.id, "READ")}>
                  <MailOpen className="h-4 w-4" />
                  Mark read
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void setStatus(selected.id, "REPLIED")}>
                  <Reply className="h-4 w-4" />
                  Mark replied
                </Button>
                <Button size="sm" variant="outline" onClick={() => void setStatus(selected.id, "ARCHIVED")}>
                  Archive
                </Button>
                <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}>
                  <Button size="sm" variant="primary" className="gap-1.5">
                    <Mail className="h-4 w-4" />
                    Reply by email
                  </Button>
                </a>
                <Button size="sm" variant="ghost" className="text-secondary" onClick={() => void remove(selected.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-subtle">Select a message from the list to read and respond.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
