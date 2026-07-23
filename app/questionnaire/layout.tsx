import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  "questionnaire",
  "es",
  "/questionnaire"
);

export default function QuestionnaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
