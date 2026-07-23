import type { Metadata } from "next";
import { AboutPage } from "@/components/AboutPage";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata("about", "fr", "/a-propos");

export default function AProposPage() {
  return <AboutPage lang="fr" />;
}
