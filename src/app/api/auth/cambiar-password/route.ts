import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: { newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await sql`
      UPDATE usuarios
      SET password_hash = ${passwordHash}, must_change_password = false
      WHERE email = ${session.user.email}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error POST /api/auth/cambiar-password:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al cambiar la contraseña' }, { status: 500 });
  }
}
