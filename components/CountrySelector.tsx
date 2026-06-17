"use client";

import { useEffect, useRef, useState } from "react";
import { countries, searchCountries, type CountryEntry } from "@/lib/geo";

type CountrySelectorProps = {
  value: string;
  onChange: (countryName: string) => void;
  placeholder?: string;
  required?: boolean;
};

export function CountrySelector({
  value,
  onChange,
  placeholder = "Busca tu país...",
  required,
}: CountrySelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CountryEntry | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const match = countries.find((c) => c.name === value);
      if (match) setSelected(match);
    } else {
      setSelected(null);
    }
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const results = searchCountries(query || (selected?.name ?? ""), 8);

  function pick(country: CountryEntry) {
    setSelected(country);
    onChange(country.name);
    setQuery("");
    setOpen(false);
  }

  function clear() {
    setSelected(null);
    onChange("");
    setQuery("");
  }

  return (
    <div ref={wrapRef} className="relative">
      {selected ? (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3 border bg-[#FAFAF8]"
          style={{ borderColor: "rgba(45,123,123,0.25)" }}
        >
          <span className="text-base">
            {selected.flag} {selected.name}
          </span>
          <button
            type="button"
            onClick={clear}
            className="text-sm text-[#E8634A] bg-transparent border-0 cursor-pointer font-semibold"
            aria-label="Quitar país"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2D7B7B]">
              🔍
            </span>
            <input
              type="text"
              value={query}
              placeholder={placeholder}
              autoComplete="off"
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className={`${inputClass} pl-10`}
            />
          </div>
          {open && results.length > 0 && (
            <ul
              className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border bg-white shadow-lg list-none p-1 m-0"
              style={{ borderColor: "rgba(45,123,123,0.2)" }}
            >
              {results.map((c) => (
                <li key={c.name}>
                  <button
                    type="button"
                    onClick={() => pick(c)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#F5EFE6] border-0 bg-transparent cursor-pointer text-base"
                  >
                    <span className="mr-2">{c.flag}</span>
                    {c.name}
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
  "w-full rounded-xl px-4 py-3 text-base border outline-none transition-colors focus:border-[#2D7B7B] border-gray-200 bg-[#FAFAF8]";
