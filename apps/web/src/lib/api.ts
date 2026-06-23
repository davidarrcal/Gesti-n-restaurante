import type {
  Producto,
  ProductoInput,
  FiltroProducto,
  Proveedor,
  Entrada,
  EntradaInput,
  Salida,
  SalidaInput,
  Plato,
  PlatoInput,
  PlazaDetalle,
  LineaEscandalloInput,
  Alertas,
  Metricas,
  Informe,
  TipoInforme,
} from "./types";
import type { AuthResponse, AuthUser } from "./auth-types";

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window === "undefined" ? "http://localhost:3001/api" : "/api");

const TOKEN_KEY = "gr_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 401 && typeof window !== "undefined") {
    clearToken();
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || res.statusText);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

function qs(params: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") u.set(k, v);
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

// ----- Productos -----
export const api = {
  listProductos: (f: FiltroProducto = {}) =>
    http<Producto[]>(`/productos${qs(f as Record<string, string | undefined>)}`),
  getProducto: (id: string) => http<Producto>(`/productos/${id}`),
  createProducto: (data: ProductoInput) =>
    http<Producto>("/productos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProducto: (id: string, data: Partial<ProductoInput>) =>
    http<Producto>(`/productos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProducto: (id: string) =>
    http<void>(`/productos/${id}`, { method: "DELETE" }),

  // ----- Proveedores -----
  listProveedores: (q?: string) =>
    http<Proveedor[]>(`/proveedores${qs({ q })}`),
  createProveedor: (data: Pick<Proveedor, "nombre"> & Partial<Proveedor>) =>
    http<Proveedor>("/proveedores", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteProveedor: (id: string) =>
    http<void>(`/proveedores/${id}`, { method: "DELETE" }),

  // ----- Entradas -----
  listEntradas: (desde?: string, hasta?: string, proveedorId?: string) =>
    http<Entrada[]>(
      `/entradas${qs({ desde, hasta, proveedorId })}`,
    ),
  getEntrada: (id: string) => http<Entrada>(`/entradas/${id}`),
  createEntrada: (data: EntradaInput) =>
    http<Entrada>("/entradas", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteEntrada: (id: string) =>
    http<void>(`/entradas/${id}`, { method: "DELETE" }),

  // ----- Salidas -----
  listSalidas: (desde?: string, hasta?: string, platoId?: string) =>
    http<Salida[]>(`/salidas${qs({ desde, hasta, platoId })}`),
  getSalida: (id: string) => http<Salida>(`/salidas/${id}`),
  createSalida: (data: SalidaInput) =>
    http<Salida>("/salidas", { method: "POST", body: JSON.stringify(data) }),
  deleteSalida: (id: string) =>
    http<void>(`/salidas/${id}`, { method: "DELETE" }),

  // ----- Platos (para selector en salidas/escandallos) -----
  listPlatos: () => http<Plato[]>("/platos"),

  // ----- Escandallos -----
  getPlato: (id: string) => http<PlazaDetalle>(`/platos/${id}`),
  createPlato: (data: PlatoInput) =>
    http<PlazaDetalle>("/platos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePlato: (id: string, data: Partial<Omit<PlatoInput, "lineas">>) =>
    http<PlazaDetalle>(`/platos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  updatePlatoLineas: (id: string, lineas: LineaEscandalloInput[]) =>
    http<PlazaDetalle>(`/platos/${id}/lineas`, {
      method: "PATCH",
      body: JSON.stringify({ lineas }),
    }),
  duplicatePlato: (id: string) =>
    http<Plato>(`/platos/${id}/duplicar`, { method: "POST" }),
  deletePlato: (id: string) =>
    http<void>(`/platos/${id}`, { method: "DELETE" }),

  // ----- Alertas y Dashboard -----
  getAlertas: (diasProximo = 7) =>
    http<Alertas>(`/alertas?diasProximo=${diasProximo}`),
  getMetricas: () => http<Metricas>("/alertas/metricas"),

  // ----- Informes -----
  getInforme: (
    tipo: TipoInforme,
    params: { productoId?: string; desde?: string; hasta?: string } = {},
  ) =>
    http<Informe>(
      `/informes?${qs({ tipo, productoId: params.productoId, desde: params.desde, hasta: params.hasta })}`,
    ),

  // ----- Auth -----
  login: (email: string, password: string) =>
    http<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => http<AuthUser>("/auth/me"),
};