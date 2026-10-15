import type { Metadata } from "next";
import { getHostSummaries } from "@/lib/queries";
import { InfraGrid } from "@/components/infra-grid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Infrastructure" };

export default async function InfrastructurePage() {
  const initial = await getHostSummaries();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Infrastructure</h1>
        <p className="text-sm text-muted-foreground">
          One card per host — capacity, load, and location at a glance.
        </p>
      </div>
      <InfraGrid initial={initial} />
    </main>
  );
}
