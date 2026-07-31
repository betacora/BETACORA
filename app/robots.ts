import type { MetadataRoute } from "next";
import {
  ABOUT_PATH,
  PRIVACY_PATH,
  SITE_URL,
  TERMS_PATH,
} from "@/lib/site";

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
          ABOUT_PATH.es,
          ABOUT_PATH.en,
          ABOUT_PATH.fr,
          PRIVACY_PATH,
          TERMS_PATH,
        ],
        disallow: [
          "/api/",
          "/viaje/",
          "/viajes/",
          "/inicio/",
          "/perfil/",
          "/guia/",
          "/descubre/",
          "/inspiracion/",
          "/vuelos/",
          "/alojamientos/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
