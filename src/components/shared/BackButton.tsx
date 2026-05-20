"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href, label = "Volver" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#fea520] text-[#041627] text-sm font-bold shadow-sm hover:bg-[#865300] hover:text-white transition-all"
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
