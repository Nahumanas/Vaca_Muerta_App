"use client";
// Empresas: market share (barras), métricas y evolución de las 5 principales (áreas apiladas).
import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis, type TooltipContentProps } from "recharts";
import { KPICard } from "@/components/DashboardKPIs";
import MarketShareChart from "@/components/MarketShareChart";
import { Card, CardBody, CardHeader, Fila } from "@/components/ui/Card";
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

  // Todos los gráficos chicos usan la MISMA escala, así se pueden comparar a simple vista
  const maximo = Math.max(1, ...series.flatMap((f) => nombresSeries.map((g) => Number((f as Record<string, unknown>)[g] ?? 0))));

  return (
    <>
      <div className="flex flex-wrap items-center gap-8 border-b border-border py-5">
        <Segmented opciones={PRODUCTOS} valor={producto} onChange={setProducto} etiqueta="Producto" />
        <Select etiqueta="Período" valor={periodo} opciones={periodos} onChange={setPeriodo} />
      </div>

      <Fila className="xl:grid-cols-3">
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
        <Card className="divide-y divide-border py-0">
          <div className="py-7">
            <p className="rotulo">Empresa líder</p>
            <p className="mt-3 font-serif text-4xl font-medium text-fg">{lider.grupo}</p>
            <p className="mt-2 text-xs text-dim">
              Produce el <span className="tabular text-oil">{num(lider.pct, 1)}%</span> del {producto.toLowerCase()}
            </p>
          </div>
          <KPICard className="py-7" kpi={{ id: "top3", titulo: "Las 3 primeras juntas", valor: top3, decimales: 1, unidad: "% del total", variaciones: [] }} />
          <KPICard className="py-7" kpi={{ id: "n", titulo: "Empresas con producción", valor: conProduccion, unidad: "grupos", variaciones: [] }} />
        </Card>
      </Fila>

      <Fila>
        <Card>
          <CardHeader
            titulo={`Las 5 principales en ${producto.toLowerCase()}, desde 2018`}
            descripcion={`${esPetroleo ? "Miles de barriles por día" : "Millones de m³ por día"}. Todos los gráficos tienen la misma escala.`}
          />
          <CardBody className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {nombresSeries.map((g, i) => {
              const ult = Number((series[series.length - 1] as Record<string, unknown>)?.[g] ?? 0);
              const resaltar = i === 0;
              return (
                <div key={g} className="border-t border-border pt-3">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm text-fg">{g}</span>
                    <span className="tabular text-sm text-fg">
                      {num(ult, 1)} <span className="text-[11px] text-dim">{unidad}</span>
                    </span>
                  </div>
                  <div style={{ height: 110 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={series} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                        <YAxis hide domain={[0, maximo]} />
                        <Tooltip
                          content={(p) => <DetalleChico {...(p as TooltipContentProps<number, string>)} unidad={unidad} />}
                          cursor={{ stroke: "var(--dim)", strokeWidth: 1 }}
                        />
                        <Area
                          type="monotone"
                          dataKey={g}
                          stroke={resaltar ? `var(--${color})` : "var(--muted)"}
                          strokeWidth={1.5}
                          fill={resaltar ? `var(--${color})` : "var(--muted)"}
                          fillOpacity={resaltar ? 0.18 : 0.08}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-1 flex justify-between tabular text-[10.5px] text-dim">
                    <span>{series[0]?.fecha.slice(0, 4)}</span>
                    <span>{mesTexto(series[series.length - 1]?.fecha ?? ultimo)}</span>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </Fila>
    </>
  );
}

function DetalleChico({ active, payload, label, unidad }: TooltipContentProps<number, string> & { unidad: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="border border-border bg-bg px-2.5 py-1.5 text-xs">
      <p className="rotulo">{mesTexto(String((p.payload as { fecha: string }).fecha ?? label))}</p>
      <p className="tabular text-fg">
        {num(Number(p.value), 1)} <span className="text-dim">{unidad}</span>
      </p>
    </div>
  );
}
