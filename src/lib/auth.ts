import type { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

type UserRole = 'admin' | 'superadmin' | 'vendedor';

interface UsuarioRow {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  role: UserRole;
  must_change_password: boolean;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const rows = (await sql`
          SELECT id, nombre, email, password_hash, role, must_change_password
          FROM usuarios
          WHERE email = ${credentials.email}
          LIMIT 1
        `) as UsuarioRow[];

        const usuario = rows[0];
        if (!usuario) {
          return null;
        }

        const passwordValida = await bcrypt.compare(credentials.password, usuario.password_hash);
        if (!passwordValida) {
          return null;
        }

        return {
          id: String(usuario.id),
          name: usuario.nombre,
          email: usuario.email,
          role: usuario.role,
          mustChangePassword: usuario.must_change_password,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }

      // Permite refrescar mustChangePassword sin forzar un nuevo login,
      // vía useSession().update({ mustChangePassword: false }) tras cambiarla.
      if (trigger === 'update' && session?.mustChangePassword !== undefined) {
        token.mustChangePassword = session.mustChangePassword;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.mustChangePassword = token.mustChangePassword;
      }

      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
