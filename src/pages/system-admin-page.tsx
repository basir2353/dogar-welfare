import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SystemAdminPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-primary/[0.06] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">System admin</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Platform control</h1>
        <p className="mt-3 text-sm leading-relaxed text-subtle">
          You are signed in with the highest role. Use the sidebar to open the same admin tools as staff (dashboard, campaigns,
          moderation, members, community, and site content). This screen is a quick hub only.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={() => navigate("/admin")}>
            Open dashboard
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/moderation")}>
            Moderation queue
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/landing")}>
            Landing copy
          </Button>
        </div>
      </Card>
    </div>
  );
}
