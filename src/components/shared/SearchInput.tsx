"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchInput({ placeholder = "Buscar...", onChange, className = "" }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474c]/50 pointer-events-none" />
      <input
        type="search"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[#c4c6cd] bg-white text-[#041627] placeholder:text-[#44474c]/50 focus:outline-none focus:ring-2 focus:ring-[#041627]/20 focus:border-[#041627] transition-all"
      />
    </div>
  );
}
