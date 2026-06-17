import { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
import { api, resolveMediaUrl } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { ModerationItem } from "./types";

export function AdminModerationPage() {
  const [moderation, setModeration] = useState<ModerationItem[]>([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/admin/moderation");
      if (data.success) {
        setModeration(data.data as ModerationItem[]);
      }
    } catch {
      setMessage("Unable to load moderation queue.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const moderateProfile = async (profileId: string, status: "VERIFIED" | "REJECTED") => {
    try {
      await api.patch(`/admin/moderation/${profileId}`, { status });
      setMessage(status === "VERIFIED" ? "Profile approved." : "Profile rejected.");
      setTimeout(() => setMessage(""), 5000);
      void load();
    } catch {
      setMessage("Unable to update moderation status.");
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Rishta moderation"
        subtitle="Pending profiles only. Approve or reject submissions. Approved profiles can appear on the home page when verified."
      />
      {message ? <p className="mb-4 text-sm text-accent">{message}</p> : null}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/12 text-accent">
            <UserCheck className="h-4 w-4" />
          </div>
          <p className="text-lg font-semibold">Queue ({moderation.length})</p>
        </div>
        {moderation.length === 0 ? <p className="text-sm text-subtle">No pending profiles.</p> : null}
        <div className="space-y-4">
          {moderation.map((item) => (
            <div key={item.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="font-medium">{item.fullName}</p>
              <p className="text-sm text-subtle">
                {item.city} · {item.user?.email} {item.user?.role ? <span>· {item.user.role}</span> : null}
              </p>
              {item.createdAt ? <p className="text-xs text-faint">Requested: {new Date(item.createdAt).toLocaleString()}</p> : null}
              <div className="mt-2 grid gap-1 text-sm text-subtle">
                {item.bio ? <p><span className="text-faint">Bio:</span> {item.bio}</p> : null}
                {item.matrimonial?.age != null ? <p><span className="text-faint">Age:</span> {item.matrimonial.age}</p> : null}
                {item.matrimonial?.maritalStatus ? <p><span className="text-faint">Marital:</span> {item.matrimonial.maritalStatus}</p> : null}
                {item.matrimonial?.sect ? <p><span className="text-faint">Sect:</span> {item.matrimonial.sect}</p> : null}
                {item.matrimonial?.education ? <p><span className="text-faint">Education:</span> {item.matrimonial.education}</p> : null}
                {item.matrimonial?.profession ? <p><span className="text-faint">Profession:</span> {item.matrimonial.profession}</p> : null}
                {item.matrimonial?.incomeRange ? <p><span className="text-faint">Income:</span> {item.matrimonial.incomeRange}</p> : null}
                {item.matrimonial?.aboutFamily ? <p><span className="text-faint">Family / about:</span> {item.matrimonial.aboutFamily}</p> : null}
                {item.matrimonial?.heightCm != null ? <p><span className="text-faint">Height (cm):</span> {item.matrimonial.heightCm}</p> : null}
              </div>
              {item.matrimonial?.images && item.matrimonial.images.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.matrimonial.images.map((img) => (
                    <div key={img.id} className="relative w-20 overflow-hidden rounded-lg border border-border/60">
                      <img src={resolveMediaUrl(img.url)} alt="" className="h-20 w-full object-cover" />
                      {img.isBanner ? <p className="px-0.5 text-center text-[10px] text-primary">Banner</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => void moderateProfile(item.id, "VERIFIED")}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => void moderateProfile(item.id, "REJECTED")}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
