'use client';

import { useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import type { UsuarioListItem } from '@/types/usuarios';

interface EliminarUsuarioModalProps {
  usuario: UsuarioListItem;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export default function EliminarUsuarioModal({
  usuario,
  loading,
  error,
  onConfirm,
  onClose,
}: EliminarUsuarioModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, loading]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-gray-800">Eliminar usuario</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            ¿Eliminar a{' '}
            <span className="font-semibold text-gray-800">{usuario.nombre}</span>{' '}
            (<span className="font-mono text-xs">{usuario.email}</span>)?
          </p>

          <div className="flex items-start gap-2.5 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-600" />
            <p className="text-xs text-yellow-800">
              Esta acción no se puede deshacer. El usuario perderá acceso al sistema de inmediato.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#DC2626' }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
