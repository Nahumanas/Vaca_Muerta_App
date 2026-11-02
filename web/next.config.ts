import path from "node:path";
import type { NextConfig } from "next";

// La web lee los datos de ../datos/procesados/web (fuera de esta carpeta),
// por eso le decimos a Next que la raíz del proyecto es la carpeta de arriba.
const raiz = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: raiz,
  turbopack: { root: raiz },
};

export default nextConfig;
