# Guide d'Intégration - Section Audience (Backoffice)

## 📋 Vue d'ensemble

La section "Audience" du backoffice Slash Tech affiche les données GA4 réelles avec :
- ✅ **Validation stricte** des données avant affichage
- ✅ **Sélecteur de plage de dates** interactif
- ✅ **Visualisations** d'appareils et géolocalisation
- ✅ **Aucune donnée fictive** - GA4 uniquement
- ✅ **Messages d'erreur** clairs en cas de données manquantes

---

## 🚀 Installation & Déploiement

### 1. Prérequis

```bash
# Node.js 14+
node --version

# npm
npm --version
```

### 2. Installation des dépendances

```bash
npm install express cors dotenv @google-analytics/data
```

### 3. Configuration des variables d'environnement

Créer un fichier `.env` :

```env
# GA4 Configuration
GA4_PROPERTY_ID=123456789
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Server
PORT=3000
NODE_ENV=production
```

**Important** : Jamais versionner le fichier `.env` ou `credentials.json` !

```bash
echo ".env" >> .gitignore
echo "credentials.json" >> .gitignore
```

### 4. Obtenir les credentials GA4

1. **Google Cloud Console** → Créer/Sélectionner projet
2. **Activer Google Analytics Data API** v1 beta
3. **Créer Service Account** :
   - IAM & Admin → Service Accounts
   - Créer nouveau compte
   - Télécharger JSON key
   - Renommer en `credentials.json`

4. **Partager la Property GA4** :
   - GA4 Admin → Property Access Management
   - Ajouter email du Service Account avec rôle "Editor"

### 5. Lancer le serveur

```bash
node api-audience.js
# Output: ✅ Slash Tech Audience API running on port 3000
```

Tester la connexion :
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok","ga4_configured":true,"timestamp":"..."}
```

---

## 🧪 Tests des Endpoints

### Test KPI
```bash
curl "http://localhost:3000/api/analytics/kpi?startDate=2024-10-01&endDate=2024-10-31"

# Response (validée):
{
  "visitors": 12847,
  "sessions": 18392,
  "pageviews": 28500,
  "countries": 47
}
```

### Test Devices
```bash
curl "http://localhost:3000/api/analytics/devices?startDate=2024-10-01&endDate=2024-10-31"

# Response (validée):
[
  {"device": "Mobile", "users": 7450, "percent": 58.0},
  {"device": "Desktop", "users": 4500, "percent": 35.0},
  {"device": "Tablet", "users": 900, "percent": 7.0}
]
```

### Test Countries
```bash
curl "http://localhost:3000/api/analytics/countries?startDate=2024-10-01&endDate=2024-10-31"

# Response (validée):
[
  {"country": "France", "users": 3240, "percent": 25.2},
  {"country": "United States", "users": 2180, "percent": 17.0},
  ...
]
```

---

## 🎨 Intégration Frontend

### 1. Servir `audience-section.html`

#### Option A : Directement dans Express
```javascript
app.use(express.static('public'));
```

Placer `audience-section.html` dans `public/` folder.

#### Option B : Intégrer dans une SPA existante (React)

```javascript
// À adapter selon votre stack (Next.js, Vue, etc.)

import { useEffect, useState } from 'react';

function AudienceSection() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [kpiData, setKpiData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  async function fetchData() {
    try {
      const params = new URLSearchParams({ startDate, endDate });
      
      // Valider d'abord
      if (!startDate || !endDate) return;

      const [kpis, devices, countries] = await Promise.all([
        fetch(`/api/analytics/kpi?${params}`).then(r => r.json()),
        fetch(`/api/analytics/devices?${params}`).then(r => r.json()),
        fetch(`/api/analytics/countries?${params}`).then(r => r.json())
      ]);

      setKpiData({ kpis, devices, countries });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="audience-section">
      <h2>📊 Audience</h2>
      
      {/* Date Range Picker */}
      <div className="date-filter">
        <input 
          type="date" 
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span>→</span>
        <input 
          type="date" 
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {/* Erreurs */}
      {error && <div className="error">{error}</div>}

      {/* KPIs */}
      {kpiData && (
        <div className="kpi-grid">
          <KpiCard label="Visiteurs" value={kpiData.kpis.visitors} />
          <KpiCard label="Sessions" value={kpiData.kpis.sessions} />
          <KpiCard label="Pages Vues" value={kpiData.kpis.pageviews} />
          <KpiCard label="Pays Actifs" value={kpiData.kpis.countries} />
        </div>
      )}

      {/* Charts */}
      {kpiData && (
        <div>
          <DeviceChart data={kpiData.devices} />
          <CountryChart data={kpiData.countries} />
        </div>
      )}
    </div>
  );
}

export default AudienceSection;
```

---

## ✅ Checklist de Validation

- [ ] Credentials GA4 correctement configurés
- [ ] Service Account a accès à la GA4 Property
- [ ] Serveur démarre sans erreurs
- [ ] `/api/health` retourne `status: ok`
- [ ] Tests d'endpoints passent
- [ ] Données affichées correspondent à GA4
- [ ] Date picker fonctionne
- [ ] Pas de données fictives affichées
- [ ] Messages d'erreur clairs
- [ ] Cache de 5min activé
- [ ] CORS configuré correctement

---

## 🔍 Vérification des Données

### 1. Comparaison avec GA4 Console

Ouvrir GA4 Admin → Explore ou Reporting, puis comparer :
- Visiteurs uniques → KPI `visitors`
- Sessions → KPI `sessions`
- Pages vues → KPI `pageviews`
- Device Category → Device chart
- Country → Country chart

**Les nombres doivent être identiques.**

### 2. Validation stricte

Si une donnée ne passe pas la validation :
- L'endpoint retourne une erreur 404
- Le frontend affiche "Aucune donnée disponible"
- Un message explique le problème

### 3. Logs de validation

Vérifier la console Node.js :

```
Error fetching /api/analytics/kpi
Warning: Device data appears invalid - no users found
GA4 device request error: ...
```

---

## 🚨 Dépannage

### Problème : "No valid data found"

**Cause** : GA4 n'a pas de données pour cette plage.

**Solutions** :
1. Vérifier que GA4 collecte des données (Real-Time report)
2. Augmenter la plage de dates
3. Vérifier que le consentement utilisateur est activé

### Problème : "Service Account authentication failed"

**Cause** : `credentials.json` manquant ou invalide.

**Solutions** :
```bash
# Vérifier le chemin
echo $GOOGLE_APPLICATION_CREDENTIALS

# Vérifier les permissions
ls -la /path/to/credentials.json
```

### Problème : CORS errors

**Solution** : Vérifier que le backend et frontend sont sur le même domaine ou que CORS est correctement configuré :

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### Problème : "Invalid date format"

**Solution** : Utiliser le format `YYYY-MM-DD` :
```
✓ 2024-10-15
✗ 10/15/2024
✗ 15-10-2024
```

---

## 📊 Structure des Données

### KPI Response
```typescript
{
  visitors: number;        // Utilisateurs actifs uniques
  sessions: number;        // Sessions totales
  pageviews: number;       // Vues de pages
  countries: number;       // Pays uniques (optionnel)
}
```

### Device Response
```typescript
Array<{
  device: string;         // "Mobile", "Desktop", "Tablet"
  users: number;          // Utilisateurs uniques
  percent: number;        // 0-100
}>
```

### Country Response
```typescript
Array<{
  country: string;        // Nom du pays
  users: number;          // Utilisateurs uniques
  percent: number;        // 0-100
}>
```

---

## 🔐 Sécurité

### Points critiques

1. **Jamais** exposer les credentials côté frontend
2. **Toujours** passer par le backend Node.js
3. **Valider** tous les inputs date (startDate/endDate)
4. **Limiter** les requêtes avec rate-limiting (optionnel)

### Exemple rate-limiting (optionnel)

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.get('/api/analytics/*', limiter, (req, res) => { ... });
```

---

## 📞 Support

Ressources officielles :
- [GA4 Data API Docs](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Google Analytics Node.js Library](https://github.com/googleapis/google-cloud-node/tree/main/packages/google-analytics-data)
- [GA4 Dimensions & Metrics Reference](https://support.google.com/analytics/answer/9143382)

---

## 📝 Notes de Maintenance

- **Données mises en cache 5 min** : ajuster si nécessaire dans `audience-section.html` (DATA_VALIDATION.cacheExpiry)
- **Limite de pays : 50** : modifier `limit: 50` dans `api-audience.js` si besoin
- **Validation stricte** : aucune donnée bidirectionnelle (mock ou fallback) n'est affichée

---

## Déploiement en Production

### Heroku

```bash
heroku create slash-tech-audience
heroku config:set GA4_PROPERTY_ID=123456789
heroku config:set GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Ou via fichier de config
heroku config:set GOOGLE_APPLICATION_CREDENTIALS="$(cat credentials.json)"

git push heroku main
```

### Vercel (serverless)

Créer `vercel.json` :
```json
{
  "buildCommand": "npm install",
  "env": {
    "GA4_PROPERTY_ID": "@ga4_property_id",
    "GOOGLE_APPLICATION_CREDENTIALS": "@google_credentials"
  }
}
```

---

**✅ Section Audience prête pour la production !**
