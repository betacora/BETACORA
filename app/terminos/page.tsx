import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { TERMS_DOC } from "@/lib/legal-content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Términos de Uso — BeTacora",
  description:
    "Términos y Condiciones de Uso de BeTacora: servicio, cuentas, itinerarios con IA y proveedores externos.",
  alternates: { canonical: `${SITE_URL}/terminos` },
};

export default function TerminosPage() {
  return <LegalPage doc={TERMS_DOC} />;
}
