'use client';

import { Filter, Search, X } from 'lucide-react';

export type FilterFieldConfig =
  | {
      type: 'search';
      key: string;
      placeholder: string;
      value: string;
      onChange: (v: string) => void;
      wide?: boolean;
    }
  | {
      type: 'select';
      key: string;
      placeholder: string;
      value: string;
      onChange: (v: string) => void;
      options: { label: string; value: string }[];
      wide?: boolean;
    };

interface FilterBarProps {
  fields: FilterFieldConfig[];
  hasActive: boolean;
  onClear: () => void;
  resultCount: number;
  totalCount: number;
  resultLabel?: string;
}

export default function FilterBar({
  fields,
  hasActive,
  onClear,
  resultCount,
  totalCount,
  resultLabel = 'registros',
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={15} className="text-gray-400 shrink-0" />
        <span className="text-sm font-semibold text-gray-600">Filtros</span>
        {hasActive && (
          <button
            onClick={onClear}
            className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <X size={12} />
            Limpiar
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {fields.map(field => (
          <div key={field.key} className={field.wide ? 'col-span-2' : ''}>
            {field.type === 'search' ? (
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8420C]/20 focus:border-[#E8420C] transition-colors placeholder:text-gray-400"
                />
              </div>
            ) : (
              <select
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#E8420C]/20 focus:border-[#E8420C] transition-colors"
              >
                <option value="">{field.placeholder}</option>
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Mostrando{' '}
        <span className="font-semibold text-gray-600 tabular-nums">
          {resultCount.toLocaleString('es-MX')}
        </span>{' '}
        de{' '}
        <span className="font-semibold tabular-nums">{totalCount.toLocaleString('es-MX')}</span>{' '}
        {resultLabel}
      </p>
    </div>
  );
}
