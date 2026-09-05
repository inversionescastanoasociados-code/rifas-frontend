import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PausaGuard from "@/components/PausaGuard";
import ModuleShell from "@/components/layout/ModuleShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Rifas | Panel de Administración",
  description: "Plataforma profesional de gestión de rifas y sorteos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#f8fafc]`}
      >
        <PausaGuard>
          <ModuleShell>{children}</ModuleShell>
        </PausaGuard>
      </body>
    </html>
  );
}
