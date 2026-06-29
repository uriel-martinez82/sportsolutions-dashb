'use client';

import { Fragment, useState, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Package,
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClass?: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T extends object> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  pageSize?: number;
  emptyMessage?: string;
  isExpandable?: (row: T) => boolean;
  renderExpanded?: (row: T) => React.ReactNode;
}

type SortDir = 'asc' | 'desc';

function getPaginationPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

function PageButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 text-xs rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}

export default function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  pageSize = 50,
  emptyMessage = 'No hay resultados que coincidan.',
  isExpandable,
  renderExpanded,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Reset page when data changes (filter applied)
  useEffect(() => {
    setPage(1);
  }, [data]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find(c => c.key === sortKey);
    if (!col?.sortValue) return data;
    return [...data].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === 'asc' ? sa.localeCompare(sb, 'es') : sb.localeCompare(sa, 'es');
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const hasExpandColumn = Boolean(isExpandable);
  const colCount = columns.length + (hasExpandColumn ? 1 : 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {hasExpandColumn && <th className="w-10 pl-3" />}
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={[
                    'text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap',
                    col.headerClass ?? '',
                    col.sortable
                      ? 'cursor-pointer select-none hover:text-gray-700 hover:bg-gray-100/60 transition-colors'
                      : '',
                  ].join(' ')}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      sortKey === col.key ? (
                        sortDir === 'asc'
                          ? <ChevronUp size={12} className="text-[#E8420C]" />
                          : <ChevronDown size={12} className="text-[#E8420C]" />
                      ) : (
                        <ChevronsUpDown size={12} className="text-gray-300" />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-6 py-16 text-center">
                  <Package size={36} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => {
                const globalIndex = (safePage - 1) * pageSize + i;
                const key = rowKey(row, globalIndex);
                const expandable = isExpandable?.(row) ?? false;
                const expanded = expandedRows.has(key);

                return (
                  <Fragment key={key}>
                    <tr
                      className={[
                        'border-b border-gray-50 hover:bg-orange-50/20 transition-colors',
                        i % 2 !== 0 ? 'bg-gray-50/30' : '',
                      ].join(' ')}
                    >
                      {hasExpandColumn && (
                        <td className="pl-3 pr-0 py-3 w-10">
                          {expandable ? (
                            <button
                              type="button"
                              onClick={() => toggleRow(key)}
                              className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              aria-label={expanded ? 'Ocultar detalle' : 'Ver detalle'}
                            >
                              {expanded
                                ? <ChevronDown size={13} className="text-gray-500" />
                                : <ChevronRight size={13} className="text-gray-500" />
                              }
                            </button>
                          ) : (
                            <span className="block w-6" />
                          )}
                        </td>
                      )}
                      {columns.map(col => (
                        <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>

                    {expandable && expanded && renderExpanded && (
                      <tr className="bg-orange-50/30 border-b border-orange-100">
                        <td colSpan={colCount} className="px-4 py-4">
                          {renderExpanded(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-4 bg-gray-50/50">
          <p className="text-xs text-gray-500 shrink-0">
            Página <span className="font-semibold">{safePage}</span> de{' '}
            <span className="font-semibold">{totalPages}</span>
            {' — '}
            <span className="tabular-nums">{sorted.length.toLocaleString('es-MX')}</span> registros
          </p>

          <div className="flex items-center gap-1">
            <PageButton onClick={() => setPage(1)} disabled={safePage === 1} label="«" />
            <PageButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} label="‹" />

            {getPaginationPages(safePage, totalPages).map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-xs">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(Number(p))}
                  className={[
                    'w-7 h-7 text-xs rounded-md transition-colors',
                    safePage === p
                      ? 'bg-[#E8420C] text-white font-semibold shadow-sm'
                      : 'hover:bg-gray-100 text-gray-600 border border-gray-200',
                  ].join(' ')}
                >
                  {p}
                </button>
              )
            )}

            <PageButton onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} label="›" />
            <PageButton onClick={() => setPage(totalPages)} disabled={safePage === totalPages} label="»" />
          </div>
        </div>
      )}
    </div>
  );
}
