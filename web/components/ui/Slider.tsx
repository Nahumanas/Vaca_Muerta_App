"use client";
// Slider con título, valor actual (grande, en monoespaciada) y mínimo/máximo.
export function Slider({
  etiqueta,
  valor,
  min,
  max,
  paso = 1,
  unidad,
  onChange,
  formato = (v) => String(v),
}: {
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  paso?: number;
  unidad?: string;
  onChange: (v: number) => void;
  formato?: (v: number) => string;
}) {
  const pct = ((valor - min) / (max - min)) * 100; // para pintar la parte "llena" del slider
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="rotulo">{etiqueta}</span>
        <span className="tabular text-2xl text-fg">
          {formato(valor)} {unidad && <span className="text-xs text-dim">{unidad}</span>}
        </span>
      </div>
      <input
        type="range"
        className="slider"
        aria-label={etiqueta}
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
      />
      <div className="mt-2 flex justify-between tabular text-[11px] text-dim">
        <span>{formato(min)}</span>
        <span>{formato(max)}</span>
      </div>
    </div>
  );
}
