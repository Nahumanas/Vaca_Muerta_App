"use client";
// Parte interactiva de Evolución: los filtros y los gráficos se recalculan en el navegador.
import { useMemo, useState } from "react";
import Chips from "@/components/Chips";
import ProductionChart from "@/components/ProductionChart";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import type { Evolucion } from "@/lib/datos";
import { anioDe, kbblD, mmm3D, num, pct, sumarPor } from "@/lib/formato";

export default function EvolucionCliente({ filas }: { filas: Evolucion[] }) {
  const anioMax = Math.max(...filas.map((f) => anioDe(f.fecha)));
  const grupos = useMemo(
    () => [...sumarPor(filas, (f) => f.grupo, (f) => f.prod_pet)].sort((a, b) => b[1] - a[1]).map(([g]) => g),
    [filas],
  );
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [desde, setDesde] = useState(2018);
  const [hasta, setHasta] = useState(anioMax);

  // Sumamos todas las empresas elegidas, mes por mes
  const mensual = useMemo(() => {
    const porMes = new Map<string, { pet: number; gas: number; pozos: number }>();
    for (const f of filas) {
      const anio = anioDe(f.fecha);
      if (anio < desde || anio > hasta) continue;
      if (elegidas.length && !elegidas.includes(f.grupo)) continue;
      const m = porMes.get(f.fecha) ?? { pet: 0, gas: 0, pozos: 0 };
      porMes.set(f.fecha, { pet: m.pet + f.prod_pet, gas: m.gas + f.prod_gas, pozos: m.pozos + f.pozos });
    }
    return [...porMes]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, m]) => ({ fecha, petroleo: kbblD(m.pet, fecha), gas: mmm3D(m.gas, fecha), pozos: m.pozos }));
  }, [filas, elegidas, desde, hasta]);

  // Promedio de cada año
  const anual = useMemo(() => {
    const porAnio = new Map<number, { pet: number; gas: number; pozos: number; n: number }>();
    for (const m of mensual) {
      const a = porAnio.get(anioDe(m.fecha)) ?? { pet: 0, gas: 0, pozos: 0, n: 0 };
      porAnio.set(anioDe(m.fecha), { pet: a.pet + m.petroleo, gas: a.gas + m.gas, pozos: a.pozos + m.pozos, n: a.n + 1 });
    }
    const lista = [...porAnio].sort(([a], [b]) => a - b);
    return lista.map(([anio, a], i) => {
      const pet = a.pet / a.n;
      const previo = i > 0 ? lista[i - 1][1].pet / lista[i - 1][1].n : null;
      return { anio, pet, gas: a.gas / a.n, pozos: a.pozos / a.n, crec: previo ? (pet / previo - 1) * 100 : null };
    });
  }, [mensual]);

  const tituloEmpresas = elegidas.length ? elegidas.join(", ") : "todas las empresas";
  const anios = Array.from({ length: anioMax - 2013 + 1 }, (_, i) => String(2013 + i));

  return (
    <>
      <Card className="mb-4">
        <CardBody className="space-y-4 pt-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted">Empresas</p>
            <Chips opciones={grupos} elegidas={elegidas} onChange={setElegidas} />
          </div>
          <div className="flex flex-wrap gap-4">
            <Select etiqueta="Desde" valor={String(desde)} opciones={anios} onChange={(v) => setDesde(Math.min(Number(v), hasta))} />
            <Select etiqueta="Hasta" valor={String(hasta)} opciones={anios} onChange={(v) => setHasta(Math.max(Number(v), desde))} />
          </div>
        </CardBody>
      </Card>

      {mensual.length === 0 ? (
        <Card className="p-5 text-sm text-muted">No hay datos para ese filtro.</Card>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader titulo="Petróleo" descripcion={`Miles de barriles por día · ${tituloEmpresas}`} />
              <CardBody>
                <ProductionChart
                  datos={mensual}
                  conRangos={false}
                  rangoInicial="Todo"
                  serie={{ clave: "petroleo", nombre: "Petróleo", unidad: "mil bbl/d", color: "oil", decimales: 1 }}
                  extras={[
                    { clave: "gas", nombre: "Gas", unidad: "MMm³/d", decimales: 1 },
                    { clave: "pozos", nombre: "Pozos en producción", unidad: "" },
                  ]}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader titulo="Gas" descripcion={`Millones de m³ por día · ${tituloEmpresas}`} />
              <CardBody>
                <ProductionChart
                  datos={mensual}
                  conRangos={false}
                  rangoInicial="Todo"
                  serie={{ clave: "gas", nombre: "Gas", unidad: "MMm³/d", color: "gas", decimales: 1 }}
                  extras={[
                    { clave: "petroleo", nombre: "Petróleo", unidad: "mil bbl/d", decimales: 1 },
                    { clave: "pozos", nombre: "Pozos en producción", unidad: "" },
                  ]}
                />
              </CardBody>
            </Card>
          </div>
          <p className="mt-2 text-xs text-muted">
            El gas sube en invierno y baja en verano porque acompaña la demanda de calefacción. El petróleo, en cambio,
            crece de forma más pareja.
          </p>

          <Card className="mt-4">
            <CardHeader titulo="Promedio de cada año" descripcion="El último año puede estar incompleto: es el promedio de los meses publicados hasta ahora." />
            <CardBody className="overflow-x-auto">
              <table className="w-full text-sm tabular">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="py-2 pr-4 font-medium">Año</th>
                    <th className="py-2 pr-4 text-right font-medium">Petróleo (mil bbl/d)</th>
                    <th className="py-2 pr-4 text-right font-medium">Gas (MMm³/d)</th>
                    <th className="py-2 pr-4 text-right font-medium">Pozos en producción</th>
                    <th className="py-2 text-right font-medium">Crecimiento del petróleo</th>
                  </tr>
                </thead>
                <tbody>
                  {anual.map((a) => (
                    <tr key={a.anio} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-4 text-muted">{a.anio}</td>
                      <td className="py-2 pr-4 text-right">{num(a.pet, 1)}</td>
                      <td className="py-2 pr-4 text-right">{num(a.gas, 1)}</td>
                      <td className="py-2 pr-4 text-right">{num(a.pozos)}</td>
                      <td className={`py-2 text-right ${a.crec === null ? "text-muted" : a.crec >= 0 ? "text-up" : "text-down"}`}>
                        {a.crec === null ? "—" : `${a.crec >= 0 ? "▲" : "▼"} ${pct(a.crec)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
