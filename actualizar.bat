@echo off
REM Actualiza los datos de la app desde tu PC y los sube a GitHub.
REM Usalo cuando GitHub no pueda conectarse al portal del Gobierno.
REM Requisitos: Python con las librerias de requirements.txt, y Git instalado.
REM Uso: doble clic, o en la terminal: actualizar.bat

cd /d "%~dp0"

echo == 1/4 Trayendo la ultima version del repo
git pull || goto error

echo == 2/4 Descargando datos del Gobierno
python scripts\descargar.py || goto error

echo == 3/4 Procesando
python scripts\procesar.py || goto error

echo == 4/4 Subiendo los datos nuevos a GitHub
git add datos\procesados
git diff --cached --quiet && (echo No hay datos nuevos. & goto fin)
git commit -m "Datos actualizados desde la PC" || goto error
git push || goto error
echo Listo: la app online se actualiza en unos minutos.
goto fin

:error
echo.
echo Algo fallo. Copia el mensaje de arriba y pasaselo a Claude.

:fin
pause
