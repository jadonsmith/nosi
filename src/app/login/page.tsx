import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Admin login" };

export default function LoginPage() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
