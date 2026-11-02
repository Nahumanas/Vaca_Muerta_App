// Etiqueta chica, en monoespaciada y sin caja. "sube"/"baja" llevan flecha (nunca solo color).
import { cn } from "@/lib/cn";

type Variante = "neutro" | "sube" | "baja" | "oil" | "gas" | "aviso";

const estilos: Record<Variante, string> = {
  neutro: "text-dim",
  sube: "text-up",
  baja: "text-down",
  oil: "text-oil",
  gas: "text-gas",
  aviso: "text-oil",
};

export function Badge({
  variante = "neutro",
  className,
  children,
}: {
  variante?: Variante;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 tabular text-[11px] uppercase tracking-wider whitespace-nowrap", estilos[variante], className)}>
      {children}
    </span>
  );
}
