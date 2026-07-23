import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface SeedUser {
  nombre: string;
  email: string;
  password: string;
  role: 'admin' | 'superadmin' | 'vendedor';
  mustChangePassword: boolean;
}

const SEED_USERS: SeedUser[] = [
  // Admins existentes — password ya definida, sin cambio obligatorio
  { nombre: 'Admin Uno', email: 'admin1@sportsolutions.mx', password: 'admin123', role: 'admin', mustChangePassword: false },
  { nombre: 'Admin Dos', email: 'admin2@sportsolutions.mx', password: 'admin123', role: 'admin', mustChangePassword: false },
  { nombre: 'Admin Tres', email: 'admin3@sportsolutions.mx', password: 'admin123', role: 'admin', mustChangePassword: false },
  { nombre: 'Uriel Martinez', email: 'uriel.martinez.elias@gmail.com', password: 'admin123', role: 'superadmin', mustChangePassword: false },

  // Admins nuevos — deben cambiar password en el primer login
  { nombre: 'Enrique Mena Vidrio', email: 'emena@sportsolutions.com.mx', password: 'SportS2026!', role: 'admin', mustChangePassword: true },
  { nombre: 'Javier Pairoux', email: 'jpairoux@sportsolutions.com.mx', password: 'SportS2026!', role: 'superadmin', mustChangePassword: true },
  { nombre: 'Angeles Hernandez', email: 'angeles.hernandez@sportsolutions.com.mx', password: 'SportS2026!', role: 'admin', mustChangePassword: true },

  // Vendedores existentes — password ya definida, sin cambio obligatorio
  { nombre: 'Vendedor Uno', email: 'vendedor1@sportsolutions.mx', password: 'vende123', role: 'vendedor', mustChangePassword: false },
  { nombre: 'Vendedor Dos', email: 'vendedor2@sportsolutions.mx', password: 'vende123', role: 'vendedor', mustChangePassword: false },
  { nombre: 'Vendedor Tres', email: 'vendedor3@sportsolutions.mx', password: 'vende123', role: 'vendedor', mustChangePassword: false },

  // Vendedores nuevos — deben cambiar password en el primer login
  { nombre: 'Alejandra Delgado', email: 'alejandra.delgado@sportsolutions.com.mx', password: 'SportS2026!', role: 'vendedor', mustChangePassword: true },
  { nombre: 'Alejandro Carrazco', email: 'acarrazco@sportsolutions.com.mx', password: 'SportS2026!', role: 'vendedor', mustChangePassword: true },
  { nombre: 'Alejandro Hernandez', email: 'alejandro@sportsolutions.com.mx', password: 'SportS2026!', role: 'vendedor', mustChangePassword: true },
  { nombre: 'Jorge de la Torre Navarro', email: 'jnavarro@sportsolutions.com.mx', password: 'SportS2026!', role: 'vendedor', mustChangePassword: true },
  { nombre: 'Juan Pablo Cruz', email: 'jcruz@sportsolutions.com.mx', password: 'SportS2026!', role: 'vendedor', mustChangePassword: true },
];

/**
 * Endpoint de setup inicial — crea la tabla `usuarios` y siembra los usuarios base.
 * Protegido con ?secret=SETUP_SECRET. Idempotente: los emails ya existentes no se
 * sobreescriben (ON CONFLICT DO NOTHING), para no pisar passwords ya cambiadas.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'vendedor',
        must_change_password BOOLEAN NOT NULL DEFAULT true,
        reset_token TEXT,
        reset_token_expiry TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Restringe los valores válidos de `role` (migración idempotente para tablas ya existentes)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_role_check'
        ) THEN
          ALTER TABLE usuarios
            ADD CONSTRAINT usuarios_role_check CHECK (role IN ('admin', 'superadmin', 'vendedor'));
        END IF;
      END $$;
    `;

    const detalle: { email: string; insertado: boolean }[] = [];

    for (const u of SEED_USERS) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      const rows = await sql`
        INSERT INTO usuarios (nombre, email, password_hash, role, must_change_password)
        VALUES (${u.nombre}, ${u.email}, ${passwordHash}, ${u.role}, ${u.mustChangePassword})
        ON CONFLICT (email) DO NOTHING
        RETURNING email
      `;
      detalle.push({ email: u.email, insertado: rows.length > 0 });
    }

    return NextResponse.json({
      success: true,
      insertados: detalle.filter(d => d.insertado).length,
      yaExistian: detalle.filter(d => !d.insertado).length,
      detalle,
    });
  } catch (error: any) {
    console.error('Error en /api/auth/setup:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al ejecutar el setup' }, { status: 500 });
  }
}
