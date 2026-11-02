"use client";
// Muestra un gráfico de Plotly (la misma librería que usaba la app de Streamlit).
// Plotly pesa bastante, así que se carga recién en el navegador.
import { useEffect, useRef } from "react";

type Props = {
  data: object[];
  layout?: object;
  alto?: number;
  fechas?: boolean; // eje X con fechas: se muestra como "08/2026"
};

// Mismo estilo para todos los gráficos (como estilo() en utilidades.py)
function estilo(layout: object, alto: number, fechas: boolean) {
  const ejeX = { showgrid: false, ...(fechas ? { tickformat: "%m/%Y", hoverformat: "%m/%Y" } : {}) };
  const base: Record<string, unknown> = {
    height: alto,
    margin: { l: 10, r: 10, t: 40, b: 10 },
    separators: ",.",
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    hovermode: "x unified",
    font: { family: "Inter, system-ui, sans-serif", color: "#3d3d3a" },
    legend: { orientation: "h", y: 1.08, x: 0 },
    xaxis: ejeX,
    yaxis: { gridcolor: "rgba(128,128,128,0.2)", automargin: true },
  };
  const extra = layout as Record<string, Record<string, unknown>>;
  return {
    ...base,
    ...extra,
    xaxis: { ...ejeX, automargin: true, ...extra.xaxis },
    yaxis: { ...(base.yaxis as object), ...extra.yaxis },
  };
}

export default function Grafico({ data, layout = {}, alto = 420, fechas = true }: Props) {
  const div = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;
    import("plotly.js-dist-min").then((Plotly) => {
      if (cancelado || !div.current) return;
      Plotly.react(div.current, data, estilo(layout, alto, fechas), { responsive: true, displaylogo: false, locale: "es" });
    });
    return () => {
      cancelado = true;
    };
  }, [data, layout, alto, fechas]);

  return <div ref={div} style={{ width: "100%", minHeight: alto }} />;
}
