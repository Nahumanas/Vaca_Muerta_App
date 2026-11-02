// Lee los JSON que genera scripts/exportar_web.py (se ejecuta al construir la web, no en el navegador).
import fs from "node:fs";
import path from "node:path";

const CARPETA = path.join(process.cwd(), "..", "datos", "procesados", "web");

function leer<T>(nombre: string): T {
  return JSON.parse(fs.readFileSync(path.join(CARPETA, `${nombre}.json`), "utf-8"));
}

// Los JSON vienen "por columnas": { fecha: [...], grupo: [...] }. Esto los pasa a una lista de filas.
function filas<T>(columnas: Record<string, unknown[]>): T[] {
  const nombres = Object.keys(columnas);
  const largo = columnas[nombres[0]].length;
  return Array.from({ length: largo }, (_, i) =>
    Object.fromEntries(nombres.map((n) => [n, columnas[n][i]])) as T,
  );
}

export type Resumen = { fecha: string; petroleo_kbbl_d: number; gas_MMm3_d: number; pozos_activos: number };
export type Empresa = { fecha: string; grupo: string; prod_pet: number; prod_gas: number; petroleo_kbbl_d: number; gas_MMm3_d: number };
export type Evolucion = { fecha: string; grupo: string; prod_pet: number; prod_gas: number; pozos: number };
export type Diseno = { anio_fractura: number; rama_m: number; etapas: number; pozos: number };
export type Pozo = {
  sigla: string; grupo: string; area: string; tipopozo: string; lat: number; lon: number;
  pet_acum_kbbl: number; gas_acum_mm3: number; primer_mes: string; ultimo_mes: string;
};
export type Info = { ultimo_mes: string; pozos: number; pozos_modelo: number; pct_petroleo_vm: number };

export const cargarResumen = () => filas<Resumen>(leer("resumen_mensual"));
export const cargarEmpresas = () => filas<Empresa>(leer("empresas_mensual"));
export const cargarEvolucion = () => filas<Evolucion>(leer("evolucion"));
export const cargarDiseno = () => filas<Diseno>(leer("diseno_anual"));
export const cargarPozos = () => filas<Pozo>(leer("pozos"));
export const cargarInfo = () => leer<Info>("info");
