"use client";

import { useState } from "react";
import {
  UNIDADES,
  UNIDAD_LABEL,
  type ProductoInput,
  type Proveedor,
  type UnidadMedida,
} from "@/lib/types";

export default function ProductoForm({
  initial,
  proveedores,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<ProductoInput>;
  proveedores: Proveedor[];
  onSubmit: (data: ProductoInput) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "");
  const [unidad, setUnidad] = useState<UnidadMedida>(initial?.unidad ?? "KG");
  const [pesoUnitario, setPeso] = useState(String(initial?.pesoUnitario ?? 0));
  const [precioUnitario, setPrecio] = useState(String(initial?.precioUnitario ?? 0));
  const [stockMinimo, setStockMin] = useState(String(initial?.stockMinimo ?? 0));
  const [fechaCaducidad, setFecha] = useState(initial?.fechaCaducidad ?? "");
  const [proveedorId, setProveedor] = useState(initial?.proveedorId ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const pes = Number(pesoUnitario);
    const pre = Number(precioUnitario);
    const stk = Number(stockMinimo);
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (isNaN(pes) || pes < 0) return setError("Peso unitario inválido.");
    if (isNaN(pre) || pre < 0) return setError("Precio unitario inválido.");
    if (isNaN(stk) || stk < 0) return setError("Stock mínimo inválido.");
    setError(null);
    onSubmit({
      nombre: nombre.trim(),
      categoria: categoria.trim() || undefined,
      unidad,
      pesoUnitario: pes,
      precioUnitario: pre,
      stockMinimo: stk,
      fechaCaducidad: fechaCaducidad || undefined,
      proveedorId: proveedorId || undefined,
    });
  }

  const input =
    "w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">
          Nombre *
        </label>
        <input className={input} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Categoría</label>
          <input className={input} value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Unidad *</label>
          <select className={input} value={unidad} onChange={(e) => setUnidad(e.target.value as UnidadMedida)}>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>{UNIDAD_LABEL[u]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Peso unitario (g/mL) *
          </label>
          <input type="number" step="0.001" className={input} value={pesoUnitario} onChange={(e) => setPeso(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Precio/unidad (€) *
          </label>
          <input type="number" step="0.01" className={input} value={precioUnitario} onChange={(e) => setPrecio(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Stock mínimo</label>
          <input type="number" step="0.001" className={input} value={stockMinimo} onChange={(e) => setStockMin(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Fecha caducidad</label>
          <input type="date" className={input} value={fechaCaducidad} onChange={(e) => setFecha(e.target.value)} />
        </div>
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
          {submitting ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}