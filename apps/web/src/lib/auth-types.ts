export type RolUsuario = "ADMIN" | "GERENTE" | "COCINERO";

export const ROL_LABEL: Record<RolUsuario, string> = {
  ADMIN: "Administrador",
  GERENTE: "Gerente",
  COCINERO: "Cocinero",
};

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}