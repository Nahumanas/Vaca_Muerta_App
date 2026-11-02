"use client";
// Empresas: market share (barras), métricas y evolución de las 5 principales (áreas apiladas).
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { KPICard } from "@/components/DashboardKPIs";
import MarketShareChart from "@/components/MarketShareChart";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import type { Empresa } from "@/lib/datos";
import { anioDe, diasDelMes, mesTexto, num, restarMeses, sumarPor } from "@/lib/formato";
import { calcularParticipacion, topConResto } from "@/lib/indicadores";

const ULT12 = "Últimos 12 meses";
const PRODUCTOS = ["Petróleo", "Gas"] as const;

export default function EmpresasCliente({ filas }: { filas: Empresa[] }) {
  const [producto, setProducto] = useState<(typeof PRODUCTOS)[number]>("Petróleo");
  const [periodo, setPeriodo] = useState(ULT12);

  const ultimo = filas.reduce((m, f) => (f.fecha > m ? f.fecha : m), filas[0].fecha);
  const periodos = [ULT12, ...Array.from({ length: anioDe(ultimo) - 2017 }, (_, i) => String(anioDe(ultimo) - i))];
  const esPetroleo = producto === "Petróleo";
  const color = esPetroleo ? "oil" : "gas";
  const unidad = esPetroleo ? "mil bbl/d" : "MMm³/d";

  // Cada empresa tiene SIEMPRE el mismo color (no cambia al filtrar): se asigna por su producción histórica
  const colorDe = useMemo(() => {
    const total = [...sumarPor(filas, (f) => f.grupo, (f) => f.petroleo_kbbl_d + f.gas_MMm3_d * 6.29)].sort(
      (a, b) => b[1] - a[1],
    );
    const mapa = new Map(total.slice(0, 8).map(([g], i) => [g, `var(--cat-${i + 1})`]));
    return (g: string) => mapa.get(g) ?? "var(--neutral)";
  }, [filas]);

  const { part, textoPeriodo, conProduccion, dias } = useMemo(() => {
    let sel: Empresa[];
    let texto: string;
    if (periodo === ULT12) {
      const desde = restarMeses(ultimo, 11);
      sel = filas.filter((f) => f.fecha >= desde);
      texto = `${mesTexto(desde)} a ${mesTexto(ultimo)}`;
    } else {
      sel = filas.filter((f) => anioDe(f.fecha) === Number(periodo));
      texto = periodo;
    }
    const part = calcularParticipacion(sel, esPetroleo ? "pet" : "gas");
    return {
      part,
      textoPeriodo: texto,
      conProduccion: part.filter((p) => p.valor > 0).length,
      dias: [...new Set(sel.map((f) => f.fecha))].reduce((s, f) => s + diasDelMes(f), 0),
    };
  }, [filas, periodo, esPetroleo, ultimo]);

  // Evolución de las 5 principales desde 2018, en formato "ancho" para Recharts: { fecha, YPF: .., Vista: .. }
  const top5 = part.slice(0, 5).map((p) => p.grupo);
  const claveTop = top5.join("|");
  const series = useMemo(() => {
    const clave = esPetroleo ? "petroleo_kbbl_d" : "gas_MMm3_d";
    const porMes = new Map<string, Record<string, number>>();
    for (const f of filas) {
      if (f.fecha < "2018-01") continue;
      const g = top5.includes(f.grupo) ? f.grupo : "Resto";
      const fila = porMes.get(f.fecha) ?? {};
      fila[g] = (fila[g] ?? 0) + f[clave];
      porMes.set(f.fecha, fila);
    }
    // Si una empresa no tiene dato un mes, va 0 (si no, el área apilada queda con un "agujero")
    const ceros = Object.fromEntries([...top5, "Resto"].map((g) => [g, 0]));
    return [...porMes].sort(([a], [b]) => a.localeCompare(b)).map(([fecha, v]) => ({ fecha, ...ceros, ...v }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filas, esPetroleo, claveTop]);
  const nombresSeries = [...top5, "Resto"];

  const lider = part[0];
  const top3 = part.slice(0, 3).reduce((s, p) => s + p.pct, 0);
  // Pasar el total del período a "por día" para el tooltip de las barras
  const porDia = (valor: number) =>
    esPetroleo ? (valor * 6.2898) / dias / 1000 : valor / dias / 1000; // m³ -> mil bbl/d · mil m³ -> MMm³/d

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Segmented opciones={PRODUCTOS} valor={producto} onChange={setProducto} etiqueta="Producto" />
        <Select etiqueta="Período" valor={periodo} opciones={periodos} onChange={setPeriodo} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader titulo={`Market share del ${producto.toLowerCase()}`} descripcion={textoPeriodo} />
          <CardBody>
            <MarketShareChart
              datos={topConResto(part, 10)}
              color={color}
              valorTooltip={(p) => `${num(porDia(p.valor), 1)} ${unidad} en promedio`}
            />
          </CardBody>
        </Card>
        <div className="grid content-start gap-4">
          <Card className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Empresa líder</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-fg">{lider.grupo}</p>
            <p className="mt-1 text-xs text-muted">Produce el {num(lider.pct, 1)}% del {producto.toLowerCase()}</p>
          </Card>
          <KPICard kpi={{ id: "top3", titulo: "Las 3 primeras juntas", valor: top3, decimales: 1, unidad: "% del total", color, variaciones: [] }} />
          <KPICard kpi={{ id: "n", titulo: "Empresas con producción", valor: conProduccion, unidad: "grupos", color: "neutro", variaciones: [] }} />
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader
          titulo={`Evolución de las 5 principales en ${producto.toLowerCase()}`}
          descripcion={esPetroleo ? "Miles de barriles por día, apilado" : "Millones de m³ por día, apilado"}
        />
        <CardBody>
          {/* Leyenda: cada empresa con su color */}
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {nombresSeries.map((g) => (
              <span key={g} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g === "Resto" ? "var(--neutral)" : colorDe(g) }} />
                {g}
              </span>
            ))}
          </div>
          <div style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis
                  dataKey="fecha"
                  ticks={series.filter((s) => s.fecha.endsWith("-01")).map((s) => s.fecha)}
                  tickFormatter={(f: string) => f.slice(0, 4)}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v: number) => num(v)} tickLine={false} axisLine={false} width={44} />
                <Tooltip content={(p) => <DetalleApilado {...(p as TooltipContentProps<number, string>)} unidad={unidad} />} cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} />
                {nombresSeries.map((g) => {
                  const c = g === "Resto" ? "var(--neutral)" : colorDe(g);
                  return (
                    <Area
                      key={g}
                      type="monotone"
                      dataKey={g}
                      stackId="1"
                      stroke="var(--panel)"
                      strokeWidth={1}
                      fill={c}
                      fillOpacity={0.9}
                      isAnimationActive={false}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </>
  );
}

function DetalleApilado({ active, payload, label, unidad }: TooltipContentProps<number, string> & { unidad: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + Number(p.value ?? 0), 0);
  return (
    <div className="min-w-52 rounded-lg border border-border bg-panel px-3 py-2.5 text-xs shadow-xl">
      <p className="mb-1.5 font-medium text-muted">{mesTexto(String(label))}</p>
      {[...payload].reverse().map((p) => (
        <p key={String(p.dataKey)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-sm" style={{ background: String(p.color) }} />
            {String(p.dataKey)}
          </span>
          <span className="tabular text-fg">{num(Number(p.value), 1)}</span>
        </p>
      ))}
      <p className="mt-1.5 flex justify-between border-t border-border pt-1.5 text-fg">
        <span>Total</span>
        <span className="tabular font-semibold">
          {num(total, 1)} <span className="font-normal text-muted">{unidad}</span>
        </span>
      </p>
    </div>
  );
}
