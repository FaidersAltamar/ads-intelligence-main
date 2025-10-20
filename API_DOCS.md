# 📘 API Documentation - Facebook Ads Scraper

**Base URL:** `https://tu-servicio.onrender.com`

---

## 📍 Endpoints

### 1. Health Check

Verifica que el servidor esté funcionando.

**Endpoint:** `GET /health`

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-20T12:00:00.000Z",
  "service": "Facebook Ads Scraper API"
}
```

---

### 2. Scrape Ads (GET)

Extrae anuncios de Facebook Ads Library usando query parameters.

**Endpoint:** `GET /api/scrape`

**Parámetros:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `keyword` | string | ✅ Sí | - | Palabra clave o dominio a buscar |
| `maxResults` | number | ❌ No | 30 | Cantidad máxima de anuncios (1-100) |

**Ejemplo:**
```
GET /api/scrape?keyword=nike.com&maxResults=20
```

**Ejemplo con cURL:**
```bash
curl "https://tu-servicio.onrender.com/api/scrape?keyword=nike.com&maxResults=20"
```

**Ejemplo con JavaScript:**
```javascript
const keyword = 'nike.com';
const maxResults = 20;
fetch(`https://tu-servicio.onrender.com/api/scrape?keyword=${keyword}&maxResults=${maxResults}`)
  .then(res => res.json())
  .then(data => console.log(data));
```

---

### 3. Scrape Ads (POST)

Extrae anuncios de Facebook Ads Library usando JSON body.

**Endpoint:** `POST /api/scrape`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "keyword": "nike.com",
  "maxResults": 20
}
```

**Ejemplo con cURL:**
```bash
curl -X POST https://tu-servicio.onrender.com/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"keyword": "nike.com", "maxResults": 20}'
```

**Ejemplo con JavaScript (Fetch):**
```javascript
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
  .then(res => res.json())
  .then(data => console.log(data));
```

**Ejemplo con Axios:**
```javascript
import axios from 'axios';

axios.post('https://tu-servicio.onrender.com/api/scrape', {
  keyword: 'nike.com',
  maxResults: 20
})
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

---

## 📤 Respuestas

### ✅ Respuesta Exitosa (200 OK)

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
      "logo_url": "https://scontent.fbcdn.net/v/t1.6435-9/...",
      "id_biblioteca": "1234567890123456",
      "fecha_inicio": "14 oct 2025",
      "texto": "Just Do It! 🏃‍♂️ New arrivals are here...",
      "imagenes": 3,
      "imagenes_urls": [
        "https://scontent.fbcdn.net/image1.jpg",
        "https://scontent.fbcdn.net/image2.jpg",
        "https://scontent.fbcdn.net/image3.jpg"
      ],
      "video": {
        "poster": "https://scontent.fbcdn.net/thumbnail.jpg",
        "src": "https://video.fbcdn.net/video.mp4"
      },
      "cta": {
        "domain": "NIKE.COM",
        "title": "New Arrivals",
        "subtitle": "Free Shipping on Orders $50+",
        "button": "Shop Now",
        "url": "https://nike.com/products/new-arrivals"
      }
    }
  ]
}
```

### ❌ Error - Falta Keyword (400 Bad Request)

```json
{
  "error": "Se requiere una palabra clave",
  "usage": "GET /api/scrape?keyword=nike.com&maxResults=30"
}
```

### ❌ Error del Servidor (500 Internal Server Error)

```json
{
  "success": false,
  "error": "page.goto: Timeout 60000ms exceeded"
}
```

---

## 📊 Estructura de Datos

### Ad Object

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `numero` | number | Número secuencial del anuncio |
| `pagina` | string | Nombre de la página de Facebook |
| `logo_url` | string | URL del logo de la página (40x40px) |
| `id_biblioteca` | string | ID único del anuncio en Facebook Ads Library |
| `fecha_inicio` | string | Fecha de inicio de circulación |
| `texto` | string | Texto promocional del anuncio (max 400 chars) |
| `imagenes` | number | Cantidad de imágenes |
| `imagenes_urls` | string[] | Array de URLs de imágenes |
| `video` | object\|null | Datos del video si existe |
| `cta` | object\|null | Datos del Call to Action si existe |

### Video Object

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `poster` | string | URL de la miniatura del video |
| `src` | string | URL del video |

### CTA Object

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `domain` | string | Dominio del enlace (ej: "NIKE.COM") |
| `title` | string | Título del CTA |
| `subtitle` | string | Subtítulo del CTA |
| `button` | string | Texto del botón (ej: "Shop Now") |
| `url` | string | URL real de destino (decodificada) |

---

## ⏱️ Tiempos de Respuesta

| Escenario | Tiempo Estimado |
|-----------|-----------------|
| Cold Start (primer request después de inactividad) | 30-60 segundos |
| Warm (servidor activo) | 20-40 segundos |
| Con caché (futura implementación) | 1-5 segundos |

**Nota:** El scraping es un proceso que tarda porque:
1. Puppeteer abre un navegador completo
2. Navega a Facebook Ads Library
3. Espera que cargue el contenido (12 segundos)
4. Hace scroll 6 veces con pausas (12 segundos)
5. Extrae y procesa los datos

---

## 🚦 Rate Limits

### Plan Gratuito de Render.com
- Sin límite de requests por segundo
- 750 horas/mes de tiempo activo
- Se duerme después de 15 min de inactividad

### Recomendaciones
- ✅ Máximo 10 búsquedas por hora (evitar bloqueos de Facebook)
- ✅ Usar `maxResults` entre 10-30 para mejor rendimiento
- ✅ Implementar caché en tu aplicación
- ❌ No hacer requests masivos consecutivos

---

## 🔐 CORS

La API tiene CORS habilitado para **todos los orígenes** (`*`), por lo que puedes consumirla desde cualquier dominio.

```javascript
// Headers configurados:
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 📝 Ejemplos Completos

### React Component

```jsx
import React, { useState } from 'react';

function AdsSearcher() {
  const [keyword, setKeyword] = useState('');
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchAds = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://tu-servicio.onrender.com/api/scrape?keyword=${keyword}&maxResults=20`
      );
      const data = await response.json();
      setAds(data.anuncios);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        value={keyword} 
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Ej: nike.com"
      />
      <button onClick={searchAds} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
      
      {ads.map(ad => (
        <div key={ad.id_biblioteca}>
          <h3>{ad.pagina}</h3>
          <p>{ad.texto}</p>
          {ad.cta && <a href={ad.cta.url}>{ad.cta.button}</a>}
        </div>
      ))}
    </div>
  );
}

export default AdsSearcher;
```

### Vue.js Component

```vue
<template>
  <div>
    <input v-model="keyword" placeholder="Ej: nike.com" />
    <button @click="searchAds" :disabled="loading">
      {{ loading ? 'Buscando...' : 'Buscar' }}
    </button>
    
    <div v-for="ad in ads" :key="ad.id_biblioteca">
      <h3>{{ ad.pagina }}</h3>
      <p>{{ ad.texto }}</p>
      <a v-if="ad.cta" :href="ad.cta.url">{{ ad.cta.button }}</a>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      keyword: '',
      ads: [],
      loading: false
    }
  },
  methods: {
    async searchAds() {
      this.loading = true;
      try {
        const response = await fetch(
          `https://tu-servicio.onrender.com/api/scrape?keyword=${this.keyword}&maxResults=20`
        );
        const data = await response.json();
        this.ads = data.anuncios;
      } catch (error) {
        console.error('Error:', error);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
```

### PHP

```php
<?php
function getFacebookAds($keyword, $maxResults = 20) {
    $url = "https://tu-servicio.onrender.com/api/scrape";
    
    $data = json_encode([
        'keyword' => $keyword,
        'maxResults' => $maxResults
    ]);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($data)
    ]);
    
    $result = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($result, true);
}

// Usar la función
$response = getFacebookAds('nike.com', 20);
print_r($response['anuncios']);
?>
```

---

## 🐛 Troubleshooting

### Error: CORS Policy

**Problema:** `Access to fetch has been blocked by CORS policy`

**Solución:** Ya está configurado CORS en el servidor. Verifica que estás usando la URL correcta.

### Error: 504 Gateway Timeout

**Problema:** El scraping tardó más de 60 segundos

**Solución:** Reduce `maxResults` o aumenta el timeout en `server.js`

### Error: No ads found

**Problema:** La keyword no tiene anuncios activos

**Solución:** Verifica manualmente en https://www.facebook.com/ads/library

---

## 📞 Soporte

Para problemas técnicos, revisa:
- Logs de Render.com
- Documentación completa en `DEPLOY_RENDER.md`
- README.md del proyecto

---

**Versión:** 1.0.0  
**Última actualización:** Octubre 2025

