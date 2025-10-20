# 🔧 Solución Error 502 - Diagnóstico Completo

## 🎯 **Cambios Aplicados**

He mejorado la configuración para solucionar el error 502:

### ✅ **Mejoras Implementadas:**

1. **Configuración optimizada de Chromium** - Argumentos específicos para Render.com
2. **Mejor manejo de errores** - Logs detallados para diagnosticar
3. **Endpoint de diagnóstico** - `/debug/chromium` para verificar instalación
4. **Timeout aumentado** - 60 segundos para launch de navegador

---

## 🚀 **Pasos para Verificar (IMPORTANTE)**

### **1️⃣ Esperar el Deploy (5-10 min)**

Ve a tu dashboard:
```
https://dashboard.render.com/web/srv-ctucpn5ds78s73evvpe0
```

Espera hasta que veas:
- 🟢 **"Live"** en la parte superior

---

### **2️⃣ Probar Endpoints en Orden**

#### **Test 1: Health Check (debe ser instantáneo)**
```
https://ads-intelligence-main-1.onrender.com/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "Facebook Ads Scraper API",
  "node_version": "v22.x.x",
  "memory": {
    "heapUsed": "50MB",
    "heapTotal": "100MB"
  }
}
```

✅ **Si funciona:** El servidor está respondiendo correctamente  
❌ **Si falla con 502:** El servidor no inició - **VER LOGS**

---

#### **Test 2: Diagnóstico de Chromium (debe ser rápido)**
```
https://ads-intelligence-main-1.onrender.com/debug/chromium
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "chromiumPath": "/tmp/chromium-...",
  "chromiumArgs": "50 argumentos",
  "nodeVersion": "v22.x.x",
  "platform": "linux",
  "arch": "x64"
}
```

✅ **Si funciona:** Chromium está instalado correctamente  
❌ **Si error:** Chromium no se pudo instalar - **VER LOGS**

---

#### **Test 3: Scraping Simple (tardará 60-90 segundos)**
```
https://ads-intelligence-main-1.onrender.com/api/scrape?keyword=nike.com&maxResults=3
```

⏱️ **Primera vez:** 60-90 segundos (normal - descarga chromium ~150MB)  
⏱️ **Segunda vez:** 20-40 segundos

**Respuesta esperada:**
```json
{
  "success": true,
  "keyword": "nike.com",
  "total": 3,
  "anuncios": [...]
}
```

✅ **Si funciona:** ¡TODO OK! 🎉  
❌ **Si timeout:** Aumentar `maxResults` o esperar más tiempo  
❌ **Si error 500:** Ver mensaje de error y logs

---

## 📊 **Revisar Logs de Render**

Si algún test falla, ve a:
```
Dashboard → Tu servicio → Logs
```

### **Logs Exitosos:**
```
==> Building...
npm install
added 192 packages in 20s
==> Build successful 🎉
==> Starting service with 'npm start'
============================================================
  FACEBOOK ADS SCRAPER - Servidor Puppeteer
============================================================
  Servidor corriendo en: http://localhost:10000
============================================================
```

### **Logs de Error - Problemas Comunes:**

#### ❌ **Error 1: Dependencias no instaladas**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solución:**
```bash
# En local
npm install
git add package-lock.json
git commit -m "Fix: dependencies"
git push
```

#### ❌ **Error 2: No encuentra chromium**
```
Error: Cannot find module '@sparticuz/chromium'
```

**Solución:** Render no instaló las deps correctamente
```
Dashboard → Settings → "Clear build cache & deploy"
```

#### ❌ **Error 3: Memoria insuficiente**
```
FATAL ERROR: Reached heap limit Allocation failed
```

**Solución:** Plan Free tiene 512MB RAM
1. Reduce `maxResults` a máximo 10 en el código
2. O upgrade a Starter ($7/mes = 2GB RAM)

#### ❌ **Error 4: Timeout al lanzar navegador**
```
Error: Timed out after 60000 ms while trying to connect to the browser
```

**Solución:** Primera vez tarda más
1. Espera 2 minutos completos
2. Reintenta la petición
3. La segunda será más rápida

---

## 🔧 **Soluciones Adicionales**

### **Opción 1: Rebuild Completo**

Si nada funciona:
```
Dashboard → Settings → "Clear build cache & deploy"
```

Esto:
- Limpia todo el caché
- Reinstala todas las dependencias desde cero
- Redescarga chromium
- ⏱️ Tarda 10-15 minutos

### **Opción 2: Reducir Recursos (Plan Free)**

Si el problema es memoria, edita `server.js`:

```javascript
// Línea 140 - Reducir tiempo de espera
await new Promise(resolve => setTimeout(resolve, 8000)); // de 12 a 8 seg

// Línea 150 - Menos scrolls
for (let i = 0; i < 3; i++) { // de 6 a 3 scrolls
```

Esto usa menos memoria pero extrae menos anuncios.

### **Opción 3: Upgrade a Starter Plan**

El plan Starter ($7/mes) tiene:
- ✅ 2GB RAM (vs 512MB)
- ✅ Sin cold starts
- ✅ Siempre activo
- ✅ Mejor rendimiento

---

## 📱 **Consumir API Una Vez Funcione**

### **Desde JavaScript:**
```javascript
// GET - Simple
fetch('https://ads-intelligence-main-1.onrender.com/api/scrape?keyword=nike.com&maxResults=10')
  .then(res => res.json())
  .then(data => console.log('Anuncios:', data.anuncios));

// POST - Recomendado
fetch('https://ads-intelligence-main-1.onrender.com/api/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ keyword: 'nike.com', maxResults: 10 })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### **Desde cURL:**
```bash
# Test rápido
curl https://ads-intelligence-main-1.onrender.com/health

# Scraping
curl "https://ads-intelligence-main-1.onrender.com/api/scrape?keyword=nike.com&maxResults=5"
```

---

## 🎓 **Entendiendo los Tiempos**

| Situación | Tiempo | Explicación |
|-----------|--------|-------------|
| Deploy inicial | 5-10 min | Instala dependencias, descarga chromium |
| Primera petición después deploy | 60-90 seg | Chromium se inicializa por primera vez |
| Segunda petición (servidor caliente) | 20-40 seg | Chromium ya está en memoria |
| Después de 15 min inactivo | 60 seg | Servidor se durmió (plan Free) |

---

## ✅ **Checklist de Verificación**

Verifica en orden:

- [ ] Deploy terminó y muestra "Live"
- [ ] `/health` responde con 200 OK
- [ ] `/debug/chromium` responde con status "ok"
- [ ] `/api/scrape?keyword=nike.com&maxResults=3` responde después de 60-90 seg
- [ ] Segunda petición es más rápida (20-40 seg)
- [ ] Interfaz web funciona correctamente

---

## 📞 **Si Aún No Funciona**

Comparte:
1. **Output de `/health`** (si responde)
2. **Output de `/debug/chromium`** (si responde)
3. **Logs completos del deploy** (copia todo desde Dashboard → Logs)
4. **Mensaje de error exacto** que aparece

Con esa información puedo diagnosticar exactamente qué está fallando.

---

## 🎯 **URLs de Referencia**

- **Dashboard:** https://dashboard.render.com/web/srv-ctucpn5ds78s73evvpe0
- **Web:** https://ads-intelligence-main-1.onrender.com/
- **Health:** https://ads-intelligence-main-1.onrender.com/health
- **Debug:** https://ads-intelligence-main-1.onrender.com/debug/chromium
- **API:** https://ads-intelligence-main-1.onrender.com/api/scrape?keyword=nike.com&maxResults=5

---

**✅ He subido mejoras al código. Render desplegará automáticamente en 5-10 minutos.**

**🔍 Sigue los pasos de verificación en orden cuando termine el deploy.**

**⏰ Avísame los resultados de cada test!** 🚀

