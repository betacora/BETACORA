import type { Metadata } from "next";
import { AboutPage } from "@/components/AboutPage";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata("about", "en", "/about");

export default function AboutRoutePage() {
  return <AboutPage lang="en" />;
}
