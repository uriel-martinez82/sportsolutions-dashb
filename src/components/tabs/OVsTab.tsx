'use client';

import { useState } from 'react';
import FilterBar from '@/components/ui/FilterBar';
import DataTable, { type ColumnDef } from '@/components/ui/DataTable';
import AsignacionModal from '@/components/dashboard/AsignacionModal';
import type { OVGrouped, OVRecord, AsignacionTarget } from '@/types/entities';
import type { OVFilters } from '@/hooks/useOVs';

interface OVsTabProps {
  rows: OVRecord[];
  allGroups: OVGrouped[];
  filteredGroups: OVGrouped[];
  filters: OVFilters;
  clientes: string[];
  statuses: string[];
  hasActive: boolean;
  isAdmin: boolean;
  setFilter: <K extends keyof OVFilters>(key: K, value: OVFilters[K]) => void;
  clearFilters: () => void;
  onRefetch: () => void;
}

function statusBadgeClass(status: string): string {
  const s = (status ?? '').toUpperCase().trim();
  if (s === 'ENTREGADO' || s === 'APARTADO') return 'bg-green-100 text-green-700';
  if (s === 'CANCELADO') return 'bg-red-100 text-red-700';
  if (s === 'SIN COBERTURA' || s === 'SIN STOCK') return 'bg-orange-100 text-orange-700';
  if (s.includes('PROCESO') || s.includes('TRÁMITE')) return 'bg-blue-100 text-blue-700';
  if (s.includes('PENDIENTE') || s.includes('ESPERA')) return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
}

// ─── Detalle expandible de SKUs dentro de una OV ─────────────────────────────

function SKUsDetailPanel({
  group,
  isAdmin,
  onAsignar,
}: {
  group: OVGrouped;
  isAdmin: boolean;
  onAsignar: (record: OVRecord) => void;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-blue-50/60 border-b border-blue-100">
        <p className="text-xs font-semibold text-gray-600">
          SKUs de <span className="font-mono">{group.NUM_OV}</span>
          <span className="font-normal text-gray-400 ml-2">· {group.CLIENTE}</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['SKU', 'Descripción', 'Cant.', 'Almacén', 'Status', 'Entrega', ...(isAdmin ? [''] : [])].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.skus.map((r, i) => (
              <tr
                key={`${r.SKU}-${i}`}
                className="border-b border-gray-50 last:border-b-0 hover:bg-blue-50/20 transition-colors"
              >
                <td className="px-4 py-2.5 font-mono font-semibold text-gray-700 whitespace-nowrap">
                  {r.SKU}
                </td>
                <td className="px-4 py-2.5 text-gray-500 max-w-[260px] truncate" title={r.DESCRIPCION}>
                  {r.DESCRIPCION || '—'}
                </td>
                <td className="px-4 py-2.5 font-semibold text-gray-700 tabular-nums text-center">
                  {r.CANTIDAD || '—'}
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
                    {r.ALMACEN || '—'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusBadgeClass(r.STATUS)}`}>
                    {r.STATUS || '—'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                  {r.FECHA_ENTREGA_CLIENTE || '—'}
                </td>
                {isAdmin && (
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => onAsignar(r)}
                      disabled={!r._rowIndex}
                      title={r._rowIndex ? 'Asignar inventario' : 'Sin índice de fila'}
                      className="text-[11px] px-3 py-1 rounded-lg font-semibold text-white disabled:opacity-30 transition-opacity hover:opacity-90 whitespace-nowrap"
                      style={{ backgroundColor: '#E8420C' }}
                    >
                      Asignar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Columnas de la tabla principal (una fila = una OV) ──────────────────────

function buildColumns(isAdmin: boolean): ColumnDef<OVGrouped>[] {
  return [
    {
      key: 'NUM_OV',
      header: 'OV',
      sortable: true,
      sortValue: g => g.NUM_OV,
      render: g => (
        <span className="font-bold text-gray-800 text-xs whitespace-nowrap tracking-wide">
          {g.NUM_OV || '—'}
        </span>
      ),
    },
    {
      key: 'CLIENTE',
      header: 'Cliente',
      sortable: true,
      sortValue: g => g.CLIENTE,
      className: 'max-w-[220px]',
      render: g => (
        <span className="text-gray-600 text-xs block truncate" title={g.CLIENTE}>
          {g.CLIENTE || '—'}
        </span>
      ),
    },
    {
      key: 'skus',
      header: 'SKUs',
      sortable: true,
      sortValue: g => g.skus.length,
      headerClass: 'text-center',
      className: 'text-center',
      render: g => (
        <span className="text-xs font-semibold text-gray-600 tabular-nums">
          {g.skus.length}
        </span>
      ),
    },
    {
      key: 'totalUnidades',
      header: 'Unidades',
      sortable: true,
      sortValue: g => g.totalUnidades,
      headerClass: 'text-right',
      className: 'text-right',
      render: g => (
        <span className="font-semibold text-gray-700 tabular-nums">
          {g.totalUnidades.toLocaleString('es-MX')}
        </span>
      ),
    },
    {
      key: 'statuses',
      header: 'Status',
      render: g => (
        <div className="flex flex-wrap gap-1">
          {g.statuses.slice(0, 2).map(s => (
            <span
              key={s}
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${statusBadgeClass(s)}`}
            >
              {s}
            </span>
          ))}
          {g.statuses.length > 2 && (
            <span className="text-[11px] text-gray-400">+{g.statuses.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      key: 'fechaEntrega',
      header: 'Entrega',
      sortable: true,
      sortValue: g => g.fechaEntrega,
      render: g => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {g.fechaEntrega || '—'}
        </span>
      ),
    },
  ];
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function OVsTab({
  rows,
  allGroups,
  filteredGroups,
  filters,
  clientes,
  statuses,
  hasActive,
  isAdmin,
  setFilter,
  clearFilters,
  onRefetch,
}: OVsTabProps) {
  const [modalTarget, setModalTarget] = useState<AsignacionTarget | null>(null);

  const handleAsignar = (record: OVRecord) => {
    if (!record._rowIndex) return;
    setModalTarget({
      sku: record.SKU,
      descripcion: record.DESCRIPCION,
      fabricante: record.FABRICANTE,
      marca: record.MARCA,
      lineaProducto: record.LINEA_PRODUCTO,
      nombreProveedor: record.NOMBRE_PROVEEDOR,
      numOV: record.NUM_OV,
      cliente: record.CLIENTE,
      almacen: record.ALMACEN,
      fechaEntrega: record.FECHA_ENTREGA_CLIENTE,
      moneda: record.MONEDA,
      cantidadRequerida: parseInt(record.CANTIDAD) || 0,
      ventaRowIndex: record._rowIndex,
    });
  };

  const handleSuccess = () => {
    onRefetch();
  };

  const columns = buildColumns(isAdmin);

  return (
    <div className="space-y-4">
      <FilterBar
        hasActive={hasActive}
        onClear={clearFilters}
        resultCount={filteredGroups.length}
        totalCount={allGroups.length}
        resultLabel="OVs"
        fields={[
          {
            type: 'search',
            key: 'search',
            placeholder: 'Buscar OV...',
            value: filters.search,
            onChange: v => setFilter('search', v),
          },
          {
            type: 'select',
            key: 'cliente',
            placeholder: 'Todos los clientes',
            value: filters.cliente,
            onChange: v => setFilter('cliente', v),
            options: clientes.map(c => ({ label: c, value: c })),
          },
          {
            type: 'select',
            key: 'status',
            placeholder: 'Todos los status',
            value: filters.status,
            onChange: v => setFilter('status', v),
            options: statuses.map(s => ({ label: s, value: s })),
          },
          {
            type: 'search',
            key: 'sku',
            placeholder: 'Buscar SKU...',
            value: filters.sku,
            onChange: v => setFilter('sku', v),
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={filteredGroups}
        rowKey={(g, i) => `${g.NUM_OV}-${i}`}
        pageSize={50}
        emptyMessage="No hay OVs que coincidan con los filtros aplicados."
        isExpandable={() => true}
        renderExpanded={group => (
          <SKUsDetailPanel
            group={group}
            isAdmin={isAdmin}
            onAsignar={handleAsignar}
          />
        )}
      />

      {modalTarget && (
        <AsignacionModal
          target={modalTarget}
          onClose={() => setModalTarget(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
