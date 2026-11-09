/**
 * API Audience - Slash Tech Backoffice
 * Valide et expose les données GA4 réelles uniquement
 *
 * Installation:
 * npm install @google-analytics/data express cors dotenv
 *
 * Variables d'environnement:
 * GA4_PROPERTY_ID=123456789
 * GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const app = express();
const analyticsDataClient = new BetaAnalyticsDataClient();

app.use(cors());
app.use(express.json());

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

if (!PROPERTY_ID) {
    throw new Error('GA4_PROPERTY_ID environment variable is required');
}

// ============================================
// DATA VALIDATION FUNCTIONS
// ============================================

/**
 * Valide les données KPI brutes
 */
function validateKPIData(rawData) {
    try {
        if (!rawData || !rawData.rows) return null;

        const kpis = {
            visitors: 0,
            sessions: 0,
            pageviews: 0,
            countries: 0
        };

        // Vérification stricte des métriques
        rawData.rows.forEach(row => {
            const metrics = row.metricValues || [];

            if (metrics[0]) {
                const visitors = parseInt(metrics[0].value, 10);
                if (Number.isInteger(visitors) && visitors >= 0) {
                    kpis.visitors = visitors;
                }
            }

            if (metrics[1]) {
                const sessions = parseInt(metrics[1].value, 10);
                if (Number.isInteger(sessions) && sessions >= 0) {
                    kpis.sessions = sessions;
                }
            }

            if (metrics[2]) {
                const pageviews = parseInt(metrics[2].value, 10);
                if (Number.isInteger(pageviews) && pageviews >= 0) {
                    kpis.pageviews = pageviews;
                }
            }
        });

        // Vérification de cohérence
        if (kpis.visitors === 0 && kpis.sessions === 0) {
            console.warn('Warning: KPI data appears invalid - no visitors or sessions');
            return null;
        }

        return kpis;
    } catch (error) {
        console.error('KPI validation error:', error);
        return null;
    }
}

/**
 * Valide les données d'appareils
 */
function validateDeviceData(rawData) {
    try {
        if (!rawData || !rawData.rows) return null;

        const devices = [];
        let totalUsers = 0;

        // Première passe : calculer le total
        rawData.rows.forEach(row => {
            if (row.metricValues && row.metricValues[0]) {
                const users = parseInt(row.metricValues[0].value, 10);
                if (Number.isInteger(users) && users >= 0) {
                    totalUsers += users;
                }
            }
        });

        if (totalUsers === 0) {
            console.warn('Warning: Device data appears invalid - no users found');
            return null;
        }

        // Deuxième passe : créer le tableau validé
        rawData.rows.forEach(row => {
            const device = row.dimensionValues?.[0]?.value;
            const users = parseInt(row.metricValues[0].value, 10);

            // Validation stricte
            if (
                device &&
                typeof device === 'string' &&
                device.trim().length > 0 &&
                Number.isInteger(users) &&
                users >= 0
            ) {
                const percent = parseFloat(((users / totalUsers) * 100).toFixed(1));

                // Vérifier que le pourcentage est logique
                if (percent > 0 && percent <= 100) {
                    devices.push({
                        device: device.charAt(0).toUpperCase() + device.slice(1),
                        users,
                        percent
                    });
                }
            }
        });

        // Vérifier qu'on a au moins une catégorie d'appareils
        if (devices.length === 0) {
            console.warn('Warning: No valid device data found');
            return null;
        }

        return devices.sort((a, b) => b.users - a.users);
    } catch (error) {
        console.error('Device validation error:', error);
        return null;
    }
}

/**
 * Valide les données de pays
 */
function validateCountryData(rawData) {
    try {
        if (!rawData || !rawData.rows) return null;

        const countries = [];
        let totalUsers = 0;

        // Première passe : calculer le total
        rawData.rows.forEach(row => {
            if (row.metricValues && row.metricValues[0]) {
                const users = parseInt(row.metricValues[0].value, 10);
                if (Number.isInteger(users) && users >= 0) {
                    totalUsers += users;
                }
            }
        });

        if (totalUsers === 0) {
            console.warn('Warning: Country data appears invalid - no users found');
            return null;
        }

        // Deuxième passe : créer le tableau validé
        rawData.rows.forEach(row => {
            const country = row.dimensionValues?.[0]?.value;
            const users = parseInt(row.metricValues[0].value, 10);

            // Validation stricte
            if (
                country &&
                typeof country === 'string' &&
                country.trim().length > 0 &&
                Number.isInteger(users) &&
                users >= 0
            ) {
                const percent = parseFloat(((users / totalUsers) * 100).toFixed(1));

                // Vérifier que le pourcentage est logique
                if (percent > 0 && percent <= 100) {
                    countries.push({
                        country: country.trim(),
                        users,
                        percent
                    });
                }
            }
        });

        // Vérifier qu'on a au moins un pays
        if (countries.length === 0) {
            console.warn('Warning: No valid country data found');
            return null;
        }

        return countries.sort((a, b) => b.users - a.users);
    } catch (error) {
        console.error('Country validation error:', error);
        return null;
    }
}

// ============================================
// GA4 API CALLS
// ============================================

/**
 * Récupère les KPIs
 */
async function getKPIData(startDate, endDate) {
    try {
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' }
            ]
        });

        return validateKPIData(response);
    } catch (error) {
        console.error('GA4 KPI request error:', error);
        return null;
    }
}

/**
 * Récupère les données d'appareils
 */
async function getDeviceData(startDate, endDate) {
    try {
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
        });

        return validateDeviceData(response);
    } catch (error) {
        console.error('GA4 device request error:', error);
        return null;
    }
}

/**
 * Récupère le détail des appareils (modèles)
 */
async function getDeviceDetailsData(startDate, endDate) {
    try {
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'deviceModel' }],
            metrics: [{ name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            limit: 20
        });

        return validateDeviceData(response);
    } catch (error) {
        console.error('GA4 device details request error:', error);
        return null;
    }
}

/**
 * Récupère les données de pays
 */
async function getCountryData(startDate, endDate) {
    try {
        const [response] = await analyticsDataClient.runReport({
            property: `properties/${PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'country' }],
            metrics: [{ name: 'activeUsers' }],
            orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            limit: 50
        });

        return validateCountryData(response);
    } catch (error) {
        console.error('GA4 country request error:', error);
        return null;
    }
}

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /api/analytics/kpi
 * Retourne les KPIs validés
 */
app.get('/api/analytics/kpi', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validation des paramètres
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate required' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format (use YYYY-MM-DD)' });
        }

        if (start > end) {
            return res.status(400).json({ error: 'startDate must be before endDate' });
        }

        const data = await getKPIData(startDate, endDate);

        if (!data) {
            return res.status(404).json({
                error: 'No valid data found for this period',
                message: 'Vérifiez que GA4 contient des données pour cette plage de dates et que le consentement utilisateur est activé.'
            });
        }

        res.json(data);
    } catch (error) {
        console.error('KPI endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/analytics/devices
 * Retourne la répartition par appareil (validée)
 */
app.get('/api/analytics/devices', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate required' });
        }

        const data = await getDeviceData(startDate, endDate);

        if (!data) {
            return res.status(404).json({
                error: 'No valid device data found',
                message: 'Assurez-vous que GA4 a collecté des données de deviceCategory pour cette plage.'
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Devices endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/analytics/device-details
 * Retourne le détail des modèles d'appareils (validé)
 */
app.get('/api/analytics/device-details', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate required' });
        }

        const data = await getDeviceDetailsData(startDate, endDate);

        if (!data) {
            return res.status(404).json({
                error: 'No valid device details found',
                message: 'Assurez-vous que GA4 a collecté des données de deviceModel pour cette plage.'
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Device details endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/analytics/countries
 * Retourne les données par pays (validées)
 */
app.get('/api/analytics/countries', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate required' });
        }

        const data = await getCountryData(startDate, endDate);

        if (!data) {
            return res.status(404).json({
                error: 'No valid country data found',
                message: 'Vérifiez la configuration de géolocalisation IP dans GA4.'
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Countries endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        ga4_configured: !!PROPERTY_ID,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Slash Tech Audience API running on port ${PORT}`);
    console.log(`📊 GA4 Property ID: ${PROPERTY_ID}`);
    console.log(`🔗 Health check: GET http://localhost:${PORT}/api/health`);
});

module.exports = app;
