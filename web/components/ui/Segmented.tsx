"use client";
// Botones tipo "pestañas" para elegir UNA opción (por ejemplo Petróleo / Gas).
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
    <div role="tablist" aria-label={etiqueta} className="inline-flex rounded-lg border border-border bg-panel-2 p-0.5">
      {opciones.map((o) => (
        <button
          key={o}
          role="tab"
          aria-selected={valor === o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            valor === o ? "bg-panel text-fg shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
