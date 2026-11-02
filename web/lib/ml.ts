// Contrato entre la web y el modelo de Machine Learning.
//
// Hoy la web le pregunta a /api/ml-predictions (una ruta de Next.js que devuelve un resultado SIMULADO).
// Cuando el modelo esté entrenado en Python (por ejemplo con FastAPI), alcanza con:
//   1. que la API de Python reciba y devuelva estos mismos campos, y
//   2. configurar NEXT_PUBLIC_ML_API_URL en Vercel con la dirección de esa API.
// Los componentes no cambian.

// Rangos de los controles (los mismos que valida la API)
export const LIMITES = {
  rama_m: { min: 500, max: 3000, paso: 50 },
  etapas: { min: 5, max: 50, paso: 1 },
} as const;

// Lo que mandamos: las variables independientes del pozo
export type EntradaPrediccion = {
  rama_m: number; // largo de la rama horizontal, en metros
  etapas: number; // cantidad de etapas de fractura
};

// Lo que recibimos
export type RespuestaPrediccion = {
  prediccion_bbl_d: number; // petróleo promedio por día en el 1er año
  intervalo: { min: number; max: number }; // rango probable
  modelo: {
    nombre: string;
    version: string;
    tipo: "simulado" | "entrenado"; // "simulado" hasta que exista el modelo real
  };
  entradas: EntradaPrediccion;
};

const URL_API = process.env.NEXT_PUBLIC_ML_API_URL || "/api/ml-predictions";

export async function pedirPrediccion(entrada: EntradaPrediccion, signal?: AbortSignal): Promise<RespuestaPrediccion> {
  const r = await fetch(URL_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entrada),
    signal,
  });
  if (!r.ok) throw new Error(`La API respondió ${r.status}`);
  return r.json();
}
