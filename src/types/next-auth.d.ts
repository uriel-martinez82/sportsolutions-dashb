import NextAuth from 'next-auth';

declare module 'next-auth' {
  type UserRole = 'admin' | 'superadmin' | 'vendedor';

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      mustChangePassword?: boolean;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    mustChangePassword: boolean;
  }
}

declare module 'next-auth/jwt' {
  type UserRole = 'admin' | 'superadmin' | 'vendedor';

  interface JWT {
    id?: string;
    role?: UserRole;
    mustChangePassword?: boolean;
  }
}
