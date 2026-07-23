"use client";

import Link from "next/link";
import type { AppLang } from "@/lib/lang";
import { NAV_COPY } from "@/lib/lang";

export type TravelerProfileData = {
  profile_type: string;
  profile_essence?: string | null;
  quote?: string | null;
  tags?: string[];
  stats?: { label: string; value: string }[];
};

type Props = {
  lang: AppLang;
  profile: TravelerProfileData;
  showCta?: boolean;
};

export function TravelerProfileCard({ lang, profile, showCta = false }: Props) {
  const copy = NAV_COPY[lang].perfil;
  const stats = profile.stats?.slice(0, 3) || [];

  return (
    <article className="rounded-[8px] overflow-hidden border border-[#E5E2DC] bg-white">
      <div className="bg-white px-6 pt-7 pb-5 sm:px-8">
        <p className="text-[0.65rem] tracking-[0.16em] uppercase text-[#6B6B6B] font-normal m-0 mb-2">
          {copy.eyebrow}
        </p>
        <h2 className="text-[1.55rem] sm:text-[1.65rem] font-medium tracking-tight leading-snug text-[#1A1A1A] m-0">
          {profile.profile_type}
        </h2>
        {profile.profile_essence ? (
          <p className="mt-3 text-[0.9rem] leading-relaxed text-[#6B6B6B] m-0">
            {profile.profile_essence}
          </p>
        ) : null}
        {profile.tags && profile.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.tags.map((t) => (
              <span
                key={t}
                className="text-[0.7rem] text-[#6B6B6B] border border-[#E5E2DC] rounded px-2.5 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
        {profile.quote ? (
          <p className="mt-4 pt-4 border-t border-[#E5E2DC] text-[0.9rem] italic text-[#6B6B6B] leading-relaxed m-0">
            {profile.quote}
          </p>
        ) : null}
      </div>

      {stats.length > 0 ? (
        <div className="bg-[#FAF8F4] border-t border-[#E5E2DC] px-6 py-4 sm:px-8 flex gap-6 flex-wrap justify-between">
          {stats.map((s) => (
            <div key={s.label} className="text-center min-w-[4.5rem]">
              <div className="text-base font-medium text-[#1A1A1A]">{s.value}</div>
              <div className="text-[0.62rem] uppercase tracking-wide text-[#6B6B6B]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {showCta ? (
        <div className="border-t border-[#E5E2DC] px-6 py-4 sm:px-8 bg-[#FAF8F4]">
          <Link
            href="/explorar?mode=trip"
            className="inline-flex w-full justify-center items-center px-5 py-3 rounded-[7px] bg-[#E8634A] text-white text-sm font-medium no-underline hover:opacity-90 transition-opacity"
          >
            {copy.emptyCta}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
