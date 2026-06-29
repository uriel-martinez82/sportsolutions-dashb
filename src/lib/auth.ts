import type { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

type UserRole = 'admin' | 'vendedor';

type AppUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const users: AppUser[] = [
  // Admins
  {
    id: '1',
    name: 'Admin Uno',
    email: 'admin1@sportsolutions.mx',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Admin Dos',
    email: 'admin2@sportsolutions.mx',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: '3',
    name: 'Admin Tres',
    email: 'admin3@sportsolutions.mx',
    password: 'admin123',
    role: 'admin',
  },

  // Vendedores
  {
    id: '4',
    name: 'Vendedor Uno',
    email: 'vendedor1@sportsolutions.mx',
    password: 'vende123',
    role: 'vendedor',
  },
  {
    id: '5',
    name: 'Vendedor Dos',
    email: 'vendedor2@sportsolutions.mx',
    password: 'vende123',
    role: 'vendedor',
  },
  {
    id: '6',
    name: 'Vendedor Tres',
    email: 'vendedor3@sportsolutions.mx',
    password: 'vende123',
    role: 'vendedor',
  },
];

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

        const user = users.find(
          (u) =>
            u.email === credentials.email &&
            u.password === credentials.password
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
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