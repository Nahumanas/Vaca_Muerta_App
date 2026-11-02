"use client";
// Mapa de pozos con react-map-gl.
// Usamos MapLibre (la versión libre de Mapbox) con el mapa base gratuito de CARTO: no hace falta token.
// Para pasar a Mapbox: cambiar el import a "react-map-gl/mapbox", instalar mapbox-gl
// y pasar mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} al <Map>. El resto queda igual.
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useState } from "react";
import Map, { Layer, NavigationControl, Popup, Source, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { Pozo } from "@/lib/datos";
import { num } from "@/lib/formato";

const ESTILOS = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

// Escala de color (un solo tono, de tenue a intenso) según el petróleo acumulado, en escala logarítmica:
// hay pozos de 1 mil barriles y de más de 1 millón.
const RAMPA = {
  dark: ["#3a1a08", "#ff5c00", "#ffd2b3"], // de marrón apagado a naranja y casi blanco
  light: ["#c9dde2", "#0f5e73", "#05222b"], // azul petróleo
};

function useTema(): "dark" | "light" {
  const [tema, setTema] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const leer = () => setTema(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    leer();
    window.addEventListener("tema", leer);
    return () => window.removeEventListener("tema", leer);
  }, []);
  return tema;
}

type Hover = { lon: number; lat: number; pozo: Pozo } | null;

export default function WellMap({ pozos }: { pozos: Pozo[] }) {
  const tema = useTema();
  const [hover, setHover] = useState<Hover>(null);
  const [tactil, setTactil] = useState(false);
  useEffect(() => setTactil(window.matchMedia("(pointer: coarse)").matches), []);

  // Los pozos como GeoJSON (el formato que entiende el mapa)
  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: pozos.map((p, i) => ({
        type: "Feature" as const,
        id: i,
        geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] },
        properties: { i, log: Math.log10(Math.max(p.pet_acum_kbbl, 0.1)) },
      })),
    }),
    [pozos],
  );

  const [c0, c1, c2] = RAMPA[tema];

  const encuadre = useMemo((): [number, number, number, number] => {
    // Usamos del 1% al 99% de los pozos: así unos pocos pozos aislados no achican todo el mapa
    const lons = pozos.map((p) => p.lon).sort((a, b) => a - b);
    const lats = pozos.map((p) => p.lat).sort((a, b) => a - b);
    const q = (v: number[], x: number) => v[Math.min(v.length - 1, Math.floor((v.length - 1) * x))];
    return [q(lons, 0.01), q(lats, 0.01), q(lons, 0.99), q(lats, 0.99)];
  }, [pozos]);

  const alMover = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) return setHover(null);
    const pozo = pozos[Number(f.properties?.i)];
    setHover({ lon: pozo.lon, lat: pozo.lat, pozo });
  };

  return (
    <div className="relative h-[440px] w-full overflow-hidden sm:h-[600px]">
      <Map
        // El mapa arranca encuadrando todos los pozos (con un margen)
        initialViewState={{ bounds: encuadre, fitBoundsOptions: { padding: 40 } }}
        mapStyle={ESTILOS[tema]}
        interactiveLayerIds={["pozos"]}
        onMouseMove={alMover}
        onClick={alMover} // en el celular no hay "mouse": tocar un pozo muestra su detalle
        onMouseLeave={() => setHover(null)}
        // Con un dedo se scrollea la página; para mover el mapa hacen falta dos dedos
        cooperativeGestures={tactil}
        cursor={hover ? "pointer" : "grab"}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Source id="pozos" type="geojson" data={geojson}>
          <Layer
            id="pozos"
            type="circle"
            paint={{
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 2.5, 10, 5, 13, 8],
              "circle-color": ["interpolate", ["linear"], ["get", "log"], 0, c0, 2, c1, 3.3, c2],
              "circle-stroke-width": 0.5,
              "circle-stroke-color": tema === "dark" ? "#000000" : "#f7f7f5",
            }}
          />
        </Source>
        {hover && (
          <Popup longitude={hover.lon} latitude={hover.lat} closeButton={false} offset={10} anchor="bottom">
            <p className="tabular text-fg">{hover.pozo.sigla}</p>
            <p className="text-muted">
              {hover.pozo.grupo} · {hover.pozo.area}
            </p>
            <p className="text-muted">{hover.pozo.tipopozo}</p>
            <p className="mt-1">
              Petróleo acumulado: <span className="tabular">{num(hover.pozo.pet_acum_kbbl)} mil bbl</span>
            </p>
            <p>
              Gas acumulado: <span className="tabular">{num(hover.pozo.gas_acum_mm3)} mil m³</span>
            </p>
            <p className="text-muted">Empezó a producir: {hover.pozo.primer_mes}</p>
          </Popup>
        )}
      </Map>

      {/* Leyenda de colores */}
      <div className="pointer-events-none absolute bottom-3 left-3 border border-border bg-bg/90 px-3 py-2 text-[11px] text-muted">
        <p className="rotulo mb-1.5">Petróleo acumulado por pozo</p>
        <div className="h-1.5 w-44" style={{ background: `linear-gradient(to right, ${c0}, ${c1}, ${c2})` }} />
        <div className="mt-0.5 flex w-44 justify-between tabular">
          <span>1 mil bbl</span>
          <span>100 mil</span>
          <span>+2 mill.</span>
        </div>
      </div>
    </div>
  );
}
