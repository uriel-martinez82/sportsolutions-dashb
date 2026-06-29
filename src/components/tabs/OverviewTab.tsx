'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Truck,
  Boxes,
  ClipboardList,
  ShoppingCart,
} from 'lucide-react';
import KPICard from '@/components/ui/KPICard';
import type { DashboardData } from '@/types/entities';

const ACCENT = '#E8420C';

const CHART_COLORS = [
  '#E8420C',
  '#F97316',
  '#FB923C',
  '#1F3864',
  '#2E74B5',
  '#60A5FA',
  '#10B981',
  '#6366F1',
  '#6B7280',
];

interface OverviewTabProps {
  data: DashboardData;
}

export default function OverviewTab({ data }: OverviewTabProps) {
  const { overview, inventario, ovsPendientes } = data;

  const stockPorSku = useMemo(() =>
    inventario
      .map(item => ({ name: item.SKU || 'Sin SKU', disponible: item.CANTIDAD_DISPONIBLE }))
      .sort((a, b) => b.disponible - a.disponible)
      .slice(0, 10),
    [inventario]
  );

  const ovsPorStatus = useMemo(() => {
    const map = new Map<string, number>();
    ovsPendientes.forEach(r => {
      const key = r.STATUS?.trim() || 'Sin status';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [ovsPendientes]);

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Boxes}
          label="Stock Disponible"
          value={overview.totalDisponible}
          sub="unidades disponibles"
        />
        <KPICard
          icon={ShoppingCart}
          label="Total Comprado"
          value={overview.totalComprado}
          sub="unidades compradas"
          color="#6366F1"
        />
        <KPICard
          icon={ClipboardList}
          label="OVs Pendientes"
          value={overview.totalOVsPendientes}
          sub="órdenes únicas"
          color="#3B82F6"
        />
        <KPICard
          icon={Package}
          label="SKUs Activos"
          value={overview.totalSKUs}
          sub={`${overview.totalOCs} OCs registradas`}
          color="#10B981"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Stock disponible por SKU</h2>
          <p className="text-xs text-gray-400 mb-5">Top 10 por unidades disponibles</p>
          {stockPorSku.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-sm text-gray-400">Sin datos de inventario</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stockPorSku} margin={{ left: 4, right: 16, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    fontSize: 12,
                  }}
                  cursor={{ fill: '#F9FAFB' }}
                />
                <Bar
                  dataKey="disponible"
                  name="Disponible"
                  radius={[5, 5, 0, 0]}
                  fill={ACCENT}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">OVs por status</h2>
          <p className="text-xs text-gray-400 mb-5">Distribución de órdenes activas</p>
          {ovsPorStatus.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-sm text-gray-400">Sin OVs pendientes</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ovsPorStatus}
                  cx="50%"
                  cy="42%"
                  outerRadius={85}
                  innerRadius={40}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {ovsPorStatus.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={7}
                  formatter={v => <span className="text-xs text-gray-600">{v}</span>}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          icon={TrendingUp}
          label="Cantidad Apartada"
          value={overview.totalApartado}
          sub="unidades reservadas"
          color="#F59E0B"
        />
        <KPICard
          icon={Truck}
          label="Órdenes de Compra"
          value={overview.totalOCs}
          sub="OCs registradas"
          color="#8B5CF6"
        />
        <KPICard
          icon={AlertTriangle}
          label="Líneas OV"
          value={ovsPendientes.length}
          sub="registros pendientes"
          color="#EF4444"
        />
      </div>
    </div>
  );
}
