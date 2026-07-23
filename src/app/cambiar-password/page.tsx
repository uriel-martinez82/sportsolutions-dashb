'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CambiarPasswordPage() {
  const router = useRouter();
  const { update } = useSession();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? 'Error al cambiar la contraseña.');
      }

      // Refresca el token de sesión sin forzar un nuevo login
      await update({ mustChangePassword: false });
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? 'Error al cambiar la contraseña.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/LogoSS.png" alt="Sport Solutions" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-base font-semibold text-gray-800">Cambiá tu contraseña</h1>
          <p className="text-sm text-gray-400 mt-1">
            Por seguridad, debés definir una contraseña nueva antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8420C]/20 focus:border-[#E8420C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repetí la contraseña"
              required
              minLength={8}
              className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8420C]/20 focus:border-[#E8420C]"
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity disabled:opacity-70"
            style={{ backgroundColor: '#E8420C' }}
          >
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
