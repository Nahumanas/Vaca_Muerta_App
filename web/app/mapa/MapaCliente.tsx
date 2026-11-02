"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import Chips from "@/components/Chips";
import { KPICard } from "@/components/DashboardKPIs";
import { Card, CardBody, CardHeader, Fila } from "@/components/ui/Card";
import type { Pozo } from "@/lib/datos";
import { num } from "@/lib/formato";

// El mapa usa el navegador (WebGL), así que se carga solo del lado del cliente
const WellMap = dynamic(() => import("@/components/WellMap"), {
  ssr: false,
  loading: () => <div className="grid h-[560px] place-items-center text-sm text-muted">Cargando mapa…</div>,
});

// Ordena una lista de textos según cuántas veces aparece cada uno (como value_counts)
function porFrecuencia(valores: string[]) {
  const n = new Map<string, number>();
  for (const v of valores) n.set(v, (n.get(v) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

export default function MapaCliente({ pozos }: { pozos: Pozo[] }) {
  const grupos = useMemo(() => porFrecuencia(pozos.map((p) => p.grupo)), [pozos]);
  const tipos = useMemo(() => porFrecuencia(pozos.map((p) => p.tipopozo)), [pozos]);
  const ultimoMes = pozos.reduce((m, p) => (p.ultimo_mes > m ? p.ultimo_mes : m), "");

  const [elegidas, setElegidas] = useState<string[]>([]);
  const [tiposElegidos, setTiposElegidos] = useState<string[]>([]);
  const [soloActivos, setSoloActivos] = useState(false);

  const sel = useMemo(
    () =>
      pozos
        .filter((p) => !elegidas.length || elegidas.includes(p.grupo))
        .filter((p) => !tiposElegidos.length || tiposElegidos.includes(p.tipopozo))
        .filter((p) => !soloActivos || p.ultimo_mes === ultimoMes)
        .sort((a, b) => a.pet_acum_kbbl - b.pet_acum_kbbl), // los mejores pozos se dibujan arriba
    [pozos, elegidas, tiposElegidos, soloActivos, ultimoMes],
  );

  const top10 = [...sel].sort((a, b) => b.pet_acum_kbbl - a.pet_acum_kbbl).slice(0, 10);
  const mmyyyy = (f: string) => `${f.slice(5, 7)}/${f.slice(0, 4)}`;

  return (
    <>
      <Fila>
        <Card className="space-y-5 py-6">
          <div>
            <p className="rotulo mb-2">Empresas</p>
            <Chips opciones={grupos} elegidas={elegidas} onChange={setElegidas} />
          </div>
          <div>
            <p className="rotulo mb-2">Tipo de pozo</p>
            <Chips opciones={tipos} elegidas={tiposElegidos} onChange={setTiposElegidos} vacio="Todos" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" className="accent-[var(--oil)]" checked={soloActivos} onChange={(e) => setSoloActivos(e.target.checked)} />
            Solo pozos que produjeron el último mes
          </label>
        </Card>
      </Fila>

      <Fila className="sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
        {[
          { id: "n", titulo: "Pozos en el mapa", valor: sel.length, unidad: "pozos" },
          { id: "acum", titulo: "Petróleo acumulado", valor: sel.reduce((s, p) => s + p.pet_acum_kbbl, 0) / 1000, unidad: "millones de bbl", color: "oil" as const },
          { id: "act", titulo: "Produjeron el último mes", valor: sel.filter((p) => p.ultimo_mes === ultimoMes).length, unidad: "pozos" },
        ].map((k) => (
          <Card key={k.id} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
            <KPICard kpi={{ ...k, variaciones: [] }} />
          </Card>
        ))}
      </Fila>

      {sel.length === 0 ? (
        <p className="py-8 text-sm text-muted">No hay pozos para ese filtro.</p>
      ) : (
        <>
          <div className="border-b border-border py-7">
            <WellMap pozos={sel} />
          </div>

          <Fila>
          <Card>
            <CardHeader titulo="Los 10 pozos que más petróleo produjeron" />
            <CardBody className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left rotulo">
                    <th className="py-2 pr-4 font-medium">Pozo</th>
                    <th className="py-2 pr-4 font-medium">Empresa</th>
                    <th className="py-2 pr-4 font-medium">Área</th>
                    <th className="py-2 pr-4 font-medium">Empezó a producir</th>
                    <th className="py-2 text-right font-medium">Petróleo acumulado (mil bbl)</th>
                  </tr>
                </thead>
                <tbody>
                  {top10.map((p) => (
                    <tr key={p.sigla} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap tabular text-fg">{p.sigla}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{p.grupo}</td>
                      <td className="py-2 pr-4 whitespace-nowrap text-muted">{p.area}</td>
                      <td className="py-2 pr-4 tabular text-dim">{mmyyyy(p.primer_mes)}</td>
                      <td className="py-2 text-right tabular text-fg">{num(p.pet_acum_kbbl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
          </Fila>
        </>
      )}
    </>
  );
}
