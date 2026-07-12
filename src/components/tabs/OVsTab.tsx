'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import FilterBar from '@/components/ui/FilterBar';
import DataTable, { type ColumnDef } from '@/components/ui/DataTable';
import AsignacionModal from '@/components/dashboard/AsignacionModal';
import type { OVGrouped, OVRecord, AsignacionTarget } from '@/types/entities';
import type { OVFilters } from '@/hooks/useOVs';

type RowActionState = 'idle' | 'cancelling' | 'delivering' | 'done';

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
  rowActions,
  onAsignar,
  onCancelar,
  onEntregar,
}: {
  group: OVGrouped;
  isAdmin: boolean;
  rowActions: Record<number, RowActionState>;
  onAsignar: (record: OVRecord) => void;
  onCancelar: (record: OVRecord) => void;
  onEntregar: (record: OVRecord) => void;
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
              {['SKU', 'Descripción', 'Cant.', 'Almacén', 'Estado', 'Status de la venta', 'Entrega', ...(isAdmin ? [''] : [])].map(h => (
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
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="font-mono font-semibold text-gray-700">{r.SKU}</span>
                  {r.NUM_OC?.trim() && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold uppercase tracking-wide">
                      Asignado
                    </span>
                  )}
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
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
                    {r.ESTADO || '—'}
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
                {isAdmin && (() => {
                  const actionState = (r._rowIndex ? rowActions[r._rowIndex] : undefined) ?? 'idle';
                  const disabled = !r._rowIndex || actionState !== 'idle';
                  const tieneOC = !!r.NUM_OC?.trim();
                  const cantidad = parseInt(r.CANTIDAD) || 0;

                  return (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {tieneOC ? (
                          <button
                            onClick={() => onAsignar(r)}
                            disabled={disabled}
                            title={r._rowIndex ? 'Re-asignar inventario' : 'Sin índice de fila'}
                            className={`text-[11px] px-3 py-1 rounded-lg font-semibold border transition-colors whitespace-nowrap ${
                              disabled
                                ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
                            }`}
                          >
                            Re-Asignar
                          </button>
                        ) : (
                          <button
                            onClick={() => onAsignar(r)}
                            disabled={disabled}
                            title={r._rowIndex ? 'Asignar inventario' : 'Sin índice de fila'}
                            className={`text-[11px] px-3 py-1 rounded-lg font-semibold transition-opacity whitespace-nowrap ${
                              disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'text-white hover:opacity-90'
                            }`}
                            style={disabled ? undefined : { backgroundColor: '#E8420C' }}
                          >
                            Asignar
                          </button>
                        )}

                        {cantidad > 0 && (
                          <button
                            onClick={() => onCancelar(r)}
                            disabled={disabled}
                            title={r._rowIndex ? 'Cancelar SKU' : 'Sin índice de fila'}
                            className={`inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-lg font-semibold border transition-colors whitespace-nowrap ${
                              disabled
                                ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                                : 'border-red-300 text-red-600 bg-white hover:bg-red-50'
                            }`}
                          >
                            {actionState === 'cancelling' && <Loader2 size={11} className="animate-spin" />}
                            Cancelar
                          </button>
                        )}

                        {tieneOC && (
                          <button
                            onClick={() => onEntregar(r)}
                            disabled={disabled}
                            title={r._rowIndex ? 'Marcar como entregado' : 'Sin índice de fila'}
                            className={`inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-lg font-semibold border transition-colors whitespace-nowrap ${
                              disabled
                                ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                                : 'border-green-300 text-green-600 bg-white hover:bg-green-50'
                            }`}
                          >
                            {actionState === 'delivering' && <Loader2 size={11} className="animate-spin" />}
                            Entregado
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })()}
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
  const [rowActions, setRowActions] = useState<Record<number, RowActionState>>({});

  const setRowAction = (rowIndex: number, state: RowActionState) => {
    setRowActions(prev => ({ ...prev, [rowIndex]: state }));
  };

  const handleCancelar = async (record: OVRecord) => {
    if (!record._rowIndex) return;
    const ok = window.confirm('¿Cancelar este SKU? La cantidad se pondrá en 0 y se devolverá al inventario.');
    if (!ok) return;

    const rowIndex = record._rowIndex;
    setRowAction(rowIndex, 'cancelling');

    try {
      const ventasRes = await fetch('/api/ventas/cancelar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex }),
      });
      if (!ventasRes.ok) {
        const json = await ventasRes.json().catch(() => ({}));
        throw new Error(json.error ?? `Error ${ventasRes.status}`);
      }

      if (record.NUM_OC?.trim()) {
        const cantidad = parseInt(record.CANTIDAD) || 0;
        const comprasRes = await fetch('/api/compras/asignar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sku: record.SKU,
            numOC: record.NUM_OC,
            cantidadAsignar: cantidad,
            revertir: true,
          }),
        });
        if (!comprasRes.ok) {
          const json = await comprasRes.json().catch(() => ({}));
          throw new Error(json.error ?? 'Error al devolver stock a COMPRAS');
        }
      }

      setRowAction(rowIndex, 'done');
      setTimeout(() => onRefetch(), 1500);
    } catch (e: any) {
      setRowAction(rowIndex, 'idle');
      window.alert(e.message ?? 'Error al cancelar el SKU.');
    }
  };

  const handleEntregar = async (record: OVRecord) => {
    if (!record._rowIndex) return;
    const ok = window.confirm('¿Marcar como entregado?');
    if (!ok) return;

    const rowIndex = record._rowIndex;
    setRowAction(rowIndex, 'delivering');

    try {
      const ventasRes = await fetch('/api/ventas/entregar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex }),
      });
      if (!ventasRes.ok) {
        const json = await ventasRes.json().catch(() => ({}));
        throw new Error(json.error ?? `Error ${ventasRes.status}`);
      }

      const cantidad = parseInt(record.CANTIDAD) || 0;
      const comprasRes = await fetch('/api/compras/entregar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: record.SKU, numOC: record.NUM_OC, cantidad }),
      });
      if (!comprasRes.ok) {
        const json = await comprasRes.json().catch(() => ({}));
        throw new Error(json.error ?? 'Error al actualizar COMPRAS');
      }

      setRowAction(rowIndex, 'done');
      setTimeout(() => onRefetch(), 1500);
    } catch (e: any) {
      setRowAction(rowIndex, 'idle');
      window.alert(e.message ?? 'Error al marcar como entregado.');
    }
  };

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
      isReAsignacion: !!record.NUM_OC?.trim(),
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
            rowActions={rowActions}
            onAsignar={handleAsignar}
            onCancelar={handleCancelar}
            onEntregar={handleEntregar}
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
