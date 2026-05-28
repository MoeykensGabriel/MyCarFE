"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Layers,
  Package,
  Wrench,
  XCircle,
} from "lucide-react";

import { workOrdersService } from "@/services/work-orders.service";
import {
  ApprovalPartItem,
  ApprovalServiceItem,
  ApproveQuotePreview,
} from "@/types/api.types";
import { formatCurrency } from "@/lib/format";
import { WorkOrderPartTier, WorkOrderPartTierLabel } from "@/lib/enums";

type PageState = "loading" | "preview" | "approving" | "success" | "error";

// ─── Utilidades de agrupación ────────────────────────────────────────────────

interface ItemRow {
  kind: "service" | "part";
  id: string;
  name: string;
  description?: string | null;
  productCode?: string | null;
  tier?: WorkOrderPartTier;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  alternativeGroupId?: string | null;
}

/** Separa items en standalone (checkbox) y groups (radio). */
function partition(items: ItemRow[]): {
  standalone: ItemRow[];
  groups: Map<string, ItemRow[]>;
} {
  const standalone: ItemRow[] = [];
  const groups = new Map<string, ItemRow[]>();
  for (const it of items) {
    if (!it.alternativeGroupId) {
      standalone.push(it);
      continue;
    }
    const arr = groups.get(it.alternativeGroupId) ?? [];
    arr.push(it);
    groups.set(it.alternativeGroupId, arr);
  }
  // Si un grupo tiene un solo item, lo tratamos como standalone (defensa: no debería pasar
  // porque el BE valida ≥2 al enviar, pero protegemos al usuario de una UI rota).
  for (const [gid, arr] of groups) {
    if (arr.length < 2) {
      standalone.push(...arr);
      groups.delete(gid);
    }
  }
  return { standalone, groups };
}

function serviceToRow(s: ApprovalServiceItem): ItemRow {
  return {
    kind:               "service",
    id:                 s.id,
    name:               s.name,
    description:        s.description,
    quantity:           s.quantity,
    unitPrice:          s.unitPrice,
    subtotal:           s.subtotal,
    alternativeGroupId: s.alternativeGroupId ?? null,
  };
}

function partToRow(p: ApprovalPartItem): ItemRow {
  return {
    kind:               "part",
    id:                 p.id,
    name:               p.name,
    productCode:        p.productCode,
    tier:               p.tier,
    quantity:           p.quantity,
    unitPrice:          p.unitPrice,
    subtotal:           p.subtotal,
    alternativeGroupId: p.alternativeGroupId ?? null,
  };
}

// ─── Página ───────────────────────────────────────────────────────────────────

// useSearchParams() obliga a un boundary de Suspense para el prerender de producción
// (sino el build de Next falla). Envolvemos el contenido real en <Suspense>.
export default function ApprovePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#f5f6f8] px-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-4 border-[#041627] border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-[#44474c]">Cargando tu presupuesto...</p>
          </div>
        </main>
      }
    >
      <ApproveContent />
    </Suspense>
  );
}

function ApproveContent() {
  const searchParams = useSearchParams();
  const token        = searchParams.get("token");

  const [state,    setState]    = useState<PageState>("loading");
  const [preview,  setPreview]  = useState<ApproveQuotePreview | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Selección: items standalone aprobados + elección por grupo
  const [approvedStandaloneIds, setApprovedStandaloneIds] = useState<Set<string>>(new Set());
  const [groupSelection,        setGroupSelection]        = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!token) {
      setErrorMsg("El link de aprobación no es válido.");
      setState("error");
      return;
    }

    workOrdersService.getApprovePreview(token)
      .then((data) => {
        if (data.isExpired) {
          setErrorMsg("El link de aprobación expiró o ya fue utilizado. Pedile al taller que genere uno nuevo.");
          setState("error");
          return;
        }

        // Default: marcamos todos los standalone como aprobados (UX cómoda — el cliente
        // los puede desmarcar). Los grupos arrancan sin selección — el cliente debe elegir.
        const rows = [...data.services.map(serviceToRow), ...data.parts.map(partToRow)];
        const { standalone } = partition(rows);
        setApprovedStandaloneIds(new Set(standalone.map((r) => r.id)));

        setPreview(data);
        setState("preview");
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail ?? err?.response?.data?.title;
        setErrorMsg(detail ?? "No se pudo cargar el presupuesto. El link puede haber expirado.");
        setState("error");
      });
  }, [token]);

  // ── Derivados ───────────────────────────────────────────────────────────────

  const allRows = useMemo<ItemRow[]>(() => {
    if (!preview) return [];
    return [...preview.services.map(serviceToRow), ...preview.parts.map(partToRow)];
  }, [preview]);

  const { standalone, groups } = useMemo(() => partition(allRows), [allRows]);

  // IDs aprobados finales: standalones tildados + elegido de cada grupo
  const approvedIds = useMemo(() => {
    const ids = new Set<string>(approvedStandaloneIds);
    for (const picked of groupSelection.values()) ids.add(picked);
    return ids;
  }, [approvedStandaloneIds, groupSelection]);

  const totalSelected = useMemo(
    () => allRows.filter((r) => approvedIds.has(r.id)).reduce((acc, r) => acc + r.subtotal, 0),
    [allRows, approvedIds],
  );

  const allGroupsResolved = useMemo(
    () => Array.from(groups.keys()).every((gid) => groupSelection.has(gid)),
    [groups, groupSelection],
  );

  const atLeastOneApproved = approvedIds.size > 0;
  const canSubmit          = allGroupsResolved && atLeastOneApproved && state === "preview";

  // ── Handlers ────────────────────────────────────────────────────────────────

  function toggleStandalone(id: string) {
    setApprovedStandaloneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else              next.add(id);
      return next;
    });
  }

  function pickFromGroup(groupId: string, itemId: string) {
    setGroupSelection((prev) => {
      const next = new Map(prev);
      next.set(groupId, itemId);
      return next;
    });
  }

  async function handleApprove() {
    if (!token || !preview || !canSubmit) return;
    setState("approving");
    try {
      const approvedServiceIds: string[] = [];
      const approvedPartIds:    string[] = [];
      for (const r of allRows) {
        if (!approvedIds.has(r.id)) continue;
        if (r.kind === "service") approvedServiceIds.push(r.id);
        else                      approvedPartIds.push(r.id);
      }
      await workOrdersService.approveQuote(token, { approvedServiceIds, approvedPartIds });
      setState("success");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; title?: string } } };
      const detail = e?.response?.data?.detail ?? e?.response?.data?.title;
      setErrorMsg(detail ?? "No se pudo aprobar el presupuesto.");
      setState("error");
    }
  }

  // ── Estados terminales ──────────────────────────────────────────────────────

  if (state === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f6f8] px-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#041627] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-[#44474c]">Cargando tu presupuesto...</p>
        </div>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f6f8] px-4">
        <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-[#041627]">No pudimos procesar tu aprobación</h1>
          <p className="text-sm text-[#44474c]">{errorMsg}</p>
        </div>
      </main>
    );
  }

  if (state === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f6f8] px-4">
        <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h1 className="text-xl font-bold text-[#041627]">¡Presupuesto aprobado!</h1>
          <p className="text-sm text-[#44474c]">
            Quedó registrada tu aprobación. Te avisaremos cuando comencemos a trabajar en el vehículo.
          </p>
        </div>
      </main>
    );
  }

  if (!preview) return null;

  // ── Vista preview con selección ─────────────────────────────────────────────

  // Filtramos por tipo para mostrar standalone separados en secciones,
  // pero los grupos los renderizamos en su propio bloque arriba (cross-type-safe).
  const standaloneServices = standalone.filter((r) => r.kind === "service");
  const standaloneParts    = standalone.filter((r) => r.kind === "part");
  const groupEntries       = Array.from(groups.entries());

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-4 py-10 pb-32">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#041627] text-white mb-2">
            <Wrench className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#041627]">Presupuesto de reparación</h1>
          <p className="text-sm text-[#44474c]">
            Hola <span className="font-semibold">{preview.customerName}</span>, elegí qué trabajos querés autorizar.
          </p>
        </div>

        {/* Vehículo */}
        <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#041627] text-white flex items-center justify-center shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#041627]">
              {preview.vehicleBrand} {preview.vehicleModel}
            </p>
            <p className="text-xs text-[#44474c] font-mono">{preview.vehicleLicensePlate}</p>
          </div>
        </div>

        {/* ── Grupos de alternativas (radio) ──────────────────────────────── */}
        {groupEntries.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 pl-1">
              Tenés que elegir una opción en cada grupo
            </p>
            {groupEntries.map(([groupId, items], idx) => (
              <GroupCard
                key={groupId}
                index={idx + 1}
                items={items}
                selectedId={groupSelection.get(groupId)}
                onSelect={(id) => pickFromGroup(groupId, id)}
              />
            ))}
          </div>
        )}

        {/* ── Servicios standalone (checkbox) ─────────────────────────────── */}
        {standaloneServices.length > 0 && (
          <SectionCard title="Servicios" icon={<Wrench className="w-3.5 h-3.5" />}>
            {standaloneServices.map((r) => (
              <CheckboxRow
                key={r.id}
                row={r}
                checked={approvedStandaloneIds.has(r.id)}
                onToggle={() => toggleStandalone(r.id)}
              />
            ))}
          </SectionCard>
        )}

        {/* ── Repuestos standalone (checkbox) ─────────────────────────────── */}
        {standaloneParts.length > 0 && (
          <SectionCard title="Repuestos" icon={<Package className="w-3.5 h-3.5" />}>
            {standaloneParts.map((r) => (
              <CheckboxRow
                key={r.id}
                row={r}
                checked={approvedStandaloneIds.has(r.id)}
                onToggle={() => toggleStandalone(r.id)}
              />
            ))}
          </SectionCard>
        )}

        {/* Aviso legal */}
        <div className="flex items-start gap-2 rounded-md bg-[#fea520]/10 border border-[#fea520]/30 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-[#fea520] shrink-0 mt-0.5" />
          <p className="text-xs text-[#44474c]">
            Al aprobar autorizás los trabajos seleccionados y el cobro del monto total al momento de la entrega.
            Los items que dejes sin tildar no se realizarán.
          </p>
        </div>
      </div>

      {/* ── Footer fijo con total + botón ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#c4c6cd] shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#44474c]">Total a autorizar</p>
            <p className="text-xl font-bold text-[#041627] tabular-nums">
              {formatCurrency(totalSelected)}
            </p>
          </div>

          {!allGroupsResolved && (
            <p className="text-[11px] text-[#fea520] font-semibold">
              Falta elegir una opción en {groupEntries.length - groupSelection.size} grupo(s).
            </p>
          )}
          {allGroupsResolved && !atLeastOneApproved && (
            <p className="text-[11px] text-[#fea520] font-semibold">
              Tenés que aprobar al menos un item.
            </p>
          )}

          <button
            onClick={handleApprove}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold text-[#041627] bg-[#fea520] hover:bg-[#865300] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-5 h-5" />
            {state === "approving" ? "Aprobando..." : "Aprobar presupuesto"}
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-[#eefcfd] border-b border-[#c4c6cd]/60 flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70">
          {title}
        </p>
      </div>
      <div className="divide-y divide-[#c4c6cd]/40">{children}</div>
    </div>
  );
}

function CheckboxRow({
  row,
  checked,
  onToggle,
}: {
  row: ItemRow;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors ${
        checked ? "bg-[#eefcfd]/30" : "hover:bg-gray-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 w-4 h-4 rounded border-[#c4c6cd] text-[#041627] focus:ring-[#041627]"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#041627]">{row.name}</p>
        {row.description && (
          <p className="text-xs text-[#44474c]/70 mt-0.5">{row.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-[#44474c]/70">
          {row.productCode && <span className="font-mono">{row.productCode}</span>}
          {row.tier !== undefined && <span>{WorkOrderPartTierLabel[row.tier]}</span>}
          {row.quantity > 1 && (
            <span>{row.quantity} × {formatCurrency(row.unitPrice)}</span>
          )}
        </div>
      </div>
      <p className="text-sm font-semibold text-[#041627] shrink-0 tabular-nums">
        {formatCurrency(row.subtotal)}
      </p>
    </label>
  );
}

function GroupCard({
  index,
  items,
  selectedId,
  onSelect,
}: {
  index: number;
  items: ItemRow[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const resolved = !!selectedId;
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
        resolved ? "border-[#c4c6cd]" : "border-[#fea520]/50 ring-1 ring-[#fea520]/20"
      }`}
    >
      <div className="px-5 py-3 bg-[#fea520]/10 border-b border-[#fea520]/30 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-[#865300]" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#865300]">
          Opción {index} — elegí una
        </p>
      </div>
      <div className="divide-y divide-[#c4c6cd]/40">
        {items.map((it) => {
          const checked = selectedId === it.id;
          return (
            <label
              key={it.id}
              className={`flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors ${
                checked ? "bg-[#eefcfd]/30" : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name={`group-${items[0].alternativeGroupId}`}
                checked={checked}
                onChange={() => onSelect(it.id)}
                className="mt-1 w-4 h-4 border-[#c4c6cd] text-[#041627] focus:ring-[#041627]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#041627]">{it.name}</p>
                {it.description && (
                  <p className="text-xs text-[#44474c]/70 mt-0.5">{it.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-[#44474c]/70">
                  {it.productCode && <span className="font-mono">{it.productCode}</span>}
                  {it.tier !== undefined && <span>{WorkOrderPartTierLabel[it.tier]}</span>}
                  {it.quantity > 1 && (
                    <span>{it.quantity} × {formatCurrency(it.unitPrice)}</span>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold text-[#041627] shrink-0 tabular-nums">
                {formatCurrency(it.subtotal)}
              </p>
            </label>
          );
        })}
      </div>
    </div>
  );
}
