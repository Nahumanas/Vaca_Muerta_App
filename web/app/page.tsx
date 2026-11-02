// Página principal (Resumen). Todos los números se calculan con los datos:
// cuando llega un mes nuevo, el texto se actualiza solo.
import Link from "next/link";
import Grafico from "@/components/Grafico";
import Metrica from "@/components/Metrica";
import { cargarDiseno, cargarEmpresas, cargarInfo, cargarResumen } from "@/lib/datos";
import { AZUL, aDia, anioDe, mesTexto, num, pct, restarMeses, sumarPor } from "@/lib/formato";

const ANIO_BASE = 2019; // primer año de la Parte 2 del proyecto (Balance Energético)
const ANIO_INICIO = 2013; // desde acá la producción de Vaca Muerta empieza a ser relevante

export default function Inicio() {
  const resumen = cargarResumen();
  const info = cargarInfo();
  const ultimo = resumen[resumen.length - 1];
  const anterior = resumen[resumen.length - 2];
  const haceUnAnio = resumen.find((r) => r.fecha === restarMeses(ultimo.fecha, 12))!;
  const variacion = (col: "petroleo_kbbl_d" | "gas_MMm3_d" | "pozos_activos", base: typeof ultimo) =>
    (ultimo[col] / base[col] - 1) * 100;

  // Promedios por año
  const anios = new Map<number, { pet: number; pozos: number; n: number }>();
  for (const r of resumen) {
    const a = anios.get(anioDe(r.fecha)) ?? { pet: 0, pozos: 0, n: 0 };
    anios.set(anioDe(r.fecha), { pet: a.pet + r.petroleo_kbbl_d, pozos: a.pozos + r.pozos_activos, n: a.n + 1 });
  }
  const anual = (anio: number) => {
    const a = anios.get(anio)!;
    const pet = a.pet / a.n;
    const pozos = a.pozos / a.n;
    return { pet, pozos, bblPorPozo: (pet * 1000) / pozos };
  };
  const mesUlt = Number(ultimo.fecha.slice(5, 7));
  const anioCerrado = mesUlt === 12 ? anioDe(ultimo.fecha) : anioDe(ultimo.fecha) - 1; // último año completo
  const base = anual(ANIO_BASE);
  const cerrado = anual(anioCerrado);
  const veces = ultimo.petroleo_kbbl_d / base.pet;

  // Participación de cada empresa en los últimos 12 meses
  const desde = restarMeses(ultimo.fecha, 11);
  const ult12 = cargarEmpresas().filter((e) => e.fecha >= desde);
  const total12 = ult12.reduce((s, e) => s + e.prod_pet, 0);
  const participacion = [...sumarPor(ult12, (e) => e.grupo, (e) => e.prod_pet)]
    .map(([grupo, v]) => ({ grupo, pct: (v / total12) * 100 }))
    .sort((a, b) => b.pct - a.pct);
  const [lider, segunda] = participacion;
  const fraseLider =
    lider.pct > 50 ? (
      <><strong>{lider.grupo} produce más de la mitad</strong> del petróleo</>
    ) : (
      <><strong>{lider.grupo} es la que más petróleo produce</strong></>
    );

  const diseno = cargarDiseno();
  const dIni = diseno.find((d) => d.anio_fractura === ANIO_INICIO)!;
  const dFin = diseno.find((d) => d.anio_fractura === anioCerrado)!;
  const cien = (x: number) => Math.round(x / 100) * 100;

  const ult24 = resumen.slice(-24);

  return (
    <>
      <h1>Monitor de Vaca Muerta</h1>
      <p className="bajada">
        Producción de petróleo y gas de la formación Vaca Muerta, pozo por pozo, con los datos oficiales de la
        Secretaría de Energía. <strong>Último dato: {mesTexto(ultimo.fecha)}.</strong>
      </p>

      <div className="grilla-3">
        {(
          [
            ["Petróleo · miles de barriles por día", "petroleo_kbbl_d", 0],
            ["Gas · millones de m³ por día", "gas_MMm3_d", 1],
            ["Pozos en producción", "pozos_activos", 0],
          ] as const
        ).map(([titulo, col, dec]) => (
          <Metrica
            key={col}
            titulo={titulo}
            valor={num(ultimo[col], dec)}
            delta={`${pct(variacion(col, anterior))} vs. ${mesTexto(anterior.fecha)}`}
            nota={`${pct(variacion(col, haceUnAnio))} contra ${mesTexto(haceUnAnio.fecha)}`}
          />
        ))}
      </div>

      <h2>Petróleo en los últimos 24 meses</h2>
      <div className="tarjeta">
        <Grafico
          alto={360}
          data={[
            {
              type: "bar",
              x: ult24.map((r) => aDia(r.fecha)),
              y: ult24.map((r) => r.petroleo_kbbl_d),
              marker: { color: AZUL },
              hovertemplate: "%{y:,.0f} mil bbl/d<extra></extra>",
            },
          ]}
          layout={{ yaxis: { title: { text: "Mil barriles por día" } }, margin: { l: 10, r: 10, t: 10, b: 10 } }}
        />
      </div>

      <h2>📌 Lo que muestran los datos</h2>
      <div className="tarjeta hallazgos">
        <ul>
          <li>
            <strong>Vaca Muerta es el {num(info.pct_petroleo_vm, 1)}% del petróleo no convencional</strong> del país:{" "}
            {num(info.pozos)} pozos en la base.
          </li>
          <li>
            El petróleo pasó de <strong>{num(base.pet)} mil barriles por día</strong> (promedio {ANIO_BASE}) a{" "}
            <strong>{num(cerrado.pet)} mil</strong> (promedio {anioCerrado}) y{" "}
            <strong>{num(ultimo.petroleo_kbbl_d)} mil en {mesTexto(ultimo.fecha)}</strong>: se multiplicó por{" "}
            {num(veces, 1)}.
          </li>
          <li>
            Esto conecta con la Parte 2 del proyecto: es el petróleo que explica el <strong>giro exportador</strong> del
            Balance Energético.
          </li>
          <li>
            Los pozos activos pasaron de <strong>{num(base.pozos)}</strong> a <strong>{num(cerrado.pozos)}</strong> (
            {ANIO_BASE} contra {anioCerrado}) y cada pozo rinde más: de{" "}
            <strong>
              {num(base.bblPorPozo)} a {num(cerrado.bblPorPozo)} barriles por día
            </strong>
            . El crecimiento viene de <strong>más pozos</strong> y también de <strong>pozos más productivos</strong>.
          </li>
          <li>
            {fraseLider} ({num(lider.pct, 1)}% en los últimos 12 meses), seguida por {segunda.grupo} (
            {num(segunda.pct, 1)}%).
          </li>
          <li>
            Los pozos son cada vez más grandes: la rama horizontal pasó de unos <strong>{num(cien(dIni.rama_m))} m</strong>{" "}
            ({ANIO_INICIO}) a unos <strong>{num(cien(dFin.rama_m))} m</strong> ({anioCerrado}), y las etapas de
            fractura, de{" "}
            <strong>
              {num(dIni.etapas)} a {num(dFin.etapas)}
            </strong>
            .
          </li>
        </ul>
        <p className="nota">
          Promedios anuales de producción. Largo de rama y etapas: valor típico (mediana) de los pozos fracturados cada
          año.
        </p>
      </div>

      <h2>¿Qué hay en la web?</h2>
      <div className="grilla-3">
        <Link href="/evolucion" className="tarjeta" style={{ textDecoration: "none", color: "inherit" }}>
          <strong>Evolución →</strong>
          <p className="nota">Cómo creció la producción mes a mes desde 2013, con filtro por empresa.</p>
        </Link>
        <Link href="/empresas" className="tarjeta" style={{ textDecoration: "none", color: "inherit" }}>
          <strong>Empresas →</strong>
          <p className="nota">Quién produce más y cómo cambió el ranking.</p>
        </Link>
        <Link href="/mapa" className="tarjeta" style={{ textDecoration: "none", color: "inherit" }}>
          <strong>Mapa →</strong>
          <p className="nota">Dónde están los pozos y cuáles produjeron más.</p>
        </Link>
      </div>
      <p className="nota">Los datos se publican una vez por mes. La web muestra el último mes disponible.</p>
    </>
  );
}
