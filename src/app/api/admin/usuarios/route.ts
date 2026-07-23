import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import type { UsuarioRole } from '@/types/usuarios';

export const dynamic = 'force-dynamic';

/** Roles que un usuario con `callerRole` puede asignar al crear/eliminar usuarios. */
function rolesAsignablesPor(callerRole: UsuarioRole | undefined): UsuarioRole[] {
  if (callerRole === 'superadmin') return ['vendedor', 'admin'];
  if (callerRole === 'admin') return ['vendedor'];
  return [];
}

function generarPasswordTemporal(): string {
  const digitos = Math.floor(1000 + Math.random() * 9000);
  return `SportS2026!${digitos}`;
}

async function requireGestorSesion() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== 'admin' && role !== 'superadmin')) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireGestorSesion();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const rows = (await sql`
      SELECT id, nombre, email, role, must_change_password, created_at
      FROM usuarios
      ORDER BY nombre ASC
    `) as {
      id: number;
      nombre: string;
      email: string;
      role: UsuarioRole;
      must_change_password: boolean;
      created_at: string | null;
    }[];

    const usuarios = rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      email: r.email,
      role: r.role,
      mustChangePassword: r.must_change_password,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ usuarios });
  } catch (error: any) {
    console.error('Error GET /api/admin/usuarios:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireGestorSesion();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  let body: { nombre?: unknown; email?: unknown; role?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = typeof body.role === 'string' ? (body.role as UsuarioRole) : undefined;

  if (!nombre || !email || !role) {
    return NextResponse.json({ error: 'nombre, email y role son requeridos' }, { status: 400 });
  }

  const permitidos = rolesAsignablesPor(session.user.role);
  if (!permitidos.includes(role)) {
    return NextResponse.json({ error: 'No tenés permiso para asignar ese rol' }, { status: 403 });
  }

  try {
    const temporaryPassword = generarPasswordTemporal();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const rows = (await sql`
      INSERT INTO usuarios (nombre, email, password_hash, role, must_change_password)
      VALUES (${nombre}, ${email}, ${passwordHash}, ${role}, true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `) as { id: number }[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      usuario: { id: rows[0].id, nombre, email, role },
      temporaryPassword,
    });
  } catch (error: any) {
    console.error('Error POST /api/admin/usuarios:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al crear el usuario' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireGestorSesion();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  let body: { userId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const userId = Number(body.userId);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: 'userId inválido' }, { status: 400 });
  }

  if (String(userId) === session.user.id) {
    return NextResponse.json({ error: 'No podés eliminar tu propio usuario' }, { status: 400 });
  }

  try {
    const rows = (await sql`SELECT role FROM usuarios WHERE id = ${userId} LIMIT 1`) as { role: UsuarioRole }[];
    const objetivo = rows[0];

    if (!objetivo) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const permitidos = rolesAsignablesPor(session.user.role);
    if (!permitidos.includes(objetivo.role)) {
      return NextResponse.json({ error: 'No tenés permiso para eliminar ese usuario' }, { status: 403 });
    }

    await sql`DELETE FROM usuarios WHERE id = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error DELETE /api/admin/usuarios:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al eliminar el usuario' }, { status: 500 });
  }
}
