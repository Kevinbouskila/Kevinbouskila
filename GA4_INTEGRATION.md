# Intégration GA4 - Slash Tech Dashboard

## 📊 Vue d'ensemble

Le tableau de bord Slash Tech affiche les données analytiques de GA4 pour deux dimensions critiques :
- **Appareils** : Mobile, Desktop, Tablet (via User Agent agrégé)
- **Géolocalisation** : Top pays (via IP geolocation agrégée)

Les deux sources respectent le consentement utilisateur (GA4 consentant visitors uniquement).

---

## 🔐 Mise en place GA4 API

### 1. Authentification & Credentials

#### Option A : Service Account (recommandé pour backend)
```bash
# 1. Créer un Service Account dans Google Cloud Console
# - Project: Slash Tech Analytics
# - Service Account: analytics-dashboard-sa

# 2. Créer une clé JSON (credentials.json)
# - Télécharger depuis Cloud Console

# 3. Partager avec le Property ID
# - IAM Google Analytics > Editor
# - Ajouter l'email du Service Account
```

**credentials.json structure** :
```json
{
  "type": "service_account",
  "project_id": "slash-tech-analytics",
  "private_key_id": "...",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n",
  "client_email": "analytics-dashboard-sa@slash-tech.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "..."
}
```

#### Option B : OAuth 2.0 (pour frontend avec user consent)
```javascript
// 1. Créer un OAuth Client ID (Desktop ou Web)
// 2. Ajouter redirect_uri: http://localhost:3000/callback
// 3. Implémenter le flow de consentement
```

### 2. Property ID & Stream ID

```javascript
// À obtenir dans GA4 Admin > Property Settings
const PROPERTY_ID = '123456789';      // GA4 Property ID
const WEB_STREAM_ID = '987654321';     // Web Data Stream
```

---

## 🎯 Endpoints GA4 Data API

### 1. Device Analytics (Mobile, Desktop, Tablet)

**Endpoint** : `POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport`

```javascript
async function getDeviceData() {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [
          {
            startDate: '30daysAgo',
            endDate: 'today'
          }
        ],
        dimensions: [
          { name: 'deviceCategory' }  // mobile, desktop, tablet
        ],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' }
        ],
        orderBys: [
          {
            metric: { metricName: 'activeUsers' },
            desc: true
          }
        ]
      })
    }
  );

  const data = await response.json();
  // Response format:
  // {
  //   rows: [
  //     { dimensionValues: ['mobile'], metricValues: ['5840', '8923', '12000'] },
  //     { dimensionValues: ['desktop'], metricValues: ['4100', '6500', '8900'] },
  //     { dimensionValues: ['tablet'], metricValues: ['807', '1300', '1500'] }
  //   ]
  // }
  return formatDeviceData(data);
}
```

### 2. Geolocation Analytics (Pays)

**Endpoint** : `POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport`

```javascript
async function getGeolocationData() {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [
          {
            startDate: '30daysAgo',
            endDate: 'today'
          }
        ],
        dimensions: [
          { name: 'country' }  // 2-letter country code ou full name
        ],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' }
        ],
        orderBys: [
          {
            metric: { metricName: 'activeUsers' },
            desc: true
          }
        ],
        limit: 50  // Top 50 pays
      })
    }
  );

  const data = await response.json();
  // Response format:
  // {
  //   rows: [
  //     { dimensionValues: ['France'], metricValues: ['3240', '4500', '6800'] },
  //     { dimensionValues: ['United States'], metricValues: ['2180', '3100', '4950'] },
  //     ...
  //   ]
  // }
  return formatGeoData(data);
}
```

### 3. Device Details (iPhone, Samsung, Chrome, etc.)

```javascript
async function getDeviceDetails() {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [
          { name: 'deviceModel' }  // iPhone, Samsung Galaxy, etc.
        ],
        metrics: [
          { name: 'activeUsers' }
        ],
        orderBys: [
          { metric: { metricName: 'activeUsers' }, desc: true }
        ],
        limit: 20  // Top 20 devices
      })
    }
  );

  return await response.json();
}
```

---

## 💻 Implementation côté Backend (Node.js)

### Setup avec Google Analytics Admin API

```javascript
// server.js
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const fs = require('fs');

const credentials = JSON.parse(
  fs.readFileSync('credentials.json', 'utf-8')
);

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials
});

const PROPERTY_ID = '123456789';

async function getDeviceAnalytics() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      {
        startDate: '30daysAgo',
        endDate: 'today'
      }
    ],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' }
    ],
    orderBys: [
      {
        metric: { metricName: 'activeUsers' },
        desc: true
      }
    ]
  });

  const result = response.rows.map(row => ({
    device: row.dimensionValues[0].value,
    users: parseInt(row.metricValues[0].value),
    sessions: parseInt(row.metricValues[1].value)
  }));

  return result;
}

async function getGeolocationAnalytics() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      {
        startDate: '30daysAgo',
        endDate: 'today'
      }
    ],
    dimensions: [{ name: 'country' }],
    metrics: [
      { name: 'activeUsers' }
    ],
    orderBys: [
      {
        metric: { metricName: 'activeUsers' },
        desc: true
      }
    ],
    limit: 50
  });

  const result = response.rows.map(row => ({
    country: row.dimensionValues[0].value,
    users: parseInt(row.metricValues[0].value)
  }));

  return result;
}

app.get('/api/analytics/devices', async (req, res) => {
  try {
    const data = await getDeviceAnalytics();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/geolocation', async (req, res) => {
  try {
    const data = await getGeolocationAnalytics();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Installation

```bash
npm install @google-analytics/data
```

---

## 📱 Implementation côté Frontend

### Fetch des données du backend

```javascript
async function loadDashboardData() {
  try {
    // Appareils
    const deviceRes = await fetch('/api/analytics/devices');
    const deviceData = await deviceRes.json();
    renderDeviceCharts(deviceData);

    // Géolocalisation
    const geoRes = await fetch('/api/analytics/geolocation');
    const geoData = await geoRes.json();
    renderCountryCharts(geoData);
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

function renderDeviceCharts(data) {
  const labels = data.map(d => d.device);
  const values = data.map(d => d.users);

  // Update Chart.js
  deviceChart.data.labels = labels;
  deviceChart.data.datasets[0].data = values;
  deviceChart.update();
}
```

---

## ⚙️ Configuration GA4 pour la Collecte

### Activer la Collecte de Géolocalisation

**Étapes** :
1. GA4 Admin > Data Settings
2. Data Collection > Enable enhanced measurement
3. Cocher : "Engagement", "Video engagement", "Scroll tracking"
4. S'assurer que l'IP geolocation est activée

### Consentement RGPD

```javascript
// gtag.js configuration avec consentement
gtag('consent', 'default', {
  'analytics_storage': 'denied'
});

// Après consentement utilisateur
gtag('consent', 'update', {
  'analytics_storage': 'granted',
  'ad_storage': 'granted'
});

gtag('config', 'G-XXXXXXXXXX', {
  'anonymize_ip': false  // Nécessaire pour la géolocalisation
});
```

---

## 📋 Checklist d'Intégration

- [ ] Créer Service Account dans Google Cloud
- [ ] Télécharger credentials.json
- [ ] Obtenir Property ID depuis GA4 Admin
- [ ] Implémenter authentification GA4 API
- [ ] Créer endpoint `/api/analytics/devices`
- [ ] Créer endpoint `/api/analytics/geolocation`
- [ ] Connecter le dashboard.html aux API endpoints
- [ ] Tester les données en temps réel
- [ ] Mettre en place le cache (Redis, etc.) pour perf
- [ ] Ajouter la gestion des erreurs
- [ ] Déployer

---

## 🔒 Sécurité

- **Jamais** exposer les credentials.json côté frontend
- **Toujours** valider les requêtes sur le backend
- **Utiliser** CORS restrictif
- **Limiter** les requêtes via rate limiting
- **Logger** les accès aux données sensibles

---

## 📞 Support & Documentation

- [GA4 Data API Docs](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Google Analytics Node Library](https://github.com/googleapis/google-cloud-node/tree/main/packages/google-analytics-data)
- [GA4 Dimensions & Metrics](https://support.google.com/analytics/answer/9143382)
