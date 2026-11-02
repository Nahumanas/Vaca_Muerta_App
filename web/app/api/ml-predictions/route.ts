// POST /api/ml-predictions
// Endpoint de ejemplo para la pestaña "Predicciones ML". TODAVÍA NO HAY MODELO: devuelve un valor
// simulado con una fórmula simple (no es Machine Learning). La fórmula está calibrada a ojo con las
// medianas reales de tabla_modelo (pozos de ~500 m rinden ~120 bbl/d en su 1er año; de ~3.000 m, ~650-750).
// Cuando el modelo esté entrenado, esta ruta se puede borrar y apuntar NEXT_PUBLIC_ML_API_URL a la API de Python.
import { NextResponse } from "next/server";
import { LIMITES, type EntradaPrediccion, type RespuestaPrediccion } from "@/lib/ml";

const dentro = (v: unknown, l: { min: number; max: number }) => typeof v === "number" && v >= l.min && v <= l.max;

export async function POST(request: Request) {
  let entrada: EntradaPrediccion;
  try {
    entrada = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo tiene que ser JSON" }, { status: 400 });
  }
  if (!dentro(entrada.rama_m, LIMITES.rama_m) || !dentro(entrada.etapas, LIMITES.etapas)) {
    return NextResponse.json(
      { error: `rama_m entre ${LIMITES.rama_m.min} y ${LIMITES.rama_m.max}; etapas entre ${LIMITES.etapas.min} y ${LIMITES.etapas.max}` },
      { status: 400 },
    );
  }

  // Simulación: más rama y más etapas = más petróleo
  const prediccion = 120 + 0.13 * (entrada.rama_m - 500) + 5.5 * (entrada.etapas - 5);

  const respuesta: RespuestaPrediccion = {
    prediccion_bbl_d: Math.round(prediccion),
    intervalo: { min: Math.round(prediccion * 0.7), max: Math.round(prediccion * 1.3) },
    modelo: { nombre: "Simulación (sin modelo)", version: "0.0.0", tipo: "simulado" },
    entradas: { rama_m: entrada.rama_m, etapas: entrada.etapas },
  };
  return NextResponse.json(respuesta);
}
