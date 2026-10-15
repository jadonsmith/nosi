import type { Metadata } from "next";
import { getHostSummaries } from "@/lib/queries";
import { WorldMap } from "@/components/world-map";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Map" };

export default async function MapPage() {
  const initial = await getHostSummaries();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Map</h1>
        <p className="text-sm text-muted-foreground">
          Where your fleet lives. Colour shows current status.
        </p>
      </div>
      <WorldMap initial={initial} />
    </main>
  );
}
