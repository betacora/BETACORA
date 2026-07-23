import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/explorar",
          "/questionnaire",
          "/auth",
          "/sobre-nosotros",
          "/about",
          "/a-propos",
        ],
        disallow: ["/api/", "/viaje/", "/viajes/", "/inicio/", "/perfil/", "/guia/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
