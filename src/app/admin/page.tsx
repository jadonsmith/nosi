import type { Metadata } from "next";
import { headers } from "next/headers";
import { getHostSummaries } from "@/lib/queries";
import { env } from "@/lib/env";
import { CopyButton } from "@/components/copy-button";
import { AdminHostList } from "@/components/admin-host-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const [{ hosts }, hdrs] = await Promise.all([getHostSummaries(), headers()]);

  const host = hdrs.get("host") ?? "nosi.example.com";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const token = env.ingestToken || "(INGEST_TOKEN not set)";

  const installCmd = `curl -fsSL ${base}/nosi-agent.sh -o /usr/local/bin/nosi-agent.sh && chmod +x /usr/local/bin/nosi-agent.sh
sudo NOSI_URL=${base} NOSI_TOKEN=${token} /usr/local/bin/nosi-agent.sh`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Manage hosts and connect new agents.
        </p>
      </div>

      <section className="mb-8 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="mb-3 text-sm font-medium">Connect an agent</h2>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Ingest endpoint</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              {base}/api/report
            </code>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Bearer token</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              {token}
            </code>
            <CopyButton value={token} label="Copy token" />
          </div>
          <div>
            <p className="mb-1 text-muted-foreground">
              Quick install on a host (run as root):
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
              {installCmd}
            </pre>
            <div className="mt-2">
              <CopyButton value={installCmd} label="Copy install script" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium">Hosts</h2>
        <AdminHostList hosts={hosts} />
      </section>
    </main>
  );
}
