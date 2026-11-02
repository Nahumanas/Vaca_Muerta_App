// Esqueleto de todas las páginas: menú superior fino + contenido sobre fondo continuo.
import type { Metadata } from "next";
import { TopNav } from "@/components/layout/TopNav";
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
        <TopNav ultimoDato={mesTexto(info.ultimo_mes.slice(0, 7))} />
        <main className="mx-auto max-w-[1400px] px-4 sm:px-8">
          {children}
          <footer className="flex flex-wrap justify-between gap-4 py-8 text-xs text-dim">
            <span>
              Fuente: Secretaría de Energía de la Nación, datos abiertos (Capítulo IV y Adjunto IV). Formación Vaca
              Muerta. Proyecto de Nahuel Mansilla.
            </span>
            <a className="hover:text-fg" href="https://github.com/Nahumanas/Vaca_Muerta_App">
              Código en GitHub →
            </a>
          </footer>
        </main>
      </body>
    </html>
  );
}
