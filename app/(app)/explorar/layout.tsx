import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  "questionnaire",
  "es",
  "/explorar"
);

export default function ExplorarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
