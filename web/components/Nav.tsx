"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGINAS = [
  { href: "/", texto: "Resumen" },
  { href: "/evolucion", texto: "Evolución" },
  { href: "/empresas", texto: "Empresas" },
  { href: "/mapa", texto: "Mapa" },
];

export default function Nav() {
  const actual = usePathname();
  return (
    <header className="nav">
      <div className="contenedor nav-fila">
        <Link href="/" className="marca">
          <span aria-hidden>🛢️</span> Monitor de Vaca Muerta
        </Link>
        <nav>
          {PAGINAS.map((p) => (
            <Link key={p.href} href={p.href} className={actual === p.href ? "activo" : ""}>
              {p.texto}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
