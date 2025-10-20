"""
Facebook Ads Library Scraper - Version Final Headless
Scraping de anuncios de Facebook Ads Library sin levantar navegador visible

Uso:
    python facebook_ads_scraper.py

Características:
    - Modo headless (sin navegador visible)
    - Extrae anuncios únicos por ID
    - Guarda resultados en JSON
    - Muestra información en consola
"""

from playwright.sync_api import sync_playwright
import time
import json
import sys
import io

# Configurar salida UTF-8 para Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def scrape_facebook_ads(keyword, max_resultados=50, headless=True):
    """
    Scraping de Facebook Ads Library
    
    Args:
        keyword: Palabra clave o dominio a buscar (ej: "bulevartienda.com")
        max_resultados: Número máximo de anuncios a extraer
        headless: Si True, ejecuta sin navegador visible
    
    Returns:
        Lista de diccionarios con datos de anuncios
    """
    print(f"[BUSQUEDA] Palabra clave: {keyword}")
    print(f"[MODO] {'Headless (sin navegador)' if headless else 'Navegador visible'}")
    print("[INICIO] Iniciando...")
    
    with sync_playwright() as p:
        # Configurar navegador
        browser = p.chromium.launch(
            headless=headless,
            args=[
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        )
        
        # Crear contexto con configuración realista
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='es-ES'
        )
        page = context.new_page()
        
        try:
            # Construir URL
            url = f"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q={keyword}&search_type=keyword_unordered&media_type=all"
            
            print("[NAVEGANDO] Abriendo Facebook Ads Library...")
            page.goto(url, timeout=60000, wait_until='domcontentloaded')
            
            # Esperar carga inicial
            print("[CARGANDO] Esperando contenido...")
            time.sleep(12)
            
            # Cerrar banner de cookies si aparece
            try:
                page.click('button[data-cookiebanner="accept_button"]', timeout=3000)
                print("[OK] Banner cerrado")
            except:
                pass
            
            # Hacer scroll para cargar más anuncios
            print("[SCROLL] Cargando mas anuncios...")
            for i in range(6):
                page.evaluate('window.scrollBy(0, 700)')
                time.sleep(2)
            
            # Obtener contador total
            total_reportado = page.evaluate('''() => {
                const texto = document.body.innerText;
                const match = texto.match(/(\\d+)\\s+resultados/);
                return match ? match[1] : '0';
            }''')
            
            print(f"[INFO] Facebook reporta {total_reportado} anuncios totales")
            print("\n[EXTRACCION] Extrayendo anuncios...\n")
            
            # Extraer anuncios con JavaScript
            ads_data = page.evaluate('''() => {
                const results = [];
                const idsVistos = new Set();
                
                // Buscar divs que contengan información de anuncios
                const allDivs = Array.from(document.querySelectorAll('div'));
                
                for(const div of allDivs) {
                    const texto = div.innerText || '';
                    
                    // Filtrar: debe tener ID de biblioteca y botón "Ver detalles"
                    if(texto.includes('Ver detalles del anuncio') && 
                       texto.includes('Identificador de la biblioteca') &&
                       texto.length > 100 && texto.length < 2500) {
                        
                        // Extraer ID único
                        const idMatch = texto.match(/Identificador de la biblioteca[:\\s]+(\\d{15,})/);
                        if(!idMatch) continue;
                        
                        const id = idMatch[1];
                        
                        // Evitar duplicados
                        if(idsVistos.has(id)) continue;
                        idsVistos.add(id);
                        
                        // Extraer fecha de circulación
                        const fechaMatch = texto.match(/En circulaci[oó]n desde el (\\d+ \\w+ \\d+)/);
                        const fecha = fechaMatch ? fechaMatch[1] : 'N/A';
                        
                        // Extraer nombre de la página/anunciante
                        const lineas = texto.split('\\n').filter(l => l.trim().length > 0);
                        let pagina = 'Desconocido';
                        
                        // Buscar nombre (evitar palabras como "Activo", "Inactivo")
                        for(const linea of lineas.slice(0, 5)) {
                            if(linea.length > 5 && 
                               linea.length < 60 && 
                               !linea.includes('Activo') &&
                               !linea.includes('Inactivo') &&
                               !linea.includes('Identificador') &&
                               !linea.includes('Ver detalles')) {
                                pagina = linea;
                                break;
                            }
                        }
                        
                        // Si no encontramos nombre, buscar en el div "Bulevar Tienda" u otros
                        if(pagina === 'Desconocido') {
                            const nombreMatch = texto.match(/([A-Z][a-zA-Z]+\\s+[A-Z][a-zA-Z]+)/);
                            if(nombreMatch) pagina = nombreMatch[1];
                        }
                        
                        // Extraer texto promocional (líneas largas con emojis)
                        let textoAnuncio = '';
                        for(const linea of lineas) {
                            if(linea.length > 30 && 
                               !linea.includes('Identificador') &&
                               !linea.includes('Ver detalles') &&
                               !linea.includes('Plataformas') &&
                               !linea.includes('circulaci') &&
                               !linea.includes('Filtros')) {
                                textoAnuncio = linea;
                                break;
                            }
                        }
                        
                        // Extraer plataformas
                        const plataformas = [];
                        if(texto.includes('Facebook')) plataformas.push('Facebook');
                        if(texto.includes('Instagram')) plataformas.push('Instagram');
                        if(texto.includes('Messenger')) plataformas.push('Messenger');
                        
                        // Contar imágenes en este contenedor
                        const imagenes = div.querySelectorAll('img').length;
                        
                        results.push({
                            numero: results.length + 1,
                            pagina: pagina.substring(0, 100),
                            id_biblioteca: id,
                            fecha_inicio: fecha,
                            texto: textoAnuncio.substring(0, 400),
                            plataformas: plataformas.join(', ') || 'N/A',
                            imagenes: imagenes
                        });
                    }
                }
                
                return results;
            }''')
            
            # Limitar resultados
            ads_data = ads_data[:max_resultados]
            
            # Mostrar en consola
            for ad in ads_data:
                print(f"--- ANUNCIO #{ad['numero']} ---")
                print(f"  Pagina: {ad['pagina']}")
                print(f"  ID: {ad['id_biblioteca']}")
                print(f"  Fecha inicio: {ad['fecha_inicio']}")
                print(f"  Plataformas: {ad['plataformas']}")
                print(f"  Imagenes: {ad['imagenes']}")
                print(f"  Texto: {ad['texto'][:120]}...")
                print()
            
            # Guardar en JSON
            filename = 'facebook_ads_resultados.json'
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump({
                    'keyword': keyword,
                    'total_encontrados': len(ads_data),
                    'total_reportado_facebook': total_reportado,
                    'fecha_extraccion': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'anuncios': ads_data
                }, f, ensure_ascii=False, indent=2)
            
            print(f"[COMPLETADO] {len(ads_data)} anuncios extraidos")
            print(f"[GUARDADO] Archivo: {filename}")
            
            return ads_data
            
        except Exception as e:
            print(f"[ERROR] {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Captura de pantalla para debugging
            try:
                screenshot_file = 'error_screenshot.png'
                page.screenshot(path=screenshot_file)
                print(f"[DEBUG] Screenshot guardado: {screenshot_file}")
            except:
                pass
            
            return []
            
        finally:
            browser.close()
            print("[CERRADO] Navegador cerrado")

def main():
    """Función principal"""
    print("="*70)
    print("  FACEBOOK ADS LIBRARY SCRAPER")
    print("  Modo Headless - Sin navegador visible")
    print("="*70)
    print()
    
    # Solicitar palabra clave al usuario
    print("Ingresa la palabra clave o dominio a buscar")
    print("Ejemplos: nike.com, adidas, coca-cola, etc.")
    print()
    keyword = input("[PALABRA CLAVE]: ").strip()
    
    # Validar que no esté vacío
    if not keyword:
        print("\n[ERROR] Debes ingresar una palabra clave")
        return
    
    # Preguntar cantidad de resultados (opcional)
    print()
    print("Cuantos anuncios deseas extraer? (presiona Enter para 30)")
    max_input = input("[CANTIDAD] (default: 30): ").strip()
    
    try:
        MAX_RESULTADOS = int(max_input) if max_input else 30
        if MAX_RESULTADOS < 1 or MAX_RESULTADOS > 100:
            print("[AVISO] Usando valor por defecto: 30")
            MAX_RESULTADOS = 30
    except ValueError:
        print("[AVISO] Valor invalido, usando 30")
        MAX_RESULTADOS = 30
    
    print()
    print(f"Buscando '{keyword}' - Extrayendo hasta {MAX_RESULTADOS} anuncios...")
    print("-"*70)
    print()
    
    # Ejecutar scraping
    anuncios = scrape_facebook_ads(
        keyword=keyword,
        max_resultados=MAX_RESULTADOS,
        headless=True  # True = sin navegador, False = con navegador visible
    )
    
    # Resumen final
    print("\n" + "="*70)
    if anuncios:
        print(f"  EXITO: {len(anuncios)} anuncios extraidos correctamente")
        print(f"  Archivo guardado: facebook_ads_resultados.json")
    else:
        print("  ERROR: No se pudieron extraer anuncios")
    print("="*70)

if __name__ == "__main__":
    main()

