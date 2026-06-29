'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Package, RefreshCw, LogOut, AlertTriangle } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useOVs } from '@/hooks/useOVs';
import { useInventario } from '@/hooks/useInventario';
import OverviewTab from '@/components/tabs/OverviewTab';
import OVsTab from '@/components/tabs/OVsTab';
import InventarioTab from '@/components/tabs/InventarioTab';

const ACCENT = '#E8420C';

type TabKey = 'overview' | 'ovs' | 'inventario';

export default function Dashboard() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const { data, loading, error, lastUpdate, refetch } = useDashboard();
  const ovsState = useOVs(data?.ovsPendientes ?? []);
  const inventarioState = useInventario(data?.inventario ?? []);

  // Tab list — Inventario visible solo para admins
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'ovs', label: 'OVs Pendientes' },
    ...(isAdmin ? [{ key: 'inventario' as TabKey, label: 'Inventario' }] : []),
  ];

  // Si un vendedor tenía la tab de inventario activa, volver a overview
  useEffect(() => {
    if (!isAdmin && activeTab === 'inventario') setActiveTab('overview');
  }, [isAdmin, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin mx-auto mb-4"
            style={{ borderTopColor: ACCENT }}
          />
          <p className="text-gray-500 text-sm">Cargando datos desde Google Sheets...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-sm w-full">
          <AlertTriangle size={40} className="mx-auto text-orange-500 mb-3" />
          <h2 className="text-base font-semibold text-gray-700">
            No se pudo cargar el dashboard
          </h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            {error ?? 'Error desconocido. Intentá de nuevo.'}
          </p>
          <button
            onClick={refetch}
            className="mt-5 px-5 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: ACCENT }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0 mr-auto">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: ACCENT }}
            >
              <Package size={16} className="text-white" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold text-gray-800">Sport Solutions</p>
              <p className="text-xs text-gray-400">Panel de Inventario</p>
            </div>
          </div>

          {/* Última actualización */}
          {lastUpdate && (
            <p className="text-xs text-gray-400 hidden lg:block shrink-0">
              Act. {lastUpdate}
            </p>
          )}

          {/* Info usuario */}
          <div className="text-right hidden md:block shrink-0 leading-tight">
            <p className="text-sm font-semibold text-gray-700">
              {session?.user?.name ?? session?.user?.email ?? 'Usuario'}
            </p>
            <p className="text-xs text-gray-400">
              {isAdmin ? 'Administrador' : 'Vendedor'}
            </p>
          </div>

          {/* Botón actualizar */}
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 shrink-0"
            title="Actualizar datos"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {/* Botón cerrar sesión */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors text-gray-600 shrink-0"
            title="Cerrar sesión"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-[#E8420C] text-[#E8420C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'overview' && <OverviewTab data={data} />}

        {activeTab === 'ovs' && (
          <OVsTab
            rows={ovsState.rows}
            allGroups={ovsState.allGroups}
            filteredGroups={ovsState.filteredGroups}
            filters={ovsState.filters}
            clientes={ovsState.clientes}
            statuses={ovsState.statuses}
            hasActive={ovsState.hasActive}
            isAdmin={isAdmin}
            setFilter={ovsState.setFilter}
            clearFilters={ovsState.clearFilters}
            onRefetch={refetch}
          />
        )}

        {activeTab === 'inventario' && isAdmin && (
          <InventarioTab
            items={inventarioState.items}
            filtered={inventarioState.filtered}
            filters={inventarioState.filters}
            almacenes={inventarioState.almacenes}
            hasActive={inventarioState.hasActive}
            setFilter={inventarioState.setFilter}
            clearFilters={inventarioState.clearFilters}
          />
        )}
      </main>
    </div>
  );
}
