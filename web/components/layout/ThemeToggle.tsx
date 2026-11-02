"use client";
// Botón para cambiar entre modo oscuro (por defecto) y modo claro.
// La elección se guarda en el navegador (localStorage) para la próxima visita.
import { useEffect, useState } from "react";

type Tema = "dark" | "light";

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>("dark");

  useEffect(() => {
    setTema((document.documentElement.dataset.theme as Tema) ?? "dark");
  }, []);

  const cambiar = () => {
    const nuevo: Tema = tema === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nuevo;
    try {
      localStorage.setItem("tema", nuevo);
    } catch {
      // modo incógnito o almacenamiento bloqueado: el tema igual cambia, solo que no se recuerda
    }
    setTema(nuevo);
    window.dispatchEvent(new Event("tema")); // el mapa escucha esto para cambiar el fondo
  };

  return (
    <button
      onClick={cambiar}
      className="tabular text-[11px] uppercase tracking-wider text-dim hover:text-fg"
      aria-label={tema === "dark" ? "Pasar a modo claro" : "Pasar a modo oscuro"}
    >
      {tema === "dark" ? "Claro" : "Oscuro"}
    </button>
  );
}

// Script que corre ANTES de pintar la página: aplica el tema guardado y evita un "flash" de color.
export const scriptTema = `try{var t=localStorage.getItem("tema");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;
