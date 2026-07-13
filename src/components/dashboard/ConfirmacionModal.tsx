'use client';

import { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { OVRecord } from '@/types/entities';

export type ConfirmacionAccion = 'cancelar' | 'entregar';

interface ConfirmacionModalProps {
  accion: ConfirmacionAccion;
  record: OVRecord;
  onConfirm: () => void;
  onClose: () => void;
}

const TITULOS: Record<ConfirmacionAccion, string> = {
  cancelar: 'Cancelar SKU',
  entregar: 'Marcar como Entregado',
};

const ADVERTENCIAS: Record<ConfirmacionAccion, string> = {
  cancelar: 'La cantidad se pondrá en 0 y el stock volverá al inventario disponible. Esta acción no se puede deshacer.',
  entregar: 'Las unidades se restarán definitivamente del inventario apartado. Esta acción no se puede deshacer.',
};

export default function ConfirmacionModal({ accion, record, onConfirm, onClose }: ConfirmacionModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const esCancelar = accion === 'cancelar';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-gray-800">{TITULOS[accion]}</h2>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info del SKU */}
        <div className="px-6 py-4 space-y-3">
          <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 space-y-1.5 text-xs">
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-400 shrink-0">SKU</span>
              <span className="font-mono font-semibold text-gray-700 text-right">{record.SKU || '—'}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-400 shrink-0">Descripción</span>
              <span className="text-gray-600 text-right truncate max-w-[220px]" title={record.DESCRIPCION}>
                {record.DESCRIPCION || '—'}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-400 shrink-0">OV</span>
              <span className="font-semibold text-gray-700 text-right">{record.NUM_OV || '—'}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-400 shrink-0">Cliente</span>
              <span className="text-gray-600 text-right truncate max-w-[220px]" title={record.CLIENTE}>
                {record.CLIENTE || '—'}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-400 shrink-0">Cantidad</span>
              <span className="font-semibold text-gray-700 tabular-nums">{record.CANTIDAD || '—'}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-400 shrink-0">Almacén</span>
              <span className="text-gray-600 text-right">{record.ALMACEN || '—'}</span>
            </div>
            {record.NUM_OC?.trim() && (
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-400 shrink-0">OC asignada</span>
                <span className="font-mono font-semibold text-gray-700 text-right">{record.NUM_OC}</span>
              </div>
            )}
          </div>

          {/* Advertencia */}
          <div className="flex items-start gap-2.5 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-600" />
            <p className="text-xs text-yellow-800">{ADVERTENCIAS[accion]}</p>
          </div>
        </div>

        {/* Footer — acciones */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
          >
            Cancelar acción
          </button>
          <button
            onClick={onConfirm}
            className="text-sm px-5 py-2.5 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: esCancelar ? '#DC2626' : '#16A34A' }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
