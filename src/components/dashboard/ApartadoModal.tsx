'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

interface VentaApartada {
  NUM_OV: string;
  CLIENTE: string;
  CANTIDAD: string;
  FECHA_ENTREGA_CLIENTE: string;
  STATUS: string;
}

interface ApartadoModalProps {
  sku: string;
  numOC: string;
  onClose: () => void;
}

export default function ApartadoModal({ sku, numOC, onClose }: ApartadoModalProps) {
  const [ventas, setVentas] = useState<VentaApartada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/ventas?sku=${encodeURIComponent(sku)}&oc=${encodeURIComponent(numOC)}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `Error ${res.status}`);
      }
      setVentas(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'No se pudieron cargar las OVs apartadas.');
    } finally {
      setLoading(false);
    }
  }, [sku, numOC]);

  useEffect(() => { fetchVentas(); }, [fetchVentas]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-800 leading-tight">
              OVs con unidades apartadas
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              {sku}
              {numOC && <span className="ml-2 text-gray-300">·</span>}
              {numOC && <span className="ml-2">{numOC}</span>}
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
              <Loader2 size={26} className="mx-auto text-gray-300 animate-spin mb-3" />
              <p className="text-sm text-gray-400">Buscando OVs apartadas…</p>
            </div>
          ) : error ? (
            <div className="py-14 text-center px-6">
              <AlertTriangle size={26} className="mx-auto text-orange-400 mb-2" />
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchVentas}
                className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
              >
                <RefreshCw size={12} />
                Reintentar
              </button>
            </div>
          ) : ventas.length === 0 ? (
            <div className="py-14 text-center px-6">
              <p className="text-sm text-gray-500">
                No hay OVs apartadas para{' '}
                <span className="font-mono font-semibold">{sku}</span>.
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['NUM OV', 'Cliente', 'Cant. Apartada', 'Fecha Entrega', 'Status'].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ventas.map((v, i) => (
                  <tr
                    key={`${v.NUM_OV}-${i}`}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono font-semibold text-gray-700 whitespace-nowrap">
                      {v.NUM_OV || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate" title={v.CLIENTE}>
                      {v.CLIENTE || '—'}
                    </td>
                    <td className="px-5 py-3 font-bold text-orange-600 tabular-nums">
                      {v.CANTIDAD || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {v.FECHA_ENTREGA_CLIENTE || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium whitespace-nowrap">
                        {v.STATUS || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
