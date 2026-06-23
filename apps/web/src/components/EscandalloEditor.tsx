"use client";

import { useEffect, useState, useMemo } from "react";
import {
  api,
  SUB_LABEL,
  UNIDAD_LABEL,
  calcLinea,
  fmtEUR,
  fmtNum,
  type Producto,
  type PlazaDetalle,
  type LineaEscandalloInput,
} from "@/lib/escandallo-helpers";

type Linea = {
  productoId: string;
  cantidad: string;
  merma: string;
};

export default function EscandalloEditor({
  plato,
  productos,
  onClose,
}: {
  plato: PlazaDetalle | null;
  productos: Producto[];
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(plato?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(plato?.descripcion ?? "");
  const [numRaciones, setNumRaciones] = useState(String(plato?.numRaciones ?? 1));
  const [precioVenta, setPrecioVenta] = useState(
    String(plato?.precioVenta ?? 0),
  );
  const [lineas, setLineas] = useState<Linea[]>(
    plato?.lineas?.map((l) => ({
      productoId: l.productoId,
      cantidad: String(l.cantidad),
      merma: String(l.mermaPorcentaje),
    })) ?? [{ productoId: "", cantidad: "", merma: "0" }],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isEdit = !!plato;

  const preview = useMemo(() => {
    return lineas.map((l) => {
      const prod = productos.find((p) => p.id === l.productoId);
      const cn = Number(l.cantidad);
      const merma = Number(l.merma);
      if (!prod || isNaN(cn))
        return null;
      return calcLinea(cn, merma, prod.unidad, Number(prod.precioUnitario));
    });
  }, [lineas, productos]);

  const costePorRacion = preview.reduce(
    (acc, p) => (p ? acc + p.subtotal : acc),
    0,
  );
  const pv = Number(precioVenta);
  const margen = isFinite(pv) ? pv - costePorRacion : 0;
  const margenPct = pv > 0 ? (margen / pv) * 100 : 0;
  const foodCost = pv > 0 ? (costePorRacion / pv) * 100 : 0;

  function addLinea() {
    setLineas([...lineas, { productoId: "", cantidad: "", merma: "0" }]);
  }
  function removeLinea(i: number) {
    setLineas(lineas.filter((_, idx) => idx !== i));
  }
  function updateLinea(
    i: number,
    campo: keyof Linea,
    v: string,
  ) {
    setLineas(lineas.map((l, idx) => (idx === i ? { ...l, [campo]: v } : l)));
  }

  async function guardarTodo() {
    setError(null);
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    const nr = Number(numRaciones);
    const pre = Number(precioVenta);
    if (isNaN(nr) || nr < 1) return setError("Número de raciones inválido.");
    if (isNaN(pre) || pre < 0) return setError("Precio de venta inválido.");

    const lineasValidas = lineas.filter((l) => l.productoId);
    for (const [i, l] of lineasValidas.entries()) {
      if (Number(l.cantidad) <= 0)
        return setError(`Línea ${i + 1}: cantidad neta inválida.`);
    }

    setSaving(true);
    try {
      const lineasDto: LineaEscandalloInput[] = lineasValidas.map((l) => ({
        productoId: l.productoId,
        cantidad: Number(l.cantidad),
        mermaPorcentaje: Number(l.merma) || 0,
      }));

      if (isEdit) {
        await api.updatePlato(plato!.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          numRaciones: nr,
          precioVenta: pre,
        });
        await api.updatePlatoLineas(plato!.id, lineasDto);
      } else {
        await api.createPlato({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          numRaciones: nr,
          precioVenta: pre,
          lineas: lineasDto,
        });
      }
      setToast("Escandallo guardado");
      setTimeout(() => onClose(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2500);
    }
  }

  const input =
    "w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-brand-500";

  return (
    <div className="space-y-5">
      {/* Datos del plato */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-neutral-600 mb-1">Nombre del plato *</label>
          <input className={input} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-neutral-600 mb-1">Descripción</label>
          <input className={input} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Nº raciones *</label>
          <input type="number" min={1} className={input} value={numRaciones} onChange={(e) => setNumRaciones(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Precio venta (€) *</label>
          <input type="number" step="0.01" min={0} className={input} value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} />
        </div>
      </div>

      {/* Ingredientes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-neutral-700">Ingredientes</h4>
          <button type="button" onClick={addLinea} className="text-sm text-brand-600 hover:underline">
            + Añadir ingrediente
          </button>
        </div>
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_110px_70px_90px_90px_36px] gap-2 px-3 py-2 bg-neutral-50 text-[11px] font-medium text-neutral-500">
            <div>Producto</div>
            <div className="text-right">Neta/ración</div>
            <div className="text-right">Merma%</div>
            <div className="text-right">Bruta</div>
            <div className="text-right">Subtotal</div>
            <div></div>
          </div>
          {lineas.map((l, i) => {
            const prod = productos.find((p) => p.id === l.productoId);
            const p = preview[i];
            return (
              <div
                key={i}
                className="grid grid-cols-[1fr_110px_70px_90px_90px_36px] gap-2 px-3 py-2 border-t border-neutral-100 items-center"
              >
                <select
                  className={input}
                  value={l.productoId}
                  onChange={(e) => updateLinea(i, "productoId", e.target.value)}
                >
                  <option value="">— Selecciona —</option>
                  {productos.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.nombre} ({UNIDAD_LABEL[pr.unidad]})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  className={input + " text-right"}
                  value={l.cantidad}
                  onChange={(e) => updateLinea(i, "cantidad", e.target.value)}
                  placeholder={prod ? SUB_LABEL[prod.unidad] : ""}
                />
                <input
                  type="number"
                  step="0.1"
                  className={input + " text-right"}
                  value={l.merma}
                  onChange={(e) => updateLinea(i, "merma", e.target.value)}
                />
                <div className="text-right text-xs text-neutral-500">
                  {p ? fmtNum(p.cantidadBruta, 1) : "—"}
                </div>
                <div className="text-right text-xs font-medium">
                  {p ? fmtEUR(p.subtotal) : "—"}
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
            );
          })}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 bg-neutral-50 rounded-xl p-4">
        <div>
          <p className="text-xs text-neutral-500">Coste por ración</p>
          <p className="text-lg font-semibold">{fmtEUR(costePorRacion)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Margen bruto</p>
          <p className={"text-lg font-semibold " + (margen >= 0 ? "text-emerald-600" : "text-red-600")}>
            {fmtEUR(margen)} ({fmtNum(margenPct, 1)}%)
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Food Cost</p>
          <p className="text-sm font-medium">{fmtNum(foodCost, 1)}%</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Coste total plato ({numRaciones || 0} raciones)</p>
          <p className="text-sm font-medium">{fmtEUR(costePorRacion * Number(numRaciones || 0))}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100">
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardarTodo}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear escandallo"}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}