"""Página Mapa: dónde están los pozos y cuáles produjeron más."""

import numpy as np
import plotly.express as px
import streamlit as st

import utilidades as u

st.set_page_config(page_title="Mapa · Monitor de Vaca Muerta", page_icon="🛢️", layout="wide")
st.title("Mapa de pozos")
st.markdown("Cada punto es un pozo. El color muestra cuánto petróleo produjo en total desde que empezó. "
            "Pasá el mouse por un pozo para ver su detalle.")

pozos = u.cargar("pozos")
pozos["pet_acum_kbbl"] = pozos["pet_acum_m3"] * u.M3_A_BARRILES / 1000
pozos["activo"] = pozos["ultimo_mes"] == pozos["ultimo_mes"].max()

with st.sidebar:
    grupos = pozos["grupo"].value_counts().index.tolist()
    elegidas = st.multiselect("Empresas", grupos, placeholder="Todas")
    todos_tipos = pozos["tipopozo"].value_counts().index.tolist()
    tipos = st.multiselect("Tipo de pozo", todos_tipos, default=todos_tipos)
    solo_activos = st.toggle("Solo pozos que produjeron el último mes", value=False)

sel = pozos.copy()
if elegidas:
    sel = sel[sel["grupo"].isin(elegidas)]
if tipos:
    sel = sel[sel["tipopozo"].isin(tipos)]
if solo_activos:
    sel = sel[sel["activo"]]
sel = sel.dropna(subset=["lat", "lon"]).sort_values("pet_acum_kbbl")   # los mejores pozos se dibujan arriba

c1, c2, c3 = st.columns(3)
c1.metric("Pozos en el mapa", u.num(len(sel)))
c2.metric("Petróleo acumulado", f"{u.num(sel['pet_acum_kbbl'].sum() / 1000, 0)} millones de bbl")
c3.metric("Pozos que produjeron el último mes", u.num(sel["activo"].sum()))

if sel.empty:
    st.warning("No hay pozos para ese filtro.")
    st.stop()

# Escala logarítmica de color: hay pozos de 1 mil y de 2 millones de barriles
sel["color"] = np.log10(sel["pet_acum_kbbl"].clip(lower=0.1))
fig = px.scatter_map(
    sel, lat="lat", lon="lon", color="color", color_continuous_scale="Blues", range_color=[0, 3.5],
    hover_name="sigla", zoom=7.3, center={"lat": -38.3, "lon": -68.9}, height=620, map_style="carto-positron",
    custom_data=["grupo", "area", "tipopozo", "pet_acum_kbbl", "gas_acum_mm3", "primer_mes"],
)
fig.update_traces(marker_size=7, hovertemplate=(
    "<b>%{hovertext}</b><br>%{customdata[0]} · %{customdata[1]}<br>%{customdata[2]}<br>"
    "Petróleo acumulado: %{customdata[3]:,.0f} mil bbl<br>Gas acumulado: %{customdata[4]:,.0f} mil m³<br>"
    "Empezó a producir: %{customdata[5]|%m/%Y}<extra></extra>"))
fig.update_layout(margin=dict(l=0, r=0, t=0, b=0), separators=",.",
                  coloraxis_colorbar=dict(title="Petróleo<br>acumulado", tickvals=[0, 1, 2, 3],
                                          ticktext=["1 mil bbl", "10 mil", "100 mil", "1 millón"]))
st.plotly_chart(fig, width="stretch")

st.subheader("Los 10 pozos que más petróleo produjeron")
top10 = sel.nlargest(10, "pet_acum_kbbl")[["sigla", "grupo", "area", "primer_mes", "pet_acum_kbbl"]]
st.dataframe(
    top10, hide_index=True, width="stretch",
    column_config={
        "sigla": "Pozo", "grupo": "Empresa", "area": "Área",
        "primer_mes": st.column_config.DateColumn("Empezó a producir", format="MM/YYYY"),
        "pet_acum_kbbl": st.column_config.NumberColumn("Petróleo acumulado (mil bbl)", format="%.0f"),
    },
)
u.pie()
