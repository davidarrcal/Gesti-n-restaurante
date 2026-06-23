"use client";

import { useState } from "react";
import {
  MOTIVOS_SALIDA,
  UNIDAD_LABEL,
  type Producto,
  type Plato,
  type MotivoSalida,
  type LineaSalidaInput,
} from "@/lib/types";

export interface SalidaFormValue {
  fecha: string;
  motivo: MotivoSalida;
  motivoTexto?: string;
  platoId?: string;
  lineas: LineaSalidaInput[];
}

export default function SalidaForm({
  productos,
  platos,
  onSubmit,
  onCancel,
  submitting,
}: {
  productos: Producto[];
  platos: Plato[];
  onSubmit: (v: SalidaFormValue) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(hoy);
  const [motivo, setMotivo] = useState<MotivoSalida>("ELABORACION");
  const [motivoTexto, setMotivoTexto] = useState("");
  const [platoId, setPlato] = useState("");
  const [lineas, setLineas] = useState<
    { productoId: string; cantidad: string }[]
  >([{ productoId: "", cantidad: "" }]);
  const [error, setError] = useState<string | null>(null);

  function addLinea() {
    setLineas([...lineas, { productoId: "", cantidad: "" }]);
  }
  function removeLinea(i: number) {
    setLineas(lineas.filter((_, idx) => idx !== i));
  }
  function updateLinea(i: number, campo: "productoId" | "cantidad", v: string) {
    setLineas(lineas.map((l, idx) => (idx === i ? { ...l, [campo]: v } : l)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lineas.length === 0) return setError("Añade al menos una línea.");
    for (const [i, l] of lineas.entries()) {
      if (!l.productoId) return setError(`Línea ${i + 1}: selecciona un producto.`);
      const c = Number(l.cantidad);
      if (isNaN(c) || c <= 0) return setError(`Línea ${i + 1}: cantidad inválida.`);
      const prod = productos.find((p) => p.id === l.productoId);
      if (prod && c > Number(prod.stockActual)) {
        return setError(
          `Línea ${i + 1}: stock insuficiente de ${prod.nombre} (disponible ${prod.stockActual}).`,
        );
      }
    }
    setError(null);
    onSubmit({
      fecha,
      motivo,
      motivoTexto: motivoTexto.trim() || undefined,
      platoId: platoId || undefined,
      lineas: lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: Number(l.cantidad),
      })),
    });
  }

  const input =
    "w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-brand-500";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Fecha</label>
          <input type="date" className={input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Motivo</label>
          <select
            className={input}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoSalida)}
          >
            {MOTIVOS_SALIDA.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Plato (opcional)</label>
          <select className={input} value={platoId} onChange={(e) => setPlato(e.target.value)}>
            <option value="">— Sin plato asociado —</option>
            {platos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Detalle del motivo</label>
          <input
            className={input}
            placeholder="Ej. Menú del día"
            value={motivoTexto}
            onChange={(e) => setMotivoTexto(e.target.value)}
          />
        </div>
      </div>

      {/* Líneas */}
      <div className="border border-neutral-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_36px] gap-2 px-3 py-2 bg-neutral-50 text-xs font-medium text-neutral-500">
          <div>Producto</div>
          <div className="text-right">Disponible</div>
          <div className="text-right">Cantidad</div>
          <div></div>
        </div>
        {lineas.map((l, i) => {
          const prod = productos.find((p) => p.id === l.productoId);
          const disponible = prod ? Number(prod.stockActual) : 0;
          const stockSuf = prod ? Number(l.cantidad || 0) <= disponible : true;
          return (
            <div
              key={i}
              className="grid grid-cols-[1fr_120px_100px_36px] gap-2 px-3 py-2 border-t border-neutral-100 items-center"
            >
              <select
                className={input}
                value={l.productoId}
                onChange={(e) => updateLinea(i, "productoId", e.target.value)}
              >
                <option value="">— Selecciona —</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({UNIDAD_LABEL[p.unidad]})
                  </option>
                ))}
              </select>
              <div className={"text-right text-sm " + (stockSuf ? "text-neutral-500" : "text-red-500")}>
                {prod ? `${disponible} ${UNIDAD_LABEL[prod.unidad]}` : "—"}
              </div>
              <input
                type="number"
                step="0.001"
                className={input + " text-right"}
                value={l.cantidad}
                onChange={(e) => updateLinea(i, "cantidad", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeLinea(i)}
                className="text-neutral-400 hover:text-red-500 text-sm"
                disabled={lineas.length === 1}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={addLinea} className="text-sm text-brand-600 hover:underline">
        + Añadir línea
      </button>

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
          {submitting ? "Guardando…" : "Registrar salida"}
        </button>
      </div>
    </form>
  );
}