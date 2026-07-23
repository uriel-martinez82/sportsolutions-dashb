import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

function generarPasswordTemporal(): string {
  const digitos = Math.floor(1000 + Math.random() * 9000);
  return `SportS2026!${digitos}`;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== 'admin' && role !== 'superadmin')) {
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

  try {
    const temporaryPassword = generarPasswordTemporal();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const rows = (await sql`
      UPDATE usuarios
      SET password_hash = ${passwordHash},
          must_change_password = true,
          reset_token = NULL,
          reset_token_expiry = NULL
      WHERE id = ${userId}
      RETURNING id, nombre, email
    `) as { id: number; nombre: string; email: string }[];

    const usuario = rows[0];
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, usuario, temporaryPassword });
  } catch (error: any) {
    console.error('Error POST /api/admin/usuarios/reset-password:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al resetear la contraseña' }, { status: 500 });
  }
}
