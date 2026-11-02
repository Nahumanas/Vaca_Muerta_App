"""
Convierte los Parquet de datos/procesados en archivos JSON chiquitos para la web (carpeta web/).

La web (Next.js, publicada en Vercel) no sabe leer Parquet, así que le dejamos los datos
en JSON dentro de datos/procesados/web/. Como esa carpeta está dentro de datos/procesados,
actualizar.bat y GitHub Actions ya la suben a GitHub sin cambiar nada.

procesar.py llama a este script al final. También se puede correr solo:
    python scripts/exportar_web.py
"""
import json
from pathlib import Path

import pandas as pd

PROCESADOS = Path(__file__).resolve().parent.parent / "datos" / "procesados"
SALIDA = PROCESADOS / "web"
M3_A_BARRILES = 6.2898


def fecha_texto(serie):
    # 2026-09-01 -> "2026-09" (las fechas se guardan como texto en el JSON)
    return serie.dt.strftime("%Y-%m")


def a_columnas(df, decimales):
    # Guardamos {"columna": [valores...]} en vez de una lista de filas: el archivo pesa mucho menos.
    salida = {}
    for col in df.columns:
        serie = df[col]
        if col in decimales:
            serie = serie.round(decimales[col])
        salida[col] = [None if pd.isna(v) else v for v in serie.tolist()]
    return salida


def guardar(nombre, datos):
    ruta = SALIDA / f"{nombre}.json"
    ruta.write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"   web/{ruta.name:<22} {ruta.stat().st_size / 1e3:7.1f} KB")


def main():
    SALIDA.mkdir(parents=True, exist_ok=True)
    print("Exportando JSON para la web")

    # Inicio: totales por mes
    resumen = pd.read_parquet(PROCESADOS / "resumen_mensual.parquet")
    resumen = resumen[["fecha", "petroleo_kbbl_d", "gas_MMm3_d", "pozos_activos"]].assign(fecha=lambda d: fecha_texto(d["fecha"]))
    guardar("resumen_mensual", a_columnas(resumen, {"petroleo_kbbl_d": 3, "gas_MMm3_d": 4}))

    # Empresas: producción de cada grupo por mes
    emp = pd.read_parquet(PROCESADOS / "empresas_mensual.parquet")
    emp = emp[["fecha", "grupo", "prod_pet", "prod_gas", "petroleo_kbbl_d", "gas_MMm3_d"]].assign(fecha=lambda d: fecha_texto(d["fecha"]))
    guardar("empresas_mensual", a_columnas(emp, {"prod_pet": 1, "prod_gas": 1, "petroleo_kbbl_d": 3, "gas_MMm3_d": 4}))

    # Evolución: como empresas, pero también con los pozos activos de cada grupo (desde 2013)
    prod = pd.read_parquet(PROCESADOS / "produccion_pozo_mes.parquet",
                           columns=["fecha", "grupo", "idpozo", "prod_pet", "prod_gas"])
    prod = prod[prod["fecha"] >= "2013-01-01"]
    evol = prod.groupby(["fecha", "grupo"])[["prod_pet", "prod_gas"]].sum()
    activos = prod[(prod["prod_pet"] > 0) | (prod["prod_gas"] > 0)]   # pozo activo = produjo algo ese mes
    evol["pozos"] = activos.groupby(["fecha", "grupo"])["idpozo"].nunique()
    evol = evol.fillna({"pozos": 0}).astype({"pozos": int}).reset_index()
    evol["fecha"] = fecha_texto(evol["fecha"])
    guardar("evolucion", a_columnas(evol, {"prod_pet": 1, "prod_gas": 1}))

    # Diseño de los pozos por año de fractura
    diseno = pd.read_parquet(PROCESADOS / "diseno_anual.parquet")
    guardar("diseno_anual", a_columnas(diseno, {"rama_m": 1, "etapas": 1}))

    # Mapa: un registro por pozo
    pozos = pd.read_parquet(PROCESADOS / "pozos.parquet").dropna(subset=["lat", "lon"])
    mapa = pd.DataFrame({
        "sigla": pozos["sigla"], "grupo": pozos["grupo"], "area": pozos["area"], "tipopozo": pozos["tipopozo"],
        "lat": pozos["lat"], "lon": pozos["lon"],
        "pet_acum_kbbl": pozos["pet_acum_m3"] * M3_A_BARRILES / 1000,
        "gas_acum_mm3": pozos["gas_acum_mm3"],
        "primer_mes": fecha_texto(pozos["primer_mes"]), "ultimo_mes": fecha_texto(pozos["ultimo_mes"]),
    })
    guardar("pozos", a_columnas(mapa, {"lat": 5, "lon": 5, "pet_acum_kbbl": 2, "gas_acum_mm3": 1}))

    # info.json se copia tal cual
    info = json.loads((PROCESADOS / "info.json").read_text(encoding="utf-8"))
    guardar("info", info)


if __name__ == "__main__":
    main()
