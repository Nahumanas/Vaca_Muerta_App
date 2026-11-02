"use client";
// Lista de opciones para elegir varias (como st.multiselect). Sin nada elegido = todas.
// Si hay muchas opciones, muestra solo las primeras y un botón "Ver todas".
import { useState } from "react";

type Props = { opciones: string[]; elegidas: string[]; onChange: (v: string[]) => void; vacio?: string; visibles?: number };

export default function Chips({ opciones, elegidas, onChange, vacio = "Todas", visibles = 12 }: Props) {
  const [verTodas, setVerTodas] = useState(false);
  const alternar = (o: string) =>
    onChange(elegidas.includes(o) ? elegidas.filter((e) => e !== o) : [...elegidas, o]);
  // Siempre se ven las elegidas, aunque estén más abajo en la lista
  const mostradas = verTodas
    ? opciones
    : opciones.filter((o, i) => i < visibles || elegidas.includes(o));
  return (
    <div className="chips">
      <button className={elegidas.length === 0 ? "chip activo" : "chip"} onClick={() => onChange([])}>
        {vacio}
      </button>
      {mostradas.map((o) => (
        <button key={o} className={elegidas.includes(o) ? "chip activo" : "chip"} onClick={() => alternar(o)}>
          {o}
        </button>
      ))}
      {opciones.length > visibles && (
        <button className="chip mas" onClick={() => setVerTodas(!verTodas)}>
          {verTodas ? "Ver menos" : `Ver todas (${opciones.length})`}
        </button>
      )}
    </div>
  );
}
