/**
 * Servidor Node.js con Puppeteer para scraping de Facebook Ads Library
 * Backend API que responde a peticiones HTTP
 */

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ruta principal - Servir HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint para scraping
app.post('/api/scrape', async (req, res) => {
    const { keyword, maxResults = 30 } = req.body;

    if (!keyword) {
        return res.status(400).json({ 
            error: 'Se requiere una palabra clave' 
        });
    }

    console.log(`[SCRAPING] Palabra clave: ${keyword}, Max: ${maxResults}`);

    try {
        const anuncios = await scrapeFacebookAds(keyword, maxResults);
        
        res.json({
            success: true,
            keyword: keyword,
            total: anuncios.length,
            fecha: new Date().toISOString(),
            anuncios: anuncios
        });
    } catch (error) {
        console.error('[ERROR]', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

/**
 * Función principal de scraping con Puppeteer
 */
async function scrapeFacebookAds(keyword, maxResults) {
    console.log('[PUPPETEER] Iniciando navegador headless...');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();

    try {
        // Configurar viewport y user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Construir URL
        const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(keyword)}&search_type=keyword_unordered&media_type=all`;
        
        console.log('[NAVEGANDO] Abriendo Facebook Ads Library...');
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });

        // Esperar carga
        console.log('[ESPERANDO] Cargando contenido...');
        await new Promise(resolve => setTimeout(resolve, 12000));

        // Cerrar banner de cookies si aparece
        try {
            await page.click('button[data-cookiebanner="accept_button"]', { timeout: 3000 });
            console.log('[OK] Banner cerrado');
        } catch (e) {
            // No hay banner
        }

        // Hacer scroll para cargar más anuncios
        console.log('[SCROLL] Cargando más anuncios...');
        for (let i = 0; i < 6; i++) {
            await page.evaluate(() => window.scrollBy(0, 700));
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Obtener total reportado
        const totalReportado = await page.evaluate(() => {
            const texto = document.body.innerText;
            const match = texto.match(/(\d+)\s+resultados/);
            return match ? match[1] : '0';
        });

        console.log(`[INFO] Facebook reporta ${totalReportado} anuncios`);
        console.log('[EXTRACCION] Extrayendo anuncios...');

        // Extraer anuncios con JavaScript en el contexto de la página
        const anuncios = await page.evaluate(() => {
            const results = [];
            const idsVistos = new Set();
            
            // Buscar divs que contengan información de anuncios
            const allDivs = Array.from(document.querySelectorAll('div'));
            
            for (const div of allDivs) {
                const texto = div.innerText || '';
                
                // Filtrar: debe tener ID de biblioteca y botón "Ver detalles"
                if (texto.includes('Ver detalles del anuncio') && 
                    texto.includes('Identificador de la biblioteca') &&
                    texto.length > 100 && texto.length < 2500) {
                    
                    // Extraer ID único
                    const idMatch = texto.match(/Identificador de la biblioteca[:\s]+(\d{15,})/);
                    if (!idMatch) continue;
                    
                    const id = idMatch[1];
                    
                    // Evitar duplicados
                    if (idsVistos.has(id)) continue;
                    idsVistos.add(id);
                    
                    // Extraer fecha
                    const fechaMatch = texto.match(/En circulaci[oó]n desde el (\d+ \w+ \d+)/);
                    const fecha = fechaMatch ? fechaMatch[1] : 'N/A';
                    
                    // Extraer nombre de página y logo
                    const lineas = texto.split('\n').filter(l => l.trim().length > 0);
                    let pagina = 'Desconocido';
                    let logoUrl = '';
                    
                    // Buscar el logo (imagen pequeña con alt)
                    const logoImg = div.querySelector('img.img, img._8nqq, img[alt]');
                    if (logoImg && logoImg.src && logoImg.src.includes('s60x60')) {
                        logoUrl = logoImg.src;
                        pagina = logoImg.alt || 'Desconocido';
                    }
                    
                    // Si no encontramos logo, buscar nombre en texto
                    if (pagina === 'Desconocido') {
                        for (const linea of lineas.slice(0, 5)) {
                            if (linea.length > 5 && 
                                linea.length < 60 && 
                                !linea.includes('Activo') &&
                                !linea.includes('Inactivo') &&
                                !linea.includes('Identificador') &&
                                !linea.includes('Ver detalles')) {
                                pagina = linea;
                                break;
                            }
                        }
                    }
                    
                    // Extraer texto promocional
                    let textoAnuncio = '';
                    for (const linea of lineas) {
                        if (linea.length > 30 && 
                            !linea.includes('Identificador') &&
                            !linea.includes('Ver detalles') &&
                            !linea.includes('Plataformas') &&
                            !linea.includes('circulaci') &&
                            !linea.includes('Filtros')) {
                            textoAnuncio = linea;
                            break;
                        }
                    }
                    
                    // Extraer URLs de imágenes
                    const imagenesElements = div.querySelectorAll('img');
                    const imagenesUrls = Array.from(imagenesElements)
                        .map(img => img.src)
                        .filter(src => src && (src.includes('scontent') || src.includes('fbcdn')))
                        .slice(0, 3);
                    
                    // Extraer video si existe
                    const videoElement = div.querySelector('video');
                    let videoData = null;
                    if (videoElement) {
                        videoData = {
                            poster: videoElement.getAttribute('poster') || '',
                            src: videoElement.getAttribute('src') || ''
                        };
                    }
                    
                    // Extraer información del CTA (Call to Action)
                    let ctaData = null;
                    try {
                        const ctaLink = div.querySelector('a[href*="facebook.com/l.php"]');
                        if (ctaLink) {
                            const ctaTexts = Array.from(ctaLink.querySelectorAll('div._4ik4._4ik5'))
                                .map(d => d.textContent.trim())
                                .filter(t => t.length > 0);
                            
                            const ctaButton = ctaLink.querySelector('[role="button"]');
                            const buttonText = ctaButton ? ctaButton.textContent.trim() : '';
                            
                            // Extraer URL real de destino (decodificar parámetro u=)
                            let realUrl = '';
                            const href = ctaLink.href || '';
                            if (href.includes('u=')) {
                                try {
                                    const urlParams = new URLSearchParams(href.split('?')[1]);
                                    realUrl = decodeURIComponent(urlParams.get('u') || '');
                                } catch(e) {
                                    realUrl = '';
                                }
                            }
                            
                            if (ctaTexts.length > 0) {
                                ctaData = {
                                    domain: ctaTexts[0] || '',
                                    title: ctaTexts[1] || '',
                                    subtitle: ctaTexts[2] || '',
                                    button: buttonText,
                                    url: realUrl
                                };
                            }
                        }
                    } catch (e) {
                        // No CTA data
                    }
                    
                    results.push({
                        numero: results.length + 1,
                        pagina: pagina.substring(0, 100),
                        logo_url: logoUrl,
                        id_biblioteca: id,
                        fecha_inicio: fecha,
                        texto: textoAnuncio.substring(0, 400),
                        imagenes: imagenesUrls.length,
                        imagenes_urls: imagenesUrls,
                        video: videoData,
                        cta: ctaData
                    });
                }
            }
            
            return results;
        });

        console.log(`[COMPLETADO] ${anuncios.length} anuncios extraidos`);

        // Limitar resultados
        const anunciosLimitados = anuncios.slice(0, maxResults);

        return anunciosLimitados;

    } finally {
        await browser.close();
        console.log('[CERRADO] Navegador cerrado');
    }
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('  FACEBOOK ADS SCRAPER - Servidor Puppeteer');
    console.log('='.repeat(60));
    console.log(`  Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`  API endpoint: POST http://localhost:${PORT}/api/scrape`);
    console.log('='.repeat(60));
    console.log('\nPresiona Ctrl+C para detener el servidor\n');
});

