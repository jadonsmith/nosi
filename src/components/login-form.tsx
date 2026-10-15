"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Incorrect password");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
    >
      <div className="mb-5 flex flex-col items-center gap-2 text-center">
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-from to-brand-to text-white">
          <EyeIcon className="size-5" />
        </span>
        <h1 className="text-lg font-semibold">Admin access</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to edit hosts and map pins.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className="mt-2 text-sm text-down">{error}</p>}

      <Button type="submit" className="mt-4 w-full" disabled={busy || !password}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
