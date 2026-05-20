"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface ComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Combobox({ options, value, onChange, placeholder = "Escribir o seleccionar...", disabled = false }: ComboboxProps) {
  const [query,  setQuery]  = useState(value);
  const [open,   setOpen]   = useState(false);
  const containerRef        = useRef<HTMLDivElement>(null);

  // Sync display when value changes externally (e.g. reset)
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  function select(option: string) {
    onChange(option);
    setQuery(option);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);   // allow free text
    setOpen(true);
  }

  function handleBlur() {
    // pequeño delay para que el click en una opción se registre primero
    setTimeout(() => setOpen(false), 150);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] placeholder:text-[#44474c]/50 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <ChevronDown
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/50 pointer-events-none transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-[#c4c6cd] bg-white shadow-lg">
          {filtered.map((option) => (
            <li key={option}>
              <button
                type="button"
                onMouseDown={() => select(option)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-left text-[#041627] hover:bg-[#eefcfd] transition-colors"
              >
                {option}
                {option === value && <Check className="w-3.5 h-3.5 text-[#fea520] shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
