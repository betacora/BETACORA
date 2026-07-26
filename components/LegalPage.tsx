import Link from "next/link";
import type { ReactNode } from "react";
import { BrandWordmark } from "@/components/BrandWordmark";
import type { LegalBlock, LegalDoc } from "@/lib/legal-content";

function linkify(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re =
    /(\/privacidad|\/terminos|https?:\/\/[^\s)]+|www\.[^\s)]+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    const href = token.startsWith("www.") ? `https://${token}` : token;
    const external = href.startsWith("http");
    parts.push(
      <Link
        key={`l-${key++}`}
        href={href}
        className="text-[#2D7B7B] underline-offset-2 hover:underline"
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {token}
      </Link>,
    );
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "note":
      return (
        <aside className="rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-sm text-[#6B6B6B] leading-relaxed">
          {linkify(block.text)}
        </aside>
      );
    case "h2":
      return (
        <h2 className="mt-10 sm:mt-12 text-[1.15rem] sm:text-xl font-medium tracking-tight text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-8 text-[1.05rem] sm:text-lg font-medium tracking-tight text-[#1A1A1A] mb-3">
          {block.text}
        </h3>
      );
    case "p":
      return (
        <p className="text-[0.975rem] leading-[1.75] text-[#1A1A1A] mb-4 font-normal">
          {linkify(block.text)}
        </p>
      );
    case "ul":
      return (
        <ul className="list-disc pl-5 mb-4 space-y-2 text-[0.975rem] leading-[1.7] text-[#1A1A1A]">
          {block.items.map((item) => (
            <li key={item.slice(0, 64)}>{linkify(item)}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mb-6 overflow-x-auto border border-[#E5E5E5] rounded-[8px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAFAFA]">
              <tr>
                {block.headers.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 font-medium text-[#1A1A1A] border-b border-[#E5E5E5]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|").slice(0, 80)} className="align-top">
                  {row.map((cell, i) => (
                    <td
                      key={`${i}-${cell.slice(0, 32)}`}
                      className="px-3 py-2.5 text-[#1A1A1A] border-b border-[#E5E5E5] last:border-b-0 leading-relaxed"
                    >
                      {linkify(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#1A1A1A]">
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
        <Link
          href="/"
          className="text-sm text-[#6B6B6B] no-underline hover:text-[#1A1A1A] transition-colors"
        >
          Inicio
        </Link>
      </header>

      <article className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <h1 className="text-[1.65rem] sm:text-[2rem] md:text-[2.25rem] font-medium tracking-tight leading-snug text-[#1A1A1A]">
          {doc.title}
        </h1>
        <p className="mt-3 text-sm text-[#6B6B6B]">
          {doc.updatedLabel}: {doc.updatedValue}
        </p>

        <div className="mt-8">
          {doc.blocks.map((block, i) => (
            <Block
              key={`${block.type}-${i}-${"text" in block ? block.text.slice(0, 24) : i}`}
              block={block}
            />
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[#E5E5E5] flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link
            href="/privacidad"
            className="text-[#2D7B7B] no-underline hover:opacity-80"
          >
            Política de Privacidad
          </Link>
          <span className="text-[#E5E5E5]" aria-hidden="true">
            ·
          </span>
          <Link
            href="/terminos"
            className="text-[#2D7B7B] no-underline hover:opacity-80"
          >
            Términos de Uso
          </Link>
          <span className="text-[#E5E5E5]" aria-hidden="true">
            ·
          </span>
          <Link href="/" className="text-[#6B6B6B] no-underline hover:text-[#1A1A1A]">
            ← Inicio
          </Link>
        </div>
      </article>
    </main>
  );
}
