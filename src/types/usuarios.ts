export type UsuarioRole = 'admin' | 'superadmin' | 'vendedor';

export interface UsuarioListItem {
  id: number;
  nombre: string;
  email: string;
  role: UsuarioRole;
  mustChangePassword: boolean;
  createdAt: string | null;
}
