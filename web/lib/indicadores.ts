// Cálculos que usa el panel (se hacen al construir la web, con los datos reales).
// Si más adelante el backend en Python devuelve estos mismos objetos, las páginas no cambian.
import type { KPI } from "@/components/DashboardKPIs";
import type { Diseno, Empresa, Resumen } from "@/lib/datos";
import { mesTexto, restarMeses, sumarPor } from "@/lib/formato";

// KPIs del último mes: valor + variación contra el mes anterior y contra un año antes
export function calcularKPIs(resumen: Resumen[]): KPI[] {
  const ultimo = resumen[resumen.length - 1];
  const anterior = resumen[resumen.length - 2];
  const haceUnAnio = resumen.find((r) => r.fecha === restarMeses(ultimo.fecha, 12));
  const vs = (col: keyof Omit<Resumen, "fecha">, base?: Resumen) =>
    base ? [{ valor: (ultimo[col] / base[col] - 1) * 100, contra: mesTexto(base.fecha) }] : [];

  return [
    {
      id: "petroleo",
      titulo: "Petróleo",
      valor: ultimo.petroleo_kbbl_d,
      unidad: "miles de barriles por día",
      color: "oil",
      variaciones: [...vs("petroleo_kbbl_d", anterior), ...vs("petroleo_kbbl_d", haceUnAnio)],
    },
    {
      id: "gas",
      titulo: "Gas",
      valor: ultimo.gas_MMm3_d,
      decimales: 1,
      unidad: "millones de m³ por día",
      color: "gas",
      variaciones: [...vs("gas_MMm3_d", anterior), ...vs("gas_MMm3_d", haceUnAnio)],
    },
    {
      id: "pozos",
      titulo: "Pozos en producción",
      valor: ultimo.pozos_activos,
      unidad: "pozos",
      color: "neutro",
      variaciones: [...vs("pozos_activos", anterior), ...vs("pozos_activos", haceUnAnio)],
    },
  ];
}

export type ParticipacionEmpresa = { grupo: string; pct: number; valor: number };

// Market share de cada grupo empresario en un conjunto de meses
export function calcularParticipacion(filas: Empresa[], producto: "pet" | "gas"): ParticipacionEmpresa[] {
  const ranking = [...sumarPor(filas, (f) => f.grupo, (f) => (producto === "pet" ? f.prod_pet : f.prod_gas))].sort(
    (a, b) => b[1] - a[1],
  );
  const total = ranking.reduce((s, [, v]) => s + v, 0);
  return ranking.map(([grupo, valor]) => ({ grupo, valor, pct: (valor / total) * 100 }));
}

// Deja las primeras N y suma el resto en "Resto"
export function topConResto(part: ParticipacionEmpresa[], n: number): ParticipacionEmpresa[] {
  if (part.length <= n) return part;
  const resto = part.slice(n);
  return [
    ...part.slice(0, n),
    { grupo: "Resto", pct: resto.reduce((s, p) => s + p.pct, 0), valor: resto.reduce((s, p) => s + p.valor, 0) },
  ];
}

// Hitos tecnológicos para marcar en el gráfico principal: el primer año en que el pozo típico
// (mediana de los pozos fracturados ese año) superó cada umbral. Si dos caen el mismo año, se juntan.
export function calcularHitos(diseno: Diseno[]): { fecha: string; etiqueta: string }[] {
  const ordenado = [...diseno].sort((a, b) => a.anio_fractura - b.anio_fractura);
  const umbrales = [
    { etiqueta: "Ramas de 2.000 m", cumple: (d: Diseno) => d.rama_m >= 2000 },
    { etiqueta: "Ramas de 3.000 m", cumple: (d: Diseno) => d.rama_m >= 3000 },
    { etiqueta: "50 etapas de fractura", cumple: (d: Diseno) => d.etapas >= 50 },
  ];
  const porAnio = new Map<number, string[]>();
  for (const u of umbrales) {
    const d = ordenado.find(u.cumple);
    if (d) porAnio.set(d.anio_fractura, [...(porAnio.get(d.anio_fractura) ?? []), u.etiqueta]);
  }
  return [...porAnio].map(([anio, etiquetas]) => ({ fecha: `${anio}-01`, etiqueta: etiquetas.join(" · ") }));
}

// Petróleo (mil bbl/d) de cada empresa, mes a mes, alineado con la lista de fechas.
// Las empresas que no están en "nombres" se suman en "Resto".
export function seriesPorEmpresa(filas: Empresa[], fechas: string[], nombres: string[]): Record<string, number[]> {
  const indice = new Map(fechas.map((f, i) => [f, i]));
  const salida: Record<string, number[]> = Object.fromEntries(nombres.map((n) => [n, fechas.map(() => 0)]));
  if (!salida.Resto) salida.Resto = fechas.map(() => 0);
  for (const f of filas) {
    const i = indice.get(f.fecha);
    if (i === undefined) continue;
    const g = salida[f.grupo] && f.grupo !== "Resto" ? f.grupo : "Resto";
    salida[g][i] += f.petroleo_kbbl_d;
  }
  for (const k of Object.keys(salida)) salida[k] = salida[k].map((v) => Math.round(v * 100) / 100);
  return salida;
}
