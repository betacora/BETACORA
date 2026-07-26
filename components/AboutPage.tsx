import Link from "next/link";
import { BrandWordmark } from "@/components/BrandWordmark";
import { HtmlLang } from "@/components/HtmlLang";
import { ABOUT_CONTENT, type AboutContent } from "@/lib/about-content";
import type { AppLang } from "@/lib/lang";
import { ABOUT_PATH } from "@/lib/site";

const LANG_LINKS: { lang: AppLang; label: string }[] = [
  { lang: "es", label: "ES" },
  { lang: "en", label: "EN" },
  { lang: "fr", label: "FR" },
];

export function AboutPage({ lang }: { lang: AppLang }) {
  const copy: AboutContent = ABOUT_CONTENT[lang];

  return (
    <main
      lang={lang}
      className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#1A1A1A]"
    >
      <HtmlLang lang={lang} />

      <header className="w-full px-5 py-5 sm:px-8 md:px-12 md:py-7 flex items-center justify-between gap-4 border-b border-[#E5E5E5]">
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline text-[#1A1A1A]"
          aria-label="BeTacora"
        >
          <img
            src="/icon-512.png?v=4"
            alt="BeTacora — bitácora inteligente de viajes"
            width={36}
            height={36}
            className="h-9 w-9 rounded-[7px] object-contain"
          />
          <BrandWordmark className="text-xl md:text-2xl font-medium tracking-tight" />
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5" aria-label="Language">
          {LANG_LINKS.map(({ lang: code, label }) => (
            <Link
              key={code}
              href={ABOUT_PATH[code]}
              hrefLang={code}
              className={`text-xs tracking-wide no-underline ${
                code === lang
                  ? "text-[#1A1A1A] border-b-[1.5px] border-[#E8634A] pb-0.5"
                  : "text-[#6B6B6B] hover:text-[#1A1A1A]"
              }`}
              aria-current={code === lang ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <article className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <p className="text-[0.65rem] tracking-[0.16em] uppercase text-[#2D7B7B] font-medium mb-3">
          {copy.eyebrow}
        </p>
        <h1 className="text-[1.65rem] sm:text-[2rem] md:text-[2.25rem] font-medium tracking-tight leading-snug text-[#1A1A1A]">
          {copy.title}
        </h1>
        <p className="mt-6 text-[1.05rem] leading-[1.75] text-[#1A1A1A] font-normal">
          {copy.lead}
        </p>

        {copy.sections.map((section) => (
          <section key={section.heading} className="mt-10 sm:mt-12">
            <h2 className="text-[1.15rem] sm:text-xl font-medium tracking-tight text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              {section.heading}
            </h2>
            {section.paragraphs.map((p) => (
              <p
                key={p.slice(0, 48)}
                className="text-[0.975rem] leading-[1.75] text-[#1A1A1A] mb-4 last:mb-0 font-normal"
              >
                {p}
              </p>
            ))}
          </section>
        ))}

        <section className="mt-10 sm:mt-12">
          {copy.faq.map((item, index) => (
            <div
              key={item.question}
              className={index === 0 ? undefined : "mt-10 sm:mt-12"}
            >
              {index === 0 ? (
                <h2 className="text-[1.15rem] sm:text-xl font-medium tracking-tight text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
                  {item.question}
                </h2>
              ) : (
                <h3 className="text-[1.05rem] sm:text-lg font-medium tracking-tight text-[#1A1A1A] mb-3">
                  {item.question}
                </h3>
              )}
              <p className="text-[0.975rem] leading-[1.75] text-[#1A1A1A] font-normal">
                {item.answer}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-12 pt-8 border-t border-[#E5E5E5] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Link
              href="/"
              className="text-[#6B6B6B] no-underline hover:text-[#1A1A1A]"
            >
              ← {copy.homeLabel}
            </Link>
            <span className="text-[#E5E5E5]" aria-hidden="true">
              ·
            </span>
            <Link
              href="/privacidad"
              className="text-[#2D7B7B] no-underline hover:opacity-80"
            >
              Privacidad
            </Link>
            <span className="text-[#E5E5E5]" aria-hidden="true">
              ·
            </span>
            <Link
              href="/terminos"
              className="text-[#2D7B7B] no-underline hover:opacity-80"
            >
              Términos
            </Link>
          </div>
          <Link
            href={copy.ctaHref}
            className="inline-flex justify-center px-8 py-3.5 rounded-[7px] bg-[#E8634A] text-white font-medium text-sm no-underline hover:opacity-90"
          >
            {copy.ctaLabel}
          </Link>
        </div>
      </article>
    </main>
  );
}
