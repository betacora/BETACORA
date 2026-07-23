"use client";

import Link from "next/link";
import { BrandWordmark } from "@/components/BrandWordmark";

type Props = {
  title?: string;
  showWordmark?: boolean;
};

export function AppHeader({ title, showWordmark = true }: Props) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E2DC] bg-[#FAF8F4]/90 backdrop-blur-md px-4 py-3.5 flex items-center justify-between gap-3">
      <Link
        href="/inicio"
        className="flex items-center gap-2 no-underline min-w-0"
        aria-label="BeTacora"
      >
        <img
          src="/icon-512.png?v=4"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 rounded-[6px] object-contain shrink-0"
        />
        {showWordmark ? (
          <BrandWordmark className="text-base font-medium tracking-tight truncate" />
        ) : null}
      </Link>
      {title ? (
        <p className="text-sm font-medium text-[#1A1A1A] truncate m-0">{title}</p>
      ) : null}
    </header>
  );
}
