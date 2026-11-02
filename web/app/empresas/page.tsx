import type { Metadata } from "next";
import { cargarEmpresas } from "@/lib/datos";
import EmpresasCliente from "./EmpresasCliente";

export const metadata: Metadata = { title: "Empresas · Monitor de Vaca Muerta" };

export default function Empresas() {
  return (
    <>
      <h1>¿Quién produce en Vaca Muerta?</h1>
      <p className="bajada">
        Las empresas están agrupadas por grupo empresario (por ejemplo, las distintas razones sociales de Vista cuentan
        como una sola). El detalle está en el notebook <code>02_limpieza</code>.
      </p>
      <EmpresasCliente filas={cargarEmpresas()} />
    </>
  );
}
