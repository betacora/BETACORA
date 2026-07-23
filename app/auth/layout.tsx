import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata("auth", "es", "/auth");

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
