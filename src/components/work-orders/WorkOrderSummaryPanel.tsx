"use client";

import Link from "next/link";
import { Building2, Car, ChevronRight, ClipboardList, Clock, User, ExternalLink } from "lucide-react";

import { WorkOrder } from "@/types/api.types";
import { SaleCondition, SaleConditionLabel } from "@/lib/enums";
import { formatDateTime, formatCurrency } from "@/lib/format";

interface Props {
  order: WorkOrder;
}

/**
 * Panel lateral (solo lectura) del detalle de la orden: tipo de ingreso, fechas,
 * cliente/empresa, vehículo y total estimado. Sigue el estilo visual de IntakeSummaryPanel.
 */
export function WorkOrderSummaryPanel({ order }: Props) {
  const vehicleLabel =
    [order.vehicleBrand, order.vehicleModel].filter(Boolean).join(" ") || "—";

  return (
          <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-[#041627] text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#fea520]" />
              <div>
                <p className="text-sm font-bold leading-none">Resumen de la orden</p>
                <p className="text-[10px] text-white/60 mt-0.5">Información general y del cliente</p>
              </div>
            </div>

            <div className="divide-y divide-[#c4c6cd]/40">
              {/* ── Tipo de ingreso & Fechas ─────────────────────────────────── */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Clock className="w-3.5 h-3.5 text-[#041627]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#041627]">
                    Detalles del ingreso
                  </p>
                </div>
                <div className="space-y-2 mt-2">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#fea520]/10 text-[#865300] border border-[#fea520]/30">
                      {order.fleetIdAtEntry ? "Flota / Empresa" : "Particular"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-[#c4c6cd]/20 pb-1.5">
                    <span className="text-[#44474c]/70 font-medium">Creada</span>
                    <span className="text-[#041627] font-semibold">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-[#c4c6cd]/20 pb-1.5">
                    <span className="text-[#44474c]/70 font-medium">Última actualización</span>
                    <span className="text-[#041627] font-semibold">{formatDateTime(order.updatedAt)}</span>
                  </div>
                  {order.mileageAtEntry != null && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#44474c]/70 font-medium">Kilometraje al ingreso</span>
                      <span className="text-[#041627] font-semibold">{order.mileageAtEntry.toLocaleString("es-AR")} km</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Cliente / Empresa ───────────────────────────────────────── */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  {order.fleetIdAtEntry ? (
                    <Building2 className="w-3.5 h-3.5 text-[#041627]" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-[#041627]" />
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#041627]">
                    {order.fleetIdAtEntry ? "Empresa" : "Cliente"}
                  </p>
                </div>
                
                {order.fleetIdAtEntry ? (
                  <div className="space-y-2">
                    <dl className="space-y-1 text-xs">
                      <p className="text-sm font-semibold text-[#041627]">{order.ownerName ?? "—"}</p>
                    </dl>
                    
                    <div className="pt-1.5 grid grid-cols-2 gap-2">
                      <Link
                        href={`/admin/fleets/${order.fleetIdAtEntry}`}
                        className="group flex items-center gap-2 rounded-lg border border-[#041627]/15 bg-[#eefcfd]/50 px-3 py-2 text-[11px] font-bold text-[#041627] hover:border-[#fea520]/60 hover:bg-[#fea520]/10 hover:text-[#865300] transition-all"
                      >
                        <Building2 className="w-3.5 h-3.5 text-[#041627]/60 group-hover:text-[#fea520] transition-colors shrink-0" />
                        <span className="truncate">Ver flota</span>
                        <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                      <Link
                        href={`/admin/work-orders?fleetId=${order.fleetIdAtEntry}`}
                        className="group flex items-center gap-2 rounded-lg border border-[#041627]/15 bg-white px-3 py-2 text-[11px] font-bold text-[#041627] hover:border-[#041627]/40 transition-all"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-[#44474c]/60 group-hover:text-[#041627] transition-colors shrink-0" />
                        <span className="truncate">Otras órdenes</span>
                        <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    </div>

                    {order.contactPersonName && (
                      <div className="pt-2 mt-2 border-t border-[#c4c6cd]/40">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474c]/70 mb-1">
                          Conductor / Entrega
                        </p>
                        <p className="text-xs font-semibold text-[#041627]">
                          {order.contactPersonName}
                        </p>
                        {order.contactPersonPhone && (
                          <p className="text-[11px] text-[#44474c]">
                            {order.contactPersonPhone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <dl className="space-y-1 text-xs">
                      <p className="text-sm font-semibold text-[#041627]">{order.ownerName ?? "—"}</p>
                    </dl>
                    
                    <div className="pt-1.5 grid grid-cols-2 gap-2">
                      <Link
                        href={`/admin/customers/${order.customerIdAtEntry}`}
                        className="group flex items-center gap-2 rounded-lg border border-[#041627]/15 bg-[#eefcfd]/50 px-3 py-2 text-[11px] font-bold text-[#041627] hover:border-[#fea520]/60 hover:bg-[#fea520]/10 hover:text-[#865300] transition-all"
                      >
                        <User className="w-3.5 h-3.5 text-[#041627]/60 group-hover:text-[#fea520] transition-colors shrink-0" />
                        <span className="truncate">Ver ficha</span>
                        <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                      <Link
                        href={`/admin/work-orders?customerId=${order.customerIdAtEntry}`}
                        className="group flex items-center gap-2 rounded-lg border border-[#041627]/15 bg-white px-3 py-2 text-[11px] font-bold text-[#041627] hover:border-[#041627]/40 transition-all"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-[#44474c]/60 group-hover:text-[#041627] transition-colors shrink-0" />
                        <span className="truncate">Otras órdenes</span>
                        <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Vehículo ────────────────────────────────────────────────── */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Car className="w-3.5 h-3.5 text-[#041627]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#041627]">
                    Vehículo
                  </p>
                </div>
                <dl className="space-y-1 text-xs">
                  <p className="text-sm font-semibold text-[#041627]">
                    {vehicleLabel}
                  </p>
                  {order.vehicleLicensePlate && (
                    <p className="font-mono text-[#44474c] uppercase">Patente {order.vehicleLicensePlate}</p>
                  )}
                </dl>
                  
                <div className="pt-1.5 grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/vehicles/${order.vehicleId}`}
                    className="group flex items-center gap-2 rounded-lg border border-[#041627]/15 bg-[#eefcfd]/50 px-3 py-2 text-[11px] font-bold text-[#041627] hover:border-[#fea520]/60 hover:bg-[#fea520]/10 hover:text-[#865300] transition-all"
                  >
                    <Car className="w-3.5 h-3.5 text-[#041627]/60 group-hover:text-[#fea520] transition-colors shrink-0" />
                    <span className="truncate">Ver ficha</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                  <Link
                    href={`/admin/work-orders?vehicleId=${order.vehicleId}`}
                    className="group flex items-center gap-2 rounded-lg border border-[#041627]/15 bg-white px-3 py-2 text-[11px] font-bold text-[#041627] hover:border-[#041627]/40 transition-all"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-[#44474c]/60 group-hover:text-[#041627] transition-colors shrink-0" />
                    <span className="truncate">Otras órdenes</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                </div>
              </div>
              
              {/* ── Condición de venta (lectura) ───────────────────────────────
                  Se carga al armar el presupuesto; acá queda como referencia de lo
                  pactado cuando la orden avanza y el editor ya no está a la vista. */}
              {order.saleCondition != null && (
                <div className="px-5 py-3 flex items-center justify-between gap-3 border-t border-[#c4c6cd]/40">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#041627]">
                    Condición de venta
                  </p>
                  <span className="text-xs font-semibold text-[#44474c] text-right">
                    {SaleConditionLabel[order.saleCondition]}
                    {order.saleCondition === SaleCondition.OrdenDeCompra && order.purchaseOrderNumber && (
                      <span className="block font-mono text-[11px] text-[#44474c]/80">
                        OC {order.purchaseOrderNumber}
                      </span>
                    )}
                    {order.saleCondition === SaleCondition.Contado && (
                      <span className="block text-[11px] text-[#44474c]/80">
                        Seña: {order.depositAmount ? formatCurrency(order.depositAmount) : "sin seña"}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* ── Monto Total en Resumen ─────────────────────────────────── */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100/30 flex items-center justify-between border-t border-[#c4c6cd]/40">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#041627]">
                    Total estimado
                  </p>
                </div>
                <span className="text-base font-black text-[#041627] tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
  );
}
