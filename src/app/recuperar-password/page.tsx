'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/solicitar-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? 'Error al solicitar el reseteo.');
      }
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? 'Error al solicitar el reseteo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/LogoSS.png" alt="Sport Solutions" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-base font-semibold text-gray-800">Recuperar contraseña</h1>
          <p className="text-sm text-gray-400 mt-1">
            Ingresá tu email y te enviaremos un link para restablecerla.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Si el email está registrado, vas a recibir un correo con instrucciones en unos minutos.
            </p>
            <Link href="/login" className="text-sm font-medium inline-block" style={{ color: '#E8420C' }}>
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@sportsolutions.mx"
                required
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
              {loading ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>

            <p className="text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
