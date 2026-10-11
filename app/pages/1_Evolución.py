"""Página Evolución: producción mes a mes, con filtro por empresa."""
import pandas as pd
import plotly.express as px
import streamlit as st

import utilidades as u

st.set_page_config(page_title="Evolución · Monitor de Vaca Muerta", page_icon="🛢️", layout="wide")
st.title("Evolución de la producción")
st.markdown("¿Cuánto creció Vaca Muerta y a qué ritmo? Elegí empresas en la barra lateral para ver solo su producción.")

prod = u.cargar("produccion_pozo_mes")
prod = prod[prod["fecha"] >= "2013-01-01"]   # antes de 2013 la producción era casi nula

# --- Filtros ---
grupos = prod.groupby("grupo")["prod_pet"].sum().sort_values(ascending=False).index.tolist()
with st.sidebar:
    elegidas = st.multiselect("Empresas", grupos, placeholder="Todas")
    anios = st.slider("Años", 2013, int(prod["fecha"].dt.year.max()), (2018, int(prod["fecha"].dt.year.max())))

filtro = prod[prod["fecha"].dt.year.between(*anios)]
if elegidas:
    filtro = filtro[filtro["grupo"].isin(elegidas)]
titulo_empresas = ", ".join(elegidas) if elegidas else "todas las empresas"

mensual = filtro.groupby("fecha")[["prod_pet", "prod_gas"]].sum().reset_index()
mensual["petroleo"] = u.kbbl_d(mensual["prod_pet"], mensual["fecha"])
mensual["gas"] = u.mmm3_d(mensual["prod_gas"], mensual["fecha"])
activos = filtro[(filtro["prod_pet"] > 0) | (filtro["prod_gas"] > 0)].groupby("fecha")["idpozo"].nunique()
mensual["pozos"] = mensual["fecha"].map(activos).fillna(0)

if mensual.empty:
    st.warning("No hay datos para ese filtro.")
    st.stop()

# --- Gráficos: uno para petróleo y otro para gas (están en unidades distintas) ---
col1, col2 = st.columns(2)
with col1:
    fig = px.line(mensual, x="fecha", y="petroleo", title=f"Petróleo · {titulo_empresas}")
    fig.update_traces(line_color=u.AZUL, line_width=2.5,
                      hovertemplate="%{y:,.1f} mil bbl/d<extra></extra>")
    fig.update_yaxes(title="Mil barriles por día", rangemode="tozero")
    st.plotly_chart(u.estilo(fig), width="stretch")
with col2:
    fig = px.line(mensual, x="fecha", y="gas", title=f"Gas · {titulo_empresas}")
    fig.update_traces(line_color=u.VERDE, line_width=2.5,
                      hovertemplate="%{y:,.1f} MMm³/d<extra></extra>")
    fig.update_yaxes(title="Millones de m³ por día", rangemode="tozero")
    st.plotly_chart(u.estilo(fig), width="stretch")

st.caption("El gas sube en invierno y baja en verano porque acompaña la demanda de calefacción. "
           "El petróleo, en cambio, crece de forma más pareja.")

# --- Tabla por año ---
st.subheader("Promedio de cada año")
anual = mensual.groupby(mensual["fecha"].dt.year)[["petroleo", "gas", "pozos"]].mean()
crec = anual["petroleo"].pct_change() * 100
# Armamos la tabla ya formateada en español (coma decimal, punto de miles)
tabla = pd.DataFrame({
    "Año": anual.index.astype(str),
    "Petróleo (mil bbl/d)": anual["petroleo"].map(lambda x: u.num(x, 1)),
    "Gas (MMm³/d)": anual["gas"].map(lambda x: u.num(x, 1)),
    "Pozos en producción": anual["pozos"].map(u.num),
    "Crecimiento del petróleo": crec.map(lambda x: "—" if pd.isna(x) else u.pct(x)),
})
st.dataframe(tabla, hide_index=True, width="stretch")
st.caption("El último año puede estar incompleto: es el promedio de los meses publicados hasta ahora.")
u.pie()
