"use client";
import { useMemo, useState } from "react";
import Chips from "@/components/Chips";
import Grafico from "@/components/Grafico";
import Metrica from "@/components/Metrica";
import type { Pozo } from "@/lib/datos";
import { num } from "@/lib/formato";

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

  const mapa = useMemo(
    () => [
      {
        type: "scattermap",
        lat: sel.map((p) => p.lat),
        lon: sel.map((p) => p.lon),
        text: sel.map((p) => p.sigla),
        customdata: sel.map((p) => [p.grupo, p.area, p.tipopozo, p.pet_acum_kbbl, p.gas_acum_mm3, p.primer_mes]),
        marker: {
          size: 7,
          // Escala logarítmica de color: hay pozos de 1 mil y de 2 millones de barriles
          color: sel.map((p) => Math.log10(Math.max(p.pet_acum_kbbl, 0.1))),
          colorscale: "Blues", reversescale: true, cmin: 0, cmax: 3.5,
          colorbar: { title: { text: "Petróleo<br>acumulado" }, tickvals: [0, 1, 2, 3], ticktext: ["1 mil bbl", "10 mil", "100 mil", "1 millón"] },
        },
        hovertemplate:
          "<b>%{text}</b><br>%{customdata[0]} · %{customdata[1]}<br>%{customdata[2]}<br>" +
          "Petróleo acumulado: %{customdata[3]:,.0f} mil bbl<br>Gas acumulado: %{customdata[4]:,.0f} mil m³<br>" +
          "Empezó a producir: %{customdata[5]}<extra></extra>",
      },
    ],
    [sel],
  );

  const top10 = [...sel].sort((a, b) => b.pet_acum_kbbl - a.pet_acum_kbbl).slice(0, 10);
  const mmyyyy = (f: string) => `${f.slice(5, 7)}/${f.slice(0, 4)}`;

  return (
    <>
      <div className="tarjeta filtros">
        <div>
          <div className="filtro-titulo">Empresas</div>
          <Chips opciones={grupos} elegidas={elegidas} onChange={setElegidas} />
        </div>
        <div>
          <div className="filtro-titulo">Tipo de pozo</div>
          <Chips opciones={tipos} elegidas={tiposElegidos} onChange={setTiposElegidos} vacio="Todos" />
        </div>
        <label className="interruptor">
          <input type="checkbox" checked={soloActivos} onChange={(e) => setSoloActivos(e.target.checked)} />
          Solo pozos que produjeron el último mes
        </label>
      </div>

      <div className="grilla-3">
        <Metrica titulo="Pozos en el mapa" valor={num(sel.length)} />
        <Metrica titulo="Petróleo acumulado" valor={`${num(sel.reduce((s, p) => s + p.pet_acum_kbbl, 0) / 1000)} millones de bbl`} />
        <Metrica titulo="Pozos que produjeron el último mes" valor={num(sel.filter((p) => p.ultimo_mes === ultimoMes).length)} />
      </div>

      {sel.length === 0 ? (
        <div className="aviso" style={{ marginTop: 16 }}>No hay pozos para ese filtro.</div>
      ) : (
        <>
          <div className="tarjeta" style={{ marginTop: 16, padding: 0, overflow: "hidden" }}>
            <Grafico
              alto={620}
              fechas={false}
              data={mapa}
              layout={{
                margin: { l: 0, r: 0, t: 0, b: 0 },
                hovermode: "closest",
                map: { style: "carto-positron", center: { lat: -38.3, lon: -68.9 }, zoom: 7.3 },
              }}
            />
          </div>

          <h2>Los 10 pozos que más petróleo produjeron</h2>
          <div className="tarjeta tabla-caja">
            <table>
              <thead>
                <tr>
                  <th>Pozo</th>
                  <th>Empresa</th>
                  <th>Área</th>
                  <th>Empezó a producir</th>
                  <th className="num">Petróleo acumulado (mil bbl)</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((p) => (
                  <tr key={p.sigla}>
                    <td>{p.sigla}</td>
                    <td>{p.grupo}</td>
                    <td>{p.area}</td>
                    <td>{mmyyyy(p.primer_mes)}</td>
                    <td className="num">{num(p.pet_acum_kbbl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
