import { cargarInfo } from "@/lib/datos";

export default function Pie() {
  const info = cargarInfo();
  return (
    <footer className="pie contenedor">
      Fuente: Secretaría de Energía de la Nación, datos abiertos (Capítulo IV y Adjunto IV). Formación Vaca Muerta.
      Datos hasta {info.ultimo_mes}. Proyecto de Nahuel Mansilla ·{" "}
      <a href="https://github.com/Nahumanas/Vaca_Muerta_App">código en GitHub</a>
    </footer>
  );
}
