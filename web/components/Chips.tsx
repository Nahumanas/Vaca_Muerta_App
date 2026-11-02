"use client";
// Lista de opciones para elegir varias. Sin nada elegido = todas.
// Si hay muchas opciones, muestra solo las primeras y un botón "Ver todas".
import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = { opciones: string[]; elegidas: string[]; onChange: (v: string[]) => void; vacio?: string; visibles?: number };

const base = "rounded-full border px-2.5 py-1 text-xs transition-colors";
const apagado = "border-border bg-panel-2 text-muted hover:text-fg hover:border-accent";
const prendido = "border-accent bg-accent text-white";

export default function Chips({ opciones, elegidas, onChange, vacio = "Todas", visibles = 12 }: Props) {
  const [verTodas, setVerTodas] = useState(false);
  const alternar = (o: string) =>
    onChange(elegidas.includes(o) ? elegidas.filter((e) => e !== o) : [...elegidas, o]);
  // Siempre se ven las elegidas, aunque estén más abajo en la lista
  const mostradas = verTodas ? opciones : opciones.filter((o, i) => i < visibles || elegidas.includes(o));
  return (
    <div className="flex flex-wrap gap-1.5">
      <button className={cn(base, elegidas.length === 0 ? prendido : apagado)} onClick={() => onChange([])}>
        {vacio}
      </button>
      {mostradas.map((o) => (
        <button key={o} className={cn(base, elegidas.includes(o) ? prendido : apagado)} onClick={() => alternar(o)}>
          {o}
        </button>
      ))}
      {opciones.length > visibles && (
        <button className={cn(base, apagado, "border-dashed")} onClick={() => setVerTodas(!verTodas)}>
          {verTodas ? "Ver menos" : `Ver todas (${opciones.length})`}
        </button>
      )}
    </div>
  );
}
