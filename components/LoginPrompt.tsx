"use client";

import Link from "next/link";

type Props = {
  title: string;
  body: string;
  cta: string;
  href?: string;
};

export function LoginPrompt({ title, body, cta, href = "/auth" }: Props) {
  return (
    <div className="rounded-[8px] border border-[#E5E7EB] bg-white p-7 text-center">
      <p className="text-lg font-medium text-[#111827] tracking-tight m-0">
        {title}
      </p>
      <p className="mt-2.5 text-sm text-[#6B7280] leading-relaxed m-0">{body}</p>
      <Link
        href={href}
        className="mt-6 inline-flex items-center justify-center w-full max-w-xs px-6 py-3 rounded-[8px] bg-[#2D7B7B] text-white font-medium text-sm no-underline hover:opacity-90 transition-opacity"
      >
        {cta}
      </Link>
    </div>
  );
}
