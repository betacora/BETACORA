import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { PRIVACY_DOC } from "@/lib/legal-content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de Privacidad — BeTacora",
  description:
    "Política de Privacidad de BeTacora: cómo tratamos tus datos de cuenta, perfil viajero e itinerarios.",
  alternates: { canonical: `${SITE_URL}/privacidad` },
};

export default function PrivacidadPage() {
  return <LegalPage doc={PRIVACY_DOC} />;
}
