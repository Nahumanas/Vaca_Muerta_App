"use client";
// Barras horizontales de market share, ordenadas de mayor a menor.
// La empresa destacada (por defecto, la primera) va en color; el resto en gris, con su % al lado.
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { ParticipacionEmpresa } from "@/lib/indicadores";
import { num } from "@/lib/formato";

type Props = {
  datos: ParticipacionEmpresa[];
  color?: "oil" | "gas";
  destacadas?: string[]; // nombres a pintar con color (si no se pasa: la primera)
  unidad?: string; // para el tooltip, ej. "mil bbl/d"
  valorTooltip?: (p: ParticipacionEmpresa) => string;
};

function Detalle({ active, payload, valorTooltip }: TooltipContentProps<number, string> & { valorTooltip?: Props["valorTooltip"] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as ParticipacionEmpresa;
  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-fg">{p.grupo}</p>
      <p className="text-muted">
        <span className="tabular text-fg">{num(p.pct, 1)}%</span> del total
        {valorTooltip && <> · {valorTooltip(p)}</>}
      </p>
    </div>
  );
}

export default function MarketShareChart({ datos, color = "oil", destacadas, valorTooltip }: Props) {
  const resaltar = destacadas ?? [datos[0]?.grupo];
  const alto = datos.length * 34 + 16;
  return (
    <div style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 52, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="grupo"
            width={118}
            tick={{ fill: "var(--fg)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--panel-2)" }}
            content={(props) => <Detalle {...(props as TooltipContentProps<number, string>)} valorTooltip={valorTooltip} />}
          />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {datos.map((d) => (
              <Cell key={d.grupo} fill={resaltar.includes(d.grupo) ? `var(--${color})` : "var(--neutral)"} />
            ))}
            <LabelList
              dataKey="pct"
              position="right"
              formatter={(v: unknown) => `${num(Number(v), 1)}%`}
              style={{ fill: "var(--fg)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
