"use client";
// Ranking de market share. Cada fila es un botón:
// - pasar el mouse = vista previa en los gráficos;
// - clic (o toque en el celular) = fija la empresa; otro clic la saca.
// Las barras van en gris; la empresa activa se pinta con el color de acento de empresas.
import { useEmpresaActiva, useEmpresas } from "@/lib/store";
import type { ParticipacionEmpresa } from "@/lib/indicadores";
import { cn } from "@/lib/cn";
import { num } from "@/lib/formato";

type Props = {
  datos: ParticipacionEmpresa[];
  seleccionables?: string[]; // empresas que tienen serie para mostrar (las demás no se pueden elegir)
  irA?: string; // id de un gráfico: en pantallas angostas, al tocar una empresa se baja/sube hasta él
};

export default function MarketShareRanking({ datos, seleccionables, irA }: Props) {
  const activa = useEmpresaActiva();
  const elegida = useEmpresas((e) => e.elegida);
  const { alternar, resaltar } = useEmpresas();
  const maximo = Math.max(...datos.map((d) => d.pct));

  return (
    <ul className="divide-y divide-border/60" onMouseLeave={() => resaltar(null)}>
      {datos.map((d) => {
        const puede = !seleccionables || seleccionables.includes(d.grupo);
        const esActiva = activa === d.grupo;
        return (
          <li key={d.grupo}>
            <button
              type="button"
              disabled={!puede}
              aria-pressed={elegida === d.grupo}
              onMouseEnter={() => puede && resaltar(d.grupo)}
              onFocus={() => puede && resaltar(d.grupo)}
              onBlur={() => resaltar(null)}
              onClick={() => {
                alternar(d.grupo);
                // En el celular el gráfico queda arriba del ranking: lo llevamos a la vista para que se vea el cambio
                if (irA && window.innerWidth < 1280) document.getElementById(irA)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "grid w-full grid-cols-[minmax(0,7.5rem)_1fr_3.5rem] items-center gap-3 py-2 text-left transition-colors",
                puede ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span className={cn("truncate text-[13px] transition-colors", esActiva ? "text-fg" : "text-muted")}>
                {elegida === d.grupo && <span className="mr-1 text-empresa">●</span>}
                {d.grupo}
              </span>
              <span className="relative h-3">
                <span
                  className={cn("absolute inset-y-0 left-0 transition-[background-color,width] duration-300", esActiva ? "bg-empresa" : "bg-neutral")}
                  style={{ width: `${Math.max(1, (d.pct / maximo) * 100)}%` }}
                />
              </span>
              <span className={cn("text-right tabular text-[12px] transition-colors", esActiva ? "text-empresa" : "text-fg")}>
                {num(d.pct, 1)}%
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
