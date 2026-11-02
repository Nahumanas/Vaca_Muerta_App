// Cálculos que usa el panel (se hacen al construir la web, con los datos reales).
// Si más adelante el backend en Python devuelve estos mismos objetos, las páginas no cambian.
import type { KPI } from "@/components/DashboardKPIs";
import type { Empresa, Resumen } from "@/lib/datos";
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
      variaciones: vs("pozos_activos", anterior),
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
