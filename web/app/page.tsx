// Vista principal (Resumen): KPIs, evolución del petróleo, market share y hallazgos.
// Todos los números se calculan con los datos reales: cuando llega un mes nuevo, se actualizan solos.
import Link from "next/link";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import MarketShareChart from "@/components/MarketShareChart";
import ProductionChart from "@/components/ProductionChart";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { cargarDiseno, cargarEmpresas, cargarInfo, cargarResumen } from "@/lib/datos";
import { anioDe, mesTexto, num, restarMeses } from "@/lib/formato";
import { calcularKPIs, calcularParticipacion, topConResto } from "@/lib/indicadores";

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
  const ult12 = cargarEmpresas().filter((e) => e.fecha >= desde);
  const participacion = calcularParticipacion(ult12, "pet");
  const [lider, segunda] = participacion;

  const diseno = cargarDiseno();
  const dIni = diseno.find((d) => d.anio_fractura === ANIO_INICIO)!;
  const dFin = diseno.find((d) => d.anio_fractura === anioCerrado)!;
  const cien = (x: number) => Math.round(x / 100) * 100;

  return (
    <>
      <PageHeader
        titulo="Panel general"
        bajada="Producción de petróleo y gas de la formación Vaca Muerta, pozo por pozo, con los datos oficiales de la Secretaría de Energía."
        derecha={<Badge>Último dato · {mesTexto(ultimo.fecha)}</Badge>}
      />

      <DashboardKPIs kpis={kpis} />

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            titulo="Evolución · Petróleo"
            descripcion={`Miles de barriles por día. De ${num(base.pet)} mil (promedio ${ANIO_BASE}) a ${num(ultimo.petroleo_kbbl_d)} mil en ${mesTexto(ultimo.fecha)}.`}
            accion={
              <Link href="/evolucion" className="text-xs text-muted hover:text-fg">
                Ver detalle →
              </Link>
            }
          />
          <CardBody>
            <ProductionChart
              datos={serie}
              serie={{ clave: "petroleo", nombre: "Petróleo", unidad: "mil bbl/d", color: "oil", decimales: 1 }}
              extras={[
                { clave: "gas", nombre: "Gas", unidad: "MMm³/d", decimales: 1 },
                { clave: "pozos", nombre: "Pozos en producción", unidad: "" },
                { clave: "bblPozo", nombre: "Por pozo", unidad: "bbl/d" },
              ]}
              referencia={{ valor: base.pet, etiqueta: `Promedio ${ANIO_BASE}` }}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            titulo="Empresas · Market share del petróleo"
            descripcion={`${mesTexto(desde)} a ${mesTexto(ultimo.fecha)}`}
            accion={
              <Link href="/empresas" className="text-xs text-muted hover:text-fg">
                Ver detalle →
              </Link>
            }
          />
          <CardBody>
            <MarketShareChart datos={topConResto(participacion, 8)} destacadas={[lider.grupo, segunda.grupo]} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader titulo="Evolución · Gas" descripcion="Millones de m³ por día. Sube en invierno y baja en verano: acompaña la demanda de calefacción." />
          <CardBody>
            <ProductionChart
              datos={serie}
              alto={300}
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
            <ul className="space-y-3 text-sm leading-relaxed text-muted">
              <li>
                <strong className="text-fg">Vaca Muerta es el {num(info.pct_petroleo_vm, 1)}%</strong> del petróleo no
                convencional del país ({num(info.pozos)} pozos en la base).
              </li>
              <li>
                El petróleo se multiplicó por{" "}
                <strong className="text-fg">{num(ultimo.petroleo_kbbl_d / base.pet, 1)}</strong> desde {ANIO_BASE}: es
                el que explica el giro exportador del Balance Energético.
              </li>
              <li>
                Cada pozo rinde más: de <strong className="text-fg">{num(base.bblPorPozo)}</strong> a{" "}
                <strong className="text-fg">{num(cerrado.bblPorPozo)} barriles por día</strong> ({ANIO_BASE} contra{" "}
                {anioCerrado}).
              </li>
              <li>
                <strong className="text-fg">{lider.grupo}</strong> produce el {num(lider.pct, 1)}% del petróleo, seguida
                por {segunda.grupo} ({num(segunda.pct, 1)}%).
              </li>
              <li>
                La rama horizontal pasó de <strong className="text-fg">{num(cien(dIni.rama_m))} m</strong> ({ANIO_INICIO})
                a <strong className="text-fg">{num(cien(dFin.rama_m))} m</strong> ({anioCerrado}), y las etapas de
                fractura de {num(dIni.etapas)} a {num(dFin.etapas)}.
              </li>
            </ul>
            <Link
              href="/predicciones"
              className="mt-4 flex items-center justify-between rounded-lg border border-border bg-panel-2 px-3 py-2.5 text-xs text-muted hover:text-fg"
            >
              <span>¿Cuánto rinde un pozo según su diseño? Probá el simulador</span>
              <span aria-hidden>→</span>
            </Link>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
