import { User, Building2, type LucideIcon } from "lucide-react";
import { IntakeMode } from "./types";

const MODES: { mode: IntakeMode; Icon: LucideIcon; title: string; description: string }[] = [
  {
    mode:        "particular",
    Icon:        User,
    title:       "Cliente particular",
    description: "Persona física con uno o más vehículos propios.",
  },
  {
    mode:        "fleet",
    Icon:        Building2,
    title:       "Empresa / Flota",
    description: "Empresa con múltiples vehículos y un contacto asignado.",
  },
];

export function Step0Mode({ onSelect }: { onSelect: (mode: IntakeMode) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {MODES.map(({ mode, Icon, title, description }) => (
        <button
          key={mode}
          onClick={() => onSelect(mode)}
          className="group flex flex-col items-start gap-3 rounded-lg border-2 border-[#c4c6cd] p-5 text-left hover:border-[#041627] hover:bg-[#041627]/[0.02] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-[#eefcfd] border border-[#c4c6cd] flex items-center justify-center group-hover:bg-[#fea520]/10 group-hover:border-[#fea520]/30 transition-colors">
            <Icon className="w-5 h-5 text-[#041627]" />
          </div>
          <div>
            <p className="font-semibold text-[#041627]">{title}</p>
            <p className="text-sm text-[#44474c] mt-0.5 leading-snug">{description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
