import { redirect } from "next/navigation";

/** Guia tab was replaced by Descubre — keep old URL working. */
export default function GuiaRedirectPage() {
  redirect("/descubre");
}
