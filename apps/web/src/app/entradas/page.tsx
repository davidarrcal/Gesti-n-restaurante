"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import EntradaForm from "@/components/EntradaForm";
import { api } from "@/lib/api";
import { UNIDAD_LABEL, type Entrada, type Producto, type Proveedor } from "@/lib/types";

export default function EntradasPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ents, prods, provs] = await Promise.all([
        api.listEntradas(),
        api.listProductos(),
        api.listProveedores(),
      ]);
      setEntradas(ents);
      setProductos(prods);
      setProveedores(provs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar entradas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar(v: {
    fecha: string;
    numeroFactura?: string;
    proveedorId?: string;
    lineas: { productoId: string; cantidad: number; precioCompra: number }[];
  }) {
    setSaving(true);
    try {
      await api.createEntrada(v);
      setModalOpen(false);
      setToast("Entrada registrada · stock actualizado");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar entrada");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2500);
    }
  }

  async function eliminar(e: Entrada) {
    const total = e.detalles.reduce(
      (a, d) => a + Number(d.cantidad) * Number(d.precioCompra),
      0,
    );
    if (!confirm(`¿Eliminar entrada del ${new Date(e.fecha).toLocaleDateString("es-ES")} (${total.toFixed(2)} €)? Se revertirá el stock.`)) return;
    try {
      await api.deleteEntrada(e.id);
      setToast("Entrada eliminada · stock revertido");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  }

  function totalEntrada(e: Entrada) {
    return e.detalles.reduce(
      (a, d) => a + Number(d.cantidad) * Number(d.precioCompra),
      0,
    );
  }

  return (
    <div>
      <PageHeader
        title="Entradas de stock"
        subtitle="Registro de compras a proveedores (RF-04, RF-05, RF-06)"
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium"
          >
            Nueva entrada
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
        ) : entradas.length === 0 ? (
          <div className="p-10 text-center text-neutral-400">
            No hay entradas registradas. Pulsa <strong>Nueva entrada</strong> para registrar una compra.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Factura</th>
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 font-medium">Productos</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {entradas.map((e) => (
                  <tr key={e.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      {new Date(e.fecha).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{e.numeroFactura ?? "—"}</td>
                    <td className="px-4 py-3">{e.proveedor?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      <details className="cursor-pointer">
                        <summary className="text-xs text-brand-600">
                          {e.detalles.length} línea(s)
                        </summary>
                        <ul className="mt-1 space-y-0.5 text-xs text-neutral-600">
                          {e.detalles.map((d) => (
                            <li key={d.id}>
                              {d.producto?.nombre}: {Number(d.cantidad)} {d.producto ? UNIDAD_LABEL[d.producto.unidad] : ""} ×{" "}
                              {Number(d.precioCompra).toFixed(2)} €
                            </li>
                          ))}
                        </ul>
                      </details>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {totalEntrada(e).toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => eliminar(e)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva entrada de stock">
        <EntradaForm
          productos={productos}
          proveedores={proveedores}
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