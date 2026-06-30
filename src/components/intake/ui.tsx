/**
 * Primitivos de UI compartidos dentro del wizard de intake.
 * Field, Section, StepNav, Tag, SummaryItem.
 */
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        className={`flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
          error ? "text-red-500" : "text-[#041627]"
        }`}
      >
        <span>
          {label}
          {required && <span className="text-[#fea520] ml-0.5">*</span>}
        </span>
        {error && (
          <span className="inline-flex items-center gap-1 normal-case tracking-normal text-[10px] font-semibold text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-2.5 h-2.5 shrink-0" />
            inválido
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-red-600 mt-1 px-2 py-1.5 rounded-md bg-red-50 border border-red-200/60 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#041627]/50">{title}</p>
        <div className="flex-1 h-px bg-[#c4c6cd]/50" />
      </div>
      {children}
    </div>
  );
}

// ─── StepNav ──────────────────────────────────────────────────────────────────

interface StepNavProps {
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  isSubmit?: boolean;
}

export function StepNav({
  onBack,
  onNext,
  nextLabel = "Siguiente",
  nextDisabled = false,
  loading = false,
  isSubmit = false,
}: StepNavProps) {
  return (
    <div className="flex justify-between items-center pt-4 border-t border-[#c4c6cd]/40 mt-2">
      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm text-[#44474c] hover:text-[#041627] transition-colors disabled:opacity-40"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>
      <button
        type={isSubmit ? "submit" : "button"}
        onClick={!isSubmit ? onNext : undefined}
        disabled={nextDisabled || loading}
        className="flex items-center gap-2 px-5 py-2 rounded-md bg-[#041627] text-white text-sm font-semibold hover:bg-[#041627]/80 transition-colors disabled:opacity-40"
      >
        {loading ? "Procesando..." : nextLabel}
        {!loading && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── Tag ──────────────────────────────────────────────────────────────────────

export function Tag({
  children,
  variant = "navy",
}: {
  children: React.ReactNode;
  variant?: "navy" | "amber";
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
        variant === "amber"
          ? "bg-[#fea520]/15 text-[#865300]"
          : "bg-[#041627]/10 text-[#041627]"
      }`}
    >
      {children}
    </span>
  );
}

// ─── SummaryItem ──────────────────────────────────────────────────────────────

export function SummaryItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">{label}</p>
      <p className="text-sm font-medium text-[#041627] mt-0.5">{value ?? "—"}</p>
    </div>
  );
}
