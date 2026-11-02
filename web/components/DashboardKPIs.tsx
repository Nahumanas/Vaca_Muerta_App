// Fila de KPIs (métricas clave) de arriba del panel. Sin cajas: tres columnas separadas por líneas finas.
// Recibe los números ya calculados: así sirve igual si mañana vienen de una API en Python.
import { Badge } from "@/components/ui/Badge";
import { Card, Fila } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { num, pct } from "@/lib/formato";

export type Variacion = { valor: number; contra: string }; // valor en %, contra = "ago 2026"

export type KPI = {
  id: string;
  titulo: string;
  valor: number;
  decimales?: number;
  unidad: string;
  color?: "oil" | "gas" | "neutro"; // el acento (naranja) solo para lo principal
  variaciones: Variacion[];
};

function Delta({ v }: { v: Variacion }) {
  const sube = v.valor >= 0;
  return (
    <span className="flex items-baseline gap-2">
      <Badge variante={sube ? "sube" : "baja"}>
        <span aria-hidden>{sube ? "▲" : "▼"}</span>
        {pct(v.valor)}
      </Badge>
      <span className="tabular text-[11px] text-dim">vs. {v.contra}</span>
    </span>
  );
}

// Una métrica suelta (se puede poner dentro de cualquier sección)
export function KPICard({ kpi, className }: { kpi: KPI; className?: string }) {
  return (
    <div className={className}>
      <p className="rotulo">{kpi.titulo}</p>
      <p className="mt-3 flex items-baseline gap-2">
        <span className={cn("tabular text-[2.6rem] leading-none font-medium tracking-tight", kpi.color === "oil" ? "text-oil" : "text-fg")}>
          {num(kpi.valor, kpi.decimales ?? 0)}
        </span>
        <span className="text-xs text-dim">{kpi.unidad}</span>
      </p>
      {kpi.variaciones.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
          {kpi.variaciones.map((v) => (
            <Delta key={v.contra} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardKPIs({ kpis }: { kpis: KPI[] }) {
  return (
    <Fila aria-label="Métricas clave" className="sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
      {kpis.map((k) => (
        <Card key={k.id} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
          <KPICard kpi={k} />
        </Card>
      ))}
    </Fila>
  );
}
