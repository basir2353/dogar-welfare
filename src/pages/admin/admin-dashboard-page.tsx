import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Users, HeartHandshake, MessageSquare, Wallet, Mail } from "lucide-react";
import { api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import type { KpiPayload } from "./types";

export function AdminDashboardPage() {
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalCampaigns: 0,
    totalDonations: 0,
    newContactMessages: 0,
    totalContactMessages: 0
  });
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadError(false);
      try {
        const { data } = await api.get("/admin/kpis");
        if (data.success && data.data) {
          const payload = data.data as KpiPayload;
          setKpis({
            totalUsers: payload.totalUsers,
            totalPosts: payload.totalPosts,
            totalCampaigns: payload.totalCampaigns,
            totalDonations: payload.totalDonations,
            newContactMessages: payload.newContactMessages ?? 0,
            totalContactMessages: payload.totalContactMessages ?? 0
          });
        }
      } catch {
        setLoadError(true);
      }
    };
    void load();
  }, []);

  const chartData = [
    { label: "Users", value: kpis.totalUsers },
    { label: "Posts", value: kpis.totalPosts },
    { label: "Campaigns", value: kpis.totalCampaigns },
    { label: "Donations", value: Math.round(kpis.totalDonations) }
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Overview of platform activity. Use the sidebar to open campaigns, moderation, members, and site content."
      />
      {loadError ? (
        <p className="mb-6 text-sm text-secondary">Could not load KPIs. Check your session and API.</p>
      ) : null}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Total users" value={kpis.totalUsers} icon={<Users className="h-5 w-5" />} tint="primary" />
        <AdminStatCard label="Campaigns" value={kpis.totalCampaigns} icon={<HeartHandshake className="h-5 w-5" />} tint="accent" />
        <AdminStatCard label="Community posts" value={kpis.totalPosts} icon={<MessageSquare className="h-5 w-5" />} tint="muted" />
        <AdminStatCard
          label="New contact messages"
          value={kpis.newContactMessages ?? 0}
          icon={<Mail className="h-5 w-5" />}
          tint="secondary"
        />
        <AdminStatCard
          label="Donations (PKR)"
          value={Math.round(kpis.totalDonations).toLocaleString()}
          icon={<Wallet className="h-5 w-5" />}
          tint="secondary"
        />
      </div>
      <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-card md:p-6">
        <p className="mb-4 text-sm font-semibold text-foreground">Activity snapshot</p>
        <div className="h-72 w-full min-w-0 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="label" stroke="var(--text-tertiary)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)"
                }}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
