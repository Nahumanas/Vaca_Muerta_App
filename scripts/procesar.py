"""
Limpia los datos crudos de Vaca Muerta y genera los archivos Parquet que usa la app.

Uso (desde la carpeta Vaca_muerta_APP):
    python scripts/procesar.py

Entrada:  datos/crudos/produccion_no_convencional.csv y datos/crudos/fracturas.csv
          (se bajan con scripts/descargar.py)
Salida:   datos/procesados/*.parquet  (livianos, se suben a GitHub y los lee la app)

Cada decisión de limpieza está explicada en notebooks/02_limpieza.ipynb.
"""
import json
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
CRUDOS = RAIZ / "datos" / "crudos"
PROCESADOS = RAIZ / "datos" / "procesados"

M3_A_BARRILES = 6.2898      # 1 m³ = 6,2898 barriles
PRESION_MAX_REAL = 20_000   # psi: por encima es un error de carga (los equipos trabajan hasta ~15.000)

COLUMNAS_PROD = ["idempresa", "empresa", "idpozo", "sigla", "anio", "mes", "prod_pet", "prod_gas", "prod_agua",
                 "tef", "formacion", "areayacimiento", "provincia", "coordenadax", "coordenaday",
                 "tipopozo", "tipoestado", "sub_tipo_recurso"]
COLUMNAS_FRAC = ["idpozo", "formacion_productiva", "longitud_rama_horizontal_m", "cantidad_fracturas",
                 "arena_bombeada_nacional_tn", "arena_bombeada_importada_tn", "agua_inyectada_m3",
                 "presion_maxima_psi", "potencia_equipos_fractura_hp", "fecha_inicio_fractura", "anio_if"]

# Una misma empresa aparece con varios códigos (por cambios de razón social o sucursales).
# Las agrupamos por "grupo empresario" usando el código idempresa, que es más estable que el nombre.
GRUPOS = {
    "YPF": "YPF", "YSUR": "YPF",                      # YSUR es una subsidiaria de YPF
    "VST": "Vista", "VIS": "Vista", "VOG": "Vista",   # Vista Energy / Vista Oil & Gas
    "PLU": "Pluspetrol", "PCN": "Pluspetrol",
    "PAL": "Pan American Energy", "PAE": "Pan American Energy",
    "SHE": "Shell", "TPT": "Tecpetrol", "TAU": "TotalEnergies", "CHE": "Chevron",
    "EMEA": "ExxonMobil", "PAM": "Pampa Energía", "PBE": "Pampa Energía",  # Pampa compró Petrobras Argentina
    "GAL": "GeoPark", "GEA": "GeoPark", "WDA": "Wintershall", "WIN": "Wintershall",
    "APS": "Capex", "KILW": "Kilwer", "OGDV": "O&G Developments", "PEL": "Petrolera Entre Lomas",
    "PTRE": "Petrolera El Trébol", "PGR": "Phoenix Global Resources",
}


def verificar_columnas(df, esperadas, archivo):
    # Si el Gobierno cambia el formato, frenamos con un mensaje claro en vez de fallar más adelante
    faltan = set(esperadas) - set(df.columns)
    if faltan:
        raise ValueError(f"{archivo}: faltan las columnas {sorted(faltan)}. ¿Cambió el formato del portal?")


def es_vaca_muerta(serie):
    return serie.fillna("").str.strip().str.lower() == "vaca muerta"


def participacion_vaca_muerta():
    # Qué parte del petróleo no convencional del país sale de Vaca Muerta (toda la historia de la base)
    crudo = pd.read_csv(CRUDOS / "produccion_no_convencional.csv", usecols=["formacion", "prod_pet"])
    petroleo = crudo["prod_pet"].clip(lower=0)
    return petroleo[es_vaca_muerta(crudo["formacion"])].sum() / petroleo.sum() * 100


def cargar_produccion():
    archivo = CRUDOS / "produccion_no_convencional.csv"
    prod = pd.read_csv(archivo, low_memory=False)
    verificar_columnas(prod, COLUMNAS_PROD, archivo.name)
    prod = prod.loc[es_vaca_muerta(prod["formacion"]), COLUMNAS_PROD].copy()

    prod["fecha"] = pd.to_datetime(dict(year=prod["anio"], month=prod["mes"], day=1))
    prod["grupo"] = prod["idempresa"].map(GRUPOS).fillna(prod["empresa"].str.title())
    # Producción negativa no tiene sentido físico: la pasamos a 0
    for col in ["prod_pet", "prod_gas", "prod_agua"]:
        prod[col] = prod[col].clip(lower=0)
    prod["tipopozo"] = prod["tipopozo"].fillna("Sin dato")
    return prod.drop(columns=["anio", "mes", "formacion"]).sort_values(["idpozo", "fecha"])


def resumen_mensual(prod):
    activos = prod[(prod["prod_pet"] > 0) | (prod["prod_gas"] > 0)]
    m = prod.groupby("fecha")[["prod_pet", "prod_gas", "prod_agua"]].sum()
    dias = m.index.days_in_month
    m["petroleo_kbbl_d"] = m["prod_pet"] * M3_A_BARRILES / dias / 1000
    m["gas_MMm3_d"] = m["prod_gas"] / dias / 1000
    m["pozos_activos"] = activos.groupby("fecha")["idpozo"].nunique()
    return m.fillna({"pozos_activos": 0}).reset_index()


def empresas_mensual(prod):
    e = prod.groupby(["fecha", "grupo"])[["prod_pet", "prod_gas"]].sum().reset_index()
    dias = e["fecha"].dt.days_in_month
    e["petroleo_kbbl_d"] = e["prod_pet"] * M3_A_BARRILES / dias / 1000
    e["gas_MMm3_d"] = e["prod_gas"] / dias / 1000
    return e


def tabla_pozos(prod):
    # Una fila por pozo: dónde está, quién lo opera hoy y cuánto produjo
    con_prod = prod[(prod["prod_pet"] > 0) | (prod["prod_gas"] > 0)]
    pozos = prod.groupby("idpozo").agg(
        sigla=("sigla", "last"), grupo=("grupo", "last"), area=("areayacimiento", "last"),
        provincia=("provincia", "last"), tipopozo=("tipopozo", "last"), estado=("tipoestado", "last"),
        lon=("coordenadax", "last"), lat=("coordenaday", "last"),
        pet_acum_m3=("prod_pet", "sum"), gas_acum_mm3=("prod_gas", "sum"),
    )
    pozos["primer_mes"] = con_prod.groupby("idpozo")["fecha"].min()
    pozos["ultimo_mes"] = con_prod.groupby("idpozo")["fecha"].max()
    return pozos.reset_index()


def cargar_fracturas():
    archivo = CRUDOS / "fracturas.csv"
    frac = pd.read_csv(archivo)
    verificar_columnas(frac, COLUMNAS_FRAC, archivo.name)
    frac = frac.loc[es_vaca_muerta(frac["formacion_productiva"]), COLUMNAS_FRAC].copy()
    frac["arena_total_tn"] = frac["arena_bombeada_nacional_tn"] + frac["arena_bombeada_importada_tn"]
    frac["fecha_inicio_fractura"] = pd.to_datetime(frac["fecha_inicio_fractura"], errors="coerce")

    antes = len(frac)
    frac = frac[(frac["longitud_rama_horizontal_m"] > 0)                  # sin rama horizontal: no es comparable
                & frac["presion_maxima_psi"].between(1, PRESION_MAX_REAL)  # presiones imposibles o vacías
                & (frac["agua_inyectada_m3"] > 0)]                       # fractura sin agua: dato incompleto
    print(f"   Fracturas de Vaca Muerta: {antes:,} -> {len(frac):,} después de sacar valores imposibles")

    # Si un pozo se fracturó más de una vez, nos quedamos con la primera (la que define su producción inicial)
    return (frac.sort_values("fecha_inicio_fractura").drop_duplicates("idpozo")
                .rename(columns={"anio_if": "anio_fractura"}))


def diseno_anual(frac):
    # Cómo cambió el diseño de los pozos: mediana del largo de rama y de las etapas, por año de fractura
    return (frac.groupby("anio_fractura")
                .agg(rama_m=("longitud_rama_horizontal_m", "median"), etapas=("cantidad_fracturas", "median"),
                     pozos=("idpozo", "count"))
                .reset_index())


def produccion_primer_anio(prod):
    # Petróleo y gas de los primeros 12 meses calendario desde que el pozo empezó a producir
    con_prod = prod[(prod["prod_pet"] > 0) | (prod["prod_gas"] > 0)]
    inicio = con_prod.groupby("idpozo")["fecha"].min().rename("inicio")
    p = prod.merge(inicio, on="idpozo")
    meses_desde_inicio = (p["fecha"].dt.year - p["inicio"].dt.year) * 12 + (p["fecha"].dt.month - p["inicio"].dt.month)
    primer_anio = p[meses_desde_inicio.between(0, 11)]
    t = primer_anio.groupby("idpozo").agg(pet_12m_m3=("prod_pet", "sum"), gas_12m_mm3=("prod_gas", "sum"))
    t = t.join(inicio)
    # Solo pozos con 12 meses completos de historia: si no, el total estaría incompleto
    ultimo_dato = prod["fecha"].max()
    completos = t["inicio"] + pd.DateOffset(months=11) <= ultimo_dato
    return t[completos].reset_index()


def tabla_modelo(prod, pozos, frac):
    t = (frac.merge(produccion_primer_anio(prod), on="idpozo", how="inner")
             .merge(pozos[["idpozo", "grupo", "area", "tipopozo", "lon", "lat"]], on="idpozo", how="left"))
    # El modelo predice petróleo: dejamos solo los pozos petrolíferos
    t = t[t["tipopozo"] == "Petrolífero"]
    columnas = ["idpozo", "grupo", "area", "lon", "lat", "anio_fractura", "longitud_rama_horizontal_m",
                "cantidad_fracturas", "arena_total_tn", "agua_inyectada_m3", "presion_maxima_psi",
                "potencia_equipos_fractura_hp", "pet_12m_m3", "gas_12m_mm3"]
    return t[columnas].reset_index(drop=True)


def main():
    PROCESADOS.mkdir(parents=True, exist_ok=True)
    print("1/3 Producción")
    prod = cargar_produccion()
    pozos = tabla_pozos(prod)
    print(f"   {len(prod):,} filas · {len(pozos):,} pozos · {prod['fecha'].min():%m/%Y} a {prod['fecha'].max():%m/%Y}")

    print("2/3 Fracturas")
    frac = cargar_fracturas()

    print("3/3 Guardando Parquet")
    salidas = {
        "produccion_pozo_mes": prod,
        "resumen_mensual": resumen_mensual(prod),
        "empresas_mensual": empresas_mensual(prod),
        "pozos": pozos,
        "tabla_modelo": tabla_modelo(prod, pozos, frac),
        "diseno_anual": diseno_anual(frac),
    }
    for nombre, df in salidas.items():
        ruta = PROCESADOS / f"{nombre}.parquet"
        df.to_parquet(ruta, index=False)
        print(f"   {ruta.name:<28} {len(df):>8,} filas  {ruta.stat().st_size / 1e6:5.1f} MB")

    # Un pequeño archivo con la fecha de los datos, para mostrar en la app "actualizado a..."
    info = {"ultimo_mes": f"{prod['fecha'].max():%Y-%m}", "pozos": int(len(pozos)),
            "pozos_modelo": int(len(salidas["tabla_modelo"])),
            "pct_petroleo_vm": round(float(participacion_vaca_muerta()), 1)}
    (PROCESADOS / "info.json").write_text(json.dumps(info, indent=2), encoding="utf-8")
    print("Listo:", info)


if __name__ == "__main__":
    main()
