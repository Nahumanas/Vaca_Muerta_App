"use client";
// Simulador de rendimiento de un pozo: el usuario mueve los sliders y la web le pregunta a la API.
// Espera 250 ms después del último movimiento para no mandar una consulta por cada píxel.
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { num } from "@/lib/formato";
import { LIMITES, pedirPrediccion, type EntradaPrediccion, type RespuestaPrediccion } from "@/lib/ml";

type Props = {
  onCambio?: (entrada: EntradaPrediccion, resultado: RespuestaPrediccion | null) => void;
};

export default function WellYieldPredictor({ onCambio }: Props) {
  const [entrada, setEntrada] = useState<EntradaPrediccion>({ rama_m: 2500, etapas: 40 });
  const [resultado, setResultado] = useState<RespuestaPrediccion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const control = new AbortController(); // si el usuario sigue moviendo, cancelamos la consulta vieja
    const espera = setTimeout(async () => {
      setCargando(true);
      setError(null);
      try {
        const r = await pedirPrediccion(entrada, control.signal);
        setResultado(r);
        onCambio?.(entrada, r);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("No se pudo calcular la predicción. Probá de nuevo.");
      } finally {
        if (!control.signal.aborted) setCargando(false);
      }
    }, 250);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrada]);

  const r = resultado;
  // Posición del valor dentro del intervalo, para la barrita
  const escalaMax = 1000;
  const aPct = (v: number) => `${Math.min(100, (v / escalaMax) * 100)}%`;

  return (
    <Card>
      <CardHeader
        titulo="Rendimiento proyectado del pozo"
        descripcion="Petróleo promedio por día durante el primer año de producción"
        accion={
          r && (
            <Badge variante={r.modelo.tipo === "simulado" ? "aviso" : "sube"}>
              {r.modelo.tipo === "simulado" ? "Resultado simulado" : `Modelo ${r.modelo.version}`}
            </Badge>
          )
        }
      />
      <CardBody className="grid gap-6 md:grid-cols-2">
        {/* Controles */}
        <div className="space-y-6">
          <Slider
            etiqueta="Largo de rama horizontal"
            valor={entrada.rama_m}
            {...LIMITES.rama_m}
            paso={LIMITES.rama_m.paso}
            unidad="m"
            formato={(v) => num(v)}
            onChange={(rama_m) => setEntrada((e) => ({ ...e, rama_m }))}
          />
          <Slider
            etiqueta="Etapas de fractura"
            valor={entrada.etapas}
            {...LIMITES.etapas}
            paso={LIMITES.etapas.paso}
            formato={(v) => num(v)}
            onChange={(etapas) => setEntrada((e) => ({ ...e, etapas }))}
          />
        </div>

        {/* Resultado */}
        <div className="rounded-lg border border-border bg-panel-2 p-4" aria-live="polite">
          {error ? (
            <p className="text-sm text-down">{error}</p>
          ) : !r ? (
            <p className="text-sm text-muted">Calculando…</p>
          ) : (
            <div className={cargando ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Proyección</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight tabular text-oil">{num(r.prediccion_bbl_d)}</span>
                <span className="text-sm text-muted">barriles por día</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                Rango probable: <span className="tabular text-fg">{num(r.intervalo.min)} a {num(r.intervalo.max)}</span> bbl/d
              </p>
              {/* Barrita con el rango y el valor */}
              <div className="relative mt-4 h-2 rounded-full bg-panel">
                <div
                  className="absolute inset-y-0 rounded-full bg-oil/35"
                  style={{ left: aPct(r.intervalo.min), width: `calc(${aPct(r.intervalo.max)} - ${aPct(r.intervalo.min)})` }}
                />
                <div className="absolute -top-1 h-4 w-1 rounded bg-oil" style={{ left: aPct(r.prediccion_bbl_d) }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-muted tabular">
                <span>0</span>
                <span>{num(escalaMax)} bbl/d</span>
              </div>
              <p className="mt-4 text-[11px] text-muted">
                {r.modelo.nombre} · v{r.modelo.version}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
