// ─────────────────────────────────────────────────────────────
//  AgroNXT — API Utility
//  All backend calls go through here.
//  Backend runs at http://localhost:5000
// ─────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://agronxt.onrender.com';

async function post(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function get(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────
//  MODEL 1 — Crop Recommender
//  Used on: /tools (Precision Crop Advisor page)
//
//  Input:
//    N, P, K     → soil nutrient values (numbers)
//    temperature → °C (auto-filled from weather)
//    humidity    → % (auto-filled from weather)
//    ph          → soil pH value
//    rainfall    → mm (auto-filled from weather)
//
//  Returns:
//    recommendations: [
//      { rank: 1, crop: "rice", confidence: 90.5 },
//      { rank: 2, crop: "maize", confidence: 6.2 },
//      { rank: 3, crop: "jute", confidence: 3.3 },
//    ]
// ─────────────────────────────────────────────────────────────
export async function predictCrop({ N, P, K, temperature, humidity, ph, rainfall }) {
  return post('/predict-crop', { N, P, K, temperature, humidity, ph, rainfall });
}

// ─────────────────────────────────────────────────────────────
//  MODEL 2A — Yield Predictor
//  Used on: /tools (after crop recommendation)
//
//  Input:
//    crop        → crop name e.g. "rice"
//    state       → state name e.g. "Odisha"
//    N, P, K, temperature, humidity, ph, rainfall
//    area_ha     → farm size in hectares
//    year        → current year e.g. 2026
//
//  Returns:
//    yield_kg_per_ha, yield_tonne_per_ha, yield_quintal_per_acre
// ─────────────────────────────────────────────────────────────
export async function predictYield({ crop, state, N, P, K, temperature, humidity, ph, rainfall, area_ha, year }) {
  return post('/predict-yield', { crop, state, N, P, K, temperature, humidity, ph, rainfall, area_ha, year: year || new Date().getFullYear() });
}

// ─────────────────────────────────────────────────────────────
//  MODEL 2B — ROI Calculator
//  Used on: /tools (ROI section), /dashboard
//
//  Input:
//    crop         → crop name e.g. "rice"
//    acres        → land size in acres
//    market_price → optional, uses default if not provided
//
//  Returns:
//    seed_cost, fertilizer_cost, labour_cost, irrigation_cost,
//    pesticide_cost, misc_cost, total_investment,
//    expected_yield_q, expected_revenue, net_profit,
//    roi_percent, is_profitable
// ─────────────────────────────────────────────────────────────
export async function calculateROI({ crop, acres, market_price }) {
  return post('/calculate-roi', { crop, acres, market_price });
}

// ─────────────────────────────────────────────────────────────
//  MODEL 3 — Season & State Advisor
//  Used on: /tools (location-based recommendation tab)
//
//  Input:
//    state    → e.g. "Odisha"
//    season   → "Kharif" | "Rabi" | "Zaid"
//    rainfall → mm
//    area_ha  → farm size in hectares
//    year     → current year
//
//  Returns:
//    top_crops: [{ rank, crop, score }]
// ─────────────────────────────────────────────────────────────
export async function recommendBySeason({ state, season, rainfall, area_ha, year }) {
  return post('/recommend-by-location', { state, season, rainfall, area_ha, year: year || new Date().getFullYear() });
}

// ─────────────────────────────────────────────────────────────
//  WEATHER — OpenWeatherMap via Flask
//  Used on: /dashboard, /tools (auto-fill weather values)
//
//  Input:
//    location → city name e.g. "Bhubaneswar"
//
//  Returns:
//    current: { temperature, humidity, rainfall_mm, wind_kmh, description }
//    forecast: [{ date, temp_max, temp_min, rainfall_mm, description }]
//    alerts:  [{ type, severity, message }]
// ─────────────────────────────────────────────────────────────
export async function getWeather(location) {
  return post('/weather', { location });
}

// ─────────────────────────────────────────────────────────────
//  UTILITY — Health check & available crops/states
// ─────────────────────────────────────────────────────────────
export async function healthCheck() {
  return get('/health');
}

export async function getAvailableCrops() {
  return get('/crops');
}

export async function getAvailableStates() {
  return get('/states');
}