// Colores y formato de números en español (lo mismo que utilidades.py en la app de Streamlit).

export const AZUL = "#2a78d6"; // petróleo
export const VERDE = "#1baf7a"; // gas
export const NARANJA = "#eb6834"; // para destacar
export const GRIS = "#9a9994"; // el resto
export const M3_A_BARRILES = 6.2898;

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "2026-09" -> "sep 2026"
export function mesTexto(fecha: string): string {
  const [anio, mes] = fecha.split("-").map(Number);
  return `${MESES[mes - 1]} ${anio}`;
}

// 12345.6 -> "12.345,6"
export function num(x: number, dec = 0): string {
  return x.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// 27.23 -> "+27,2%"
export function pct(x: number, dec = 1): string {
  return `${x >= 0 ? "+" : ""}${num(x, dec)}%`;
}

export function diasDelMes(fecha: string): number {
  const [anio, mes] = fecha.split("-").map(Number);
  return new Date(anio, mes, 0).getDate();
}

// m³ en el mes -> miles de barriles por día
export const kbblD = (m3: number, fecha: string) => (m3 * M3_A_BARRILES) / diasDelMes(fecha) / 1000;

// miles de m³ en el mes -> millones de m³ por día
export const mmm3D = (milesM3: number, fecha: string) => milesM3 / diasDelMes(fecha) / 1000;

// "2026-09" -> "2025-10" (restar meses)
export function restarMeses(fecha: string, meses: number): string {
  const [anio, mes] = fecha.split("-").map(Number);
  const total = anio * 12 + (mes - 1) - meses;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export const anioDe = (fecha: string) => Number(fecha.slice(0, 4));

// Fecha "2026-09" como fecha completa, para el eje de los gráficos
export const aDia = (fecha: string) => `${fecha}-01`;

export function sumarPor<T>(filas: T[], clave: (f: T) => string, valor: (f: T) => number): Map<string, number> {
  const m = new Map<string, number>();
  for (const f of filas) m.set(clave(f), (m.get(clave(f)) ?? 0) + valor(f));
  return m;
}
