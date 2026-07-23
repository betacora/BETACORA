import type { Metadata } from "next";
import { LandingPage } from "./landing-page";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata("home", "es", "/");

export default function Home() {
  return <LandingPage />;
}
