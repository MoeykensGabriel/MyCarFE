import { Lock } from "lucide-react";

/**
 * Placeholder con candado para una función premium (plus) todavía no disponible
 * para el usuario. Se muestra en lugar de la función real cuando está bloqueada.
 */
export function PremiumLockCard({
  title,
  description = "Función premium — disponible próximamente.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <section className="relative bg-white rounded-2xl border border-dashed border-[#c4c6cd] shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="w-10 h-10 rounded-xl bg-[#041627]/5 border border-[#041627]/10 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-[#44474c]/60" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-extrabold text-[#041627]/70">{title}</p>
            <span className="inline-flex items-center text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#fea520]/15 text-[#865300] border border-[#fea520]/30">
              Próximamente
            </span>
          </div>
          <p className="text-xs text-[#44474c]/70 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </section>
  );
}
