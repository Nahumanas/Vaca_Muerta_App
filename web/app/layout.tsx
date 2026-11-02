// Esqueleto de todas las páginas: barra lateral + contenido.
import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import { scriptTema } from "@/components/layout/ThemeToggle";
import { cargarInfo } from "@/lib/datos";
import { mesTexto } from "@/lib/formato";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monitor de Vaca Muerta",
  description:
    "Producción de petróleo y gas de la formación Vaca Muerta, pozo por pozo, con los datos oficiales de la Secretaría de Energía.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const info = cargarInfo();
  return (
    // Modo oscuro por defecto. suppressHydrationWarning: el script de abajo puede cambiar data-theme antes de React.
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="min-h-screen">
        <Sidebar ultimoDato={mesTexto(info.ultimo_mes.slice(0, 7))} />
        <main className="px-4 py-6 sm:px-6 lg:ml-60 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
          <footer className="mx-auto mt-10 max-w-[1400px] border-t border-border pt-4 text-xs text-muted">
            Fuente: Secretaría de Energía de la Nación, datos abiertos (Capítulo IV y Adjunto IV). Formación Vaca
            Muerta. Proyecto de Nahuel Mansilla.
          </footer>
        </main>
      </body>
    </html>
  );
}
