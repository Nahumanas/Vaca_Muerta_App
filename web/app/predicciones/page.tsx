import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOSTRAR_ML } from "@/lib/config";
import MLPredictionPanel from "@/components/MLPredictionPanel";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { cargarModelo } from "@/lib/datos";

export const metadata: Metadata = { title: "Predicciones ML · Monitor de Vaca Muerta" };

export default function Predicciones() {
  if (!MOSTRAR_ML) notFound(); // oculta hasta que el modelo esté listo (ver lib/config.ts)
  return (
    <>
      <PageHeader
        titulo="Predicciones ML"
        bajada="¿Cuánto petróleo va a dar un pozo nuevo en su primer año según cómo se diseñe? Mové los controles para ver la proyección."
        derecha={<Badge variante="aviso">● Beta · modelo en preparación</Badge>}
      />
      <MLPredictionPanel pozos={cargarModelo()} />
    </>
  );
}
