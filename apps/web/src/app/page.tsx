"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import { api } from "@/lib/api";
import { fmtEUR } from "@/lib/escandallo";
import { UNIDAD_LABEL, type Metricas, type Alertas } from "@/lib/types";

export default function DashboardPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [alertas, setAlertas] = useState<Alertas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, a] = await Promise.all([api.getMetricas(), api.getAlertas(7)]);
      setMetricas(m);
      setAlertas(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Cargando datos…" />
        <div className="p-10 text-center text-neutral-400">Cargando…</div>
      </div>
    );
  }

  if (error || !metricas || !alertas) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error ?? "Error al cargar datos"}
        </div>
      </div>
    );
  }

  const c = metricas.contadores;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen de stock crítico, alertas y accesos directos (RF-16/17/18)"
        actions={
          <button
            onClick={cargar}
            className="px-3 py-2 rounded-lg border border-neutral-300 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Actualizar
          </button>
        }
      />

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card title="Productos">
          <p className="text-3xl font-semibold text-neutral-700">{c.productos}</p>
          <p className="text-xs text-neutral-500">registrados</p>
        </Card>
        <Card title="Proveedores">
          <p className="text-3xl font-semibold text-neutral-700">{c.proveedores}</p>
          <p className="text-xs text-neutral-500">activos</p>
        </Card>
        <Card title="Escandallos">
          <p className="text-3xl font-semibold text-neutral-700">{c.platos}</p>
          <p className="text-xs text-neutral-500">platos</p>
        </Card>
        <Card title="Entradas hoy">
          <p className="text-3xl font-semibold text-emerald-600">{c.entradasHoy}</p>
          <p className="text-xs text-neutral-500">compras registradas</p>
        </Card>
        <Card title="Salidas hoy">
          <p className="text-3xl font-semibold text-amber-600">{c.salidasHoy}</p>
          <p className="text-xs text-neutral-500">consumos registrados</p>
        </Card>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card title={`Stock bajo mínimo (${alertas.stockBajoMinimo.length})`}>
          {alertas.stockBajoMinimo.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4 text-center">
              Todo el stock está por encima del mínimo.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {alertas.stockBajoMinimo.map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between">
                  <Link href={`/productos`} className="text-sm font-medium text-neutral-700 hover:underline">
                    {p.nombre}
                  </Link>
                  <span className="text-xs text-red-600">
                    {p.stockActual} / {p.stockMinimo} {UNIDAD_LABEL[p.unidad]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Caducidades (${alertas.caducados.length + alertas.proximosCaducar.length})`}>
          {alertas.caducados.length === 0 && alertas.proximosCaducar.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4 text-center">
              Sin alertas de caducidad.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {alertas.caducados.map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">{p.nombre}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Caducado hace {p.diasCaducado}d
                  </span>
                </li>
              ))}
              {alertas.proximosCaducar.map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">{p.nombre}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Caduca en {p.diasRestantes}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Valor inventario + últimos movimientos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card title="Valor inventario (aprox.)">
          <p className="text-2xl font-semibold text-neutral-700">
            {fmtEUR(metricas.valorInventario)}
          </p>
          <p className="text-xs text-neutral-500">precio × stock actual</p>
        </Card>
        <Card title="Total alertas">
          <p className="text-2xl font-semibold text-red-600">
            {metricas.alertas.totalAlertas}
          </p>
          <p className="text-xs text-neutral-500">
            {metricas.alertas.stockBajo} stock · {metricas.alertas.caducados} caducados · {metricas.alertas.proximos} próximos
          </p>
        </Card>
        <Card title="Accesos directos">
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/productos", label: "Productos" },
              { href: "/entradas?new=1", label: "Nueva entrada" },
              { href: "/salidas?new=1", label: "Nuevo consumo" },
              { href: "/escandallos?new=1", label: "Nuevo escandallo" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="px-3 py-2 rounded-lg border border-neutral-200 hover:border-brand-500 hover:bg-brand-50 text-xs font-medium text-neutral-700 text-center"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Últimos movimientos */}
      <Card title="Últimos movimientos">
        {metricas.ultimosMovimientos.length === 0 ? (
          <p className="text-sm text-neutral-400 py-4 text-center">
            No hay movimientos registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-neutral-500 text-left">
                <tr>
                  <th className="px-2 py-2 font-medium">Producto</th>
                  <th className="px-2 py-2 font-medium">Tipo</th>
                  <th className="px-2 py-2 font-medium text-right">Cantidad</th>
                  <th className="px-2 py-2 font-medium text-right">Stock resultante</th>
                  <th className="px-2 py-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {metricas.ultimosMovimientos.map((m) => (
                  <tr key={m.id}>
                    <td className="px-2 py-2 text-neutral-700">{m.producto}</td>
                    <td className="px-2 py-2">
                      <span
                        className={
                          "px-2 py-0.5 rounded-full text-xs " +
                          (m.tipo === "ENTRADA"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700")
                        }
                      >
                        {m.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right">
                      {m.cantidad} {m.unidad ? UNIDAD_LABEL[m.unidad] : ""}
                    </td>
                    <td className="px-2 py-2 text-right text-neutral-500">
                      {m.stockResultante}
                    </td>
                    <td className="px-2 py-2 text-neutral-500 text-xs">
                      {new Date(m.fecha).toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}