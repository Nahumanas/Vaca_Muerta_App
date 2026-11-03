import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { cargarPozos } from "@/lib/datos";
import MapaCliente from "./MapaCliente";

export const metadata: Metadata = { title: "Mapa · Monitor de Vaca Muerta" };

export default function Mapa() {
  return (
    <>
      <PageHeader
        titulo="Mapa de pozos"
        bajada="Cada punto es un pozo. El color muestra cuánto petróleo produjo en total desde que empezó. Pasá el mouse (o tocá) un pozo para ver su detalle."
      />
      <MapaCliente pozos={cargarPozos()} />
    </>
  );
}
