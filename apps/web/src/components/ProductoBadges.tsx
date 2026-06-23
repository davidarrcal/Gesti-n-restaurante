import { UNIDAD_LABEL, type UnidadMedida } from "@/lib/types";

export default function BadgeCaducidad({
  fecha,
  caducado,
}: {
  fecha?: string | null;
  caducado?: boolean;
}) {
  if (!fecha) return <span className="text-neutral-400">—</span>;
  const d = new Date(fecha);
  const hoy = new Date();
  const dias = Math.ceil((d.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  let color = "bg-neutral-100 text-neutral-600";
  let txt = `${d.toLocaleDateString("es-ES")}`;
  if (caducado || dias < 0) {
    color = "bg-red-100 text-red-700";
    txt = `Caducado · ${txt}`;
  } else if (dias <= 7) {
    color = "bg-amber-100 text-amber-700";
    txt = `${dias}d · ${txt}`;
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${color}`}>{txt}</span>
  );
}

export function UnidadTag({ unidad }: { unidad: UnidadMedida }) {
  return (
    <span className="px-2 py-0.5 rounded text-xs bg-neutral-100 text-neutral-600 uppercase">
      {UNIDAD_LABEL[unidad]}
    </span>
  );
}