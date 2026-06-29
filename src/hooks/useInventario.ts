'use client';

import { useState, useMemo } from 'react';
import type { InventarioItem } from '@/types/entities';

export interface InventarioFilters {
  search: string;
  almacen: string;
}

const EMPTY_FILTERS: InventarioFilters = { search: '', almacen: '' };

function normalize(v: string | null | undefined): string {
  return String(v ?? '').toUpperCase().trim();
}

export interface InventarioState {
  items: InventarioItem[];
  filtered: InventarioItem[];
  filters: InventarioFilters;
  almacenes: string[];
  hasActive: boolean;
  setFilter: <K extends keyof InventarioFilters>(key: K, value: InventarioFilters[K]) => void;
  clearFilters: () => void;
}

export function useInventario(inventario: InventarioItem[]): InventarioState {
  const [filters, setFilters] = useState<InventarioFilters>(EMPTY_FILTERS);

  const setFilter = <K extends keyof InventarioFilters>(key: K, value: InventarioFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const hasActive = Object.values(filters).some(Boolean);

  const almacenes = useMemo(
    () => Array.from(new Set(inventario.map(r => r.ALMACEN).filter(Boolean))).sort(),
    [inventario]
  );

  const filtered = useMemo(() => {
    const s = normalize(filters.search);
    return inventario.filter(r => {
      if (
        s &&
        !normalize(r.SKU).includes(s) &&
        !normalize(r.DESCRIPCION).includes(s) &&
        !normalize(r.FABRICANTE).includes(s) &&
        !normalize(r.NOMBRE_PROVEEDOR).includes(s)
      ) {
        return false;
      }
      if (filters.almacen && r.ALMACEN !== filters.almacen) return false;
      return true;
    });
  }, [inventario, filters]);

  return {
    items: inventario,
    filtered,
    filters,
    almacenes,
    hasActive,
    setFilter,
    clearFilters,
  };
}
