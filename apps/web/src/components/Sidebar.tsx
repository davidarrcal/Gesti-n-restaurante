"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RolUsuario } from "@/lib/auth-types";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles?: RolUsuario[];
}

export function filterNavByRole(items: NavItem[]): NavItem[] {
  const { user } = useAuth();
  const filtered = user
    ? items.filter((it) => !it.roles || it.roles.includes(user.rol))
    : items;
  return filtered;
}

export default function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const visible = items.filter(
    (it) => !it.roles || it.roles.includes(user.rol),
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="w-60 shrink-0 border-r border-neutral-200 bg-white px-3 py-5 hidden md:flex md:flex-col gap-1">
        <div className="px-2 mb-6 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500 text-white grid place-items-center font-bold">
            GR
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-sm">Gestión Restaurante</p>
            <p className="text-[11px] text-neutral-500">Inventario y escandallos</p>
          </div>
        </div>
        {visible.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                "px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 " +
                (active
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-neutral-600 hover:bg-neutral-100")
              }
            >
              <span className="text-base">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </aside>

      {/* Bottom nav móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around items-center px-1 py-1 z-40">
        {visible.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] " +
                (active ? "text-brand-600 font-medium" : "text-neutral-500")
              }
            >
              <span className="text-lg">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}