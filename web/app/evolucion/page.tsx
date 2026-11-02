import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { cargarEvolucion } from "@/lib/datos";
import EvolucionCliente from "./EvolucionCliente";

export const metadata: Metadata = { title: "Evolución · Monitor de Vaca Muerta" };

export default function Evolucion() {
  return (
    <>
      <PageHeader
        titulo="Evolución de la producción"
        bajada="¿Cuánto creció Vaca Muerta y a qué ritmo? Elegí empresas para ver solo su producción."
      />
      <EvolucionCliente filas={cargarEvolucion()} />
    </>
  );
}
