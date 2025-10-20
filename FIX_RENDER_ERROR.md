# 🔧 Arreglar Error 500 en Render.com

## ❌ Error Actual

```
Browser was not found at the configured executablePath
(/opt/render/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome)
```

**Causa:** Puppeteer no puede usar su Chrome descargado en Render.com

---

## ✅ Solución Aplicada

He actualizado tu código para usar **@sparticuz/chromium** que está optimizado para servidores cloud como Render.com.

### Cambios realizados:

1. ✅ **package.json** - Agregadas nuevas dependencias
2. ✅ **server.js** - Configurado para usar chromium optimizado
3. ✅ **render.yaml** - Actualizada configuración

---

## 🚀 Cómo Actualizar en Render.com

### Opción 1: Push Automático (Recomendado)

Si ya tienes el servicio desplegado:

```bash
# 1. Commit los cambios
git add .
git commit -m "Fix: Usar chromium optimizado para Render.com"

# 2. Push a GitHub
git push origin main

# 3. Render detectará los cambios y redesplegará automáticamente
```

⏱️ Espera 5-10 minutos mientras Render:
- Instala nuevas dependencias
- Descarga chromium optimizado
- Reinicia el servicio

### Opción 2: Manual Redeploy

Si el auto-deploy no está habilitado:

1. Ve a https://dashboard.render.com
2. Selecciona tu servicio `ads-intelligence-main-1`
3. Click en **"Manual Deploy"** → **"Deploy latest commit"**
4. Espera 5-10 minutos

---

## 🧪 Verificar que Funciona

### 1. Health Check

Abre en el navegador:
```
https://ads-intelligence-main-1.onrender.com/health
```

Debe responder:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "Facebook Ads Scraper API"
}
```

### 2. Test Scraping (GET)

```
https://ads-intelligence-main-1.onrender.com/api/scrape?keyword=nike.com&maxResults=5
```

⏱️ Primera vez tarda 30-60 segundos (cold start + descarga chromium)

### 3. Test desde la Interfaz Web

```
https://ads-intelligence-main-1.onrender.com/
```

Busca: `nike.com` con `5` anuncios

---

## 📊 Ver Logs en Tiempo Real

Para ver qué está pasando:

1. Ve a tu servicio en Render Dashboard
2. Click en **"Logs"** (menú izquierdo)
3. Debes ver:
   ```
   [PUPPETEER] Iniciando navegador headless...
   [NAVEGANDO] Abriendo Facebook Ads Library...
   [ESPERANDO] Cargando contenido...
   [COMPLETADO] X anuncios extraidos
   ```

---

## ⚠️ Notas Importantes

### Primera Petición Después del Deploy

- ⏱️ **Tarda 60-90 segundos** (cold start + download chromium)
- 💾 Chromium se descarga la primera vez (~150MB)
- 🚀 Peticiones siguientes: 20-40 segundos

### Plan Free de Render

- 💤 Se duerme después de 15 min sin actividad
- 🔄 Primera petición después de dormir: 60 segundos
- ✅ Solución: Upgrade a plan Starter ($7/mes) para mantenerlo activo

---

## 🐛 Troubleshooting

### ❌ Sigue sin funcionar después del deploy

**Verifica los logs:**
```
Dashboard → Tu servicio → Logs
```

Busca errores como:
- `npm ERR!` → Problema instalando dependencias
- `Error: Cannot find module` → Falta alguna dependencia
- `ENOSPC` → Sin espacio (poco probable)

**Solución:** Rebuild desde cero
```
Dashboard → Settings → "Clear build cache & deploy"
```

### ❌ Error: Memory limit exceeded

**Problema:** Plan Free tiene límite de 512MB RAM

**Soluciones:**
1. Reduce `maxResults` a máximo 10-20 anuncios
2. Upgrade a plan Starter (512MB → 2GB)

### ❌ Timeout después de 60 segundos

**Problema:** Facebook tarda mucho en cargar

**Solución en server.js línea 130:**
```javascript
// Cambiar de 12000 a 20000 (20 segundos)
await new Promise(resolve => setTimeout(resolve, 20000));
```

---

## 📦 Dependencias Nuevas Instaladas

```json
{
  "puppeteer": "^23.10.4",           // Original
  "puppeteer-core": "^23.10.4",      // ✨ Nuevo
  "@sparticuz/chromium": "^131.0.0"  // ✨ Nuevo (Chromium optimizado)
}
```

**@sparticuz/chromium** características:
- ✅ Compilado específicamente para AWS Lambda y servidores cloud
- ✅ Tamaño reducido (~150MB vs ~300MB)
- ✅ Compatible con Render.com, Vercel, Railway, etc.
- ✅ Mantenido activamente por la comunidad

---

## 🎓 Más Información

### Por qué falló el Puppeteer original?

Render.com usa contenedores Linux efímeros. El Chrome que descarga Puppeteer:
1. Se descarga en `/opt/render/.cache/`
2. Necesita permisos especiales de Linux
3. No encuentra algunas librerías del sistema
4. El path cambia en cada deploy

### Por qué funciona @sparticuz/chromium?

1. Está pre-compilado para Linux x64
2. Incluye todas las librerías necesarias
3. Se auto-descarga en el primer uso
4. Funciona en ambientes serverless/cloud

---

## ✅ Checklist de Verificación

Después del deploy, verifica:

- [ ] Health check responde (200 OK)
- [ ] Logs muestran servidor iniciado
- [ ] Primera petición tarda ~60 seg pero funciona
- [ ] Segunda petición tarda ~30 seg
- [ ] Interfaz web carga correctamente
- [ ] Scraping devuelve anuncios reales

---

## 📞 Si Aún No Funciona

1. **Comparte los logs completos** del deploy
2. **Prueba en local** primero:
   ```bash
   npm install
   npm start
   ```
3. **Verifica variables de entorno** en Render:
   - `NODE_ENV=production`
   - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`

---

## 🚀 URLs de Tu Servicio

- **Web:** https://ads-intelligence-main-1.onrender.com/
- **Health:** https://ads-intelligence-main-1.onrender.com/health
- **API GET:** https://ads-intelligence-main-1.onrender.com/api/scrape?keyword=nike.com&maxResults=10
- **API POST:** https://ads-intelligence-main-1.onrender.com/api/scrape

---

**✅ Ahora tu API debería funcionar correctamente en Render.com!**

Commit y push los cambios, Render redesplegará automáticamente 🎉

