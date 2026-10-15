import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHostDetail } from "@/lib/queries";
import { isAuthed } from "@/lib/auth";
import { HostDetailView } from "@/components/host-detail-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/hosts/[hostname]">): Promise<Metadata> {
  const { hostname } = await params;
  return { title: decodeURIComponent(hostname) };
}

export default async function HostPage({
  params,
  searchParams,
}: PageProps<"/hosts/[hostname]">) {
  const [{ hostname }, sp] = await Promise.all([params, searchParams]);
  const range = typeof sp.range === "string" ? sp.range : "24h";
  const [detail, canAdmin] = await Promise.all([
    getHostDetail(decodeURIComponent(hostname), range),
    isAuthed(),
  ]);
  if (!detail) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <HostDetailView initial={detail} canAdmin={canAdmin} />
    </main>
  );
}
