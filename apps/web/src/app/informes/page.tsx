"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";
import { fmtEUR, fmtNum } from "@/lib/escandallo";
import { UNIDAD_LABEL, type Producto, type Informe, type TipoInforme } from "@/lib/types";

export default function InformesPage() {
  const [tipo, setTipo] = useState<TipoInforme>("movimientos");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [informe, setInforme] = useState<Informe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listProductos().then(setProductos).catch(() => {});
  }, []);

  const generar = useCallback(async () => {
    if (tipo === "movimientos" && !productoId) {
      setError("Selecciona un producto para el informe de movimientos.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await api.getInforme(tipo, {
        productoId: productoId || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
      setInforme(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar informe");
    } finally {
      setLoading(false);
    }
  }, [tipo, productoId, desde, hasta]);

  function exportCSV() {
    if (!informe) return;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (informe.tipo === "movimientos") {
      headers = ["Fecha", "Tipo", "Cantidad", "Stock resultante", "Motivo", "Referencia"];
      rows = informe.filas.map((f) => [
        new Date(f.fecha).toLocaleString("es-ES"),
        f.tipo,
        String(f.cantidad),
        String(f.stockResultante),
        f.motivo ?? "",
        f.referencia ?? "",
      ]);
    } else if (informe.tipo === "escandallos") {
      headers = ["Plato", "Raciones", "Ingredientes", "Precio venta", "Coste/ración", "Coste total", "Margen bruto", "Margen %", "Food Cost %"];
      rows = informe.filas.map((f) => [
        f.nombre,
        String(f.numRaciones),
        String(f.numIngredientes),
        String(f.precioVenta),
        String(f.costePorRacion),
        String(f.costeTotalPlato),
        String(f.margenBruto),
        String(f.margenPorcentual),
        String(f.foodCost),
      ]);
    } else {
      headers = ["Producto", "Categoría", "Stock", "Unidad", "Caducidad", "Días", "Estado", "Proveedor"];
      rows = informe.filas.map((f) => [
        f.nombre,
        f.categoria ?? "",
        String(f.stockActual),
        f.unidad,
        new Date(f.fechaCaducidad).toLocaleDateString("es-ES"),
        String(f.diasRestantes),
        f.estado,
        f.proveedor ?? "",
      ]);
    }

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe_${informe.tipo}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tipos: { value: TipoInforme; label: string; desc: string }[] = [
    { value: "movimientos", label: "Movimientos por producto", desc: "Entradas y salidas en un rango de fechas (RF-19)" },
    { value: "escandallos", label: "Costes de escandallos", desc: "Listado de platos con coste y margen (RF-20)" },
    { value: "caducidades", label: "Caducidades", desc: "Productos caducados o próximos a caducar (RF-21)" },
  ];

  const input = "px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-brand-500";

  return (
    <div>
      <PageHeader
        title="Informes"
        subtitle="Movimientos, costes de escandallos y caducidades (RF-19, RF-20, RF-21)"
        actions={
          informe && (
            <button
              onClick={exportCSV}
              className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium"
            >
              Exportar CSV
            </button>
          )
        }
      />

      {/* Selector de tipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {tipos.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setTipo(t.value);
              setInforme(null);
            }}
            className={
              "text-left p-4 rounded-2xl border transition-colors " +
              (tipo === t.value
                ? "border-brand-500 bg-brand-50"
                : "border-neutral-200 bg-white hover:border-neutral-300")
            }
          >
            <p className="font-medium text-sm text-neutral-800">{t.label}</p>
            <p className="text-xs text-neutral-500 mt-1">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        {tipo === "movimientos" && (
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Producto *</label>
            <select className={input} value={productoId} onChange={(e) => setProductoId(e.target.value)}>
              <option value="">— Selecciona —</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
        )}
        {tipo !== "escandallos" && (
          <>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Desde</label>
              <input type="date" className={input} value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Hasta</label>
              <input type="date" className={input} value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </>
        )}
        <button
          onClick={generar}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-neutral-800 text-white text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Generando…" : "Generar"}
        </button>
      </div>

      {error && (
        <div className="mb-3 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Resultado */}
      {informe && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {informe.tipo === "movimientos" &&
              [
                { label: "Entradas", value: `${informe.resumen.totalEntradas}` },
                { label: "Salidas", value: `${informe.resumen.totalSalidas}` },
                { label: "Balance", value: `${informe.resumen.balance}` },
                { label: "Stock actual", value: `${informe.resumen.stockResultante}` },
              ].map((r) => (
                <div key={r.label} className="bg-white rounded-xl border border-neutral-200 p-4">
                  <p className="text-xs text-neutral-500">{r.label}</p>
                  <p className="text-lg font-semibold">{r.value}</p>
                </div>
              ))}
            {informe.tipo === "escandallos" &&
              [
                { label: "Platos", value: String(informe.resumen.numPlatos) },
                { label: "Coste medio/ración", value: fmtEUR(informe.resumen.costeMedioRacion) },
                { label: "Margen medio", value: `${fmtNum(informe.resumen.margenMedioPorcentual, 1)}%` },
              ].map((r) => (
                <div key={r.label} className="bg-white rounded-xl border border-neutral-200 p-4">
                  <p className="text-xs text-neutral-500">{r.label}</p>
                  <p className="text-lg font-semibold">{r.value}</p>
                </div>
              ))}
            {informe.tipo === "caducidades" &&
              [
                { label: "Total", value: String(informe.resumen.totalProductos) },
                { label: "Caducados", value: String(informe.resumen.caducados), color: "text-red-600" },
                { label: "Próximos", value: String(informe.resumen.proximos), color: "text-amber-600" },
                { label: "OK", value: String(informe.resumen.ok), color: "text-emerald-600" },
              ].map((r) => (
                <div key={r.label} className="bg-white rounded-xl border border-neutral-200 p-4">
                  <p className="text-xs text-neutral-500">{r.label}</p>
                  <p className={"text-lg font-semibold " + (r.color ?? "")}>{r.value}</p>
                </div>
              ))}
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {informe.tipo === "movimientos" && (
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium text-right">Cantidad</th>
                      <th className="px-4 py-3 font-medium text-right">Stock resultante</th>
                      <th className="px-4 py-3 font-medium">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {informe.filas.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">Sin movimientos en el rango seleccionado.</td></tr>
                    ) : (
                      informe.filas.map((f, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3">{new Date(f.fecha).toLocaleString("es-ES")}</td>
                          <td className="px-4 py-3">
                            <span className={"px-2 py-0.5 rounded-full text-xs " + (f.tipo === "ENTRADA" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                              {f.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {f.cantidad} {informe.producto.unidad ? UNIDAD_LABEL[informe.producto.unidad] : ""}
                          </td>
                          <td className="px-4 py-3 text-right text-neutral-500">{f.stockResultante}</td>
                          <td className="px-4 py-3 text-neutral-500">{f.motivo ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {informe.tipo === "escandallos" && (
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Plato</th>
                      <th className="px-4 py-3 font-medium text-center">Raciones</th>
                      <th className="px-4 py-3 font-medium text-right">Coste/ración</th>
                      <th className="px-4 py-3 font-medium text-right">P. venta</th>
                      <th className="px-4 py-3 font-medium text-right">Margen</th>
                      <th className="px-4 py-3 font-medium text-right">Food Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {informe.filas.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No hay escandallos creados.</td></tr>
                    ) : (
                      informe.filas.map((f) => (
                        <tr key={f.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 font-medium">{f.nombre}</td>
                          <td className="px-4 py-3 text-center text-neutral-500">{f.numRaciones}</td>
                          <td className="px-4 py-3 text-right">{fmtEUR(f.costePorRacion)}</td>
                          <td className="px-4 py-3 text-right">{fmtEUR(f.precioVenta)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={f.margenBruto >= 0 ? "text-emerald-600" : "text-red-600"}>
                              {fmtEUR(f.margenBruto)} ({fmtNum(f.margenPorcentual, 1)}%)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={"px-2 py-0.5 rounded text-xs " + (f.foodCost <= 35 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                              {fmtNum(f.foodCost, 1)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {informe.tipo === "caducidades" && (
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Producto</th>
                      <th className="px-4 py-3 font-medium">Categoría</th>
                      <th className="px-4 py-3 font-medium text-right">Stock</th>
                      <th className="px-4 py-3 font-medium">Caducidad</th>
                      <th className="px-4 py-3 font-medium text-right">Días</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Proveedor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {informe.filas.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">Sin productos con caducidad registrada.</td></tr>
                    ) : (
                      informe.filas.map((f) => (
                        <tr key={f.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 font-medium">{f.nombre}</td>
                          <td className="px-4 py-3 text-neutral-500">{f.categoria ?? "—"}</td>
                          <td className="px-4 py-3 text-right">{f.stockActual} {UNIDAD_LABEL[f.unidad]}</td>
                          <td className="px-4 py-3">{new Date(f.fechaCaducidad).toLocaleDateString("es-ES")}</td>
                          <td className="px-4 py-3 text-right">{f.diasRestantes}</td>
                          <td className="px-4 py-3">
                            <span className={"px-2 py-0.5 rounded-full text-xs " + (
                              f.estado === "CADUCADO" ? "bg-red-100 text-red-700" :
                              f.estado === "PROXIMO" ? "bg-amber-100 text-amber-700" :
                              "bg-emerald-50 text-emerald-700"
                            )}>
                              {f.estado === "CADUCADO" ? "Caducado" : f.estado === "PROXIMO" ? "Próximo" : "OK"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-500">{f.proveedor ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}