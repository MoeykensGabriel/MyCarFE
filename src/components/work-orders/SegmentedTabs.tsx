"use client";

export interface SegmentedTab<T extends string> {
  id: T;
  label: string;
  icon: React.ReactNode;
}

interface Props<T extends string> {
  tabs: SegmentedTab<T>[];
  current: T;
  onChange: (id: T) => void;
}

/** Selector de pestañas de los modales de alta (catálogo / puntual / planilla). */
export function SegmentedTabs<T extends string>({ tabs, current, onChange }: Props<T>) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit max-w-full overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
            current === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
