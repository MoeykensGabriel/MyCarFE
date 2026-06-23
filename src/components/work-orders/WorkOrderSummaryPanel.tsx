"use client";

import Link from "next/link";
import { Building2, Car, ChevronRight, ClipboardList, Clock, User } from "lucide-react";

import { WorkOrder } from "@/types/api.types";
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
                    
                    <div className="pt-1.5 space-y-1">
                      <Link
                        href={`/admin/fleets/${order.fleetIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                      >
                        Ver flota <ChevronRight className="w-3 h-3" />
                      </Link>
                      <br />
                      <Link
                        href={`/admin/work-orders?fleetId=${order.fleetIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                      >
                        Otras órdenes de la flota <ChevronRight className="w-3 h-3" />
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
                    
                    <div className="pt-1.5 space-y-1">
                      <Link
                        href={`/admin/customers/${order.customerIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                      >
                        Ver ficha <ChevronRight className="w-3 h-3" />
                      </Link>
                      <br />
                      <Link
                        href={`/admin/work-orders?customerId=${order.customerIdAtEntry}`}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                      >
                        Otras órdenes <ChevronRight className="w-3 h-3" />
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
                  
                  <div className="pt-1.5 space-y-1">
                    <Link
                      href={`/admin/vehicles/${order.vehicleId}`}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                    >
                      Ver ficha <ChevronRight className="w-3 h-3" />
                    </Link>
                    <br />
                    <Link
                      href={`/admin/work-orders?vehicleId=${order.vehicleId}`}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                    >
                      Otras órdenes <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </dl>
              </div>
              
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
