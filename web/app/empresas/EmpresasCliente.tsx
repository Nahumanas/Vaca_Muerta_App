"use client";
// Empresas: ranking de market share, métricas y las 5 principales en gráficos chicos sincronizados.
import { useMemo, useState } from "react";
import { KPICard } from "@/components/DashboardKPIs";
import MarketShareRanking from "@/components/MarketShareRanking";
import SmallMultiplesSync from "@/components/SmallMultiplesSync";
import { Card, CardBody, CardHeader, Fila } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import type { Empresa } from "@/lib/datos";
import { anioDe, mesTexto, num, restarMeses, sumarPor } from "@/lib/formato";
import { calcularParticipacion, topConResto } from "@/lib/indicadores";

const ULT12 = "Últimos 12 meses";
const PRODUCTOS = ["Petróleo", "Gas"] as const;

export default function EmpresasCliente({ filas }: { filas: Empresa[] }) {
  const [producto, setProducto] = useState<(typeof PRODUCTOS)[number]>("Petróleo");
  const [periodo, setPeriodo] = useState(ULT12);

  const ultimo = filas.reduce((m, f) => (f.fecha > m ? f.fecha : m), filas[0].fecha);
  const periodos = [ULT12, ...Array.from({ length: anioDe(ultimo) - 2017 }, (_, i) => String(anioDe(ultimo) - i))];
  const esPetroleo = producto === "Petróleo";
  const unidad = esPetroleo ? "mil bbl/d" : "MMm³/d";

  const { part, textoPeriodo, conProduccion } = useMemo(() => {
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

  return (
    <>
      <div className="flex flex-wrap items-center gap-8 border-b border-border py-5">
        <Segmented opciones={PRODUCTOS} valor={producto} onChange={setProducto} etiqueta="Producto" />
        <Select etiqueta="Período" valor={periodo} opciones={periodos} onChange={setPeriodo} />
      </div>

      <Fila className="xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader titulo={`Market share del ${producto.toLowerCase()}`} descripcion={`${textoPeriodo}. Pasá el mouse o tocá una empresa para resaltarla abajo.`} />
          <CardBody>
<MarketShareRanking datos={topConResto(part, 10)} seleccionables={nombresSeries} />
          </CardBody>
        </Card>
        <Card className="divide-y divide-border py-0">
          <div className="py-7">
            <p className="rotulo">Empresa líder</p>
            <p className="mt-3 font-serif text-4xl font-medium text-fg">{lider.grupo}</p>
            <p className="mt-2 text-xs text-dim">
              Produce el <span className="tabular text-fg">{num(lider.pct, 1)}%</span> del {producto.toLowerCase()}
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
            descripcion={`${esPetroleo ? "Miles de barriles por día" : "Millones de m³ por día"}. Misma escala en todos. Pasá el mouse por uno: el resto marca la misma fecha.`}
          />
          <CardBody>
            <SmallMultiplesSync datos={series} nombres={nombresSeries} unidad={unidad} />
          </CardBody>
        </Card>
      </Fila>
    </>
  );
}
