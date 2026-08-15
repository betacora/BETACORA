"use client";

import type { VisitSuggestion } from "@/lib/visitSuggestions";

export type VisitCardsCopy = {
  title: string;
  subtitle: string;
  selectedCount: string;
  hint: string;
};

type Props = {
  suggestions: VisitSuggestion[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  copy: VisitCardsCopy;
  cityName: string;
};

/**
 * Toggle cards for visit suggestions — same selected/rest discipline as
 * questionnaire options (1% rule: teal only when selected).
 */
export function VisitSuggestionCards({
  suggestions,
  selectedIds,
  onToggle,
  copy,
  cityName,
}: Props) {
  const selectedCount = selectedIds.size;
  const countLabel = copy.selectedCount
    .replace("{n}", String(selectedCount))
    .replace("{city}", cityName);

  return (
    <section aria-label={copy.title}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-base font-medium tracking-tight text-[#111827] m-0">
            {copy.title.replace("{city}", cityName)}
          </h2>
          <p className="mt-1.5 text-sm text-[#6B7280] leading-relaxed m-0">
            {copy.subtitle}
          </p>
        </div>
        <p className="text-sm text-[#6B7280] m-0 shrink-0" aria-live="polite">
          {countLabel}
        </p>
      </div>

      <p className="mt-3 text-[0.8125rem] text-[#6B7280] m-0">{copy.hint}</p>

      <ul className="mt-4 m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s) => {
          const selected = selectedIds.has(s.id);
          return (
            <li key={s.id} className="m-0 p-0">
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onToggle(s.id)}
                className={[
                  "w-full h-full text-left rounded-[8px] border px-4 py-4 cursor-pointer transition-[border-color,background-color] duration-150",
                  selected
                    ? "border-[#2D7B7B] bg-[#E8F2F2]"
                    : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={[
                      "text-[0.9375rem] font-medium m-0 leading-snug",
                      selected ? "text-[#2D7B7B]" : "text-[#111827]",
                    ].join(" ")}
                  >
                    {s.name}
                  </p>
                  <span
                    aria-hidden
                    className={[
                      "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border text-[0.65rem] font-medium",
                      selected
                        ? "border-[#2D7B7B] bg-[#2D7B7B] text-white"
                        : "border-[#E5E7EB] bg-white text-transparent",
                    ].join(" ")}
                  >
                    ✓
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#6B7280] leading-relaxed m-0">
                  {s.blurb}
                </p>
                {s.practical_note ? (
                  <p className="mt-2 text-[0.75rem] text-[#6B7280] m-0 leading-snug">
                    {s.practical_note}
                  </p>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
