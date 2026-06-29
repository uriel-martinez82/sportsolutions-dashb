'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import type { AsignacionTarget, CompraDisponible } from '@/types/entities';

interface AsignacionModalProps {
  target: AsignacionTarget;
  onClose: () => void;
  onSuccess: () => void;
}

const ACCENT = '#E8420C';

export default function AsignacionModal({ target, onClose, onSuccess }: AsignacionModalProps) {
  const [compras, setCompras] = useState<CompraDisponible[]>([]);
  const [asignaciones, setAsignaciones] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/compras?sku=${encodeURIComponent(target.sku)}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `Error ${res.status}`);
      }
      const data: CompraDisponible[] = await res.json();
      setCompras(data);
      const initial: Record<number, number> = {};
      data.forEach(c => { initial[c.rowIndexInSheet] = 0; });
      setAsignaciones(initial);
    } catch (e: any) {
      setFetchError(e.message ?? 'No se pudo cargar el stock disponible.');
    } finally {
      setLoading(false);
    }
  }, [target.sku]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const totalAsignado = Object.values(asignaciones).reduce((s, v) => s + (v || 0), 0);
  const faltan = target.cantidadRequerida - totalAsignado;
  const pct = target.cantidadRequerida > 0
    ? Math.min(100, (totalAsignado / target.cantidadRequerida) * 100)
    : 0;
  const completo = totalAsignado > 0 && faltan === 0;
  const parcial = totalAsignado > 0 && faltan > 0;

  const handleChange = (rowIndex: number, raw: string, maxDisponible: number) => {
    let val = Math.max(0, parseInt(raw) || 0);
    // No superar disponible de esta OC
    val = Math.min(val, maxDisponible);
    // No superar la cantidad total requerida
    const otros = Object.entries(asignaciones)
      .filter(([k]) => Number(k) !== rowIndex)
      .reduce((s, [, v]) => s + (v || 0), 0);
    val = Math.min(val, Math.max(0, target.cantidadRequerida - otros));
    setAsignaciones(prev => ({ ...prev, [rowIndex]: val }));
  };

  const handleConfirmar = async () => {
    const ocsConAsignacion = compras.filter(c => (asignaciones[c.rowIndexInSheet] || 0) > 0);
    if (!ocsConAsignacion.length) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Actualizar CANTIDAD_DISPONIBLE y CANTIDAD_APARTADA en cada OC de COMPRAS
      for (const oc of ocsConAsignacion) {
        const res = await fetch('/api/compras/asignar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rowIndex: oc.rowIndexInSheet,
            cantidadAsignar: asignaciones[oc.rowIndexInSheet],
          }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? `Error al actualizar OC ${oc.NUM_OC}`);
        }
      }

      // 2. Actualizar STATUS y ESTADO en la fila de VENTAS
      const status = completo ? 'Apartado' : 'Sin cobertura';
      const estado = completo ? 'Apartado' : 'Sin stock';

      const ventasRes = await fetch('/api/ventas/asignar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: target.ventaRowIndex,
          status,
          estado,
        }),
      });
      if (!ventasRes.ok) {
        const json = await ventasRes.json().catch(() => ({}));
        throw new Error(json.error ?? 'Error al actualizar la OV en VENTAS');
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      setSubmitError(e.message ?? 'Error al confirmar la asignación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-800 leading-tight">
              Asignar inventario —{' '}
              <span className="font-mono text-sm text-gray-600">{target.sku}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate" title={target.descripcion}>
              {target.descripcion}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              <span className="font-medium text-gray-600">{target.numOV}</span>
              {' · '}
              {target.cliente}
              {' · '}
              Requerido:{' '}
              <span className="font-semibold text-gray-700">
                {target.cantidadRequerida.toLocaleString('es-MX')} unidades
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 size={28} className="mx-auto text-gray-300 animate-spin mb-3" />
              <p className="text-sm text-gray-400">Buscando stock disponible para {target.sku}…</p>
            </div>
          ) : fetchError ? (
            <div className="py-16 text-center px-6">
              <AlertTriangle size={28} className="mx-auto text-orange-400 mb-2" />
              <p className="text-sm text-gray-600 mb-4">{fetchError}</p>
              <button
                onClick={fetchStock}
                className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
              >
                <RefreshCw size={12} />
                Reintentar
              </button>
            </div>
          ) : compras.length === 0 ? (
            <div className="py-16 text-center px-6">
              <AlertTriangle size={28} className="mx-auto text-orange-400 mb-2" />
              <p className="text-sm text-gray-500">
                No hay stock disponible para <span className="font-mono font-semibold">{target.sku}</span> en ninguna OC.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['NUM OC', 'Almacén', 'Disponible', 'Apartado', 'A asignar'].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compras.map(oc => {
                  const asignado = asignaciones[oc.rowIndexInSheet] || 0;
                  const otrosTotal = Object.entries(asignaciones)
                    .filter(([k]) => Number(k) !== oc.rowIndexInSheet)
                    .reduce((s, [, v]) => s + (v || 0), 0);
                  const maxInput = Math.min(oc.CANTIDAD_DISPONIBLE, Math.max(0, target.cantidadRequerida - otrosTotal));

                  return (
                    <tr key={oc.rowIndexInSheet} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">
                        {oc.NUM_OC || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
                          {oc.ALMACEN || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold text-green-700 tabular-nums">
                        {oc.CANTIDAD_DISPONIBLE.toLocaleString('es-MX')}
                      </td>
                      <td className="px-5 py-3 font-semibold text-orange-600 tabular-nums">
                        {oc.CANTIDAD_APARTADA.toLocaleString('es-MX')}
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          min={0}
                          max={maxInput}
                          value={asignado || ''}
                          placeholder="0"
                          onChange={e => handleChange(oc.rowIndexInSheet, e.target.value, oc.CANTIDAD_DISPONIBLE)}
                          className="w-24 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E8420C]/20 focus:border-[#E8420C] transition-colors"
                          style={{ colorScheme: 'light' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer — progreso + confirmar */}
        {!loading && !fetchError && compras.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 space-y-3 shrink-0">
            {/* Barra de progreso */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500">Unidades asignadas</span>
                <span className={`font-semibold tabular-nums ${completo ? 'text-green-600' : 'text-gray-700'}`}>
                  {totalAsignado.toLocaleString('es-MX')} / {target.cantidadRequerida.toLocaleString('es-MX')}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-200"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: completo ? '#10B981' : ACCENT,
                  }}
                />
              </div>
            </div>

            {/* Mensaje de estado */}
            {completo && (
              <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                <CheckCircle size={14} />
                Asignación completa — OV pasará a estado &quot;Apartado&quot;
              </div>
            )}
            {parcial && (
              <div className="flex items-center gap-2 text-xs text-orange-600">
                <AlertTriangle size={14} />
                {faltan.toLocaleString('es-MX')} {faltan === 1 ? 'unidad queda' : 'unidades quedan'} sin cubrir —
                OV pasará a &quot;Sin cobertura&quot;
              </div>
            )}

            {/* Error de submit */}
            {submitError && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Botón confirmar */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={totalAsignado === 0 || submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: ACCENT }}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? 'Procesando…' : 'Confirmar asignación'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
