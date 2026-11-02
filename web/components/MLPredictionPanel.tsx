"use client";
// Pestaña "Predicciones ML": el simulador + los pozos reales para comparar.
// Los pozos reales (tabla_modelo) son los datos con los que se va a entrenar el modelo.
import { useMemo, useState } from "react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, type TooltipContentProps } from "recharts";
import WellYieldPredictor from "@/components/WellYieldPredictor";
import { Card, CardBody, CardHeader, Fila } from "@/components/ui/Card";
import type { PozoModelo } from "@/lib/datos";
import { num } from "@/lib/formato";
import { LIMITES, type EntradaPrediccion, type RespuestaPrediccion } from "@/lib/ml";

// Mediana: el valor del medio (la mitad de los pozos rinde más y la otra mitad menos)
function cuantil(valores: number[], q: number) {
  const v = [...valores].sort((a, b) => a - b);
  const pos = (v.length - 1) * q;
  const abajo = Math.floor(pos);
  return v[abajo] + (v[Math.ceil(pos)] - v[abajo]) * (pos - abajo);
}

function DetallePozo({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as PozoModelo & { prediccion?: boolean };
  return (
    <div className="border border-border bg-bg px-3 py-2 text-xs">
      <p className="font-medium text-fg">{p.prediccion ? "Tu pozo (proyección)" : `${p.grupo} · ${p.anio}`}</p>
      <p className="text-muted">
        Rama <span className="tabular text-fg">{num(p.rama_m)} m</span> · {num(p.etapas)} etapas
      </p>
      <p className="text-muted">
        <span className="tabular text-fg">{num(p.pet_bbl_d)}</span> bbl/d en el 1er año
      </p>
    </div>
  );
}

export default function MLPredictionPanel({ pozos }: { pozos: PozoModelo[] }) {
  const [entrada, setEntrada] = useState<EntradaPrediccion>({ rama_m: 2500, etapas: 40 });
  const [resultado, setResultado] = useState<RespuestaPrediccion | null>(null);

  // Pozos reales "parecidos" al que se está simulando
  const parecidos = useMemo(
    () => pozos.filter((p) => Math.abs(p.rama_m - entrada.rama_m) <= 250 && Math.abs(p.etapas - entrada.etapas) <= 6),
    [pozos, entrada],
  );
  const ref =
    parecidos.length >= 5
      ? { n: parecidos.length, mediana: cuantil(parecidos.map((p) => p.pet_bbl_d), 0.5), p25: cuantil(parecidos.map((p) => p.pet_bbl_d), 0.25), p75: cuantil(parecidos.map((p) => p.pet_bbl_d), 0.75) }
      : null;

  const visibles = useMemo(() => pozos.filter((p) => p.pet_bbl_d <= 1500), [pozos]); // sin los 3-4 extremos que aplastan el gráfico
  const punto = resultado ? [{ rama_m: entrada.rama_m, etapas: entrada.etapas, pet_bbl_d: resultado.prediccion_bbl_d, prediccion: true }] : [];

  return (
    <>
      <WellYieldPredictor
        onCambio={(e, r) => {
          setEntrada(e);
          setResultado(r);
        }}
      />

      <Fila className="xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            titulo="Pozos reales: largo de rama vs. petróleo del 1er año"
            descripcion={`${num(pozos.length)} pozos petrolíferos con datos de fractura. Son los datos con los que se va a entrenar el modelo.`}
          />
          <CardBody>
            <div style={{ height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="var(--grid)" strokeDasharray="2 4" />
                  <XAxis
                    type="number"
                    dataKey="rama_m"
                    name="Rama"
                    domain={[0, 5000]}
                    tickFormatter={(v: number) => `${num(v)} m`}
                    tick={{ fill: "var(--dim)", fontSize: 10.5, fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="pet_bbl_d"
                    name="Petróleo"
                    tick={{ fill: "var(--dim)", fontSize: 10.5, fontFamily: "var(--font-mono)" }}
                    tickFormatter={(v: number) => num(v)}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <ZAxis range={[10, 10]} />
                  <Tooltip content={(p) => <DetallePozo {...(p as TooltipContentProps<number, string>)} />} cursor={false} />
                  <Scatter data={visibles} fill="var(--muted)" fillOpacity={0.35} isAnimationActive={false} />
                  <Scatter
                    data={punto}
                    isAnimationActive={false}
                    legendType="none"
                    // Punto grande, para que "tu pozo" se distinga entre los reales
                    shape={(props: { cx?: number; cy?: number }) => (
                      <circle cx={props.cx} cy={props.cy} r={7} fill="var(--oil)" stroke="var(--bg)" strokeWidth={2} />
                    )}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 flex items-center gap-5 text-xs text-dim">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted/50" /> Pozo real
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-oil" /> Tu pozo (proyección)
              </span>
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader titulo="¿Qué pasó con pozos parecidos?" descripcion={`Rama ${num(entrada.rama_m - 250)} a ${num(entrada.rama_m + 250)} m · ${num(entrada.etapas - 6)} a ${num(entrada.etapas + 6)} etapas`} />
          <CardBody>
            {ref ? (
              <>
                <p className="rotulo">Mediana real</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="tabular text-[2.6rem] leading-none font-medium text-fg">{num(ref.mediana)}</span>
                  <span className="text-xs text-muted">bbl/d</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  La mitad de los pozos quedó entre <span className="tabular text-fg">{num(ref.p25)}</span> y{" "}
                  <span className="tabular text-fg">{num(ref.p75)}</span> bbl/d ({num(ref.n)} pozos).
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Hay menos de 5 pozos reales con ese diseño: no alcanza para comparar.</p>
            )}
            <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs leading-relaxed text-muted">
              <p>
                <strong className="text-fg">Estado del modelo:</strong> en preparación. Hoy el número de arriba sale de
                una fórmula simple, no de un modelo entrenado.
              </p>
              <p>
                <strong className="text-fg">Próximo paso:</strong> entrenar un modelo con estos {num(pozos.length)} pozos
                (rama, etapas, arena, agua, año) para predecir el petróleo del primer año, y servirlo con una API en
                Python.
              </p>
              <p>
                Rango de los controles: rama {num(LIMITES.rama_m.min)} a {num(LIMITES.rama_m.max)} m, etapas{" "}
                {LIMITES.etapas.min} a {LIMITES.etapas.max}.
              </p>
            </div>
          </CardBody>
        </Card>
      </Fila>
    </>
  );
}
