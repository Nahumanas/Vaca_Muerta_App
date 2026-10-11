# Monitor de Vaca Muerta

Parte 3 del proyecto *Balance Energético de Argentina*
([Parte 2 en GitHub](https://github.com/Nahumanas/Analisis_Energetico_Argentina_2019_2024)): una app que muestra
la producción de Vaca Muerta pozo por pozo y se actualiza sola cada mes, más (próximamente) un modelo de
Machine Learning que estima la producción de un pozo según cómo se lo fracturó.

**App online:** _(link de Streamlit Cloud, se agrega al publicarla)_

## Estado

| Etapa | Estado |
|---|---|
| 0. Sumar el Balance 2025 a la Parte 2 | ✅ Hecho |
| 1. Descargar y explorar producción y fracturas | ✅ Hecho (`notebooks/01_exploracion.ipynb`) |
| 2. Limpieza y archivos Parquet | ✅ Hecho (`scripts/procesar.py`, `notebooks/02_limpieza.ipynb`) |
| 3. App v1 en Streamlit | ✅ Hecho (`app/`) |
| 4. Actualización automática (GitHub Actions) | ✅ Hecho (`.github/workflows/actualizar_datos.yml`) |
| 5. Modelo de ML | Pendiente |
| 6. Simulador en la app | Pendiente |

## Cómo descargar los datos

Desde esta carpeta, en la terminal:

```
python scripts/descargar.py
```

Baja dos archivos del portal de la Secretaría de Energía a `datos/crudos/`:
- `produccion_no_convencional.csv`: producción mensual de cada pozo no convencional (~150 MB).
- `fracturas.csv`: cómo se fracturó cada pozo.

## Cómo procesar los datos

Después de descargar, desde esta carpeta:

```
pip install -r requirements.txt
python scripts/procesar.py
```

Limpia los CSV y genera en `datos/procesados/` los archivos Parquet que usa la app (~4 MB en total).
Cada decisión de limpieza está explicada en `notebooks/02_limpieza.ipynb`.

## Cómo abrir la app

Desde esta carpeta:

```
streamlit run app/Inicio.py
```

Se abre en el navegador (http://localhost:8501) con 4 páginas:

| Página | Qué muestra |
|---|---|
| Inicio | Producción del último mes, variación contra el mes y el año anterior, los últimos 24 meses y las conclusiones principales |
| Evolución | Petróleo y gas mes a mes desde 2013, con filtro por empresa y por años |
| Empresas | Ranking de empresas por petróleo o gas, y la evolución de las 5 principales |
| Mapa | Mapa interactivo de pozos, coloreados por producción acumulada |

La app lee los archivos de `datos/procesados/`. Para actualizarla con datos nuevos: `descargar.py` → `procesar.py` → volver a abrirla.

## Actualización automática

Todos los lunes, **GitHub Actions** corre `descargar.py` y `procesar.py` en los servidores de GitHub.
Si el Gobierno publicó datos nuevos, guarda los Parquet actualizados en el repo y la app online se actualiza sola.
También se puede correr a mano desde la pestaña **Actions → Actualizar datos → Run workflow**.

## Fuentes

- [Producción de petróleo y gas por pozo](http://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo)
- [Datos de fractura de pozos (Adjunto IV)](http://datos.energia.gob.ar/dataset/datos-de-fractura-de-pozos-adjunto-iv)
