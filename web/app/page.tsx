// Vista principal (Resumen): KPIs, evolución del petróleo, market share y hallazgos.
// Todos los números se calculan con los datos reales: cuando llega un mes nuevo, se actualizan solos.
import Link from "next/link";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import MainChart from "@/components/MainChart";
import MarketShareRanking from "@/components/MarketShareRanking";
import ProductionChart from "@/components/ProductionChart";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, Fila } from "@/components/ui/Card";
import { MOSTRAR_ML } from "@/lib/config";
import { PageHeader } from "@/components/ui/PageHeader";
import { cargarDiseno, cargarEmpresas, cargarInfo, cargarResumen } from "@/lib/datos";
import { anioDe, mesTexto, num, restarMeses } from "@/lib/formato";
import { calcularHitos, calcularKPIs, calcularParticipacion, seriesPorEmpresa, topConResto } from "@/lib/indicadores";

const ANIO_BASE = 2019; // primer año de la Parte 2 del proyecto (Balance Energético)
const ANIO_INICIO = 2013; // desde acá la producción de Vaca Muerta empieza a ser relevante

export default function Inicio() {
  const resumen = cargarResumen();
  const info = cargarInfo();
  const ultimo = resumen[resumen.length - 1];
  const kpis = calcularKPIs(resumen);

  // Serie para el gráfico: además del petróleo, el tooltip muestra gas, pozos y barriles por pozo
  const serie = resumen.map((r) => ({
    fecha: r.fecha,
    petroleo: r.petroleo_kbbl_d,
    gas: r.gas_MMm3_d,
    pozos: r.pozos_activos,
    bblPozo: (r.petroleo_kbbl_d * 1000) / r.pozos_activos,
  }));

  // Promedios por año
  const promedioAnual = (anio: number) => {
    const meses = resumen.filter((r) => anioDe(r.fecha) === anio);
    const pet = meses.reduce((s, r) => s + r.petroleo_kbbl_d, 0) / meses.length;
    const pozos = meses.reduce((s, r) => s + r.pozos_activos, 0) / meses.length;
    return { pet, pozos, bblPorPozo: (pet * 1000) / pozos };
  };
  const mesUlt = Number(ultimo.fecha.slice(5, 7));
  const anioCerrado = mesUlt === 12 ? anioDe(ultimo.fecha) : anioDe(ultimo.fecha) - 1; // último año completo
  const base = promedioAnual(ANIO_BASE);
  const cerrado = promedioAnual(anioCerrado);

  // Market share de los últimos 12 meses
  const desde = restarMeses(ultimo.fecha, 11);
  const empresas = cargarEmpresas();
  const ult12 = empresas.filter((e) => e.fecha >= desde);
  const participacion = calcularParticipacion(ult12, "pet");
  const ranking = topConResto(participacion, 8);
  // Curva de cada empresa del ranking (para cuando se elige una)
  const porEmpresa = seriesPorEmpresa(empresas, serie.map((s) => s.fecha), ranking.map((r) => r.grupo));
  const [lider, segunda] = participacion;

  const diseno = cargarDiseno();
  const hitos = calcularHitos(diseno);
  const dIni = diseno.find((d) => d.anio_fractura === ANIO_INICIO)!;
  const dFin = diseno.find((d) => d.anio_fractura === anioCerrado)!;
  const cien = (x: number) => Math.round(x / 100) * 100;

  const enlace = (href: string) => (
    <Link href={href} className="tabular text-[11px] uppercase tracking-wider text-dim hover:text-oil">
      Ver detalle →
    </Link>
  );

  return (
    <>
      <PageHeader
        titulo="Vaca Muerta, mes a mes"
        bajada="Producción de petróleo y gas de la formación Vaca Muerta, pozo por pozo, con los datos oficiales de la Secretaría de Energía."
        derecha={<Badge>Último dato · {mesTexto(ultimo.fecha)}</Badge>}
      />

      <DashboardKPIs kpis={kpis} />

      <Fila className="xl:grid-cols-3">
        <Card id="grafico-principal" className="scroll-mt-16 xl:col-span-2">
          <MainChart
            total={serie}
            porEmpresa={porEmpresa}
            hitos={hitos}
            promedioBase={{ valor: base.pet, anio: ANIO_BASE }}
            accion={enlace("/evolucion")}
          />
        </Card>

        <Card>
          <CardHeader
            titulo="Market share"
            descripcion={`Petróleo, ${mesTexto(desde)} a ${mesTexto(ultimo.fecha)}. Pasá el mouse o tocá una empresa.`}
            accion={enlace("/empresas")}
          />
          <CardBody>
            <MarketShareRanking datos={ranking} irA="grafico-principal" />
          </CardBody>
        </Card>
      </Fila>

      <Fila className="xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            titulo="Evolución del gas"
            descripcion="Millones de m³ por día. Sube en invierno y baja en verano: acompaña la demanda de calefacción."
          />
          <CardBody>
            <ProductionChart
              datos={serie}
              alto={280}
              serie={{ clave: "gas", nombre: "Gas", unidad: "MMm³/d", color: "gas", decimales: 1 }}
              extras={[
                { clave: "petroleo", nombre: "Petróleo", unidad: "mil bbl/d", decimales: 1 },
                { clave: "pozos", nombre: "Pozos en producción", unidad: "" },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader titulo="Lo que muestran los datos" />
          <CardBody>
            <ol className="divide-y divide-border text-sm leading-relaxed">
              {[
                <>
                  <strong className="font-medium text-fg">Vaca Muerta es el {num(info.pct_petroleo_vm, 1)}%</strong> del
                  petróleo no convencional del país (<span className="tabular">{num(info.pozos)}</span> pozos en la base).
                </>,
                <>
                  El petróleo se multiplicó por{" "}
                  <strong className="tabular font-medium text-oil">{num(ultimo.petroleo_kbbl_d / base.pet, 1)}</strong>{" "}
                  desde {ANIO_BASE}: es el que explica el giro exportador del Balance Energético.
                </>,
                <>
                  Cada pozo rinde más: de <strong className="tabular font-medium text-fg">{num(base.bblPorPozo)}</strong> a{" "}
                  <strong className="tabular font-medium text-fg">{num(cerrado.bblPorPozo)}</strong> barriles por día (
                  {ANIO_BASE} contra {anioCerrado}).
                </>,
                <>
                  <strong className="font-medium text-fg">{lider.grupo}</strong> produce el{" "}
                  <span className="tabular">{num(lider.pct, 1)}%</span> del petróleo, seguida por {segunda.grupo} (
                  <span className="tabular">{num(segunda.pct, 1)}%</span>).
                </>,
                <>
                  La rama horizontal pasó de <strong className="tabular font-medium text-fg">{num(cien(dIni.rama_m))} m</strong>{" "}
                  ({ANIO_INICIO}) a <strong className="tabular font-medium text-fg">{num(cien(dFin.rama_m))} m</strong> (
                  {anioCerrado}), y las etapas de fractura de <span className="tabular">{num(dIni.etapas)}</span> a{" "}
                  <span className="tabular">{num(dFin.etapas)}</span>.
                </>,
              ].map((texto, i) => (
                <li key={i} className="flex gap-4 py-3 first:pt-0">
                  <span className="tabular text-[11px] text-dim">{String(i + 1).padStart(2, "0")}</span>
                  <span>{texto}</span>
                </li>
              ))}
            </ol>
            {MOSTRAR_ML && (
              <Link
                href="/predicciones"
                className="mt-4 flex items-center justify-between border-t border-border pt-4 tabular text-[11px] uppercase tracking-wider text-dim hover:text-oil"
              >
                <span>Simulador de rendimiento de pozos</span>
                <span aria-hidden>→</span>
              </Link>
            )}
          </CardBody>
        </Card>
      </Fila>
    </>
  );
}
