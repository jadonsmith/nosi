import { getHostSummaries } from "@/lib/queries";
import { DashboardTable } from "@/components/dashboard-table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initial = await getHostSummaries();

  return (
    <main className="relative">
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-64" />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="brand-text mb-1 font-mono text-xs uppercase tracking-widest">
            Network Observation &amp; Status Interface
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live view of every host reporting to this NOSI instance.
          </p>
        </div>
        <DashboardTable initial={initial} />
      </div>
    </main>
  );
}
