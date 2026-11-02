"use client";
// Gráfico de áreas de la producción mes a mes (Recharts).
// - "serie" es lo que se dibuja (petróleo o gas).
// - "extras" son datos que NO se dibujan pero aparecen en el tooltip (gas, pozos, etc.).
// - Botones para elegir el rango de tiempo.
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { Segmented } from "@/components/ui/Segmented";
import { mesTexto, num } from "@/lib/formato";

export type PuntoSerie = { fecha: string } & Record<string, number | string>;

export type Medida = {
  clave: string; // nombre de la columna en los datos
  nombre: string;
  unidad: string;
  decimales?: number;
};

type Rango = "24 meses" | "Desde 2019" | "Todo";
const RANGOS: Rango[] = ["24 meses", "Desde 2019", "Todo"];

type Props = {
  datos: PuntoSerie[];
  serie: Medida & { color: "oil" | "gas" };
  extras?: Medida[];
  referencia?: { valor: number; etiqueta: string }; // línea horizontal (ej. promedio 2019)
  alto?: number;
  rangoInicial?: Rango;
  conRangos?: boolean;
};

// Tooltip propio: muestra el valor principal grande y los datos extra abajo
function Detalle({ active, payload, serie, extras }: TooltipContentProps<number, string> & { serie: Props["serie"]; extras: Medida[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as PuntoSerie;
  return (
    <div className="min-w-48 rounded-lg border border-border bg-panel px-3 py-2.5 text-xs shadow-xl">
      <p className="mb-1.5 font-medium text-muted">{mesTexto(p.fecha)}</p>
      <p className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-fg">
          <span className="h-2 w-2 rounded-full" style={{ background: `var(--${serie.color})` }} />
          {serie.nombre}
        </span>
        <span className="font-semibold tabular text-fg">
          {num(Number(p[serie.clave]), serie.decimales ?? 0)} <span className="font-normal text-muted">{serie.unidad}</span>
        </span>
      </p>
      {extras.length > 0 && (
        <div className="mt-1.5 space-y-1 border-t border-border pt-1.5">
          {extras.map((e) => (
            <p key={e.clave} className="flex justify-between gap-4 text-muted">
              <span>{e.nombre}</span>
              <span className="tabular text-fg">
                {p[e.clave] === undefined ? "—" : num(Number(p[e.clave]), e.decimales ?? 0)}{" "}
                <span className="text-muted">{e.unidad}</span>
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductionChart({
  datos,
  serie,
  extras = [],
  referencia,
  alto = 320,
  rangoInicial = "Desde 2019",
  conRangos = true,
}: Props) {
  const [rango, setRango] = useState<Rango>(rangoInicial);

  const visibles = useMemo(() => {
    if (rango === "24 meses") return datos.slice(-24);
    if (rango === "Desde 2019") return datos.filter((d) => d.fecha >= "2019-01");
    return datos;
  }, [datos, rango]);

  // Marcas del eje X: en rangos largos, un enero por año; en 24 meses, un mes de cada tres
  const marcas = useMemo(() => {
    if (rango === "24 meses") return visibles.filter((_, i) => i % 3 === 0).map((d) => d.fecha);
    const eneros = visibles.filter((d) => d.fecha.endsWith("-01")).map((d) => d.fecha);
    return eneros.length > 9 ? eneros.filter((_, i) => i % 2 === 0) : eneros;
  }, [visibles, rango]);

  const idGradiente = `relleno-${serie.clave}`;

  return (
    <div>
      {conRangos && (
        <div className="mb-3 flex justify-end">
          <Segmented opciones={RANGOS} valor={rango} onChange={setRango} etiqueta="Rango de tiempo" />
        </div>
      )}
      <div style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibles} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`var(--${serie.color})`} stopOpacity={0.35} />
                <stop offset="100%" stopColor={`var(--${serie.color})`} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis
              dataKey="fecha"
              ticks={marcas}
              tickFormatter={(f: string) => (rango === "24 meses" ? mesTexto(f) : f.slice(0, 4))}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              minTickGap={16}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickFormatter={(v: number) => num(v)}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              content={(props) => <Detalle {...(props as TooltipContentProps<number, string>)} serie={serie} extras={extras} />}
              cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }}
            />
            {referencia && (
              <ReferenceLine
                y={referencia.valor}
                stroke="var(--muted)"
                strokeDasharray="4 4"
                label={{ value: referencia.etiqueta, position: "insideTopLeft", fill: "var(--muted)", fontSize: 11 }}
              />
            )}
            <Area
              type="monotone"
              dataKey={serie.clave}
              name={serie.nombre}
              stroke={`var(--${serie.color})`}
              strokeWidth={2}
              fill={`url(#${idGradiente})`}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--panel)" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
