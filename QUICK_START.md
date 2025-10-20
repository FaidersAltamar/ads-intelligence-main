# ⚡ Quick Start - Render.com

## 🚀 Despliegue en 3 Pasos

### 1️⃣ Subir a GitHub

```bash
git init
git add .
git commit -m "Deploy: Facebook Ads Scraper API"
git remote add origin https://github.com/TU_USUARIO/facebook-ads-scraper.git
git push -u origin main
```

### 2️⃣ Configurar Render.com

1. Ve a https://dashboard.render.com
2. **New +** → **Web Service**
3. Conecta GitHub y selecciona el repo
4. Configuración:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. **Create Web Service**

### 3️⃣ ¡Listo! Tu API está online

Tu URL será: `https://tu-servicio.onrender.com`

---

## 📡 Consumir la API

### Método 1: GET (desde navegador o URL)

```
https://tu-servicio.onrender.com/api/scrape?keyword=nike.com&maxResults=20
```

### Método 2: POST (desde JavaScript)

```javascript
fetch('https://tu-servicio.onrender.com/api/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keyword: 'nike.com',
    maxResults: 20
  })
})
  .then(res => res.json())
  .then(data => console.log(data.anuncios));
```

### Método 3: Desde HTML simple

```html
<script>
async function buscarAnuncios() {
  const url = 'https://tu-servicio.onrender.com/api/scrape?keyword=nike.com&maxResults=20';
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('Total:', data.total);
  data.anuncios.forEach(ad => {
    console.log(ad.pagina, ad.texto);
  });
}

buscarAnuncios();
</script>
```

---

## 🔍 Probar que funciona

1. **Health check:**
   ```
   https://tu-servicio.onrender.com/health
   ```
   Debe responder: `{"status":"ok",...}`

2. **Primer scraping:**
   ```
   https://tu-servicio.onrender.com/api/scrape?keyword=nike.com&maxResults=5
   ```
   ⏱️ Primera vez tarda 30-60 seg (cold start)
   ⏱️ Siguientes veces 20-40 seg

---

## 📋 Respuesta de la API

```json
{
  "success": true,
  "keyword": "nike.com",
  "total": 20,
  "fecha": "2025-10-20T12:00:00.000Z",
  "anuncios": [
    {
      "numero": 1,
      "pagina": "Nike",
      "logo_url": "https://...",
      "id_biblioteca": "1234567890123456",
      "fecha_inicio": "14 oct 2025",
      "texto": "Just Do It! 🏃‍♂️...",
      "imagenes": 3,
      "imagenes_urls": ["url1.jpg", "url2.jpg"],
      "video": { "poster": "...", "src": "..." },
      "cta": {
        "domain": "NIKE.COM",
        "title": "New Arrivals",
        "button": "Shop Now",
        "url": "https://nike.com/..."
      }
    }
  ]
}
```

---

## ⚠️ Importante

- ✅ **CORS habilitado** - Funciona desde cualquier dominio
- ⏱️ **Tarda 20-60 seg** - Es normal, está haciendo scraping real
- 💤 **Plan Free se duerme** - Primera petición tarda más
- 🔄 **Máximo 10 búsquedas/hora** - Para evitar bloqueos de Facebook

---

## 📚 Documentación Completa

- 📖 **DEPLOY_RENDER.md** - Guía completa de despliegue
- 📘 **API_DOCS.md** - Documentación técnica de la API
- 📄 **README.md** - Información general del proyecto
- 📝 **COMO_FUNCIONA.md** - Explicación técnica detallada

---

## 🆘 Problemas Comunes

**❌ "This site can't be reached"**
→ Espera 30-60 seg (cold start)

**❌ "No ads found"**
→ Verifica que la keyword existe en Facebook Ads Library

**❌ "Timeout"**
→ Reduce `maxResults` a 10-20

---

**✅ ¡Tu API está lista para usar!**

Reemplaza `tu-servicio.onrender.com` con tu URL real de Render 🚀

