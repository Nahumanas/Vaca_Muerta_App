// Bloques del panel, SIN cajas: no hay fondo ni bordes redondeados.
// - <Fila> es una franja a todo el ancho con una línea fina abajo; sus columnas se separan con líneas verticales.
// - <Card> es una sección dentro de una fila (solo aire alrededor).
import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function Fila({ className, ...props }: Props) {
  return (
    <div
      className={cn(
        "grid border-b border-border divide-y divide-border lg:divide-y-0 lg:divide-x",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: Props) {
  return <section className={cn("min-w-0 py-6 sm:py-7 lg:px-8 lg:first:pl-0 lg:last:pr-0", className)} {...props} />;
}

export function CardHeader({
  titulo,
  descripcion,
  accion,
  className,
}: {
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  accion?: React.ReactNode; // algo a la derecha del título (filtros, un enlace...)
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="font-serif text-xl font-medium tracking-tight text-fg">{titulo}</h2>
        {descripcion && <p className="mt-1 text-sm text-muted">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}

export function CardBody({ className, ...props }: Props) {
  return <div className={cn(className)} {...props} />;
}
