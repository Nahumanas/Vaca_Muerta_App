"use client";
// Opciones para elegir UNA (por ejemplo Petróleo / Gas). La elegida se subraya con el color de acento.
import { cn } from "@/lib/cn";

export function Segmented<T extends string>({
  opciones,
  valor,
  onChange,
  etiqueta,
}: {
  opciones: readonly T[];
  valor: T;
  onChange: (v: T) => void;
  etiqueta?: string; // para lectores de pantalla
}) {
  return (
    <div role="tablist" aria-label={etiqueta} className="inline-flex gap-4">
      {opciones.map((o) => (
        <button
          key={o}
          role="tab"
          aria-selected={valor === o}
          onClick={() => onChange(o)}
          className={cn(
            "border-b py-2 tabular text-[11px] uppercase tracking-wider transition-colors sm:py-0 sm:pb-1",
            valor === o ? "border-oil text-fg" : "border-transparent text-dim hover:text-muted",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
