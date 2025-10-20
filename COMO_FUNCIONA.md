# 📖 CÓMO FUNCIONA - Facebook Ads Scraper

## 🎯 Concepto General

Esta herramienta NO usa una API oficial de Facebook. En su lugar, usa **web scraping** para extraer información pública de la Facebook Ads Library utilizando Puppeteer.

---

## 🏗️ Arquitectura de la Aplicación

```
┌─────────────────┐
│  NAVEGADOR WEB  │  ← Usuario abre http://localhost:3000
│  (Tu Browser)   │
└────────┬────────┘
         │ HTTP Request
         ▼
┌─────────────────┐
│  SERVER.JS      │  ← Servidor Node.js + Express (Puerto 3000)
│  (Express API)  │
└────────┬────────┘
         │ Ejecuta
         ▼
┌─────────────────┐
│   PUPPETEER     │  ← Automatiza navegador headless
│  (Chromium)     │
└────────┬────────┘
         │ Visita
         ▼
┌─────────────────┐
│  FACEBOOK ADS   │  ← Sitio web público de Facebook
│    LIBRARY      │  https://www.facebook.com/ads/library
└─────────────────┘
```

---

## 🔧 Tecnologías Utilizadas

### 1. **Puppeteer** ([pptr.dev](https://pptr.dev))
- **¿Qué es?** Una librería de Node.js desarrollada por Google
- **¿Qué hace?** Controla un navegador Chrome/Chromium de forma programática
- **Modo headless:** Ejecuta el navegador sin interfaz gráfica (invisible)
- **Capacidades:**
  - Navegar a URLs
  - Hacer clic en botones
  - Llenar formularios
  - Hacer scroll
  - Extraer contenido de la página
  - Tomar screenshots

### 2. **Express.js**
- Framework web para Node.js
- Crea el servidor HTTP en puerto 3000
- Expone endpoints API (rutas)

### 3. **HTML/CSS/JavaScript**
- Interfaz web moderna para el usuario
- Formularios para ingresar búsquedas
- Visualización de resultados

---

## 🔄 Flujo de Funcionamiento Paso a Paso

### **Paso 1: Usuario Ingresa Búsqueda**
```
Usuario en navegador → Escribe "nike.com" → Click "Buscar Anuncios"
```

### **Paso 2: Petición al Servidor**
```javascript
// El navegador envía una petición POST
fetch('/api/scrape', {
    method: 'POST',
    body: JSON.stringify({ 
        keyword: "nike.com", 
        maxResults: 30 
    })
})
```

### **Paso 3: Servidor Inicia Puppeteer**
```javascript
// server.js línea 57
const browser = await puppeteer.launch({
    headless: true,  // Sin ventana visible
    args: ['--no-sandbox']
});
```

### **Paso 4: Puppeteer Abre Facebook Ads Library**
```javascript
// server.js línea 75
const url = `https://www.facebook.com/ads/library/?q=nike.com`;
await page.goto(url);
```

### **Paso 5: Espera y Scroll**
```javascript
// server.js línea 88-103
// Espera 12 segundos para que cargue
await new Promise(resolve => setTimeout(resolve, 12000));

// Hace scroll 6 veces para cargar más anuncios
for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, 700));
    await new Promise(resolve => setTimeout(resolve, 2000));
}
```

### **Paso 6: Extrae Información con JavaScript**
```javascript
// server.js línea 113-253
// Ejecuta código JavaScript dentro de la página de Facebook
const anuncios = await page.evaluate(() => {
    // Busca todos los divs que contengan anuncios
    const allDivs = Array.from(document.querySelectorAll('div'));
    
    // Para cada div, extrae:
    // - ID del anuncio
    // - Nombre de la página
    // - Logo
    // - Fecha de inicio
    // - Texto promocional
    // - Imágenes/Videos
    // - Botón CTA (Call to Action)
    // - URL de destino
    
    return results;
});
```

### **Paso 7: Devuelve Resultados**
```javascript
// server.js línea 37-43
res.json({
    success: true,
    keyword: "nike.com",
    total: 25,
    anuncios: [...]
});
```

### **Paso 8: Interfaz Muestra Resultados**
```javascript
// index.html línea 478-562
// JavaScript procesa el JSON y genera HTML
// Muestra cada anuncio con:
// - Logo circular
// - Nombre de página
// - Texto del anuncio
// - Video o imagen
// - Botón CTA con enlace real
```

---

## 🎨 ¿Por Qué Se Ve Igual a Facebook?

La interfaz **NO copia el HTML de Facebook**, sino que **replica el diseño**:

### Extrae Datos:
```javascript
// Logo
const logoImg = div.querySelector('img._8nqq');
logoUrl = logoImg.src;  // https://scontent.fbcdn.net/.../logo.jpg

// Texto
const texto = div.innerText;

// Video
const video = div.querySelector('video');
videoPoster = video.poster;  // Miniatura
videoSrc = video.src;        // URL del video
```

### Genera Nuevo HTML:
```html
<div class="ad-card">
    <div class="ad-header">
        <img src="logo.jpg" class="ad-logo">
        <div class="ad-title">Nike</div>
    </div>
    <video src="video.mp4" poster="thumbnail.jpg"></video>
    <a href="https://nike.com/product">Shop now</a>
</div>
```

---

## 🚫 Limitaciones y Consideraciones

### ✅ **Ventajas:**
- No necesita API key de Facebook
- Gratis (sin límites de API)
- Accede a datos públicos
- Extrae información visual (imágenes, videos)

### ⚠️ **Desventajas:**
- **Más lento** que una API oficial (30-60 segundos)
- **Frágil**: Si Facebook cambia el HTML, puede dejar de funcionar
- **Detección de bots**: Facebook puede bloquear si hace demasiadas peticiones
- **No es oficial**: Viola términos de servicio de Facebook (técnicamente)

### 🛡️ **Protecciones Implementadas:**
- User Agent realista (simula navegador normal)
- Tiempos de espera entre acciones
- Scroll gradual (simula comportamiento humano)
- Modo headless (menos recursos)

---

## 📊 Datos que Extrae

Por cada anuncio:

| Campo | Ejemplo | Descripción |
|-------|---------|-------------|
| `numero` | 1 | Orden en la lista |
| `pagina` | "Nike" | Nombre de la página |
| `logo_url` | "https://scontent.fbcdn.net/..." | Logo 40x40px |
| `id_biblioteca` | "1234567890123456" | ID único del anuncio |
| `fecha_inicio` | "14 oct 2025" | Fecha de circulación |
| `texto` | "Just Do It! 🏃‍♂️..." | Texto promocional |
| `imagenes` | 3 | Cantidad de imágenes |
| `imagenes_urls` | ["url1.jpg", "url2.jpg"] | URLs de imágenes |
| `video` | {poster, src} | Datos del video |
| `cta.domain` | "NIKE.COM" | Dominio del CTA |
| `cta.title` | "New Arrivals" | Título del botón |
| `cta.button` | "Shop Now" | Texto del botón |
| `cta.url` | "https://nike.com/..." | URL real de destino |

---

## 🔐 Seguridad y Ética

### ⚠️ **Importante:**
- Solo accede a **datos públicos** de Facebook Ads Library
- No hackea ni bypasa seguridad
- No accede a cuentas privadas
- Usa el mismo método que un humano navegando

### 📜 **Términos de Servicio:**
- Técnicamente viola TOS de Facebook (scraping automatizado)
- Úsalo solo para:
  - Investigación de mercado personal
  - Análisis de competencia
  - Fines educativos
- **NO** para:
  - Venta de datos
  - Spam
  - Competencia desleal

---

## 🚀 Casos de Uso

### ✅ **Usos Legítimos:**
1. **Análisis de competencia**
   - Ver qué anuncios usa tu competencia
   - Qué productos promocionan
   - Qué copy funciona mejor

2. **Investigación de mercado**
   - Tendencias en publicidad
   - Estrategias de pricing
   - Ofertas comunes

3. **Inspiración creativa**
   - Ideas para tus propios anuncios
   - Formatos que funcionan
   - CTAs efectivos

4. **Monitoreo de marca**
   - Ver quién usa tu marca
   - Detectar plagio de productos
   - Competidores directos

---

## 🔧 Mantenimiento

### Si deja de funcionar:
```
Razón común: Facebook cambió la estructura HTML
```

**Solución:**
1. Inspeccionar página de Facebook con DevTools
2. Identificar nuevos selectores CSS
3. Actualizar líneas 121-253 de `server.js`

### Ejemplo:
```javascript
// Antes
const logo = div.querySelector('img._8nqq');

// Después (si cambia)
const logo = div.querySelector('img.new-class-name');
```

---

## 📞 Soporte

Si tienes problemas:

1. **Servidor no inicia:** Verifica que puerto 3000 esté libre
2. **No encuentra anuncios:** Aumenta tiempo de espera (línea 88)
3. **Bloqueo de Facebook:** Espera 1 hora antes de reintentar
4. **Errores de selectores:** Facebook cambió HTML, actualizar código

---

## 🎓 Recursos para Aprender Más

- **Puppeteer Docs:** https://pptr.dev
- **Express.js:** https://expressjs.com
- **Web Scraping:** https://en.wikipedia.org/wiki/Web_scraping
- **Chrome DevTools:** https://developer.chrome.com/docs/devtools/

---

**✅ Conclusión:**

Esta herramienta es un **navegador automatizado** que visita Facebook Ads Library, 
extrae información visible públicamente, y la presenta en una interfaz bonita. 
Es como si alguien entrara manualmente a Facebook, copiara la información, y la 
pegara en una tabla... pero automático y en segundos. 🚀

