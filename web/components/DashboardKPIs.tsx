// Fila de KPIs (métricas clave) de arriba del panel.
// Recibe los números ya calculados: así sirve igual si mañana vienen de una API en Python.
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { num, pct } from "@/lib/formato";

export type Variacion = { valor: number; contra: string }; // valor en %, contra = "ago 2026"

export type KPI = {
  id: string;
  titulo: string;
  valor: number;
  decimales?: number;
  unidad: string;
  color?: "oil" | "gas" | "neutro"; // franja de color a la izquierda
  variaciones: Variacion[];
};

function Delta({ v }: { v: Variacion }) {
  const sube = v.valor >= 0;
  return (
    <span className="flex items-center gap-1.5">
      <Badge variante={sube ? "sube" : "baja"}>
        <span aria-hidden>{sube ? "▲" : "▼"}</span>
        {pct(v.valor)}
      </Badge>
      <span className="text-[11px] text-muted">vs. {v.contra}</span>
    </span>
  );
}

export function KPICard({ kpi }: { kpi: KPI }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          kpi.color === "oil" ? "bg-oil" : kpi.color === "gas" ? "bg-gas" : "bg-neutral",
        )}
      />
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{kpi.titulo}</p>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular text-fg">{num(kpi.valor, kpi.decimales ?? 0)}</span>
        <span className="text-xs text-muted">{kpi.unidad}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {kpi.variaciones.map((v) => (
          <Delta key={v.contra} v={v} />
        ))}
      </div>
    </Card>
  );
}

export function DashboardKPIs({ kpis }: { kpis: KPI[] }) {
  return (
    <section aria-label="Métricas clave" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((k) => (
        <KPICard key={k.id} kpi={k} />
      ))}
    </section>
  );
}
