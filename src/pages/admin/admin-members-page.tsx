import { useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import { api, resolveMediaUrl } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { AllMemberRow } from "./types";

export function AdminMembersPage() {
  const [allMembers, setAllMembers] = useState<AllMemberRow[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/admin/members");
        if (data.success) {
          setAllMembers(data.data as AllMemberRow[]);
        }
      } catch {
        setMessage("Unable to load members.");
      }
    };
    void load();
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Members directory"
        subtitle="Up to 500 most recently updated profiles, every status, with rishta details and gallery thumbnails."
      />
      {message ? <p className="mb-4 text-sm text-secondary">{message}</p> : null}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <UsersRound className="h-4 w-4" />
          </div>
          <p className="text-lg font-semibold">All members ({allMembers.length})</p>
        </div>
        {allMembers.length === 0 ? <p className="text-sm text-subtle">No members found.</p> : null}
        <div className="max-h-[calc(100vh-20rem)] space-y-3 overflow-y-auto pr-1">
          {allMembers.map((row) => (
            <div key={row.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="font-medium">
                {row.fullName}
                {row.verificationStatus ? (
                  <span
                    className={
                      "ml-2 inline-block rounded-md px-2 py-0.5 text-xs font-normal " +
                      (row.verificationStatus === "VERIFIED"
                        ? "bg-accent/20 text-accent"
                        : row.verificationStatus === "PENDING"
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-200"
                          : "bg-rose-500/20 text-rose-700 dark:text-rose-200")
                    }
                  >
                    {row.verificationStatus}
                  </span>
                ) : null}
              </p>
              <p className="text-sm text-subtle">
                {row.user?.email} · {row.city}
                {row.user?.role ? <span> · {row.user.role}</span> : null}
                {row.user?.createdAt ? <span> · joined {new Date(row.user.createdAt).toLocaleDateString()}</span> : null}
              </p>
              <div className="mt-1 grid gap-0.5 text-sm text-subtle">
                {row.bio ? <p><span className="text-faint">Bio:</span> {row.bio}</p> : null}
                {row.matrimonial ? (
                  <>
                    {row.matrimonial.age != null ? <p><span className="text-faint">Age:</span> {row.matrimonial.age}</p> : null}
                    {row.matrimonial.maritalStatus ? <p><span className="text-faint">Marital:</span> {row.matrimonial.maritalStatus}</p> : null}
                    {row.matrimonial.sect ? <p><span className="text-faint">Sect:</span> {row.matrimonial.sect}</p> : null}
                    {row.matrimonial.education ? <p><span className="text-faint">Education:</span> {row.matrimonial.education}</p> : null}
                    {row.matrimonial.profession ? <p><span className="text-faint">Profession:</span> {row.matrimonial.profession}</p> : null}
                    {row.matrimonial.incomeRange ? <p><span className="text-faint">Income band:</span> {row.matrimonial.incomeRange}</p> : null}
                    {row.matrimonial.aboutFamily ? <p><span className="text-faint">Family / about:</span> {row.matrimonial.aboutFamily}</p> : null}
                    {row.matrimonial.heightCm != null ? <p><span className="text-faint">Height (cm):</span> {row.matrimonial.heightCm}</p> : null}
                  </>
                ) : (
                  <p className="text-faint">No rishta record yet.</p>
                )}
              </div>
              {row.matrimonial?.images && row.matrimonial.images.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {row.matrimonial.images.map((img) => (
                    <a
                      key={img.id}
                      href={resolveMediaUrl(img.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-20 overflow-hidden rounded-lg border border-border/60"
                    >
                      <img src={resolveMediaUrl(img.url)} alt="" className="h-20 w-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
