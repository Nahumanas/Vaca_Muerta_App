"""
Descarga los datos de Vaca Muerta del portal de datos abiertos de la
Secretaría de Energía (datos.energia.gob.ar).

Uso (desde la carpeta Vaca_muerta_APP, en la terminal de VS Code):
    python scripts/descargar.py

Qué hace:
1. Le pregunta al portal (API CKAN) qué archivos tiene cada dataset.
   Así no dependemos de una URL fija: si el Gobierno cambia el link,
   el script lo encuentra igual.
2. Elige el archivo CSV correcto de cada dataset.
3. Lo guarda en datos/crudos/ (esa carpeta NO se sube a GitHub: pesa mucho).

Solo usa librerías que ya vienen con Python (no hay que instalar nada).
"""
import json
import sys
import time
import urllib.request
from pathlib import Path

PORTAL = "http://datos.energia.gob.ar/api/3/action/package_show?id="
CARPETA = Path(__file__).resolve().parent.parent / "datos" / "crudos"

# dataset del portal -> (texto que tiene que aparecer en el nombre del recurso, nombre del archivo local)
DATASETS = {
    "produccion-de-petroleo-y-gas-por-pozo": ("no convencional", "produccion_no_convencional.csv"),
    "datos-de-fractura-de-pozos-adjunto-iv": ("", "fracturas.csv"),
}


def pedir_json(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def elegir_recurso(recursos, texto):
    # Nos quedamos con los CSV cuyo nombre contenga el texto buscado
    csvs = [r for r in recursos if (r.get("format") or "").upper() == "CSV" or r["url"].lower().endswith(".csv")]
    candidatos = [r for r in csvs if texto.lower() in (r.get("name") or "").lower()]
    return candidatos[0] if candidatos else None


def descargar(url, destino):
    print(f"   Descargando {url}")
    inicio = time.time()

    def progreso(bloques, tam_bloque, total):
        mb = bloques * tam_bloque / 1e6
        print(f"\r   {mb:,.0f} MB" + (f" de {total/1e6:,.0f} MB" if total > 0 else ""), end="")

    urllib.request.urlretrieve(url, destino, reporthook=progreso)
    print(f"\n   Listo en {time.time() - inicio:,.0f} s -> {destino}")


def main():
    CARPETA.mkdir(parents=True, exist_ok=True)
    for dataset, (texto, archivo) in DATASETS.items():
        print(f"\n== {dataset}")
        recursos = pedir_json(PORTAL + dataset)["result"]["resources"]
        recurso = elegir_recurso(recursos, texto)
        if recurso is None:
            # Error claro si el portal cambió: mostramos qué archivos hay para elegir a mano
            print("   No encontré el archivo esperado. Archivos disponibles en el portal:")
            for r in recursos:
                print(f"   - {r.get('name')} [{r.get('format')}] {r['url']}")
            sys.exit(1)
        print(f"   Archivo: {recurso.get('name')} (actualizado: {recurso.get('last_modified') or recurso.get('created')})")
        descargar(recurso["url"], CARPETA / archivo)


if __name__ == "__main__":
    main()
