'use client';

import { useState, useCallback, useEffect } from 'react';
import type { DashboardData } from '@/types/entities';

interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: string;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData({
        ovsPendientes: json.ovsPendientes ?? [],
        inventario: json.inventario ?? [],
        overview: json.overview ?? {
          totalComprado: 0,
          totalDisponible: 0,
          totalApartado: 0,
          totalOVsPendientes: 0,
          totalSKUs: 0,
          totalOCs: 0,
        },
      });
      setLastUpdate(new Date().toLocaleTimeString('es-MX'));
    } catch {
      setError('No se pudo cargar la información. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, lastUpdate, refetch };
}
