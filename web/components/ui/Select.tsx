"use client";
// Lista desplegable sin caja: solo una línea abajo.
export function Select({
  valor,
  opciones,
  onChange,
  etiqueta,
}: {
  valor: string;
  opciones: string[];
  onChange: (v: string) => void;
  etiqueta: string;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="rotulo">{etiqueta}</span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="border-0 border-b border-border bg-bg py-2 pr-1 tabular text-sm text-fg outline-none focus:border-oil sm:py-0.5 sm:text-xs"
      >
        {opciones.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
