import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { Toaster } from "@/components/ui/sonner";
import { InlineScript } from "@/components/inline-script";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "NOSI", template: "%s · NOSI" },
  description:
    "Lightweight infrastructure monitoring — live host heartbeats, metrics, and a world map of your fleet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <InlineScript html={THEME_INIT_SCRIPT} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteNav />
        <div className="flex-1">{children}</div>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
