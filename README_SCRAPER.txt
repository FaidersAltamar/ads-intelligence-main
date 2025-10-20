===============================================================
  FACEBOOK ADS LIBRARY SCRAPER
  Seguimiento de anuncios sin levantar navegador (Headless)
===============================================================

DESCRIPCION:
------------
Script en Python que utiliza Playwright para extraer información
de anuncios de la Facebook Ads Library de forma automática y
sin necesidad de mostrar un navegador visible.

CARACTERÍSTICAS:
----------------
✓ Modo headless (sin interfaz gráfica)
✓ Extrae anuncios únicos (sin duplicados)
✓ Obtiene: ID, fecha, texto, imágenes, plataformas
✓ Guarda resultados en formato JSON
✓ Muestra información en consola en tiempo real
✓ Compatible con cualquier palabra clave o dominio

REQUISITOS:
-----------
- Python 3.7 o superior
- Playwright instalado (ver archivo requirements.txt)
- Navegador Chromium de Playwright

INSTALACIÓN:
------------
1. Instalar dependencias:
   pip install -r requirements.txt

2. Instalar navegador Chromium:
   playwright install chromium

USO BÁSICO:
-----------
Ejecutar en consola:
   python facebook_ads_scraper.py

Por defecto busca "bulevartienda.com", extrae 30 anuncios y los
guarda en "facebook_ads_resultados.json"

PERSONALIZAR BÚSQUEDA:
----------------------
Editar el archivo facebook_ads_scraper.py:

Línea 190: KEYWORD = "tu-palabra-clave-aqui"
Línea 191: MAX_RESULTADOS = 50  # Cambiar cantidad

O modificar directamente en la función main()

ARCHIVO DE SALIDA:
------------------
facebook_ads_resultados.json - Contiene:
  - keyword: Término buscado
  - total_encontrados: Número de anuncios extraídos
  - total_reportado_facebook: Total que reporta Facebook
  - fecha_extraccion: Timestamp de la extracción
  - anuncios: Array con todos los anuncios

ESTRUCTURA DE CADA ANUNCIO:
---------------------------
{
  "numero": 1,
  "pagina": "Nombre de la página",
  "id_biblioteca": "ID único del anuncio",
  "fecha_inicio": "Fecha de circulación",
  "texto": "Texto promocional del anuncio",
  "plataformas": "Facebook, Instagram, etc",
  "imagenes": 2
}

EJEMPLO DE USO DESDE CÓDIGO:
-----------------------------
from facebook_ads_scraper import scrape_facebook_ads

# Buscar anuncios
anuncios = scrape_facebook_ads(
    keyword="nike.com",
    max_resultados=20,
    headless=True
)

# Procesar resultados
for ad in anuncios:
    print(f"ID: {ad['id_biblioteca']}")
    print(f"Texto: {ad['texto']}")

LIMITACIONES:
-------------
- Facebook puede detectar bots y bloquear acceso temporal
- Requiere conexión a internet
- Los selectores pueden cambiar si Facebook actualiza su web
- Limitado por velocidad de scroll y carga de página

TROUBLESHOOTING:
----------------
- Si no encuentra anuncios: Aumentar tiempo de espera en línea 81
- Si sale error de navegador: Reinstalar con "playwright install"
- Si captura duplicados: Ajustar selectores en código JavaScript

NOTAS:
------
- El scraper respeta la estructura pública de Facebook Ads Library
- No requiere API key ni autenticación
- Ejecutar con moderación para evitar bloqueos

ARCHIVOS DEL PROYECTO:
----------------------
- facebook_ads_scraper.py    -> Script principal
- facebook_ads_resultados.json -> Resultados de última ejecución
- requirements.txt            -> Dependencias Python
- README_SCRAPER.txt          -> Este archivo

===============================================================
Creado para seguimiento de competencia y análisis de anuncios
===============================================================

