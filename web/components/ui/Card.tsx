// Tarjeta base (al estilo shadcn/ui): todas las secciones del panel van dentro de una.
import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: Props) {
  return <div className={cn("rounded-xl border border-border bg-panel", className)} {...props} />;
}

export function CardHeader({
  titulo,
  descripcion,
  accion,
  className,
}: {
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  accion?: React.ReactNode; // algo a la derecha del título (filtros, un badge...)
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-4", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight text-fg">{titulo}</h2>
        {descripcion && <p className="mt-0.5 text-xs text-muted">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}

export function CardBody({ className, ...props }: Props) {
  return <div className={cn("px-5 pt-3 pb-4", className)} {...props} />;
}
