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
      className="flex items-center gap-2 rounded-lg border border-border bg-panel-2 px-2.5 py-1.5 text-xs text-muted hover:text-fg"
      aria-label={tema === "dark" ? "Pasar a modo claro" : "Pasar a modo oscuro"}
    >
      <span aria-hidden>{tema === "dark" ? "☀" : "☾"}</span>
      {tema === "dark" ? "Modo claro" : "Modo oscuro"}
    </button>
  );
}

// Script que corre ANTES de pintar la página: aplica el tema guardado y evita un "flash" de color.
export const scriptTema = `try{var t=localStorage.getItem("tema");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;
