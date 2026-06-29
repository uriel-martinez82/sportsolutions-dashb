'use client';

import { useState, useMemo } from 'react';
import type { OVRecord, OVGrouped } from '@/types/entities';

export interface OVFilters {
  search: string;   // busca en NUM_OV
  cliente: string;
  status: string;
  sku: string;      // busca si algún SKU de la OV coincide
}

const EMPTY_FILTERS: OVFilters = { search: '', cliente: '', status: '', sku: '' };

function normalize(v: string | null | undefined): string {
  return String(v ?? '').toUpperCase().trim();
}

export interface OVsState {
  rows: OVRecord[];
  allGroups: OVGrouped[];
  filteredGroups: OVGrouped[];
  filters: OVFilters;
  clientes: string[];
  statuses: string[];
  hasActive: boolean;
  setFilter: <K extends keyof OVFilters>(key: K, value: OVFilters[K]) => void;
  clearFilters: () => void;
}

export function useOVs(ovsPendientes: OVRecord[]): OVsState {
  const [filters, setFilters] = useState<OVFilters>(EMPTY_FILTERS);

  const setFilter = <K extends keyof OVFilters>(key: K, value: OVFilters[K]) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const hasActive = Object.values(filters).some(Boolean);

  // Opciones de filtro — de toda la data sin filtrar
  const clientes = useMemo(
    () => Array.from(new Set(ovsPendientes.map(r => r.CLIENTE).filter(Boolean))).sort(),
    [ovsPendientes]
  );

  const statuses = useMemo(
    () => Array.from(new Set(ovsPendientes.map(r => r.STATUS).filter(Boolean))).sort(),
    [ovsPendientes]
  );

  // Agrupa TODOS los registros por NUM_OV (sin filtrar) — la expansión muestra todos los SKUs
  const allGroups = useMemo<OVGrouped[]>(() => {
    const map = new Map<string, OVGrouped>();

    for (const r of ovsPendientes) {
      const key = r.NUM_OV || '(Sin OV)';

      if (!map.has(key)) {
        map.set(key, {
          NUM_OV: r.NUM_OV,
          CLIENTE: r.CLIENTE,
          skus: [],
          totalUnidades: 0,
          statuses: [],
          fechaEntrega: '',
        });
      }

      const group = map.get(key)!;
      group.skus.push(r);
      group.totalUnidades += parseInt(r.CANTIDAD) || 0;

      if (r.STATUS && !group.statuses.includes(r.STATUS)) {
        group.statuses.push(r.STATUS);
      }

      // Guarda la primera fecha encontrada (los datos ya vienen ordenados por OV)
      if (r.FECHA_ENTREGA_CLIENTE && !group.fechaEntrega) {
        group.fechaEntrega = r.FECHA_ENTREGA_CLIENTE;
      }
    }

    return Array.from(map.values());
  }, [ovsPendientes]);

  // Filtra a nivel de OV: una OV aparece si ALGUNO de sus campos/SKUs coincide
  const filteredGroups = useMemo<OVGrouped[]>(() => {
    return allGroups.filter(g => {
      if (filters.search && !normalize(g.NUM_OV).includes(normalize(filters.search))) return false;
      if (filters.cliente && g.CLIENTE !== filters.cliente) return false;
      if (filters.status && !g.statuses.includes(filters.status)) return false;
      if (filters.sku && !g.skus.some(r => normalize(r.SKU).includes(normalize(filters.sku)))) {
        return false;
      }
      return true;
    });
  }, [allGroups, filters]);

  return {
    rows: ovsPendientes,
    allGroups,
    filteredGroups,
    filters,
    clientes,
    statuses,
    hasActive,
    setFilter,
    clearFilters,
  };
}
