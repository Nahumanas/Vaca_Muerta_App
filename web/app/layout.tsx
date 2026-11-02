import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Pie from "@/components/Pie";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monitor de Vaca Muerta",
  description:
    "Producción de petróleo y gas de la formación Vaca Muerta, pozo por pozo, con los datos oficiales de la Secretaría de Energía.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main className="contenedor">{children}</main>
        <Pie />
      </body>
    </html>
  );
}
