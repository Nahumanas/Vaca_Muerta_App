"use client";
// Simulador de rendimiento de un pozo: el usuario mueve los sliders y la web le pregunta a la API.
// Espera 250 ms después del último movimiento para no mandar una consulta por cada píxel.
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, Fila } from "@/components/ui/Card";
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
    <Fila className="lg:grid-cols-2">
      {/* Controles */}
      <Card>
        <CardHeader
          titulo="Rendimiento proyectado del pozo"
          descripcion="Petróleo promedio por día durante el primer año de producción"
        />
        <div className="space-y-9 pt-2">
          <Slider
            etiqueta="Largo de rama horizontal"
            valor={entrada.rama_m}
            {...LIMITES.rama_m}
            unidad="m"
            formato={(v) => num(v)}
            onChange={(rama_m) => setEntrada((e) => ({ ...e, rama_m }))}
          />
          <Slider
            etiqueta="Etapas de fractura"
            valor={entrada.etapas}
            {...LIMITES.etapas}
            formato={(v) => num(v)}
            onChange={(etapas) => setEntrada((e) => ({ ...e, etapas }))}
          />
        </div>
      </Card>

      {/* Resultado */}
      <Card aria-live="polite">
        {error ? (
          <p className="text-sm text-down">{error}</p>
        ) : !r ? (
          <p className="tabular text-sm text-dim">Calculando…</p>
        ) : (
          <div className={cargando ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <div className="flex items-center justify-between">
              <p className="rotulo">Proyección</p>
              <Badge variante={r.modelo.tipo === "simulado" ? "aviso" : "sube"}>
                {r.modelo.tipo === "simulado" ? "● Resultado simulado" : `● Modelo ${r.modelo.version}`}
              </Badge>
            </div>
            <p className="mt-4 flex items-baseline gap-3">
              <span className="tabular text-7xl leading-none font-medium tracking-tighter text-oil">{num(r.prediccion_bbl_d)}</span>
              <span className="text-sm text-dim">barriles por día</span>
            </p>
            <p className="mt-4 text-xs text-muted">
              Rango probable <span className="tabular text-fg">{num(r.intervalo.min)} – {num(r.intervalo.max)}</span> bbl/d
            </p>
            {/* Regla con el rango y el valor */}
            <div className="relative mt-6 h-px bg-border">
              <div
                className="absolute -top-px h-[3px] bg-oil/40"
                style={{ left: aPct(r.intervalo.min), width: `calc(${aPct(r.intervalo.max)} - ${aPct(r.intervalo.min)})` }}
              />
              <div className="absolute -top-2 h-4 w-px bg-oil" style={{ left: aPct(r.prediccion_bbl_d) }} />
            </div>
            <div className="mt-2 flex justify-between tabular text-[10.5px] text-dim">
              <span>0</span>
              <span>{num(escalaMax / 2)}</span>
              <span>{num(escalaMax)} bbl/d</span>
            </div>
            <p className="mt-6 tabular text-[10.5px] text-dim">
              {r.modelo.nombre} · v{r.modelo.version}
            </p>
          </div>
        )}
      </Card>
    </Fila>
  );
}
