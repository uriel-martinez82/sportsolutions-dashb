import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  let body: { token?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const token = typeof body.token === 'string' ? body.token : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  try {
    const rows = (await sql`
      SELECT id FROM usuarios
      WHERE reset_token = ${token} AND reset_token_expiry > NOW()
      LIMIT 1
    `) as { id: number }[];

    const usuario = rows[0];
    if (!usuario) {
      return NextResponse.json({ error: 'El link de recuperación es inválido o expiró' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await sql`
      UPDATE usuarios
      SET password_hash = ${passwordHash},
          must_change_password = false,
          reset_token = NULL,
          reset_token_expiry = NULL
      WHERE id = ${usuario.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error POST /api/auth/reset-password:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al restablecer la contraseña' }, { status: 500 });
  }
}
