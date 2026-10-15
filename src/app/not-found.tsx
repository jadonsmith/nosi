import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="brand-text font-mono text-5xl font-semibold">404</p>
        <p className="text-muted-foreground">That page isn&apos;t here.</p>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
