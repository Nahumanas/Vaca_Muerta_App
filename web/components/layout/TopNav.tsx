"use client";
// Menú superior fino: la marca a la izquierda y las pestañas a la derecha.
// En el celular las pestañas pasan a una segunda línea que se puede deslizar.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { MOSTRAR_ML } from "@/lib/config";
import { ThemeToggle } from "./ThemeToggle";

const PESTANAS = [
  { href: "/", texto: "Resumen" },
  { href: "/evolucion", texto: "Evolución" },
  { href: "/empresas", texto: "Empresas" },
  { href: "/mapa", texto: "Mapa" },
  // Oculta hasta que el modelo esté listo (ver lib/config.ts)
  ...(MOSTRAR_ML ? [{ href: "/predicciones", texto: "Predicciones ML" }] : []),
];

export function TopNav({ ultimoDato }: { ultimoDato: string }) {
  const actual = usePathname();
  const activa = (href: string) => (href === "/" ? actual === "/" : actual.startsWith(href));

  // Escritorio: links finos arriba a la derecha
  const enlaces = PESTANAS.map((p) => (
    <Link
      key={p.href}
      href={p.href}
      className={cn(
        "shrink-0 border-b py-1 tabular text-[11px] uppercase tracking-wider transition-colors",
        activa(p.href) ? "border-oil text-fg" : "border-transparent text-dim hover:text-muted",
      )}
    >
      {p.texto}
    </Link>
  ));

  return (
    <>
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-8">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-serif text-lg font-semibold text-fg">Monitor Vaca Muerta</span>
          <span className="hidden tabular text-[11px] text-dim min-[420px]:inline">
            <span className="text-oil">●</span> datos a {ultimoDato}
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 md:flex" aria-label="Secciones">
            {enlaces}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
      {/* Celular: menú tipo "píldora" flotante. Va FUERA del header: el desenfoque del header
          (backdrop-blur) haría que "fixed" quede pegado al header y no a la pantalla. */}
      {/* Celular: menú tipo "píldora" flotante abajo, con botones grandes para el dedo */}
      <nav
        className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 flex justify-between border border-border bg-bg/95 p-1 backdrop-blur md:hidden"
        aria-label="Secciones"
      >
        {PESTANAS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={cn(
              "flex h-11 flex-1 items-center justify-center tabular text-[11px] uppercase tracking-wide",
              activa(p.href) ? "bg-oil text-bg" : "text-muted active:bg-panel-2",
            )}
          >
            {p.texto === "Predicciones ML" ? "ML" : p.texto}
          </Link>
        ))}
      </nav>
    </>
  );
}
