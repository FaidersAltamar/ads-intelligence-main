/**
 * Servidor Node.js con Puppeteer para scraping de Facebook Ads Library
 * Backend API que responde a peticiones HTTP
 */

const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS configurado para aceptar peticiones desde cualquier origen
app.use(cors({
    origin: '*', // Permite peticiones desde cualquier dominio
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'Facebook Ads Scraper API',
        node_version: process.version,
        memory: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
        }
    });
});

// Diagnóstico de Chromium
app.get('/debug/chromium', async (req, res) => {
    try {
        const execPath = await chromium.executablePath();
        res.json({
            status: 'ok',
            chromiumPath: execPath,
            chromiumArgs: chromium.args.length + ' argumentos',
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message,
            stack: error.stack
        });
    }
});

// Debug endpoint: captura HTML y screenshot de Facebook Ads Library
app.get('/debug/facebook', async (req, res) => {
    const keyword = req.query.keyword || 'bulevartienda.com';
    
    console.log('[DEBUG] Iniciando captura de diagnóstico...');
    
    const browser = await puppeteer.launch({
        headless: chromium.headless,
        args: [...chromium.args, '--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        ignoreHTTPSErrors: true,
        timeout: 60000
    });

    const page = await browser.newPage();

    try {
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(keyword)}&search_type=keyword_unordered&media_type=all`;
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Cerrar cookies
        try {
            await page.click('button[data-cookiebanner="accept_button"]', { timeout: 3000 });
        } catch (e) {}

        // Capturar información
        const debugInfo = await page.evaluate(() => {
            const bodyText = document.body.innerText.substring(0, 5000);
            const hasResultsEs = bodyText.includes('resultados');
            const hasResultsEn = bodyText.includes('results');
            const hasDetallesEs = bodyText.includes('Ver detalles del anuncio');
            const hasDetallesEn = bodyText.includes('See ad details');
            const hasBibliotecaEs = bodyText.includes('Identificador de la biblioteca');
            const hasBibliotecaEn = bodyText.includes('Ad Library ID') || bodyText.includes('Library ID');
            
            return {
                idioma: hasResultsEs ? 'español' : (hasResultsEn ? 'inglés' : 'desconocido'),
                textoInicial: bodyText,
                marcadores: {
                    resultadosEs: hasResultsEs,
                    resultadosEn: hasResultsEn,
                    detallesEs: hasDetallesEs,
                    detallesEn: hasDetallesEn,
                    bibliotecaEs: hasBibliotecaEs,
                    bibliotecaEn: hasBibliotecaEn
                },
                divsTotales: document.querySelectorAll('div').length,
                url: window.location.href,
                title: document.title
            };
        });

        // Capturar screenshot (en base64 para ver en navegador)
        const screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: false,
            type: 'png'
        });

        await browser.close();

        res.json({
            status: 'ok',
            keyword: keyword,
            servidor: {
                platform: process.platform,
                nodeVersion: process.version
            },
            diagnostico: debugInfo,
            screenshot: `data:image/png;base64,${screenshot}`
        });

    } catch (error) {
        await browser.close();
        res.status(500).json({
            status: 'error',
            error: error.message,
            stack: error.stack
        });
    }
});

// Ruta principal - Servir HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint GET (para consumir desde URL)
app.get('/api/scrape', async (req, res) => {
    const { keyword, maxResults = 30 } = req.query;

    if (!keyword) {
        return res.status(400).json({ 
            error: 'Se requiere una palabra clave',
            usage: 'GET /api/scrape?keyword=nike.com&maxResults=30'
        });
    }

    console.log(`[SCRAPING GET] Palabra clave: ${keyword}, Max: ${maxResults}`);

    try {
        const anuncios = await scrapeFacebookAds(keyword, parseInt(maxResults));
        
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

// API endpoint POST (para consumir desde aplicaciones)
app.post('/api/scrape', async (req, res) => {
    const { keyword, maxResults = 30 } = req.body;

    if (!keyword) {
        return res.status(400).json({ 
            error: 'Se requiere una palabra clave' 
        });
    }

    console.log(`[SCRAPING POST] Palabra clave: ${keyword}, Max: ${maxResults}`);

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
        console.error('[ERROR COMPLETO]', error.message);
        console.error('[ERROR STACK]', error.stack);
        res.status(500).json({ 
            success: false,
            error: error.message,
            details: process.env.NODE_ENV === 'production' ? 'Ver logs del servidor' : error.stack
        });
    }
});

/**
 * Función principal de scraping con Puppeteer
 */
async function scrapeFacebookAds(keyword, maxResults) {
    console.log('[PUPPETEER] Iniciando navegador headless...');
    
    // Configuración optimizada para Render.com
    const isProduction = process.env.NODE_ENV === 'production';
    
    const browser = await puppeteer.launch({
        headless: chromium.headless,
        args: [
            ...chromium.args,
            '--disable-gpu',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-web-security'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        ignoreHTTPSErrors: true,
        timeout: 60000
    });

    const page = await browser.newPage();

    try {
        // Configurar viewport y user agent realista
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Agregar headers adicionales para parecer un navegador real
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        });

        // Construir URL
        const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(keyword)}&search_type=keyword_unordered&media_type=all`;
        
        console.log('[NAVEGANDO] Abriendo Facebook Ads Library...');
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });

        // Esperar carga (más tiempo en servidores lentos)
        console.log('[ESPERANDO] Cargando contenido...');
        const waitTime = process.env.NODE_ENV === 'production' ? 20000 : 12000;
        await new Promise(resolve => setTimeout(resolve, waitTime));

        // Cerrar banner de cookies si aparece
        try {
            await page.click('button[data-cookiebanner="accept_button"]', { timeout: 3000 });
            console.log('[OK] Banner cerrado');
        } catch (e) {
            // No hay banner
        }

        // Scroll inteligente para cargar más anuncios según maxResults
        console.log(`[SCROLL] Cargando anuncios hasta alcanzar ${maxResults} resultados...`);
        
        // Calcular scrolls necesarios (aproximadamente 2-3 anuncios por scroll)
        const scrollsNecesarios = Math.min(Math.ceil(maxResults / 2.5), 30); // Máximo 30 scrolls
        let anunciosPrevios = 0;
        let scrollsSinCambio = 0;
        
        for (let i = 0; i < scrollsNecesarios; i++) {
            // Hacer scroll grande
            await page.evaluate(() => {
                window.scrollBy(0, 1200);
            });
            
            // Esperar a que cargue contenido nuevo
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            // Contar anuncios actuales cada 3 scrolls para verificar progreso
            if (i % 3 === 0) {
                const anunciosActuales = await page.evaluate(() => {
                    const allDivs = Array.from(document.querySelectorAll('div'));
                    let count = 0;
                    for (const div of allDivs) {
                        const texto = div.innerText || '';
                        const hasDetalles = texto.includes('Ver detalles del anuncio') || texto.includes('See ad details');
                        const hasBiblioteca = texto.includes('Identificador de la biblioteca') || 
                                              texto.includes('Ad Library ID') || 
                                              texto.includes('Library ID');
                        if (hasDetalles && hasBiblioteca && texto.length > 100 && texto.length < 2500) {
                            count++;
                        }
                    }
                    return count;
                });
                
                console.log(`[SCROLL ${i+1}/${scrollsNecesarios}] Anuncios detectados: ${anunciosActuales}`);
                
                // Si ya tenemos suficientes anuncios, detener scroll
                if (anunciosActuales >= maxResults) {
                    console.log(`[OK] Se alcanzó el objetivo de ${maxResults} anuncios`);
                    break;
                }
                
                // Si no se cargan más anuncios después de varios scrolls, detener
                if (anunciosActuales === anunciosPrevios) {
                    scrollsSinCambio++;
                    if (scrollsSinCambio >= 3) {
                        console.log('[INFO] No se detectan más anuncios nuevos, finalizando scroll');
                        break;
                    }
                } else {
                    scrollsSinCambio = 0;
                }
                
                anunciosPrevios = anunciosActuales;
            }
        }

        // Obtener total reportado (español e inglés)
        const totalReportado = await page.evaluate(() => {
            const texto = document.body.innerText;
            const matchEs = texto.match(/(\d+)\s+resultados/);
            const matchEn = texto.match(/(\d+)\s+results/);
            return (matchEs ? matchEs[1] : (matchEn ? matchEn[1] : '0'));
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
                
                // Filtrar: debe tener ID de biblioteca y botón "Ver detalles" (español o inglés)
                const hasDetalles = texto.includes('Ver detalles del anuncio') || texto.includes('See ad details');
                const hasBiblioteca = texto.includes('Identificador de la biblioteca') || 
                                      texto.includes('Ad Library ID') || 
                                      texto.includes('Library ID');
                
                if (hasDetalles && hasBiblioteca && texto.length > 100 && texto.length < 2500) {
                    
                    // Extraer ID único (español o inglés)
                    const idMatchEs = texto.match(/Identificador de la biblioteca[:\s]+(\d{15,})/);
                    const idMatchEn = texto.match(/(?:Ad Library ID|Library ID)[:\s]+(\d{15,})/);
                    const idMatch = idMatchEs || idMatchEn;
                    
                    if (!idMatch) continue;
                    
                    const id = idMatch[1];
                    
                    // Evitar duplicados
                    if (idsVistos.has(id)) continue;
                    idsVistos.add(id);
                    
                    // Extraer fecha (español o inglés)
                    const fechaMatchEs = texto.match(/En circulaci[oó]n desde el (\d+ \w+ \d+)/);
                    const fechaMatchEn = texto.match(/Started running on (.+\d{4})/);
                    const fecha = fechaMatchEs ? fechaMatchEs[1] : (fechaMatchEn ? fechaMatchEn[1] : 'N/A');
                    
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
                                !linea.includes('Active') &&
                                !linea.includes('Inactivo') &&
                                !linea.includes('Inactive') &&
                                !linea.includes('Identificador') &&
                                !linea.includes('Library ID') &&
                                !linea.includes('Ver detalles') &&
                                !linea.includes('See ad details')) {
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
                            !linea.includes('Library ID') &&
                            !linea.includes('Ver detalles') &&
                            !linea.includes('See ad details') &&
                            !linea.includes('Plataformas') &&
                            !linea.includes('Platforms') &&
                            !linea.includes('circulaci') &&
                            !linea.includes('running on') &&
                            !linea.includes('Filtros') &&
                            !linea.includes('Filters')) {
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

