"use client";
// Slider con título, valor actual y mínimo/máximo. Es un <input type="range"> con estilo.
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
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted">{etiqueta}</span>
        <span className="text-lg font-semibold tabular text-fg">
          {formato(valor)} {unidad && <span className="text-xs font-normal text-muted">{unidad}</span>}
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
      <div className="mt-1 flex justify-between text-[11px] text-muted tabular">
        <span>{formato(min)}</span>
        <span>{formato(max)}</span>
      </div>
    </div>
  );
}
