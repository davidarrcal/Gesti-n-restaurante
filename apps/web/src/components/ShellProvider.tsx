"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Sidebar, { type NavItem } from "@/components/Sidebar";
import UserMenu from "@/components/UserMenu";
import type { RolUsuario } from "@/lib/auth-types";

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/productos", label: "Productos", icon: "📦" },
  { href: "/entradas", label: "Entradas", icon: "📥" },
  { href: "/salidas", label: "Salidas", icon: "📤" },
  { href: "/escandallos", label: "Escandallos", icon: "🧮" },
  { href: "/informes", label: "Informes", icon: "📊", roles: ["GERENTE" as RolUsuario, "ADMIN" as RolUsuario] },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!loading && !user && !isLogin) {
      router.push("/login");
    }
  }, [loading, user, isLogin, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50">
        <div className="text-neutral-400">Cargando…</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50">
      <Sidebar items={NAV} />
      <div className="flex-1 flex flex-col min-h-0">
        <header className="hidden md:flex items-center justify-end px-6 py-3 border-b border-neutral-200 bg-white">
          <UserMenu />
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <div className="md:hidden fixed top-3 right-3 z-50">
        <UserMenu />
      </div>
    </div>
  );
}

export default function ShellProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}