import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "MétricaSur — Tu negocio, más simple", description: "La plataforma de gestión que se adapta a tu negocio. Organizá clientes, tareas y operaciones desde un solo lugar." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es-AR"><body>{children}</body></html>; }
