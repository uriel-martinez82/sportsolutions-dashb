'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/LogoSS.png" alt="Sport Solutions" className="h-16 w-auto mx-auto mb-4" />
          <p className="text-sm text-gray-400 mt-1">Panel de Inventario</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@sportsolutions.mx"
              required
              className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8420C]/20 focus:border-[#E8420C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8420C]/20 focus:border-[#E8420C]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity disabled:opacity-70"
            style={{ backgroundColor: '#E8420C' }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="text-center">
            <Link
              href="/recuperar-password"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}