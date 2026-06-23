export type UnidadMedida = "KG" | "G" | "L" | "ML" | "UDS";

export const UNIDADES: UnidadMedida[] = ["KG", "G", "L", "ML", "UDS"];

export const UNIDAD_LABEL: Record<UnidadMedida, string> = {
  KG: "kg",
  G: "g",
  L: "L",
  ML: "mL",
  UDS: "uds",
};

export interface Proveedor {
  id: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

export interface Plato {
  id: string;
  nombre: string;
  descripcion?: string | null;
  numRaciones: number;
  precioVenta: string;
}

// ----- Escandallos -----
export interface LineaEscandalloInput {
  productoId: string;
  cantidad: number; // neta por ración en subunidad (g, mL, uds)
  mermaPorcentaje?: number; // %
}

export interface PlatoInput {
  nombre: string;
  descripcion?: string;
  numRaciones: number;
  precioVenta: number;
  lineas: LineaEscandalloInput[];
}

export interface LineaCalc {
  productoId: string;
  nombre: string;
  unidad: UnidadMedida;
  precioUnitario: number;
  cantidadNeta: number;
  cantidadBruta: number;
  mermaPorcentaje: number;
  cantidadEnUnidadProducto: number;
  subtotal: number;
}

export interface EscandalloCalc {
  lineas: LineaCalc[];
  costePorRacion: number;
  costeTotalPlato: number;
  precioVenta: number;
  margenBruto: number;
  margenPorcentual: number;
  foodCost: number;
}

export interface PlazaDetalle extends Plato {
  lineas: {
    id: string;
    platoId: string;
    productoId: string;
    cantidad: string;
    mermaPorcentaje: string;
    producto: Producto;
  }[];
  calc: EscandalloCalc;
}

// ----- Alertas -----
export interface AlertaStockBajo {
  id: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  unidad: UnidadMedida;
  proveedor: string | null;
}

export interface AlertaCaducidad {
  id: string;
  nombre: string;
  fechaCaducidad: string;
  diasRestantes: number;
  diasCaducado?: number;
  proveedor: string | null;
}

export interface Alertas {
  diasProximo: number;
  stockBajoMinimo: AlertaStockBajo[];
  proximosCaducar: AlertaCaducidad[];
  caducados: AlertaCaducidad[];
  resumen: {
    totalAlertas: number;
    stockBajo: number;
    proximos: number;
    caducados: number;
  };
}

export interface MovimientoResumen {
  id: string;
  producto: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  stockResultante: number;
  fecha: string;
  unidad?: UnidadMedida;
}

export interface Metricas {
  contadores: {
    productos: number;
    proveedores: number;
    platos: number;
    entradasHoy: number;
    salidasHoy: number;
  };
  valorInventario: number;
  alertas: Alertas["resumen"];
  ultimosMovimientos: MovimientoResumen[];
}

// ----- Informes -----
export type TipoInforme = "movimientos" | "escandallos" | "caducidades";

export interface FilaMovimiento {
  fecha: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  stockResultante: number;
  motivo?: string | null;
  referencia?: string | null;
}

export interface InformeMovimientos {
  tipo: "movimientos";
  producto: {
    id: string;
    nombre: string;
    unidad?: UnidadMedida;
    precioUnitario: number;
  };
  filas: FilaMovimiento[];
  resumen: {
    totalEntradas: number;
    totalSalidas: number;
    balance: number;
    stockResultante: number;
    numMovimientos: number;
  };
}

export interface FilaEscandallo {
  id: string;
  nombre: string;
  numRaciones: number;
  numIngredientes: number;
  precioVenta: number;
  costePorRacion: number;
  costeTotalPlato: number;
  margenBruto: number;
  margenPorcentual: number;
  foodCost: number;
}

export interface InformeEscandallos {
  tipo: "escandallos";
  filas: FilaEscandallo[];
  resumen: {
    numPlatos: number;
    costeMedioRacion: number;
    margenMedioPorcentual: number;
  };
}

export interface FilaCaducidad {
  id: string;
  nombre: string;
  categoria?: string | null;
  stockActual: number;
  unidad: UnidadMedida;
  fechaCaducidad: string;
  diasRestantes: number;
  estado: "CADUCADO" | "PROXIMO" | "OK";
  proveedor: string | null;
}

export interface InformeCaducidades {
  tipo: "caducidades";
  filas: FilaCaducidad[];
  resumen: {
    totalProductos: number;
    caducados: number;
    proximos: number;
    ok: number;
  };
}

export type Informe =
  | InformeMovimientos
  | InformeEscandallos
  | InformeCaducidades;

export interface Producto {
  id: string;
  nombre: string;
  categoria?: string | null;
  unidad: UnidadMedida;
  pesoUnitario: string;
  precioUnitario: string;
  stockMinimo: string;
  stockActual: string;
  fechaCaducidad?: string | null;
  proveedorId?: string | null;
  proveedor?: Proveedor | null;
  stockBajoMinimo?: boolean;
  caducado?: boolean;
}

export type FiltroCaducidad = "TODOS" | "CADUCADOS" | "PROXIMOS";

export interface FiltroProducto {
  q?: string;
  categoria?: string;
  proveedorId?: string;
  unidad?: UnidadMedida;
  caducidad?: FiltroCaducidad;
}

export interface ProductoInput {
  nombre: string;
  categoria?: string;
  unidad: UnidadMedida;
  pesoUnitario: number;
  precioUnitario: number;
  stockMinimo?: number;
  fechaCaducidad?: string;
  proveedorId?: string;
}

// ----- Entradas -----
export interface LineaEntradaInput {
  productoId: string;
  cantidad: number;
  precioCompra: number;
}

export interface EntradaInput {
  fecha?: string;
  numeroFactura?: string;
  proveedorId?: string;
  lineas: LineaEntradaInput[];
}

export interface DetalleEntrada {
  id: string;
  entradaId: string;
  productoId: string;
  cantidad: string;
  precioCompra: string;
  producto?: Producto;
}

export interface Entrada {
  id: string;
  fecha: string;
  numeroFactura?: string | null;
  proveedorId?: string | null;
  proveedor?: Proveedor | null;
  detalles: DetalleEntrada[];
}

// ----- Salidas -----
export type MotivoSalida = "ELABORACION" | "MERMA" | "ROTURA" | "INVENTARIO" | "OTRO";

export const MOTIVOS_SALIDA: { value: MotivoSalida; label: string }[] = [
  { value: "ELABORACION", label: "Elaboración" },
  { value: "MERMA", label: "Merma" },
  { value: "ROTURA", label: "Rotura" },
  { value: "INVENTARIO", label: "Ajuste inventario" },
  { value: "OTRO", label: "Otro" },
];

export interface LineaSalidaInput {
  productoId: string;
  cantidad: number;
}

export interface SalidaInput {
  fecha?: string;
  motivo?: MotivoSalida;
  motivoTexto?: string;
  platoId?: string;
  lineas: LineaSalidaInput[];
}

export interface DetalleSalida {
  id: string;
  salidaId: string;
  productoId: string;
  cantidad: string;
  producto?: Producto;
}

export interface Salida {
  id: string;
  fecha: string;
  motivo: MotivoSalida;
  motivoTexto?: string | null;
  platoId?: string | null;
  plato?: Plato | null;
  detalles: DetalleSalida[];
}