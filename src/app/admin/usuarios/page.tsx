'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, LogOut, UserPlus, KeyRound, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import FilterBar from '@/components/ui/FilterBar';
import DataTable, { type ColumnDef } from '@/components/ui/DataTable';
import AgregarUsuarioModal from '@/components/admin/AgregarUsuarioModal';
import EliminarUsuarioModal from '@/components/admin/EliminarUsuarioModal';
import PasswordGeneradaModal from '@/components/admin/PasswordGeneradaModal';
import type { UsuarioListItem, UsuarioRole } from '@/types/usuarios';

const ACCENT = '#E8420C';

/** Roles que un usuario con `callerRole` puede asignar/eliminar. */
function rolesAsignablesPor(callerRole: UsuarioRole | undefined): UsuarioRole[] {
  if (callerRole === 'superadmin') return ['vendedor', 'admin'];
  if (callerRole === 'admin') return ['vendedor'];
  return [];
}

function roleBadgeClass(role: UsuarioRole): string {
  if (role === 'superadmin') return 'bg-purple-100 text-purple-700';
  if (role === 'admin') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
}

const ROLE_LABELS: Record<UsuarioRole, string> = {
  admin: 'Admin',
  superadmin: 'SuperAdmin',
  vendedor: 'Vendedor',
};

interface ResultadoPassword {
  titulo: string;
  nombre: string;
  email: string;
  password: string;
}

export default function UsuariosAdminPage() {
  const { data: session, status } = useSession();
  const callerRole = session?.user?.role;
  const callerId = session?.user?.id;
  const puedeGestionar = callerRole === 'admin' || callerRole === 'superadmin';

  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'todos' | UsuarioRole>('todos');

  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UsuarioListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [resultado, setResultado] = useState<ResultadoPassword | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const rolesPermitidos = rolesAsignablesPor(callerRole);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/usuarios', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? `Error ${res.status}`);
      }
      setUsuarios(json.usuarios ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (puedeGestionar) fetchUsuarios();
  }, [puedeGestionar]);

  const filtrados = useMemo(
    () => (roleFilter === 'todos' ? usuarios : usuarios.filter(u => u.role === roleFilter)),
    [usuarios, roleFilter]
  );

  const puedeEliminar = (usuario: UsuarioListItem): boolean => {
    if (String(usuario.id) === callerId) return false;
    return rolesPermitidos.includes(usuario.role);
  };

  const handleUsuarioCreado = (nombre: string, email: string, role: UsuarioRole, temporaryPassword: string) => {
    setShowAddModal(false);
    setResultado({ titulo: 'Usuario creado', nombre, email, password: temporaryPassword });
    fetchUsuarios();
  };

  const handleResetPassword = async (usuario: UsuarioListItem) => {
    setActionError(null);
    setResettingId(usuario.id);
    try {
      const res = await fetch('/api/admin/usuarios/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: usuario.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? `Error ${res.status}`);
      }
      setResultado({
        titulo: 'Password reseteada',
        nombre: usuario.nombre,
        email: usuario.email,
        password: json.temporaryPassword,
      });
      fetchUsuarios();
    } catch (e: any) {
      setActionError(e.message ?? 'Error al resetear la contraseña.');
    } finally {
      setResettingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? `Error ${res.status}`);
      }
      setDeleteTarget(null);
      fetchUsuarios();
    } catch (e: any) {
      setDeleteError(e.message ?? 'Error al eliminar el usuario.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<UsuarioListItem>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortable: true,
      sortValue: u => u.nombre,
      render: u => <span className="text-xs font-semibold text-gray-800">{u.nombre}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      sortValue: u => u.email,
      render: u => <span className="text-xs text-gray-500 font-mono">{u.email}</span>,
    },
    {
      key: 'role',
      header: 'Rol',
      render: u => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${roleBadgeClass(u.role)}`}>
            {ROLE_LABELS[u.role]}
          </span>
          {u.mustChangePassword && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium whitespace-nowrap">
              Debe cambiar password
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      headerClass: 'text-right',
      className: 'text-right',
      render: u => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleResetPassword(u)}
            disabled={resettingId === u.id}
            title="Resetear contraseña"
            className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-lg font-semibold border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {resettingId === u.id ? <Loader2 size={11} className="animate-spin" /> : <KeyRound size={11} />}
            Resetear
          </button>

          {puedeEliminar(u) && (
            <button
              onClick={() => { setDeleteError(null); setDeleteTarget(u); }}
              title="Eliminar usuario"
              className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-lg font-semibold border border-red-300 text-red-600 bg-white hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              <Trash2 size={11} />
              Eliminar
            </button>
          )}
        </div>
      ),
    },
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div
          className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"
          style={{ borderTopColor: ACCENT }}
        />
      </div>
    );
  }

  if (!puedeGestionar) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-sm w-full">
          <AlertTriangle size={40} className="mx-auto text-orange-500 mb-3" />
          <h2 className="text-base font-semibold text-gray-700">No tenés acceso a esta página</h2>
          <Link
            href="/"
            className="mt-5 inline-block px-5 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: ACCENT }}
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-3 shrink-0 mr-auto">
            <img src="/LogoSS.png" alt="Sport Solutions" className="h-8 w-auto shrink-0" />
            <p className="hidden sm:block text-sm font-medium text-gray-600">Gestión de Usuarios</p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 shrink-0"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors text-gray-600 shrink-0"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-gray-800">Usuarios</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            <UserPlus size={14} />
            Agregar usuario
          </button>
        </div>

        <FilterBar
          hasActive={roleFilter !== 'todos'}
          onClear={() => setRoleFilter('todos')}
          resultCount={filtrados.length}
          totalCount={usuarios.length}
          resultLabel="usuarios"
          fields={[
            {
              type: 'select',
              key: 'role',
              placeholder: 'Todos los roles',
              value: roleFilter === 'todos' ? '' : roleFilter,
              onChange: v => setRoleFilter((v || 'todos') as 'todos' | UsuarioRole),
              options: [
                { label: 'Admin', value: 'admin' },
                { label: 'SuperAdmin', value: 'superadmin' },
                { label: 'Vendedor', value: 'vendedor' },
              ],
            },
          ]}
        />

        {actionError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="mx-auto text-gray-300 animate-spin mb-3" />
            <p className="text-sm text-gray-400">Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <AlertTriangle size={32} className="mx-auto text-orange-500 mb-2" />
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchUsuarios}
              className="mt-4 text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtrados}
            rowKey={u => String(u.id)}
            pageSize={20}
            emptyMessage="No hay usuarios que coincidan con el filtro."
          />
        )}
      </main>

      {showAddModal && (
        <AgregarUsuarioModal
          rolesPermitidos={rolesPermitidos}
          onClose={() => setShowAddModal(false)}
          onCreated={handleUsuarioCreado}
        />
      )}

      {deleteTarget && (
        <EliminarUsuarioModal
          usuario={deleteTarget}
          loading={deleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onClose={() => { if (!deleting) { setDeleteTarget(null); setDeleteError(null); } }}
        />
      )}

      {resultado && (
        <PasswordGeneradaModal
          titulo={resultado.titulo}
          nombre={resultado.nombre}
          email={resultado.email}
          password={resultado.password}
          onClose={() => setResultado(null)}
        />
      )}
    </div>
  );
}
