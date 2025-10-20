# 🚀 Guía de Despliegue en Render.com

## 📋 Requisitos Previos

1. ✅ Cuenta en [Render.com](https://render.com) (gratis)
2. ✅ Repositorio Git (GitHub, GitLab o Bitbucket)
3. ✅ Código subido al repositorio

---

## 🔧 Paso 1: Preparar el Repositorio

### 1.1 Crear repositorio en GitHub

```bash
# Inicializar Git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Deploy: Facebook Ads Scraper API"

# Conectar con GitHub (crea el repo primero en github.com)
git remote add origin https://github.com/TU_USUARIO/facebook-ads-scraper.git

# Subir código
git push -u origin main
```

---

## 🌐 Paso 2: Desplegar en Render.com

### 2.1 Crear nuevo Web Service

1. Ve a https://dashboard.render.com
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu cuenta de GitHub/GitLab
4. Selecciona el repositorio `facebook-ads-scraper`

### 2.2 Configurar el servicio

**Build & Deploy:**
- **Name:** `facebook-ads-scraper` (o el que prefieras)
- **Region:** Oregon (US West) - más cercano
- **Branch:** `main`
- **Root Directory:** (dejar vacío)
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Plan:**
- Selecciona **Free** (suficiente para empezar)
- ⚠️ Nota: El plan gratuito se duerme después de 15 min de inactividad

### 2.3 Variables de Entorno (opcional)

No necesitas configurar nada, pero si quieres optimizar:

```
NODE_ENV=production
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

### 2.4 Desplegar

1. Click en **"Create Web Service"**
2. Espera 5-10 minutos mientras Render:
   - Clona tu repositorio
   - Instala dependencias (`npm install`)
   - Descarga Chromium para Puppeteer
   - Inicia el servidor

---

## 🎯 Paso 3: Probar la API

### Tu URL será:
```
https://tu-servicio.onrender.com
```

### 3.1 Health Check
```bash
curl https://tu-servicio.onrender.com/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-20T12:00:00.000Z",
  "service": "Facebook Ads Scraper API"
}
```

### 3.2 Probar Scraping (GET)

**Desde el navegador:**
```
https://tu-servicio.onrender.com/api/scrape?keyword=nike.com&maxResults=10
```

**Con cURL:**
```bash
curl "https://tu-servicio.onrender.com/api/scrape?keyword=nike.com&maxResults=10"
```

### 3.3 Probar Scraping (POST)

```bash
curl -X POST https://tu-servicio.onrender.com/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"keyword": "nike.com", "maxResults": 10}'
```

---

## 📱 Paso 4: Consumir desde Otra Web

### 4.1 Con JavaScript (Fetch API)

```javascript
// GET Request
const keyword = 'nike.com';
const maxResults = 20;
const url = `https://tu-servicio.onrender.com/api/scrape?keyword=${keyword}&maxResults=${maxResults}`;

fetch(url)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Anuncios:', data.anuncios);
    console.log('📊 Total:', data.total);
  })
  .catch(error => console.error('❌ Error:', error));
```

```javascript
// POST Request
fetch('https://tu-servicio.onrender.com/api/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    keyword: 'nike.com',
    maxResults: 20
  })
})
  .then(response => response.json())
  .then(data => {
    console.log('✅ Anuncios:', data.anuncios);
  })
  .catch(error => console.error('❌ Error:', error));
```

### 4.2 Con jQuery (AJAX)

```javascript
$.ajax({
  url: 'https://tu-servicio.onrender.com/api/scrape',
  method: 'POST',
  contentType: 'application/json',
  data: JSON.stringify({
    keyword: 'nike.com',
    maxResults: 20
  }),
  success: function(data) {
    console.log('✅ Anuncios:', data.anuncios);
  },
  error: function(error) {
    console.error('❌ Error:', error);
  }
});
```

### 4.3 Con Axios

```javascript
import axios from 'axios';

axios.post('https://tu-servicio.onrender.com/api/scrape', {
  keyword: 'nike.com',
  maxResults: 20
})
  .then(response => {
    console.log('✅ Anuncios:', response.data.anuncios);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
```

### 4.4 Con PHP

```php
<?php
$url = 'https://tu-servicio.onrender.com/api/scrape';
$data = [
    'keyword' => 'nike.com',
    'maxResults' => 20
];

$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    ]
];

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);
$response = json_decode($result, true);

print_r($response['anuncios']);
?>
```

---

## 📊 Formato de Respuesta

### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "keyword": "nike.com",
  "total": 25,
  "fecha": "2025-10-20T12:00:00.000Z",
  "anuncios": [
    {
      "numero": 1,
      "pagina": "Nike",
      "logo_url": "https://scontent.fbcdn.net/...",
      "id_biblioteca": "1234567890123456",
      "fecha_inicio": "14 oct 2025",
      "texto": "Just Do It! 🏃‍♂️ New arrivals...",
      "imagenes": 3,
      "imagenes_urls": ["url1.jpg", "url2.jpg", "url3.jpg"],
      "video": {
        "poster": "thumbnail.jpg",
        "src": "video.mp4"
      },
      "cta": {
        "domain": "NIKE.COM",
        "title": "New Arrivals",
        "subtitle": "Free Shipping",
        "button": "Shop Now",
        "url": "https://nike.com/products/new"
      }
    }
  ]
}
```

### Error (400/500)

```json
{
  "success": false,
  "error": "Se requiere una palabra clave"
}
```

---

## ⚙️ Configuración Avanzada

### Aumentar Timeout (si es muy lento)

En `server.js` línea 98:
```javascript
await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos
```

### Cambiar Cantidad de Scrolls

En `server.js` línea 110:
```javascript
for (let i = 0; i < 10; i++) { // Más scrolls = más anuncios
```

---

## 🔥 Planes de Render.com

### Free Plan (Gratis)
- ✅ 750 horas/mes
- ✅ Suficiente para empezar
- ⚠️ Se duerme después de 15 min de inactividad
- ⚠️ Primera petición puede tardar 30-60 segundos (cold start)

### Starter Plan ($7/mes)
- ✅ Sin límite de horas
- ✅ No se duerme
- ✅ Mejor rendimiento
- ✅ Recomendado para producción

---

## 🐛 Troubleshooting

### ❌ Error: "This site can't be reached"
**Problema:** El servicio está iniciando o dormido
**Solución:** Espera 30-60 segundos y reintenta

### ❌ Error: "Puppeteer timeout"
**Problema:** Facebook tardó mucho en cargar
**Solución:** Aumenta el timeout en `server.js` línea 98

### ❌ Error: "No anuncios encontrados"
**Problema:** La keyword no tiene anuncios activos
**Solución:** Verifica en https://www.facebook.com/ads/library

### ❌ Error: "Memory limit exceeded"
**Problema:** Plan gratuito tiene límite de RAM
**Solución:** Reduce `maxResults` a máximo 30 anuncios

---

## 📈 Monitoreo

### Ver Logs en Tiempo Real

1. Ve a tu servicio en Render Dashboard
2. Click en **"Logs"**
3. Verás todos los console.log del servidor

### Métricas

- **Events:** Historial de despliegues
- **Metrics:** CPU, RAM, Requests
- **Settings:** Configuración del servicio

---

## 🔐 Seguridad (Opcional)

### Agregar API Key

En `server.js` después de línea 20:

```javascript
// Middleware de autenticación simple
app.use('/api/scrape', (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.API_KEY || 'mi-api-key-secreta';
    
    if (apiKey !== validKey) {
        return res.status(401).json({ error: 'API Key inválida' });
    }
    next();
});
```

Luego en Render → Environment Variables:
```
API_KEY=tu-clave-super-secreta-12345
```

Consumir:
```javascript
fetch('https://tu-servicio.onrender.com/api/scrape?keyword=nike.com', {
  headers: {
    'X-API-Key': 'tu-clave-super-secreta-12345'
  }
})
```

---

## 🎓 Recursos Adicionales

- 📖 [Documentación Render.com](https://render.com/docs)
- 🐕 [Puppeteer Docs](https://pptr.dev)
- 🌐 [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## ✅ Checklist Final

- [ ] Código subido a GitHub
- [ ] Servicio creado en Render.com
- [ ] Health check responde correctamente
- [ ] API scraping funciona (prueba con keyword)
- [ ] CORS configurado (permite peticiones desde tu web)
- [ ] URL guardada para consumir desde tu app

---

**🚀 ¡Listo! Tu API está en la nube y lista para usar.**

**URL de ejemplo final:**
```
https://facebook-ads-scraper-xyz.onrender.com/api/scrape?keyword=nike.com&maxResults=20
```

