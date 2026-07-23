'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('El link de recuperación no es válido.');
      return;
    }
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
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? 'Error al restablecer la contraseña.');
      }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (e: any) {
      setError(e.message ?? 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <img src="/LogoSS.png" alt="Sport Solutions" className="h-16 w-auto mx-auto mb-4" />
        <h1 className="text-base font-semibold text-gray-800">Restablecer contraseña</h1>
      </div>

      {!token ? (
        <p className="text-sm text-red-500 text-center">
          El link de recuperación no es válido. Solicitá uno nuevo.
        </p>
      ) : success ? (
        <p className="text-sm text-green-600 text-center">
          Contraseña actualizada. Redirigiendo al login…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
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
            {loading ? 'Guardando...' : 'Restablecer contraseña'}
          </button>
        </form>
      )}

      <p className="text-center mt-4">
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
          Volver al login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
