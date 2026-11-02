"use client";
import { useMemo, useState } from "react";
import Grafico from "@/components/Grafico";
import Metrica from "@/components/Metrica";
import type { Empresa } from "@/lib/datos";
import { AZUL, GRIS, NARANJA, VERDE, aDia, anioDe, mesTexto, num, restarMeses, sumarPor } from "@/lib/formato";

const ULT12 = "Últimos 12 meses";

export default function EmpresasCliente({ filas }: { filas: Empresa[] }) {
  const [producto, setProducto] = useState<"Petróleo" | "Gas">("Petróleo");
  const [periodo, setPeriodo] = useState(ULT12);

  const ultimo = filas.reduce((m, f) => (f.fecha > m ? f.fecha : m), filas[0].fecha);
  const periodos = [ULT12, ...Array.from({ length: anioDe(ultimo) - 2017 }, (_, i) => String(anioDe(ultimo) - i))];
  const esPetroleo = producto === "Petróleo";
  const color = esPetroleo ? AZUL : VERDE;

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
    const ranking = [...sumarPor(sel, (f) => f.grupo, (f) => (esPetroleo ? f.prod_pet : f.prod_gas))].sort(
      (a, b) => b[1] - a[1],
    );
    const total = ranking.reduce((s, [, v]) => s + v, 0);
    return {
      part: ranking.map(([grupo, v]) => ({ grupo, pct: (v / total) * 100 })),
      textoPeriodo: texto,
      conProduccion: ranking.filter(([, v]) => v > 0).length,
    };
  }, [filas, periodo, esPetroleo, ultimo]);

  // Top 10 + "Resto"
  const top = part.slice(0, 10);
  if (part.length > 10) top.push({ grupo: "Resto", pct: part.slice(10).reduce((s, p) => s + p.pct, 0) });

  // Evolución de las 5 principales desde 2018
  const top5 = part.slice(0, 5).map((p) => p.grupo);
  const series = useMemo(() => {
    const clave = esPetroleo ? "petroleo_kbbl_d" : "gas_MMm3_d";
    const porGrupo = new Map<string, Map<string, number>>();
    for (const f of filas) {
      if (f.fecha < "2018-01") continue;
      const g = top5.includes(f.grupo) ? f.grupo : "Resto";
      const m = porGrupo.get(g) ?? new Map<string, number>();
      m.set(f.fecha, (m.get(f.fecha) ?? 0) + f[clave]);
      porGrupo.set(g, m);
    }
    const paleta = [color, NARANJA, "#7a5ac8", "#d4a017", "#3d3d3a", "#c8c7c2"];
    return [...top5, "Resto"].map((g, i) => {
      const puntos = [...(porGrupo.get(g) ?? new Map())].sort(([a], [b]) => a.localeCompare(b));
      return {
        type: "scatter", mode: "lines", stackgroup: "uno", name: g,
        x: puntos.map(([f]) => aDia(f)), y: puntos.map(([, v]) => v),
        line: { color: paleta[i], width: 0.5 }, fillcolor: paleta[i],
        hovertemplate: `${g}: %{y:,.1f}<extra></extra>`,
      };
    });
  }, [filas, esPetroleo, top5.join("|"), color]);

  const lider = part[0];

  return (
    <>
      <div className="tarjeta fila-filtros" style={{ marginBottom: 20 }}>
        <div>
          <div className="filtro-titulo">Producto</div>
          <div className="chips">
            {(["Petróleo", "Gas"] as const).map((p) => (
              <button key={p} className={producto === p ? "chip activo" : "chip"} onClick={() => setProducto(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <label>
          <div className="filtro-titulo">Período</div>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            {periodos.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
      </div>

      <div className="grilla-3-2">
        <div className="tarjeta">
          <Grafico
            alto={460}
            fechas={false}
            data={[
              {
                type: "bar", orientation: "h",
                x: top.map((t) => t.pct), y: top.map((t) => t.grupo),
                text: top.map((t) => `${num(t.pct, 1)}%`), textposition: "outside", cliponaxis: false,
                marker: { color: top.map((_, i) => (i === 0 ? color : GRIS)) },
                hovertemplate: "%{y}: %{x:.1f}%<extra></extra>",
              },
            ]}
            layout={{
              title: { text: `Participación en el ${producto.toLowerCase()} · ${textoPeriodo}`, font: { size: 15 } },
              hovermode: "closest",
              yaxis: { autorange: "reversed", gridcolor: "rgba(0,0,0,0)" },
              xaxis: { title: { text: "% del total" }, ticksuffix: "%", range: [0, (top[0]?.pct ?? 0) * 1.15] },
            }}
          />
        </div>
        <div className="metricas-columna">
          <Metrica titulo={`Empresa líder en ${producto.toLowerCase()}`} valor={lider.grupo} nota={`Produce el ${num(lider.pct, 1)}% del total`} />
          <Metrica titulo="Las 3 primeras juntas" valor={`${num(part.slice(0, 3).reduce((s, p) => s + p.pct, 0), 1)}%`} />
          <Metrica titulo="Empresas con producción" valor={String(conProduccion)} />
        </div>
      </div>

      <h2>Evolución de las 5 principales en {producto.toLowerCase()}</h2>
      <div className="tarjeta">
        <Grafico
          alto={440}
          data={series}
          layout={{ legend: { orientation: "h", y: 1.08, x: 0, traceorder: "normal" }, yaxis: { title: { text: esPetroleo ? "Mil barriles por día" : "Millones de m³ por día" } } }}
        />
      </div>
    </>
  );
}
