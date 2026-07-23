import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { AnalyticsBridge } from "@/components/AnalyticsBridge";
import { SplashScreen } from "./splash-screen";
import { SwRegister } from "./sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeTacora — Tu bitácora inteligente",
  description:
    "El lugar donde vive toda tu vida como viajero. Tu bitácora inteligente · Your Smart Logbook",
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
  themeColor: "#2D7B7B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" style={{ background: "#FAF8F4" }}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `#app-splash{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#FAF8F4}html,body{background:#FAF8F4}`,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png?v=4" type="image/png" sizes="192x192" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BeTacora" />
        <link rel="apple-touch-icon" href="/icon-192.png?v=4" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#FAF8F4]">
        <SplashScreen />
        <SwRegister />
        {children}
        <AnalyticsBridge />
        <Analytics />
      </body>
    </html>
  );
}
