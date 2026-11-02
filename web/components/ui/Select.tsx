"use client";
// Lista desplegable con el estilo del panel.
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
    <label className="flex items-center gap-2 text-xs text-muted">
      {etiqueta}
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-panel-2 px-2 py-1 text-xs text-fg outline-none focus:border-accent"
      >
        {opciones.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
