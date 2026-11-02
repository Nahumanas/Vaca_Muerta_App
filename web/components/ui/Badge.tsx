// Etiqueta chica. "sube"/"baja" se usan para las variaciones (verde/rojo + flecha, nunca solo color).
import { cn } from "@/lib/cn";

type Variante = "neutro" | "sube" | "baja" | "oil" | "gas" | "aviso";

const estilos: Record<Variante, string> = {
  neutro: "bg-panel-2 text-muted border-border",
  sube: "bg-up/10 text-up border-up/25",
  baja: "bg-down/10 text-down border-down/25",
  oil: "bg-oil-soft text-oil border-oil/30",
  gas: "bg-gas-soft text-gas border-gas/30",
  aviso: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
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
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium tabular whitespace-nowrap",
        estilos[variante],
        className,
      )}
    >
      {children}
    </span>
  );
}
