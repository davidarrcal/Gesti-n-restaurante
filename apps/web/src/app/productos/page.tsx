"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import ProductoForm from "@/components/ProductoForm";
import BadgeCaducidad, { UnidadTag } from "@/components/ProductoBadges";
import { api } from "@/lib/api";
import type { Producto, ProductoInput, Proveedor, FiltroCaducidad, UnidadMedida } from "@/lib/types";

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [unidad, setUnidad] = useState<"" | UnidadMedida>("");
  const [caducidad, setCaducidad] = useState<FiltroCaducidad>("TODOS");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [saving, setSaving] = useState(false);

  const [provModalOpen, setProvModalOpen] = useState(false);
  const [provNombre, setProvNombre] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, provs] = await Promise.all([
        api.listProductos({
          q: q || undefined,
          categoria: categoria || undefined,
          proveedorId: proveedorId || undefined,
          unidad: unidad || undefined,
          caducidad,
        }),
        api.listProveedores(),
      ]);
      setProductos(prods);
      setProveedores(provs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, [q, categoria, proveedorId, unidad, caducidad]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function abrirCrear() {
    setEditing(null);
    setModalOpen(true);
  }

  function abrirEditar(p: Producto) {
    setEditing(p);
    setModalOpen(true);
  }

  async function guardar(data: ProductoInput) {
    setSaving(true);
    try {
      if (editing) {
        await api.updateProducto(editing.id, data);
        setToast("Producto actualizado");
      } else {
        await api.createProducto(data);
        setToast("Producto creado");
      }
      setModalOpen(false);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2500);
    }
  }

  async function eliminar(p: Producto) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteProducto(p.id);
      setToast("Producto eliminado");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  }

  async function crearProveedor() {
    if (!provNombre.trim()) return;
    try {
      await api.createProveedor({ nombre: provNombre.trim() });
      setProvNombre("");
      setProvModalOpen(false);
      await cargar();
      setToast("Proveedor añadido");
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear proveedor");
    }
  }

  const input =
    "px-3 py-1.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-brand-500";

  const categorias = Array.from(
    new Set(productos.map((p) => p.categoria).filter(Boolean))
  ) as string[];

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle="Registro y control de insumos (RF-01 a RF-03)"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setProvModalOpen(true)}
              className="px-3 py-2 rounded-lg border border-neutral-300 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              + Proveedor
            </button>
            <button
              onClick={abrirCrear}
              className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium"
            >
              Añadir producto
            </button>
          </div>
        }
      />

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-3 mb-4 flex flex-wrap gap-2 items-center">
        <input
          placeholder="Buscar…"
          className={input + " w-48"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className={input} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas categorías</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className={input} value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
          <option value="">Todos proveedores</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <select
          className={input}
          value={unidad}
          onChange={(e) => setUnidad(e.target.value as "" | UnidadMedida)}
        >
          <option value="">Todas unidades</option>
          <option value="KG">kg</option>
          <option value="G">g</option>
          <option value="L">L</option>
          <option value="ML">mL</option>
          <option value="UDS">uds</option>
        </select>
        <select className={input} value={caducidad} onChange={(e) => setCaducidad(e.target.value as FiltroCaducidad)}>
          <option value="TODOS">Todo caducidad</option>
          <option value="CADUCADOS">Caducados</option>
          <option value="PROXIMOS">Próximos (7d)</option>
        </select>
        <span className="text-sm text-neutral-400 ml-auto">{productos.length} resultado(s)</span>
      </div>

      {error && (
        <div className="mb-3 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-neutral-400">Cargando…</div>
        ) : productos.length === 0 ? (
          <div className="p-10 text-center text-neutral-400">
            No hay productos que coincidan. Pulsa <strong>Añadir producto</strong> para crear el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Unidad</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Mín.</th>
                  <th className="px-4 py-3 font-medium">Caducidad</th>
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 font-medium text-right">Precio</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {productos.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-800">{p.nombre}</td>
                    <td className="px-4 py-3 text-neutral-500">{p.categoria ?? "—"}</td>
                    <td className="px-4 py-3"><UnidadTag unidad={p.unidad} /></td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.stockBajoMinimo ? "text-red-600 font-semibold" : ""}>
                        {Number(p.stockActual).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-500">
                      {Number(p.stockMinimo).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <BadgeCaducidad fecha={p.fechaCaducidad} caducado={p.caducado} />
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{p.proveedor?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {Number(p.precioUnitario).toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => abrirEditar(p)}
                        className="text-brand-600 hover:underline mr-3 text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminar(p)}
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

      {/* Modal producto */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar producto" : "Nuevo producto"}
      >
        <ProductoForm
          key={editing?.id ?? "new"}
          initial={editing ? {
            nombre: editing.nombre,
            categoria: editing.categoria ?? "",
            unidad: editing.unidad,
            pesoUnitario: Number(editing.pesoUnitario),
            precioUnitario: Number(editing.precioUnitario),
            stockMinimo: Number(editing.stockMinimo),
            fechaCaducidad: editing.fechaCaducidad?.slice(0, 10),
            proveedorId: editing.proveedorId ?? "",
          } : undefined}
          proveedores={proveedores}
          onSubmit={guardar}
          onCancel={() => setModalOpen(false)}
          submitting={saving}
        />
      </Modal>

      {/* Modal proveedor rápido */}
      <Modal open={provModalOpen} onClose={() => setProvModalOpen(false)} title="Nuevo proveedor">
        <div className="space-y-3">
          <label className="block text-xs font-medium text-neutral-600">Nombre *</label>
          <input
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-brand-500"
            value={provNombre}
            onChange={(e) => setProvNombre(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setProvModalOpen(false)} className="px-4 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100">
              Cancelar
            </button>
            <button onClick={crearProveedor} className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium">
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-5 right-5 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}