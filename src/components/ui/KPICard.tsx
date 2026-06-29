'use client';

import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}

export default function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color = '#E8420C',
}: KPICardProps) {
  const display = typeof value === 'number' ? value.toLocaleString('es-MX') : value;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="rounded-xl p-3 shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{label}</p>
        <p className="text-3xl font-bold text-gray-800 leading-tight tabular-nums">{display}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}
