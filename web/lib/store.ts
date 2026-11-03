"use client";
// Estado compartido entre componentes (Zustand).
// Guarda qué empresa está elegida: el ranking la cambia y los gráficos la leen.
// - "elegida": la que se fijó con un clic (queda hasta que se saca).
// - "resaltada": la que está bajo el mouse en este momento (vista previa).
// La que se muestra es la resaltada si hay una; si no, la elegida.
import { create } from "zustand";

type EstadoEmpresas = {
  elegida: string | null;
  resaltada: string | null;
  alternar: (empresa: string) => void; // clic: elige o, si ya estaba elegida, la saca
  resaltar: (empresa: string | null) => void; // mouse encima / afuera
  limpiar: () => void;
};

export const useEmpresas = create<EstadoEmpresas>((set) => ({
  elegida: null,
  resaltada: null,
  alternar: (empresa) => set((e) => ({ elegida: e.elegida === empresa ? null : empresa })),
  resaltar: (empresa) => set({ resaltada: empresa }),
  limpiar: () => set({ elegida: null, resaltada: null }),
}));

// Atajo: la empresa que hay que mostrar ahora
export const useEmpresaActiva = () => useEmpresas((e) => e.resaltada ?? e.elegida);
