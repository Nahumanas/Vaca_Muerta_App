"use client";
// Grilla de gráficos chicos ("small multiples"), uno por empresa, todos con la MISMA escala.
// Tooltip sincronizado: Recharts comparte el cursor entre todos los gráficos que tienen el mismo
// "syncId". Si pasás el mouse por una fecha en el de Shell, aparece la línea vertical y el valor
// de esa misma fecha en YPF, Vista, etc.
// Las líneas van en gris; la empresa bajo el mouse (o elegida en el ranking) se ilumina.
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis, type TooltipContentProps } from "recharts";
import { cn } from "@/lib/cn";
import { mesTexto, num } from "@/lib/formato";
import { useEmpresaActiva, useEmpresas } from "@/lib/store";

type Props = {
  datos: ({ fecha: string } & Record<string, number | string>)[]; // una fila por mes: { fecha, YPF: .., Vista: .. }
  nombres: string[];
  unidad: string;
};

// Tooltip mínimo: fecha y valor de ESTE gráfico
function Valor({ active, payload, unidad }: TooltipContentProps<number, string> & { unidad: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="border border-border bg-bg px-2 py-1 text-[11px] leading-tight">
      <p className="tabular text-dim">{mesTexto(String((p.payload as { fecha: string }).fecha))}</p>
      <p className="tabular text-fg">
        {num(Number(p.value), 1)} <span className="text-dim">{unidad}</span>
      </p>
    </div>
  );
}

export default function SmallMultiplesSync({ datos, nombres, unidad }: Props) {
  const activa = useEmpresaActiva();
  const { resaltar, alternar } = useEmpresas();
  // Escala común: el máximo de todas las empresas
  const maximo = Math.max(1, ...datos.flatMap((f) => nombres.map((g) => Number(f[g] ?? 0))));
  const ultimo = datos[datos.length - 1];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-8 sm:gap-y-8 lg:grid-cols-3">
      {nombres.map((g) => {
        const encendida = activa === g;
        const color = encendida ? "var(--empresa)" : "var(--muted)";
        return (
          <div
            key={g}
            className="cursor-pointer border-t border-border pt-3"
            onMouseEnter={() => resaltar(g)}
            onMouseLeave={() => resaltar(null)}
            onClick={() => alternar(g)}
          >
            <div className="mb-2 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
              <span className={cn("truncate text-sm transition-colors", encendida ? "text-empresa" : "text-fg")}>{g}</span>
              <span className="tabular text-sm text-fg">
                {num(Number(ultimo?.[g] ?? 0), 1)} <span className="text-[11px] text-dim">{unidad}</span>
              </span>
            </div>
            <div className="h-24 sm:h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datos} syncId="empresas" margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                  <YAxis hide domain={[0, maximo]} />
                  <Tooltip
                    content={(p) => <Valor {...(p as TooltipContentProps<number, string>)} unidad={unidad} />}
                    cursor={{ stroke: "var(--dim)", strokeWidth: 1 }}
                    position={{ y: 0 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={g}
                    stroke={color}
                    strokeWidth={encendida ? 2 : 1.25}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0, fill: color }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex justify-between tabular text-[10.5px] text-dim">
              <span>{datos[0]?.fecha.slice(0, 4)}</span>
              <span>{ultimo?.fecha.slice(0, 4)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
