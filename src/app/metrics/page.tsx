import type { Metadata } from "next";
import { getHostSummaries } from "@/lib/queries";
import { MetricsExplorer } from "@/components/metrics-explorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Metrics" };

export default async function MetricsPage({
  searchParams,
}: PageProps<"/metrics">) {
  const [{ hosts }, sp] = await Promise.all([getHostSummaries(), searchParams]);
  const hostnames = hosts.map((h) => h.hostname);
  const initialHost =
    typeof sp.host === "string" ? sp.host : undefined;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Metrics</h1>
        <p className="text-sm text-muted-foreground">
          Historical CPU, memory, and disk usage per host.
        </p>
      </div>
      <MetricsExplorer hostnames={hostnames} initialHost={initialHost} />
    </main>
  );
}
