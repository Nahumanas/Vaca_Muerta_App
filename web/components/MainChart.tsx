"use client";
// Gráfico principal de "Evolución del petróleo".
// - Sin empresa elegida: muestra el TOTAL (naranja, el único lugar donde se usa ese color).
// - Con una empresa elegida en el ranking (hover o clic): muestra SOLO la curva de esa empresa,
//   con el color de acento de empresas, y la transición es animada.
// - Líneas verticales con hitos tecnológicos (calculados con los datos de diseño de pozos).
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
import { CardHeader } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { mesTexto, num } from "@/lib/formato";
import { useEmpresaActiva, useEmpresas } from "@/lib/store";

export type PuntoTotal = { fecha: string; petroleo: number; gas: number; pozos: number; bblPozo: number };
export type Hito = { fecha: string; etiqueta: string }; // fecha "2025-01"

type Rango = "24 meses" | "Desde 2019" | "Todo";
const RANGOS: Rango[] = ["24 meses", "Desde 2019", "Todo"];

type Props = {
  total: PuntoTotal[];
  porEmpresa: Record<string, number[]>; // mil bbl/d de cada empresa, mes a mes (mismo orden que "total")
  hitos: Hito[];
  promedioBase: { valor: number; anio: number };
  accion?: React.ReactNode; // enlace "Ver detalle"
};

type Fila = PuntoTotal & { valor: number; share: number | null };

function Detalle({ active, payload, empresa }: TooltipContentProps<number, string> & { empresa: string | null }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Fila;
  return (
    <div className="min-w-52 border border-border bg-bg px-3 py-2.5 text-xs">
      <p className="rotulo mb-2">{mesTexto(p.fecha)}</p>
      <p className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-fg">
          <span className="h-2 w-2" style={{ background: empresa ? "var(--empresa)" : "var(--oil)" }} />
          {empresa ?? "Petróleo total"}
        </span>
        <span className="tabular text-fg">
          {num(p.valor, 1)} <span className="text-dim">mil bbl/d</span>
        </span>
      </p>
      <div className="mt-1.5 space-y-1 border-t border-border pt-1.5 text-muted">
        {empresa ? (
          <>
            <p className="flex justify-between gap-4">
              <span>Participación</span>
              <span className="tabular text-fg">{p.share === null ? "—" : `${num(p.share, 1)}%`}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Total Vaca Muerta</span>
              <span className="tabular text-fg">{num(p.petroleo, 1)} mil bbl/d</span>
            </p>
          </>
        ) : (
          <>
            <p className="flex justify-between gap-4">
              <span>Gas</span>
              <span className="tabular text-fg">{num(p.gas, 1)} MMm³/d</span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Pozos en producción</span>
              <span className="tabular text-fg">{num(p.pozos)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span>Por pozo</span>
              <span className="tabular text-fg">{num(p.bblPozo)} bbl/d</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function MainChart({ total, porEmpresa, hitos, promedioBase, accion }: Props) {
  const empresa = useEmpresaActiva();
  const elegida = useEmpresas((e) => e.elegida);
  const limpiar = useEmpresas((e) => e.limpiar);
  const [rango, setRango] = useState<Rango>("Desde 2019");

  // Datos del gráfico: el total o la empresa activa
  const datos: Fila[] = useMemo(() => {
    const serie = empresa ? porEmpresa[empresa] : null;
    const filas = total.map((t, i) => {
      const valor = serie ? serie[i] ?? 0 : t.petroleo;
      return { ...t, valor, share: serie ? (valor / t.petroleo) * 100 : null };
    });
    if (rango === "24 meses") return filas.slice(-24);
    if (rango === "Desde 2019") return filas.filter((d) => d.fecha >= "2019-01");
    return filas;
  }, [total, porEmpresa, empresa, rango]);

  const marcas = useMemo(() => {
    if (rango === "24 meses") return datos.filter((_, i) => i % 3 === 0).map((d) => d.fecha);
    const eneros = datos.filter((d) => d.fecha.endsWith("-01")).map((d) => d.fecha);
    return eneros.length > 9 ? eneros.filter((_, i) => i % 2 === 0) : eneros;
  }, [datos, rango]);

  const desde = datos[0]?.fecha ?? "";
  const ultimo = datos[datos.length - 1];
  const color = empresa ? "var(--empresa)" : "var(--oil)";
  const hitosVisibles = hitos.filter((h) => h.fecha >= desde);

  return (
    <>
      <CardHeader
        titulo={
          <>
            Evolución del petróleo
            {empresa && <span className="text-empresa"> · {empresa}</span>}
          </>
        }
        descripcion={
          empresa ? (
            <>
              Miles de barriles por día de {empresa}: {num(ultimo?.valor ?? 0, 1)} mil en {mesTexto(ultimo?.fecha ?? desde)}{" "}
              ({num(ultimo?.share ?? 0, 1)}% del total).
            </>
          ) : (
            <>
              Miles de barriles por día. De {num(promedioBase.valor)} mil (promedio {promedioBase.anio}) a{" "}
              {num(ultimo?.valor ?? 0)} mil en {mesTexto(ultimo?.fecha ?? desde)}.
            </>
          )
        }
        accion={accion}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-dim">
          {elegida ? (
            <button onClick={limpiar} className="tabular uppercase tracking-wider text-empresa hover:text-fg">
              ✕ Volver al total
            </button>
          ) : (
            "Tocá una empresa del ranking para ver solo su curva."
          )}
        </p>
        <Segmented opciones={RANGOS} valor={rango} onChange={setRango} etiqueta="Rango de tiempo" />
      </div>
      <div className="h-[260px] sm:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={datos} margin={{ top: 22, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="relleno-principal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="2 4" />
            <XAxis
              dataKey="fecha"
              ticks={marcas}
              tickFormatter={(f: string) => (rango === "24 meses" ? mesTexto(f) : f.slice(0, 4))}
              tick={{ fill: "var(--dim)", fontSize: 10.5, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              minTickGap={16}
            />
            <YAxis
              tick={{ fill: "var(--dim)", fontSize: 10.5, fontFamily: "var(--font-mono)" }}
              tickFormatter={(v: number) => num(v)}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              content={(p) => <Detalle {...(p as TooltipContentProps<number, string>)} empresa={empresa} />}
              cursor={{ stroke: "var(--dim)", strokeWidth: 1 }}
            />
            {/* Hitos tecnológicos: líneas verticales con su etiqueta arriba */}
            {hitosVisibles.map((h) => (
              <ReferenceLine
                key={h.fecha}
                x={h.fecha}
                stroke="var(--dim)"
                strokeDasharray="2 3"
                label={{
                  value: h.etiqueta,
                  position: "insideTopRight",
                  fill: "var(--muted)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  offset: 4,
                  dy: -20,
                }}
              />
            ))}
            {!empresa && (
              <ReferenceLine
                y={promedioBase.valor}
                stroke="var(--dim)"
                strokeDasharray="4 4"
                label={{
                  value: `Promedio ${promedioBase.anio}`,
                  position: "insideBottomRight",
                  fill: "var(--dim)",
                  fontSize: 10.5,
                  fontFamily: "var(--font-mono)",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="valor"
              stroke={color}
              strokeWidth={1.75}
              fill="url(#relleno-principal)"
              activeDot={{ r: 3.5, strokeWidth: 0, fill: color }}
              isAnimationActive
              animationDuration={450}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
