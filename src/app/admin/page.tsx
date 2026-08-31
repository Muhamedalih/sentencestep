import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { getDashboardStats } from "@/lib/admin/content-queries";
import { modeMeta } from "@/lib/learning-modes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-muted-foreground mt-1 text-sm">{label}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const stats = await getDashboardStats();
  const totalLessons =
    stats.totalByMode.normal + stats.totalByMode.stories + stats.totalByMode.conversation;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">A quick look at SentenceStep&apos;s content.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ordinary lessons" value={stats.totalByMode.normal} />
        <StatCard label="Stories" value={stats.totalByMode.stories} />
        <StatCard label="Conversations" value={stats.totalByMode.conversation} />
        <StatCard label="Total content" value={totalLessons} />
        <StatCard label="Free" value={stats.freeCount} />
        <StatCard label="Premium" value={stats.premiumCount} />
        <StatCard label="Registered users" value={stats.userCount ?? "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recently added</CardTitle>
          <CardDescription>The last 5 pieces of content created.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {stats.recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">No content yet.</p>
          ) : (
            stats.recent.map((item) => (
              <Link
                key={item.id}
                href={`/admin/content/${item.id}/edit`}
                className="hover:bg-muted flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
              >
                <span className="min-w-0 truncate font-medium">{item.title}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {modeMeta[item.mode].title} · Level {item.level}
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Link href="/admin/content" className="text-primary text-sm font-medium hover:underline">
        Manage all content →
      </Link>
    </div>
  );
}
