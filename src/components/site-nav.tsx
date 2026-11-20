"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, EyeIcon, LogOutIcon } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/infrastructure", label: "Infrastructure" },
  { href: "/metrics", label: "Metrics" },
  { href: "/map", label: "Map" },
];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => alive && setAuthed(Boolean(j.authed)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 pr-2">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-brand-from to-brand-to text-white shadow-sm">
            <EyeIcon className="size-4" />
          </span>
          <span className="brand-text text-lg font-semibold tracking-tight">
            NOSI
          </span>
        </Link>

        {/* On narrow screens the links scroll sideways so the controls on the right stay visible.
            self-stretch keeps the active underline inside the scroll box. */}
        <nav className="flex min-w-0 items-center gap-1 self-stretch overflow-x-auto [scrollbar-width:none]">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-2 -bottom-[11px] h-0.5 rounded-full bg-gradient-to-r from-brand-from to-brand-to" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <a
            href="https://jadon.me/"
            aria-label="Back to jadon.me"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground hover:text-foreground",
            )}
          >
            <ArrowLeftIcon />
            <span className="hidden sm:inline">jadon.me</span>
          </a>
          <ThemeToggle />
          {authed ? (
            <>
              <Link
                href="/admin"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Admin
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sign out"
                onClick={logout}
              >
                <LogOutIcon />
              </Button>
            </>
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Admin login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
