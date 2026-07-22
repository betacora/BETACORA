"use client";

import { useEffect, useRef, useState } from "react";
import {
  countries,
  localized,
  MIN_QUERY_LEN,
  searchCountries,
  type CountryEntry,
  type Lang,
} from "@/lib/geo";

type CountrySelectorProps = {
  value: string;
  onChange: (countryName: string) => void;
  placeholder?: string;
  required?: boolean;
  lang?: Lang;
};

export function CountrySelector({
  value,
  onChange,
  placeholder = "Busca tu país...",
  required,
  lang = "es",
}: CountrySelectorProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CountryEntry | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const match = countries.find(
        (c) =>
          c.name.es === value ||
          c.name.en === value ||
          c.name.fr === value
      );
      if (match) setSelected(match);
    } else {
      setSelected(null);
    }
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 220);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const results =
    debouncedQuery.trim().length >= MIN_QUERY_LEN
      ? searchCountries(debouncedQuery, 20, lang)
      : [];

  function pick(country: CountryEntry) {
    setSelected(country);
    onChange(country.name.es);
    setQuery("");
    setDebouncedQuery("");
    setOpen(false);
  }

  function clear() {
    setSelected(null);
    onChange("");
    setQuery("");
    setDebouncedQuery("");
  }

  return (
    <div ref={wrapRef} className="relative">
      {selected ? (
        <div className="flex items-center justify-between rounded-[7px] px-4 py-3 border border-[#E5E2DC] bg-white">
          <span className="text-base text-[#1A1A1A]">
            <span className="mr-2 text-sm" aria-hidden="true">
              {selected.flag}
            </span>
            {localized(selected.name, lang)}
          </span>
          <button
            type="button"
            onClick={clear}
            className="text-sm text-[#E8634A] bg-transparent border-0 cursor-pointer font-medium"
            aria-label="Quitar país"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D7B7B] pointer-events-none"
              aria-hidden="true"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              placeholder={placeholder}
              autoComplete="off"
              required={required}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className={`${inputClass} pl-10`}
            />
          </div>
          {open && results.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-[7px] border border-[#E5E2DC] bg-white list-none p-1 m-0">
              {results.map((c) => (
                <li key={c.isoCode}>
                  <button
                    type="button"
                    onClick={() => pick(c)}
                    className="w-full text-left px-3 py-2.5 rounded-[6px] hover:bg-[#FFF5F2] border-0 bg-transparent cursor-pointer text-base text-[#1A1A1A]"
                  >
                    <span className="mr-2 text-sm" aria-hidden="true">
                      {c.flag}
                    </span>
                    {localized(c.name, lang)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-[7px] px-4 py-3 text-base border border-[#E5E2DC] outline-none transition-colors focus:border-[#2D7B7B] bg-white text-[#1A1A1A] placeholder:text-[#9a9590]";
