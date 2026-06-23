import type { Metadata } from "next";
import "./globals.css";
import ShellProvider from "@/components/ShellProvider";

export const metadata: Metadata = {
  title: "Gestión Restaurante",
  description: "Inventario y escandallos para restaurantes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <ShellProvider>{children}</ShellProvider>
      </body>
    </html>
  );
}