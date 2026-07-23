import type { MetadataRoute } from "next";
import { ABOUT_PATH, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const aboutAlternates = {
    languages: {
      es: `${SITE_URL}${ABOUT_PATH.es}`,
      en: `${SITE_URL}${ABOUT_PATH.en}`,
      fr: `${SITE_URL}${ABOUT_PATH.fr}`,
    },
  };

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/explorar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/questionnaire`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/auth`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}${ABOUT_PATH.es}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: aboutAlternates,
    },
    {
      url: `${SITE_URL}${ABOUT_PATH.en}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: aboutAlternates,
    },
    {
      url: `${SITE_URL}${ABOUT_PATH.fr}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: aboutAlternates,
    },
  ];
}
