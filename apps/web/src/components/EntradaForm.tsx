"use client";

import { useState } from "react";
import type { Producto, Proveedor, LineaEntradaInput } from "@/lib/types";
import { UNIDAD_LABEL } from "@/lib/types";

export interface EntradaFormValue {
  fecha: string;
  numeroFactura?: string;
  proveedorId?: string;
  lineas: LineaEntradaInput[];
}

export default function EntradaForm({
  productos,
  proveedores,
  onSubmit,
  onCancel,
  submitting,
}: {
  productos: Producto[];
  proveedores: Proveedor[];
  onSubmit: (v: EntradaFormValue) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(hoy);
  const [numeroFactura, setFactura] = useState("");
  const [proveedorId, setProveedor] = useState("");
  const [lineas, setLineas] = useState<
    { productoId: string; cantidad: string; precioCompra: string }[]
  >([{ productoId: "", cantidad: "", precioCompra: "" }]);
  const [error, setError] = useState<string | null>(null);

  function addLinea() {
    setLineas([...lineas, { productoId: "", cantidad: "", precioCompra: "" }]);
  }
  function removeLinea(i: number) {
    setLineas(lineas.filter((_, idx) => idx !== i));
  }
  function updateLinea(i: number, campo: keyof (typeof lineas)[number], v: string) {
    setLineas(lineas.map((l, idx) => (idx === i ? { ...l, [campo]: v } : l)));
  }

  function onProductoChange(i: number, productoId: string) {
    const prod = productos.find((p) => p.id === productoId);
    const precioDefault = prod ? Number(prod.precioUnitario).toFixed(2) : "" as string;
    setLineas(
      lineas.map((l, idx) =>
        idx === i
          ? { ...l, productoId, precioCompra: precioDefault }
          : l,
      ),
    );
  }

  const total = lineas.reduce((acc, l) => {
    const c = Number(l.cantidad);
    const p = Number(l.precioCompra);
    return acc + (isNaN(c) || isNaN(p) ? 0 : c * p);
  }, 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lineas.length === 0) return setError("Añade al menos una línea.");
    for (const [i, l] of lineas.entries()) {
      if (!l.productoId) return setError(`Línea ${i + 1}: selecciona un producto.`);
      const c = Number(l.cantidad);
      const p = Number(l.precioCompra);
      if (isNaN(c) || c <= 0) return setError(`Línea ${i + 1}: cantidad inválida.`);
      if (isNaN(p) || p < 0) return setError(`Línea ${i + 1}: precio inválido.`);
    }
    setError(null);
    onSubmit({
      fecha,
      numeroFactura: numeroFactura.trim() || undefined,
      proveedorId: proveedorId || undefined,
      lineas: lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: Number(l.cantidad),
        precioCompra: Number(l.precioCompra),
      })),
    });
  }

  const input =
    "w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-brand-500";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Fecha</label>
          <input type="date" className={input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Nº factura</label>
          <input className={input} value={numeroFactura} onChange={(e) => setFactura(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Proveedor</label>
          <select className={input} value={proveedorId} onChange={(e) => setProveedor(e.target.value)}>
            <option value="">— Sin proveedor —</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Líneas */}
      <div className="border border-neutral-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_100px_90px_36px] gap-2 px-3 py-2 bg-neutral-50 text-xs font-medium text-neutral-500">
          <div>Producto</div>
          <div className="text-right">Cantidad</div>
          <div className="text-right">Precio (€)</div>
          <div className="text-right">Subtotal</div>
          <div></div>
        </div>
        {lineas.map((l, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_90px_100px_90px_36px] gap-2 px-3 py-2 border-t border-neutral-100 items-center"
          >
            <select
              className={input}
              value={l.productoId}
              onChange={(e) => onProductoChange(i, e.target.value)}
            >
              <option value="">— Selecciona —</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({UNIDAD_LABEL[p.unidad]})
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.001"
              className={input + " text-right"}
              value={l.cantidad}
              onChange={(e) => updateLinea(i, "cantidad", e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              className={input + " text-right"}
              value={l.precioCompra}
              onChange={(e) => updateLinea(i, "precioCompra", e.target.value)}
            />
            <div className="text-right text-sm text-neutral-600">
              {(Number(l.cantidad) * Number(l.precioCompra) || 0).toFixed(2)}
            </div>
            <button
              type="button"
              onClick={() => removeLinea(i)}
              className="text-neutral-400 hover:text-red-500 text-sm"
              disabled={lineas.length === 1}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addLinea}
          className="text-sm text-brand-600 hover:underline"
        >
          + Añadir línea
        </button>
        <div className="text-sm font-semibold">Total: {total.toFixed(2)} €</div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium disabled:opacity-60"
        >
          {submitting ? "Guardando…" : "Registrar entrada"}
        </button>
      </div>
    </form>
  );
}