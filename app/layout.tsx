import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { AnalyticsBridge } from "@/components/AnalyticsBridge";
import { SplashScreen } from "./splash-screen";
import { SwRegister } from "./sw-register";
import { buildJsonLd, buildPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const homeMeta = buildPageMetadata("home", "es", "/");

export const metadata: Metadata = {
  ...homeMeta,
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BeTacora",
  },
  icons: {
    icon: [
      { url: "/icon-192.png?v=4", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=4", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png?v=4",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

const jsonLd = buildJsonLd();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" style={{ background: "#FFFFFF" }}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `#app-splash{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#FFFFFF}html,body{background:#FFFFFF}`,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png?v=4" type="image/png" sizes="192x192" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BeTacora" />
        <link rel="apple-touch-icon" href="/icon-192.png?v=4" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#FFFFFF]">
        <SplashScreen />
        <SwRegister />
        {children}
        <AnalyticsBridge />
        <Analytics />
      </body>
    </html>
  );
}
