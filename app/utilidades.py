"""
Funciones compartidas por todas las páginas de la app:
cargar los Parquet, colores y formato de números en español.
"""
import json
from pathlib import Path

import pandas as pd
import streamlit as st

PROCESADOS = Path(__file__).resolve().parent.parent / "datos" / "procesados"

AZUL = "#2a78d6"     # petróleo
VERDE = "#1baf7a"    # gas
NARANJA = "#eb6834"  # para destacar
GRIS = "#9a9994"     # el resto
M3_A_BARRILES = 6.2898

MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


@st.cache_data   # guarda el archivo en memoria: solo se lee la primera vez
def cargar(nombre):
    return pd.read_parquet(PROCESADOS / f"{nombre}.parquet")


@st.cache_data
def info():
    return json.loads((PROCESADOS / "info.json").read_text(encoding="utf-8"))


def mes_texto(fecha):
    return f"{MESES[fecha.month - 1]} {fecha.year}"


def num(x, dec=0):
    # 12345.6 -> "12.345,6" (formato argentino)
    return f"{x:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def pct(x, dec=1):
    # 27.23 -> "+27,2%"
    return f"{x:+.{dec}f}%".replace(".", ",")


def kbbl_d(m3, fechas):
    # m³ en el mes -> miles de barriles por día
    return m3 * M3_A_BARRILES / fechas.dt.days_in_month / 1000


def mmm3_d(miles_m3, fechas):
    # miles de m³ en el mes -> millones de m³ por día
    return miles_m3 / fechas.dt.days_in_month / 1000


def estilo(fig, alto=420, fechas=True):
    # Mismo estilo para todos los gráficos: fondo limpio y números con formato argentino.
    # Las fechas van como "08/2026" porque Plotly escribe los nombres de los meses en inglés.
    fig.update_layout(height=alto, margin=dict(l=10, r=10, t=40, b=10), separators=",.",
                      plot_bgcolor="rgba(0,0,0,0)", hovermode="x unified",
                      legend=dict(orientation="h", y=1.08, x=0, title=None))
    fig.update_xaxes(showgrid=False, title=None)
    fig.update_yaxes(gridcolor="rgba(128,128,128,0.2)")
    if fechas:
        fig.update_xaxes(tickformat="%m/%Y", hoverformat="%m/%Y")
    return fig


def pie():
    st.divider()
    st.caption(f"Fuente: Secretaría de Energía de la Nación, datos abiertos (Capítulo IV y Adjunto IV). "
               f"Formación Vaca Muerta. Datos hasta {info()['ultimo_mes']}. "
               "Proyecto de Nahuel Mansilla.")
