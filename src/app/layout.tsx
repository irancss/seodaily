import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Toaster } from "@/components/organisms/toaster";

import "./globals.css";

// Site-wide defaults; the public layout overrides them from the admin settings.
export const metadata: Metadata = {
  title: { default: "سئو دیلی", template: "%s | سئو دیلی" },
  description: "طراحی سایت و سئو",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa-IR" dir="rtl">
      <head>
        {/* All three weights are used above the fold (~26 KB each). */}
        <link rel="preload" href="/fonts/Vazir-Regular-FD-WOL.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/Vazir-Medium-FD-WOL.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/Vazir-Bold-FD-WOL.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
