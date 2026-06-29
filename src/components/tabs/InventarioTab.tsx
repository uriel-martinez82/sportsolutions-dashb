'use client';

import { useMemo, useState } from 'react';
import FilterBar from '@/components/ui/FilterBar';
import ApartadoModal from '@/components/dashboard/ApartadoModal';
import DataTable, { type ColumnDef } from '@/components/ui/DataTable';
import type { InventarioItem, OCDetalle } from '@/types/entities';
import type { InventarioFilters } from '@/hooks/useInventario';

interface InventarioTabProps {
  items: InventarioItem[];
  filtered: InventarioItem[];
  filters: InventarioFilters;
  almacenes: string[];
  hasActive: boolean;
  setFilter: <K extends keyof InventarioFilters>(key: K, value: InventarioFilters[K]) => void;
  clearFilters: () => void;
}

/** Parsea un precio en formato ES (punto=miles, coma=decimal) o US (punto=decimal) */
function parseFOB(value: string): number {
  if (!value) return 0;
  const s = value.trim();
  // Si tiene coma después de punto → formato ES "1.234,56"
  // Si tiene solo punto o solo coma → tratar coma como decimal
  const esFormat = /\.\d{3}(,|$)/.test(s);
  const normalized = esFormat
    ? s.replace(/\./g, '').replace(',', '.')
    : s.replace(',', '.');
  return Number(normalized) || 0;
}

function formatUSD(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function OCsDetailTable({
  item,
  onApartadoClick,
}: {
  item: InventarioItem;
  onApartadoClick: (sku: string, numOC: string) => void;
}) {
  // Precalcular valor total por OC y el total consolidado del SKU
  const ocValues = item.OCS.map(oc => {
    const fob = parseFOB(oc.PRECIO_FOB);
    return fob > 0 ? fob * oc.CANTIDAD_COMPRADA : 0;
  });

  const totalConsolidado = ocValues.reduce((sum, v) => sum + v, 0);
  const hayValores = totalConsolidado > 0;

  return (
    <div className="rounded-xl border border-orange-100 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-orange-100 bg-orange-50/80">
        <p className="text-sm font-semibold text-gray-700">
          Detalle de OCs —{' '}
          <span className="font-mono text-xs">{item.SKU}</span>
        </p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{item.DESCRIPCION}</p>
        {hayValores && (
          <p className="text-xs mt-1.5">
            <span className="font-bold" style={{ color: '#111827' }}>
              Valor total comprometido:{' '}
              {formatUSD(totalConsolidado)}
            </span>
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {[
                'NUM OC',
                'Comprado',
                'Disponible',
                'Apartado',
                'Precio Unit.',
                'Precio FOB',
                'Moneda',
                'Total',
                'Fecha OC',
                'Embarque',
                'Llegada',
                'Estado',
                'Almacén',
                'Observaciones',
              ].map(h => (
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
            {item.OCS.map((oc: OCDetalle, i: number) => (
              <tr
                key={`${oc.NUM_OC}-${i}`}
                className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono font-semibold text-gray-700 whitespace-nowrap">
                  {oc.NUM_OC || '—'}
                </td>
                <td className="px-4 py-2 font-semibold text-gray-700 whitespace-nowrap tabular-nums">
                  {oc.CANTIDAD_COMPRADA.toLocaleString('es-MX')}
                </td>
                <td className="px-4 py-2 font-bold text-green-700 whitespace-nowrap tabular-nums">
                  {oc.CANTIDAD_DISPONIBLE.toLocaleString('es-MX')}
                </td>
                <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                  {oc.CANTIDAD_APARTADA > 0 ? (
                    <button
                      onClick={() => onApartadoClick(item.SKU, oc.NUM_OC)}
                      className="font-semibold text-orange-600 cursor-pointer underline decoration-dotted decoration-orange-400 underline-offset-2 hover:text-orange-700 transition-colors"
                    >
                      {oc.CANTIDAD_APARTADA.toLocaleString('es-MX')}
                    </button>
                  ) : (
                    <span className="font-semibold text-gray-400">0</span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                  {oc.PRECIO_UNITARIO || '—'}
                </td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                  {oc.PRECIO_FOB || '—'}
                </td>
                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                  {oc.MONEDA || '—'}
                </td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap tabular-nums">
                  {ocValues[i] > 0 ? formatUSD(ocValues[i]) : '—'}
                </td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{oc.FECHA_OC || '—'}</td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                  {oc.FECHA_EMBARQUE || '—'}
                </td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                  {oc.FECHA_LLEGADA_BODEGA || '—'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    {oc.ESTADO || '—'}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                  {oc.ALMACEN || '—'}
                </td>
                <td className="px-4 py-2 text-gray-500 max-w-[260px] truncate" title={oc.OBSERVACIONES}>
                  {oc.OBSERVACIONES || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildColumns(): ColumnDef<InventarioItem>[] {
  return [
    {
      key: 'SKU',
      header: 'SKU',
      sortable: true,
      sortValue: r => r.SKU,
      render: r => (
        <span className="font-mono text-xs font-semibold text-gray-800 whitespace-nowrap">
          {r.SKU}
        </span>
      ),
    },
    {
      key: 'DESCRIPCION',
      header: 'Descripción',
      className: 'max-w-[280px]',
      render: r => (
        <span className="text-gray-700 text-xs block truncate" title={r.DESCRIPCION}>
          {r.DESCRIPCION || '—'}
        </span>
      ),
    },
    {
      key: 'FABRICANTE',
      header: 'Fabricante',
      sortable: true,
      sortValue: r => r.FABRICANTE,
      render: r => (
        <span className="text-gray-600 text-xs whitespace-nowrap">{r.FABRICANTE || '—'}</span>
      ),
    },
    {
      key: 'NOMBRE_PROVEEDOR',
      header: 'Proveedor',
      sortable: true,
      sortValue: r => r.NOMBRE_PROVEEDOR,
      render: r => (
        <span className="text-gray-600 text-xs whitespace-nowrap">{r.NOMBRE_PROVEEDOR || '—'}</span>
      ),
    },
    {
      key: 'ALMACEN',
      header: 'Almacén',
      sortable: true,
      sortValue: r => r.ALMACEN,
      render: r => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
          {r.ALMACEN || '—'}
        </span>
      ),
    },
    {
      key: 'CANTIDAD_COMPRADA',
      header: 'Comprado',
      sortable: true,
      sortValue: r => r.CANTIDAD_COMPRADA,
      headerClass: 'text-right',
      className: 'text-right',
      render: r => (
        <span className="font-semibold text-gray-700 tabular-nums">
          {r.CANTIDAD_COMPRADA.toLocaleString('es-MX')}
        </span>
      ),
    },
    {
      key: 'CANTIDAD_DISPONIBLE',
      header: 'Disponible',
      sortable: true,
      sortValue: r => r.CANTIDAD_DISPONIBLE,
      headerClass: 'text-right',
      className: 'text-right',
      render: r => (
        <span className="font-bold text-green-700 tabular-nums">
          {r.CANTIDAD_DISPONIBLE.toLocaleString('es-MX')}
        </span>
      ),
    },
    {
      key: 'CANTIDAD_APARTADA',
      header: 'Apartado',
      sortable: true,
      sortValue: r => r.OCS.reduce((s, oc) => s + oc.CANTIDAD_APARTADA, 0),
      headerClass: 'text-right',
      className: 'text-right',
      render: r => {
        const total = r.OCS.reduce((s, oc) => s + oc.CANTIDAD_APARTADA, 0);
        return (
          <span className={`font-semibold tabular-nums ${total > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {total.toLocaleString('es-MX')}
          </span>
        );
      },
    },
    {
      key: 'OCS',
      header: 'OCs',
      sortable: true,
      sortValue: r => r.OCS.length,
      headerClass: 'text-center',
      className: 'text-center',
      render: r =>
        r.OCS.length > 1 ? (
          <span className="text-xs font-semibold text-[#E8420C]">{r.OCS.length} OCs</span>
        ) : (
          <span className="text-xs text-gray-500 font-mono">{r.OCS[0]?.NUM_OC || '—'}</span>
        ),
    },
  ];
}

export default function InventarioTab({
  items,
  filtered,
  filters,
  almacenes,
  hasActive,
  setFilter,
  clearFilters,
}: InventarioTabProps) {
  const [apartadoTarget, setApartadoTarget] = useState<{ sku: string; numOC: string } | null>(null);

  const columns = useMemo(() => buildColumns(), []);

  const totalFiltrado = useMemo(() => {
    let sum = 0;
    for (const item of filtered) {
      for (const oc of item.OCS) {
        const fob = parseFOB(oc.PRECIO_FOB);
        if (fob > 0) sum += fob * oc.CANTIDAD_COMPRADA;
      }
    }
    return sum;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <FilterBar
        hasActive={hasActive}
        onClear={clearFilters}
        resultCount={filtered.length}
        totalCount={items.length}
        resultLabel="productos agrupados"
        fields={[
          {
            type: 'search',
            key: 'search',
            placeholder: 'Buscar SKU, descripción, fabricante o proveedor...',
            value: filters.search,
            onChange: v => setFilter('search', v),
            wide: true,
          },
          {
            type: 'select',
            key: 'almacen',
            placeholder: 'Todos los almacenes',
            value: filters.almacen,
            onChange: v => setFilter('almacen', v),
            options: almacenes.map(a => ({ label: a, value: a })),
          },
        ]}
      />

      {totalFiltrado > 0 && (
        <p className="text-sm px-1">
          <span className="font-bold" style={{ color: '#111827' }}>Valor total comprometido: </span>
          <span className="font-bold" style={{ color: '#E8420C' }}>
            {totalFiltrado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row, i) => `${row.SKU}-${row.ALMACEN}-${i}`}
        pageSize={50}
        emptyMessage="No hay productos que coincidan con los filtros aplicados."
        isExpandable={row => row.OCS.length > 1}
        renderExpanded={row => (
          <OCsDetailTable
            item={row}
            onApartadoClick={(sku, numOC) => setApartadoTarget({ sku, numOC })}
          />
        )}
      />

      {apartadoTarget && (
        <ApartadoModal
          sku={apartadoTarget.sku}
          numOC={apartadoTarget.numOC}
          onClose={() => setApartadoTarget(null)}
        />
      )}
    </div>
  );
}
