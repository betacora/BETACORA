import type { Metadata } from "next";
import { AboutPage } from "@/components/AboutPage";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  "about",
  "es",
  "/sobre-nosotros"
);

export default function SobreNosotrosPage() {
  return <AboutPage lang="es" />;
}
