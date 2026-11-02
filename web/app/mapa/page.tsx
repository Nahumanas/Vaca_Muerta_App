import type { Metadata } from "next";
import { cargarPozos } from "@/lib/datos";
import MapaCliente from "./MapaCliente";

export const metadata: Metadata = { title: "Mapa · Monitor de Vaca Muerta" };

export default function Mapa() {
  return (
    <>
      <h1>Mapa de pozos</h1>
      <p className="bajada">
        Cada punto es un pozo. El color muestra cuánto petróleo produjo en total desde que empezó. Pasá el mouse por un
        pozo para ver su detalle.
      </p>
      <MapaCliente pozos={cargarPozos()} />
    </>
  );
}
