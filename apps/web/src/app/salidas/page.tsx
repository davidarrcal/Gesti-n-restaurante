"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import SalidaForm from "@/components/SalidaForm";
import { api } from "@/lib/api";
import {
  MOTIVOS_SALIDA,
  UNIDAD_LABEL,
  type Salida,
  type Producto,
  type Plato,
} from "@/lib/types";

export default function SalidasPage() {
  const [salidas, setSalidas] = useState<Salida[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sals, prods, pls] = await Promise.all([
        api.listSalidas(),
        api.listProductos(),
        api.listPlatos().catch(() => [] as Plato[]),
      ]);
      setSalidas(sals);
      setProductos(prods);
      setPlatos(pls);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar salidas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar(v: {
    fecha: string;
    motivo: "ELABORACION" | "MERMA" | "ROTURA" | "INVENTARIO" | "OTRO";
    motivoTexto?: string;
    platoId?: string;
    lineas: { productoId: string; cantidad: number }[];
  }) {
    setSaving(true);
    try {
      await api.createSalida(v);
      setModalOpen(false);
      setToast("Salida registrada · stock descontado");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar salida");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2500);
    }
  }

  async function eliminar(s: Salida) {
    if (
      !confirm(
        `¿Eliminar salida del ${new Date(s.fecha).toLocaleDateString(
          "es-ES",
        )}? Se revertirá el stock.`,
      )
    )
      return;
    try {
      await api.deleteSalida(s.id);
      setToast("Salida eliminada · stock revertido");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  }

  function motivoLabel(m: string) {
    return MOTIVOS_SALIDA.find((x) => x.value === m)?.label ?? m;
  }

  return (
    <div>
      <PageHeader
        title="Salidas de stock"
        subtitle="Registro de consumos y mermas (RF-07, RF-08, RF-09)"
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium"
          >
            Nueva salida
          </button>
        }
      />

      {error && (
        <div className="mb-3 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-neutral-400">Cargando…</div>
        ) : salidas.length === 0 ? (
          <div className="p-10 text-center text-neutral-400">
            No hay salidas registradas. Pulsa <strong>Nueva salida</strong> para registrar un consumo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                  <th className="px-4 py-3 font-medium">Plato</th>
                  <th className="px-4 py-3 font-medium">Productos</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {salidas.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      {new Date(s.fecha).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-700">
                        {motivoLabel(s.motivo)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {s.motivoTexto ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {s.plato?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      <details className="cursor-pointer">
                        <summary className="text-xs text-brand-600">
                          {s.detalles.length} línea(s)
                        </summary>
                        <ul className="mt-1 space-y-0.5 text-xs text-neutral-600">
                          {s.detalles.map((d) => (
                            <li key={d.id}>
                              {d.producto?.nombre}: {Number(d.cantidad)}{" "}
                              {d.producto ? UNIDAD_LABEL[d.producto.unidad] : ""}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => eliminar(s)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva salida de stock">
        <SalidaForm
          productos={productos}
          platos={platos}
          onSubmit={guardar}
          onCancel={() => setModalOpen(false)}
          submitting={saving}
        />
      </Modal>

      {toast && (
        <div className="fixed bottom-5 right-5 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}