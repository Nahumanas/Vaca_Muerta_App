"""
Monitor de Vaca Muerta: página principal (Resumen).

Para abrir la app, desde la carpeta Vaca_muerta_APP:
    streamlit run app/Inicio.py
"""
import pandas as pd
import plotly.express as px
import streamlit as st

import utilidades as u

st.set_page_config(page_title="Monitor de Vaca Muerta", page_icon="🛢️", layout="wide")

resumen = u.cargar("resumen_mensual")
ultimo = resumen.iloc[-1]
anterior = resumen.iloc[-2]
hace_un_anio = resumen[resumen["fecha"] == ultimo["fecha"] - pd.DateOffset(years=1)].iloc[0]

st.title("🛢️ Monitor de Vaca Muerta")
st.markdown(f"Producción de petróleo y gas de la formación Vaca Muerta, pozo por pozo, con los datos oficiales de la "
            f"Secretaría de Energía. **Último dato: {u.mes_texto(ultimo['fecha'])}.**")


def variacion(col, base):
    return (ultimo[col] / base[col] - 1) * 100


c1, c2, c3 = st.columns(3)
for col_st, titulo, col, dec in [
    (c1, "Petróleo · miles de barriles por día", "petroleo_kbbl_d", 0),
    (c2, "Gas · millones de m³ por día", "gas_MMm3_d", 1),
    (c3, "Pozos en producción", "pozos_activos", 0),
]:
    with col_st:
        st.metric(titulo, u.num(ultimo[col], dec),
                  delta=f"{u.pct(variacion(col, anterior))} vs. {u.mes_texto(anterior['fecha'])}")
        st.caption(f"{u.pct(variacion(col, hace_un_anio))} contra {u.mes_texto(hace_un_anio['fecha'])}")

st.subheader("Petróleo en los últimos 24 meses")
ult24 = resumen.tail(24)
fig = px.bar(ult24, x="fecha", y="petroleo_kbbl_d", labels={"petroleo_kbbl_d": "Mil barriles por día"})
fig.update_traces(marker_color=u.AZUL, hovertemplate="%{y:,.0f} mil bbl/d<extra></extra>")
st.plotly_chart(u.estilo(fig, 360), width="stretch")

# ---------- Lo que muestran los datos ----------
# Todos los números se calculan con los datos: cuando llega un mes nuevo, el texto se actualiza solo.
ANIO_BASE = 2019      # primer año de la Parte 2 del proyecto (Balance Energético)
ANIO_INICIO = 2013    # desde acá la producción de Vaca Muerta empieza a ser relevante
fecha_ult = ultimo["fecha"]
anio_cerrado = fecha_ult.year if fecha_ult.month == 12 else fecha_ult.year - 1   # último año completo

anual = resumen.groupby(resumen["fecha"].dt.year)[["petroleo_kbbl_d", "pozos_activos"]].mean()
anual["bbl_por_pozo"] = anual["petroleo_kbbl_d"] * 1000 / anual["pozos_activos"]
base, cerrado = anual.loc[ANIO_BASE], anual.loc[anio_cerrado]
veces = ultimo["petroleo_kbbl_d"] / base["petroleo_kbbl_d"]

empresas = u.cargar("empresas_mensual")
ult12 = empresas[empresas["fecha"] > fecha_ult - pd.DateOffset(months=12)]
participacion = ult12.groupby("grupo")["prod_pet"].sum().sort_values(ascending=False) / ult12["prod_pet"].sum() * 100
lider, segunda = participacion.index[:2]
if participacion.iloc[0] > 50:
    frase_lider = f"**{lider} produce más de la mitad** del petróleo"
else:
    frase_lider = f"**{lider} es la que más petróleo produce**"

diseno = u.cargar("diseno_anual").set_index("anio_fractura")
d_ini, d_fin = diseno.loc[ANIO_INICIO], diseno.loc[anio_cerrado]
info = u.info()

st.subheader("📌 Lo que muestran los datos")
with st.container(border=True):
    st.markdown(f"""
- **Vaca Muerta es el {u.num(info['pct_petroleo_vm'], 1)}% del petróleo no convencional** del país:
  {u.num(info['pozos'])} pozos en la base.
- El petróleo pasó de **{u.num(base['petroleo_kbbl_d'])} mil barriles por día** (promedio {ANIO_BASE}) a
  **{u.num(cerrado['petroleo_kbbl_d'])} mil** (promedio {anio_cerrado}) y
  **{u.num(ultimo['petroleo_kbbl_d'])} mil en {u.mes_texto(fecha_ult)}**: se multiplicó por {u.num(veces, 1)}.
- Esto conecta con la Parte 2 del proyecto: es el petróleo que explica el **giro exportador** del Balance Energético.
- Los pozos activos pasaron de **{u.num(base['pozos_activos'])}** a **{u.num(cerrado['pozos_activos'])}**
  ({ANIO_BASE} contra {anio_cerrado}) y cada pozo rinde más: de **{u.num(base['bbl_por_pozo'])} a
  {u.num(cerrado['bbl_por_pozo'])} barriles por día**. El crecimiento viene de **más pozos** y también de
  **pozos más productivos**.
- {frase_lider} ({u.num(participacion.iloc[0], 1)}% en los últimos 12 meses), seguida por {segunda}
  ({u.num(participacion.iloc[1], 1)}%).
- Los pozos son cada vez más grandes: la rama horizontal pasó de unos **{u.num(round(d_ini['rama_m'], -2))} m**
  ({ANIO_INICIO}) a unos **{u.num(round(d_fin['rama_m'], -2))} m** ({anio_cerrado}), y las etapas de fractura,
  de **{u.num(d_ini['etapas'])} a {u.num(d_fin['etapas'])}**.
""")
    st.caption("Promedios anuales de producción. Largo de rama y etapas: valor típico (mediana) de los pozos "
               "fracturados cada año.")

st.markdown("""
#### ¿Qué hay en la app?
- **Evolución:** cómo creció la producción mes a mes desde 2013, con filtro por empresa.
- **Empresas:** quién produce más y cómo cambió el ranking.
- **Mapa:** dónde están los pozos y cuáles produjeron más.

Los datos se publican una vez por mes. La app muestra el último mes disponible.
""")
u.pie()
