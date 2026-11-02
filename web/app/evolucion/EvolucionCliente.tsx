"use client";
// Parte interactiva de Evolución: los filtros y los gráficos se recalculan en el navegador.
import { useMemo, useState } from "react";
import Chips from "@/components/Chips";
import Grafico from "@/components/Grafico";
import type { Evolucion } from "@/lib/datos";
import { AZUL, VERDE, aDia, anioDe, kbblD, mmm3D, num, pct, sumarPor } from "@/lib/formato";

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
  const anios = Array.from({ length: anioMax - 2013 + 1 }, (_, i) => 2013 + i);
  const x = mensual.map((m) => aDia(m.fecha));

  return (
    <>
      <div className="tarjeta filtros">
        <div>
          <div className="filtro-titulo">Empresas</div>
          <Chips opciones={grupos} elegidas={elegidas} onChange={setElegidas} />
        </div>
        <div className="fila-filtros">
          <label>
            <div className="filtro-titulo">Desde</div>
            <select value={desde} onChange={(e) => setDesde(Math.min(Number(e.target.value), hasta))}>
              {anios.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label>
            <div className="filtro-titulo">Hasta</div>
            <select value={hasta} onChange={(e) => setHasta(Math.max(Number(e.target.value), desde))}>
              {anios.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
        </div>
      </div>

      {mensual.length === 0 ? (
        <div className="aviso">No hay datos para ese filtro.</div>
      ) : (
        <>
          <div className="grilla-2">
            <div className="tarjeta">
              <Grafico
                data={[{ type: "scatter", mode: "lines", x, y: mensual.map((m) => m.petroleo), line: { color: AZUL, width: 2.5 }, hovertemplate: "%{y:,.1f} mil bbl/d<extra></extra>" }]}
                layout={{ title: { text: `Petróleo · ${tituloEmpresas}`, font: { size: 15 } }, yaxis: { title: { text: "Mil barriles por día" }, rangemode: "tozero" } }}
              />
            </div>
            <div className="tarjeta">
              <Grafico
                data={[{ type: "scatter", mode: "lines", x, y: mensual.map((m) => m.gas), line: { color: VERDE, width: 2.5 }, hovertemplate: "%{y:,.1f} MMm³/d<extra></extra>" }]}
                layout={{ title: { text: `Gas · ${tituloEmpresas}`, font: { size: 15 } }, yaxis: { title: { text: "Millones de m³ por día" }, rangemode: "tozero" } }}
              />
            </div>
          </div>
          <p className="nota">
            El gas sube en invierno y baja en verano porque acompaña la demanda de calefacción. El petróleo, en cambio,
            crece de forma más pareja.
          </p>

          <h2>Promedio de cada año</h2>
          <div className="tarjeta tabla-caja">
            <table>
              <thead>
                <tr>
                  <th>Año</th>
                  <th className="num">Petróleo (mil bbl/d)</th>
                  <th className="num">Gas (MMm³/d)</th>
                  <th className="num">Pozos en producción</th>
                  <th className="num">Crecimiento del petróleo</th>
                </tr>
              </thead>
              <tbody>
                {anual.map((a) => (
                  <tr key={a.anio}>
                    <td>{a.anio}</td>
                    <td className="num">{num(a.pet, 1)}</td>
                    <td className="num">{num(a.gas, 1)}</td>
                    <td className="num">{num(a.pozos)}</td>
                    <td className="num">{a.crec === null ? "—" : pct(a.crec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="nota">El último año puede estar incompleto: es el promedio de los meses publicados hasta ahora.</p>
        </>
      )}
    </>
  );
}
