'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { UsuarioRole } from '@/types/usuarios';

interface AgregarUsuarioModalProps {
  rolesPermitidos: UsuarioRole[];
  onClose: () => void;
  onCreated: (nombre: string, email: string, role: UsuarioRole, temporaryPassword: string) => void;
}

const ROLE_LABELS: Record<UsuarioRole, string> = {
  admin: 'Admin',
  superadmin: 'SuperAdmin',
  vendedor: 'Vendedor',
};

export default function AgregarUsuarioModal({
  rolesPermitidos,
  onClose,
  onCreated,
}: AgregarUsuarioModalProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UsuarioRole>(rolesPermitidos[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !submitting) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), role }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? `Error ${res.status}`);
      }

      onCreated(nombre.trim(), email.trim(), role, json.temporaryPassword);
    } catch (e: any) {
      setError(e.message ?? 'Error al crear el usuario.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-gray-800">Agregar usuario</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
              required
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8420C]/20 focus:border-[#E8420C]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nombre@sportsolutions.com.mx"
              required
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8420C]/20 focus:border-[#E8420C]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UsuarioRole)}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8420C]/20 focus:border-[#E8420C] bg-white"
            >
              {rolesPermitidos.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-400">
            Se generará una contraseña temporal automáticamente. El usuario deberá cambiarla en su primer login.
          </p>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity disabled:opacity-70"
            style={{ backgroundColor: '#E8420C' }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}
