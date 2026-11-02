import type { Metadata } from "next";
import { cargarEvolucion } from "@/lib/datos";
import EvolucionCliente from "./EvolucionCliente";

export const metadata: Metadata = { title: "Evolución · Monitor de Vaca Muerta" };

export default function Evolucion() {
  return (
    <>
      <h1>Evolución de la producción</h1>
      <p className="bajada">¿Cuánto creció Vaca Muerta y a qué ritmo? Elegí empresas para ver solo su producción.</p>
      <EvolucionCliente filas={cargarEvolucion()} />
    </>
  );
}
