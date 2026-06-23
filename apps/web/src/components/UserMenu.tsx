"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROL_LABEL } from "@/lib/auth-types";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initials = user.nombre
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-brand-500 text-white grid place-items-center text-xs font-bold">
          {initials}
        </div>
        <div className="hidden sm:block leading-tight">
          <p className="text-xs font-medium text-neutral-700">{user.nombre}</p>
          <p className="text-[10px] text-neutral-400">{ROL_LABEL[user.rol]}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="text-xs text-neutral-500 hover:text-red-500"
      >
        Salir
      </button>
    </div>
  );
}