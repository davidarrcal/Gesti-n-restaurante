import type { UnidadMedida } from "./types";

/** El escandallo usa la subunidad (g, mL, uds) para las cantidades netas */
export const SUB_LABEL: Record<UnidadMedida, string> = {
  KG: "g",
  G: "g",
  L: "mL",
  ML: "mL",
  UDS: "uds",
};

/** Convierte de subunidad a la unidad de precio del producto */
export function subToBase(cantidadSub: number, unidad: UnidadMedida): number {
  if (unidad === "KG" || unidad === "L") return cantidadSub / 1000;
  return cantidadSub;
}

export interface LineaPreview {
  nombre: string;
  unidad: UnidadMedida;
  precioUnitario: number;
  cantidadNeta: number;
  merma: number;
  cantidadBruta: number;
  subtotal: number;
}

/** Calcula un preview de escandallo en el frontend */
export function calcLinea(
  cantidadNeta: number,
  merma: number,
  unidad: UnidadMedida,
  precioUnitario: number,
): LineaPreview {
  const bruta = merma > 0 ? cantidadNeta / (1 - merma / 100) : cantidadNeta;
  const enUnidad = subToBase(bruta, unidad);
  return {
    nombre: "",
    unidad,
    precioUnitario,
    cantidadNeta,
    merma,
    cantidadBruta: bruta,
    subtotal: enUnidad * precioUnitario,
  };
}

export function fmtEUR(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export function fmtNum(n: number, dec = 2): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}