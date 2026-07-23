import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) {
    return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
  }

  try {
    const rows = (await sql`SELECT id FROM usuarios WHERE email = ${email} LIMIT 1`) as { id: number }[];

    if (rows.length > 0) {
      const token = randomUUID();

      await sql`
        UPDATE usuarios
        SET reset_token = ${token}, reset_token_expiry = NOW() + INTERVAL '1 hour'
        WHERE email = ${email}
      `;

      const link = `https://sportsolutions-dashb.vercel.app/reset-password?token=${token}`;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Recuperar contraseña — Sport Solutions',
        html: `
          <p>Recibimos una solicitud para restablecer tu contraseña en el Panel de Inventario de Sport Solutions.</p>
          <p><a href="${link}">Hacé clic acá para elegir una nueva contraseña</a></p>
          <p>Este link vence en 1 hora. Si no solicitaste esto, podés ignorar este correo.</p>
        `,
      });
    }

    // Responder igual exista o no el email en la base (no filtrar registros por enumeración)
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error POST /api/auth/solicitar-reset:', error);
    return NextResponse.json({ success: true });
  }
}
