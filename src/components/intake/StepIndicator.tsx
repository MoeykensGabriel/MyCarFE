import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps:   string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const step   = i + 1;
        const done   = step < current;
        const active = step === current;

        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                  done
                    ? "bg-[#fea520] text-[#041627]"
                    : active
                    ? "bg-[#041627] text-white ring-4 ring-[#041627]/10"
                    : "bg-white border-2 border-[#c4c6cd] text-[#44474c]"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : step}
              </div>
              <span
                className={`text-sm font-medium ${
                  active ? "text-[#041627]" : done ? "text-[#44474c]" : "text-[#c4c6cd]"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-3 h-px w-10 transition-colors ${
                  done ? "bg-[#fea520]" : "bg-[#c4c6cd]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
