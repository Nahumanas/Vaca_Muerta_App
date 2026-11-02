"use client";
// Barra lateral con las pestañas. En el celular se convierte en una barra arriba.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./ThemeToggle";

const PESTANAS = [
  { href: "/", texto: "Resumen", icono: "▦" },
  { href: "/evolucion", texto: "Evolución", icono: "↗" },
  { href: "/empresas", texto: "Empresas", icono: "≡" },
  { href: "/mapa", texto: "Mapa", icono: "◎" },
  { href: "/predicciones", texto: "Predicciones ML", icono: "◇", beta: true },
];

function Marca() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-oil text-sm font-bold text-white">VM</span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-fg">Monitor Vaca Muerta</span>
        <span className="block text-[11px] text-muted">Petróleo y gas · Neuquén</span>
      </span>
    </Link>
  );
}

export function Sidebar({ ultimoDato }: { ultimoDato: string }) {
  const actual = usePathname();
  const activa = (href: string) => (href === "/" ? actual === "/" : actual.startsWith(href));

  return (
    <>
      {/* Escritorio: barra a la izquierda */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-panel lg:flex">
        <div className="px-5 py-5">
          <Marca />
        </div>
        <nav className="flex flex-col gap-0.5 px-3" aria-label="Secciones">
          {PESTANAS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                activa(p.href) ? "bg-panel-2 font-medium text-fg" : "text-muted hover:bg-panel-2 hover:text-fg",
              )}
            >
              <span aria-hidden className={cn("w-4 text-center", activa(p.href) && "text-oil")}>
                {p.icono}
              </span>
              {p.texto}
              {p.beta && (
                <span className="ml-auto rounded border border-border px-1 text-[10px] text-muted">Beta</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3 border-t border-border px-5 py-4 text-[11px] text-muted">
          <ThemeToggle />
          <p>
            Datos oficiales de la Secretaría de Energía. Último dato: <span className="text-fg">{ultimoDato}</span>.
          </p>
          <a className="block hover:text-fg" href="https://github.com/Nahumanas/Vaca_Muerta_App">
            Código en GitHub →
          </a>
        </div>
      </aside>

      {/* Celular y tablet: barra arriba con las pestañas deslizables */}
      <header className="sticky top-0 z-20 border-b border-border bg-panel/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Marca />
          <ThemeToggle />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Secciones">
          {PESTANAS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs",
                activa(p.href) ? "bg-panel-2 font-medium text-fg" : "text-muted",
              )}
            >
              {p.texto}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
