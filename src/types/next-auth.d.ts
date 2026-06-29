import NextAuth from 'next-auth';

declare module 'next-auth' {
  type UserRole = 'admin' | 'vendedor';

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
    };
  }

  interface User {
    id: string;
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  type UserRole = 'admin' | 'vendedor';

  interface JWT {
    id?: string;
    role?: UserRole;
  }
}