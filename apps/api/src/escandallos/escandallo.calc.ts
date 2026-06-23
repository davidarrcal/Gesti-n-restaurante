import { UnidadMedida } from '@prisma/client';

/**
 * El escandallo almacena `cantidad` en la subunidad (g, mL, uds).
 * El precio del producto está por su `unidad` (KG, G, L, mL, UDS).
 * Esta función convierte de subunidad a la unidad del producto.
 */
export function subToBase(cantidadSub: number, unidad: UnidadMedida): number {
  if (unidad === 'KG' || unidad === 'L') return cantidadSub / 1000;
  return cantidadSub; // G, mL, UDS ya están en subunidad
}

export const SUB_LABEL: Record<UnidadMedida, string> = {
  KG: 'g',
  G: 'g',
  L: 'mL',
  ML: 'mL',
  UDS: 'uds',
};

export interface LineaCalc {
  producto: {
    id: string;
    nombre: string;
    unidad: UnidadMedida;
    precioUnitario: number;
  };
  cantidadNeta: number; // subunidad
  cantidadBruta: number; // subunidad (con merma)
  mermaPorcentaje: number;
  cantidadEnUnidadProducto: number; // bruta en la unidad del precio
  subtotal: number; // €
}

export interface EscandalloCalc {
  lineas: LineaCalc[];
  costePorRacion: number;
  costeTotalPlato: number;
  precioVenta: number;
  margenBruto: number; // por ración
  margenPorcentual: number; // %
  foodCost: number; // % coste/venta
}

/**
 * Calcula el escandallo completo a partir de las líneas y datos del plato.
 */
export function calcularEscandallo(
  lineas: {
    productoId: string;
    cantidad: number; // neta por ración en subunidad (g, mL, uds)
    mermaPorcentaje: number;
    producto: {
      id: string;
      nombre: string;
      unidad: UnidadMedida;
      precioUnitario: any;
    };
  }[],
  numRaciones: number,
  precioVenta: number,
): EscandalloCalc {
  const lineasCalc: LineaCalc[] = lineas.map((l) => {
    const merma = Number(l.mermaPorcentaje ?? 0);
    const neta = Number(l.cantidad);
    const bruta = merma > 0 ? neta / (1 - merma / 100) : neta;
    const precio = Number(l.producto.precioUnitario);
    const enUnidad = subToBase(bruta, l.producto.unidad);
    return {
      producto: {
        id: l.producto.id,
        nombre: l.producto.nombre,
        unidad: l.producto.unidad,
        precioUnitario: precio,
      },
      cantidadNeta: neta,
      cantidadBruta: bruta,
      mermaPorcentaje: merma,
      cantidadEnUnidadProducto: enUnidad,
      subtotal: enUnidad * precio,
    };
  });

  const costePorRacion = lineasCalc.reduce(
    (acc, l) => acc + l.subtotal,
    0,
  );
  const costeTotalPlato = costePorRacion * numRaciones;
  const margenBruto = precioVenta - costePorRacion;
  const margenPorcentual =
    precioVenta > 0 ? (margenBruto / precioVenta) * 100 : 0;
  const foodCost = precioVenta > 0 ? (costePorRacion / precioVenta) * 100 : 0;

  return {
    lineas: lineasCalc,
    costePorRacion,
    costeTotalPlato,
    precioVenta,
    margenBruto,
    margenPorcentual,
    foodCost,
  };
}