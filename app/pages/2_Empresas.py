"""Página Empresas: ranking y participación de cada empresa."""
import pandas as pd
import plotly.express as px
import streamlit as st

import utilidades as u

st.set_page_config(page_title="Empresas · Monitor de Vaca Muerta", page_icon="🛢️", layout="wide")
st.title("¿Quién produce en Vaca Muerta?")
st.markdown("Las empresas están agrupadas por grupo empresario (por ejemplo, las distintas razones sociales de Vista "
            "cuentan como una sola). El detalle está en el notebook `02_limpieza`.")

emp = u.cargar("empresas_mensual")
ultimo = emp["fecha"].max()

with st.sidebar:
    producto = st.radio("Producto", ["Petróleo", "Gas"], horizontal=True)
    periodos = ["Últimos 12 meses"] + [str(a) for a in range(ultimo.year, 2017, -1)]
    periodo = st.selectbox("Período", periodos)

col_valor = "prod_pet" if producto == "Petróleo" else "prod_gas"
color = u.AZUL if producto == "Petróleo" else u.VERDE

if periodo == "Últimos 12 meses":
    desde = ultimo - pd.DateOffset(months=11)
    sel = emp[emp["fecha"] >= desde]
    texto_periodo = f"{u.mes_texto(desde)} a {u.mes_texto(ultimo)}"
else:
    sel = emp[emp["fecha"].dt.year == int(periodo)]
    texto_periodo = periodo

ranking = sel.groupby("grupo")[col_valor].sum().sort_values(ascending=False)
part = (ranking / ranking.sum() * 100).rename("participacion").reset_index()
top = part.head(10).copy()
if len(part) > 10:
    top = pd.concat([top, pd.DataFrame({"grupo": ["Resto"], "participacion": [part["participacion"].iloc[10:].sum()]})])

# --- Ranking ---
col1, col2 = st.columns([3, 2])
with col1:
    fig = px.bar(top, x="participacion", y="grupo", orientation="h",
                 title=f"Participación en el {producto.lower()} · {texto_periodo}", text="participacion")
    fig.update_traces(marker_color=[color] + [u.GRIS] * (len(top) - 1), texttemplate="%{x:.1f}%",
                      textposition="outside", hovertemplate="%{y}: %{x:.1f}%<extra></extra>", cliponaxis=False)
    fig.update_yaxes(autorange="reversed", title=None)
    fig.update_xaxes(title="% del total", ticksuffix="%")
    fig.update_xaxes(range=[0, top["participacion"].max() * 1.15])   # lugar para la etiqueta de la barra más larga
    fig = u.estilo(fig, 460, fechas=False)
    fig.update_layout(hovermode="closest")
    st.plotly_chart(fig, width="stretch")
with col2:
    lider = part.iloc[0]
    st.metric(f"Empresa líder en {producto.lower()}", lider["grupo"])
    st.caption(f"Produce el {u.num(lider['participacion'], 1)}% del total")
    st.metric("Las 3 primeras juntas", f"{u.num(part['participacion'].head(3).sum(), 1)}%")
    st.metric("Empresas con producción", f"{(ranking > 0).sum()}")

# --- Evolución de las 5 principales ---
st.subheader(f"Evolución de las 5 principales en {producto.lower()}")
top5 = part["grupo"].head(5).tolist()
emp["grupo_graf"] = emp["grupo"].where(emp["grupo"].isin(top5), "Resto")
y = "petroleo_kbbl_d" if producto == "Petróleo" else "gas_MMm3_d"
serie = emp[emp["fecha"] >= "2018-01-01"].groupby(["fecha", "grupo_graf"])[y].sum().reset_index()
paleta = dict(zip(top5, [color, u.NARANJA, "#7a5ac8", "#d4a017", "#3d3d3a"]))
paleta["Resto"] = "#c8c7c2"
fig = px.area(serie, x="fecha", y=y, color="grupo_graf", category_orders={"grupo_graf": top5 + ["Resto"]},
              color_discrete_map=paleta)
fig.update_yaxes(title="Mil barriles por día" if producto == "Petróleo" else "Millones de m³ por día")
fig.update_traces(hovertemplate="%{fullData.name}: %{y:,.1f}<extra></extra>")
st.plotly_chart(u.estilo(fig, 440), width="stretch")
u.pie()
