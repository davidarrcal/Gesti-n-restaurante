"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import EscandalloEditor from "@/components/EscandalloEditor";
import { api } from "@/lib/api";
import { fmtEUR, fmtNum } from "@/lib/escandallo";
import type { Producto, PlazaDetalle } from "@/lib/types";

interface PlatoResumen {
  id: string;
  nombre: string;
  descripcion?: string | null;
  numRaciones: number;
  precioVenta: string;
  numIngredientes: number;
  costePorRacion: number;
  margenBruto: number;
  margenPorcentual: number;
  foodCost: number;
}

export default function EscandallosPage() {
  const [platos, setPlatos] = useState<PlatoResumen[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PlazaDetalle | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pls, prods] = await Promise.all([
        api.listPlatos(),
        api.listProductos(),
      ]);
      setPlatos(pls as PlatoResumen[]);
      setProductos(prods);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar escandallos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function abrirEditar(id: string) {
    try {
      const detalle = await api.getPlato(id);
      setEditing(detalle);
      setEditorOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar plato");
    }
  }

  function abrirCrear() {
    setEditing(null);
    setEditorOpen(true);
  }

  async function duplicar(id: string) {
    try {
      await api.duplicatePlato(id);
      setToast("Escandallo duplicado");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al duplicar");
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  }

  async function eliminar(p: PlatoResumen) {
    if (!confirm(`¿Eliminar el escandallo "${p.nombre}"?`)) return;
    try {
      await api.deletePlato(p.id);
      setToast("Escandallo eliminado");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  }

  async function onGuardado() {
    setEditorOpen(false);
    setEditing(null);
    setToast("Escandallo guardado");
    await cargar();
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div>
      <PageHeader
        title="Escandallos"
        subtitle="Cálculo de coste de materia prima por ración (RF-10 a RF-15)"
        actions={
          <button
            onClick={abrirCrear}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium"
          >
            Nuevo escandallo
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
        ) : platos.length === 0 ? (
          <div className="p-10 text-center text-neutral-400">
            Aún no has creado ningún escandallo. Pulsa <strong>Nuevo escandallo</strong> para empezar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Plato</th>
                  <th className="px-4 py-3 font-medium text-center">Raciones</th>
                  <th className="px-4 py-3 font-medium text-center">Ingredientes</th>
                  <th className="px-4 py-3 font-medium text-right">Coste/ración</th>
                  <th className="px-4 py-3 font-medium text-right">P. venta</th>
                  <th className="px-4 py-3 font-medium text-right">Margen</th>
                  <th className="px-4 py-3 font-medium text-right">Food Cost</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {platos.map((p) => {
                  const pv = Number(p.precioVenta);
                  const margenOk = p.margenBruto >= 0;
                  const fcOk = p.foodCost <= 35;
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-800">{p.nombre}</div>
                        {p.descripcion && (
                          <div className="text-xs text-neutral-400">{p.descripcion}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-neutral-500">{p.numRaciones}</td>
                      <td className="px-4 py-3 text-center text-neutral-500">{p.numIngredientes}</td>
                      <td className="px-4 py-3 text-right font-medium">{fmtEUR(p.costePorRacion)}</td>
                      <td className="px-4 py-3 text-right">{fmtEUR(pv)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={margenOk ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                          {fmtEUR(p.margenBruto)}
                          <div className="text-xs font-normal text-neutral-400">{fmtNum(p.margenPorcentual, 1)}%</div>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={"px-2 py-0.5 rounded text-xs " + (fcOk ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                          {fmtNum(p.foodCost, 1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => abrirEditar(p.id)} className="text-brand-600 hover:underline mr-3 text-xs">Editar</button>
                        <button onClick={() => duplicar(p.id)} className="text-neutral-500 hover:underline mr-3 text-xs">Duplicar</button>
                        <button onClick={() => eliminar(p)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        title={editing ? `Editar ${editing.nombre}` : "Nuevo escandallo"}
      >
        <EscandalloEditor
          plato={editing}
          productos={productos}
          onClose={onGuardado}
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