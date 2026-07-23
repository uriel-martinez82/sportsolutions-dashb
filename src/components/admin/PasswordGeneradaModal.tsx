'use client';

import { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface PasswordGeneradaModalProps {
  titulo: string;
  nombre: string;
  email: string;
  password: string;
  onClose: () => void;
}

export default function PasswordGeneradaModal({
  titulo,
  nombre,
  email,
  password,
  onClose,
}: PasswordGeneradaModalProps) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Si el navegador bloquea el clipboard, el usuario igual puede seleccionar el texto a mano
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-gray-800">{titulo}</h2>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div className="text-xs text-gray-500">
            <p className="font-semibold text-gray-700">{nombre}</p>
            <p>{email}</p>
          </div>

          <p className="text-xs text-gray-500">
            Compartile esta contraseña temporal — deberá cambiarla en su primer login.
          </p>

          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <span className="flex-1 font-mono text-sm text-gray-800 select-all">{password}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 transition-colors text-gray-600"
            >
              {copiado ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#E8420C' }}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
