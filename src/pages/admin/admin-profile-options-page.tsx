import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Tags } from "lucide-react";
import { api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuthStore } from "@/store/auth-store";

export function AdminProfileOptionsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === "ADMIN" || role === "SUPER_ADMIN";
  const [castes, setCastes] = useState<string[]>([]);
  const [casteInput, setCasteInput] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!canEdit) return;
    const load = async () => {
      try {
        const { data } = await api.get("/admin/profile-options/castes");
        if (data.success && data.data?.castes) {
          setCastes(data.data.castes as string[]);
        }
      } catch {
        setMessage("Unable to load biradri options.");
      }
    };
    void load();
  }, [canEdit]);

  if (!canEdit) {
    return <Navigate to="/admin" replace />;
  }

  const addCaste = async () => {
    const name = casteInput.trim();
    if (!name) return;
    try {
      const { data } = await api.post("/admin/profile-options/castes", { name });
      if (data.success && data.data?.castes) {
        setCastes(data.data.castes as string[]);
        setCasteInput("");
        setMessage("Biradri option added.");
        setTimeout(() => setMessage(""), 4000);
      }
    } catch {
      setMessage("Unable to add biradri option.");
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Profile biradri"
        subtitle="Manage caste / biradri labels shown in profile setup. Super admins can add new entries."
      />
      {message ? <p className="mb-4 text-sm text-accent">{message}</p> : null}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/20 text-muted">
            <Tags className="h-4 w-4" />
          </div>
          <p className="text-lg font-semibold">Caste / biradri list</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Add biradri (e.g. Dogar)"
            value={casteInput}
            onChange={(e) => setCasteInput(e.target.value)}
            className="max-w-xs flex-1"
          />
          <Button onClick={() => void addCaste()}>Add</Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {castes.map((item) => (
            <span key={item} className="rounded-full border border-border/60 bg-background/50 px-3 py-1.5 text-xs text-subtle">
              {item}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
