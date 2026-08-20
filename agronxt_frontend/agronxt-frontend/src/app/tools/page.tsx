"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { predictCrop, calculateROI } from "@/lib/api";

const fadeUpConfig = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0] as const }, 
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] as const } }, 
};

const CROP_META: Record<string, { duration: string; risk: string; emoji: string }> = {
  rice:        { duration: "120 Days", risk: "Low-Med",  emoji: "🌾" },
  wheat:       { duration: "130 Days", risk: "Low",      emoji: "🌿" },
  maize:       { duration: "90 Days",  risk: "Low",      emoji: "🌽" },
  cotton:      { duration: "180 Days", risk: "Medium",   emoji: "☁️" },
  sugarcane:   { duration: "365 Days", risk: "Low-Med",  emoji: "🎋" },
  jute:        { duration: "120 Days", risk: "Low",      emoji: "🌱" },
  coffee:      { duration: "730 Days", risk: "Medium",   emoji: "☕" },
  banana:      { duration: "365 Days", risk: "Low",      emoji: "🍌" },
  mango:       { duration: "180 Days", risk: "Low",      emoji: "🥭" },
  coconut:     { duration: "365 Days", risk: "Low",      emoji: "🥥" },
  papaya:      { duration: "270 Days", risk: "Low",      emoji: "🍈" },
  orange:      { duration: "365 Days", risk: "Low-Med",  emoji: "🍊" },
  apple:       { duration: "180 Days", risk: "Medium",   emoji: "🍎" },
  grapes:      { duration: "150 Days", risk: "Medium",   emoji: "🍇" },
  watermelon:  { duration: "80 Days",  risk: "Low",      emoji: "🍉" },
  muskmelon:   { duration: "80 Days",  risk: "Low",      emoji: "🍈" },
  pomegranate: { duration: "180 Days", risk: "Low-Med",  emoji: "🍎" },
  chickpea:    { duration: "100 Days", risk: "Low",      emoji: "🫘" },
  kidneybeans: { duration: "90 Days",  risk: "Low",      emoji: "🫘" },
  lentil:      { duration: "100 Days", risk: "Low",      emoji: "🫘" },
  blackgram:   { duration: "80 Days",  risk: "Low",      emoji: "🫘" },
  mungbean:    { duration: "65 Days",  risk: "Low",      emoji: "🫘" },
  mothbeans:   { duration: "65 Days",  risk: "Low",      emoji: "🫘" },
  pigeonpeas:  { duration: "150 Days", risk: "Low",      emoji: "🫘" },
  default:     { duration: "120 Days", risk: "Medium",   emoji: "🌱" },
};

function getCropMeta(crop?: string) {
  return CROP_META[crop?.toLowerCase() || ""] || CROP_META.default;
}

function capitalize(str?: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatINR(n?: number | null) {
  if (n === null || n === undefined) return "—";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export default function ToolsPage() {
  // --- GLOBAL TOOL STATE ---
  const [activeTool, setActiveTool] = useState<"ADVISOR" | "VISION">("ADVISOR");

  // --- CROP ADVISOR STATE ---
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    N: "", P: "", K: "", ph: "",
    temperature: "", humidity: "", rainfall: "",
    location: "", acres: "1",
  });

  const [recommendations, setRecommendations]   = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop]         = useState<any>(null);
  const [roiResult, setRoiResult]               = useState<any>(null);
  const [weatherData, setWeatherData]           = useState<any>(null);

  const [loadingWeather, setLoadingWeather]     = useState(false);
  const [loadingSoil, setLoadingSoil]           = useState(false);
  const [loadingAnalyze, setLoadingAnalyze]     = useState(false);
  const [loadingROI, setLoadingROI]             = useState(false);
  const [error, setError]                       = useState("");

  // --- DISEASE VISION STATE ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [visionResult, setVisionResult] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // ── Auto-fill weather ────────────────────────────────────────
  const fetchWeather = async () => {
    if (!form.location.trim()) return;
    setLoadingWeather(true);
    setError("");
    
    try {
      const res = await fetch("http://localhost:8000/weather/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: form.location })
      });
      
      const responseData = await res.json();
      if (responseData.status === "ok" && responseData.data?.current) {
        const w = responseData.data.current;
        const realAnnualRain = responseData.data.annual_rainfall > 0 
          ? responseData.data.annual_rainfall.toString() 
          : ""; 

        setWeatherData({
          temperature: w.temperature_2m,
          humidity: w.relative_humidity_2m,
          rainfall_mm: realAnnualRain
        });
        
        setForm((p) => ({
          ...p,
          temperature: w.temperature_2m.toString(),
          humidity: w.relative_humidity_2m.toString(),
          rainfall: realAnnualRain
        }));
      }
      else {
        throw new Error(responseData.detail || "Failed to fetch weather.");
      }
    } catch (err) {
      setError("Could not fetch climate data for this city. Please enter values manually.");
    } finally {
      setLoadingWeather(false);
    }
  };

  // ── Auto-fill Soil via Satellite ─────────────────────────────
  const fetchSoil = async () => {
    if (!form.location.trim()) {
      setError("Please enter a location in the Field Location section first.");
      return;
    }
    setLoadingSoil(true);
    setError("");

    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${form.location}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
         throw new Error("Location not found for soil estimation.");
      }
      
      const lat = geoData.results[0].latitude;
      const lng = geoData.results[0].longitude;

      const res = await fetch("http://localhost:8000/soil/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }) 
      });
      
      const responseData = await res.json();
      
      if (responseData.status === "ok") {
        const s = responseData.data;
        setForm((p) => ({
          ...p,
          N: s.N?.toString() || p.N,
          P: s.P?.toString() || p.P,
          K: s.K?.toString() || p.K,
          ph: s.ph?.toString() || p.ph,
        }));
      } else {
        setError("Failed to fetch satellite soil data. You may enter it manually.");
      }
    } catch (err: any) {
      console.error("Soil fetch error:", err);
      setError(err.message || "Could not fetch satellite soil data. Please enter values manually.");
    } finally {
      setLoadingSoil(false);
    }
  };
        
  const handleAnalyze = async () => {
    const { N, P, K, ph, temperature, humidity, rainfall } = form;
    if (!N || !P || !K || !ph || !temperature || !humidity || !rainfall) {
      setError("Please fill all soil and weather fields before analyzing.");
      return;
    }
    setLoadingAnalyze(true);
    setError("");
    try {
      const result = await predictCrop({
        N: parseFloat(N), P: parseFloat(P), K: parseFloat(K),
        ph: parseFloat(ph), temperature: parseFloat(temperature),
        humidity: parseFloat(humidity), rainfall: parseFloat(rainfall),
      });
      if (result.recommendations?.length) {
        setRecommendations(result.recommendations);
        setSelectedCrop(result.recommendations[0]);
        setStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError("No recommendations returned. Check your input values.");
      }
    } catch {
      setError("Analysis failed. Make sure the backend is running.");
    } finally {
      setLoadingAnalyze(false);
    }
  };

  const handleGetROI = async (cropData: { crop: string; confidence?: number; rank?: number }) => {
    setSelectedCrop(cropData);
    setLoadingROI(true);
    setError("");
    try {
      const result = await calculateROI({
        crop: cropData.crop,
        acres: parseFloat(form.acres) || 1,
      } as any); 
      
      if (result.net_profit !== undefined) {
        setRoiResult(result);
        setStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(result.error || "ROI calculation failed.");
      }
    } catch {
      setError("ROI calculation failed. Make sure the backend is running.");
    } finally {
      setLoadingROI(false);
    }
  };

  const goToStep = (n: number) => {
    if (n < step) setStep(n);
  };

  // ── DISEASE VISION LOGIC ────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setVisionImage(imageUrl);
      setVisionResult(null); 
      runVisionScan();
    }
  };

  const runVisionScan = () => {
    setIsScanning(true);
    // Simulate ML Backend processing time
    setTimeout(() => {
      setIsScanning(false);
      setVisionResult({
        disease: "Early Blight (Alternaria solani)",
        confidence: 96.4,
        severity: "High Risk",
        symptoms: "Concentric dark rings or 'bullseye' spots on older leaves, often surrounded by a yellow halo. Can lead to severe defoliation and yield loss.",
        solutions: {
          chemical: "Apply broad-spectrum fungicides containing Chlorothalonil, Mancozeb, or Copper. Rotate active ingredients to prevent resistance.",
          organic: "Remove and burn infected leaves immediately. Apply organic copper fungicides or bio-fungicides like Bacillus subtilis.",
          prevention: "Implement 3-year crop rotation. Ensure wide plant spacing for airflow. Use drip irrigation instead of overhead sprinklers."
        }
      });
    }, 3000);
  };

  const resetVision = () => {
    setVisionImage(null);
    setVisionResult(null);
    setIsScanning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const steps = [
    { n: 1, label: "Soil Analysis" },
    { n: 2, label: "Recommendations" },
    { n: 3, label: "ROI Forecast" },
  ];

  return (
    <div className="bg-surface dark:bg-inverse-surface text-on-surface dark:text-white transition-colors duration-300 min-h-screen">
      <main className="pt-28 pb-24 px-6 md:px-8 max-w-7xl mx-auto">

        {/* Dynamic Header & Responsive Tool Toggle */}
        <motion.header {...fadeUpConfig} className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex-1">
              <span className="text-primary dark:text-primary-fixed-dim font-label text-[0.75rem] uppercase tracking-[0.05em] font-bold">
                Intelligence Suite
              </span>
              <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface dark:text-white mt-2 mb-4 transition-all">
                {activeTool === "ADVISOR" ? "Precision Crop Advisor" : "Disease Vision AI"}
              </h1>
              <p className="text-lg text-on-surface-variant dark:text-[#c0c9bb] max-w-2xl font-body leading-relaxed transition-all">
                {activeTool === "ADVISOR" 
                  ? "Leverage soil data and historical yield analytics to determine your field's optimal cultivation path and projected profitability."
                  : "Upload a photo of a struggling crop leaf. Our Computer Vision model will instantly diagnose the pathogen and prescribe localized treatments."}
              </p>
            </div>

            {/* Mobile-Responsive Native Toggle */}
            <div className="w-full md:w-auto bg-surface-container-high dark:bg-[#1b1c1c] p-1.5 rounded-full flex relative shadow-inner shrink-0 max-w-[400px]">
              <button 
                onClick={() => setActiveTool("ADVISOR")} 
                className={`flex-1 relative z-10 py-3 md:px-6 rounded-full text-xs sm:text-sm font-bold transition-colors duration-300 ${activeTool === "ADVISOR" ? "text-white dark:text-[#002204]" : "text-on-surface-variant dark:text-[#c0c9bb] hover:text-on-surface dark:hover:text-white"}`}
              >
                Crop Advisor
              </button>
              <button 
                onClick={() => setActiveTool("VISION")} 
                className={`flex-1 relative z-10 py-3 md:px-6 rounded-full text-xs sm:text-sm font-bold transition-colors duration-300 ${activeTool === "VISION" ? "text-white dark:text-[#002204]" : "text-on-surface-variant dark:text-[#c0c9bb] hover:text-on-surface dark:hover:text-white"}`}
              >
                Disease Vision
              </button>
              
              {/* Sliding Background */}
              <div 
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-primary dark:bg-primary-fixed-dim rounded-full shadow-md transition-transform duration-500 ease-in-out`}
                style={{ 
                  transform: activeTool === "ADVISOR" ? "translateX(0%)" : "translateX(100%)", 
                  left: "6px"
                }}
              />
            </div>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          
          {/* =========================================================
              TOOL 1: PRECISION CROP ADVISOR 
          ========================================================= */}
          {activeTool === "ADVISOR" && (
            <motion.div key="advisor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Sidebar ───────────────────────────────────────── */}
                <aside className="lg:col-span-3">
                  <div className="bg-surface-container-low dark:bg-[#1b1c1c] rounded-[2rem] p-8 sticky top-28 border border-transparent dark:border-white/5 editorial-shadow">
                    <div className="space-y-8">
                      {steps.map((s) => {
                        const active   = step === s.n;
                        const done     = step > s.n;
                        const upcoming = step < s.n;
                        return (
                          <button
                            key={s.n}
                            onClick={() => goToStep(s.n)}
                            className={`flex items-center gap-4 w-full text-left transition-opacity ${upcoming ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}`}
                            disabled={upcoming}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors ${
                              active ? "bg-primary dark:bg-primary-fixed-dim text-on-primary dark:text-[#002204]" :
                              done   ? "bg-secondary dark:bg-secondary-fixed text-on-secondary dark:text-[#002113]" :
                                       "bg-surface-variant dark:bg-[#303030] text-on-surface-variant dark:text-[#c0c9bb]"
                            }`}>
                              {done ? <span className="material-symbols-outlined text-sm">check</span> : s.n}
                            </div>
                            <div>
                              <p className={`text-sm font-label uppercase tracking-wider font-bold ${active ? "text-primary dark:text-primary-fixed-dim" : "text-outline dark:text-[#c0c9bb]"}`}>
                                Step {s.n === 1 ? "One" : s.n === 2 ? "Two" : "Three"}
                              </p>
                              <p className="font-headline font-bold text-on-surface dark:text-white">{s.label}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-10 pt-8 border-t border-outline-variant/20 dark:border-white/10">
                      <label className="block text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-3">
                        Farm Size (Acres)
                      </label>
                      <input
                        type="number" name="acres" value={form.acres}
                        onChange={handleChange} min="0.1" step="0.1"
                        placeholder="1.0"
                        className="w-full bg-surface-container-high dark:bg-[#303030] border-none rounded-xl p-3 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim text-sm font-body text-on-surface dark:text-white"
                      />
                      <p className="text-[10px] text-outline dark:text-[#c0c9bb]/60 mt-2 font-body">Used for ROI calculation in Step 3</p>
                    </div>
                  </div>
                </aside>

                {/* ── Main Content ──────────────────────────────────── */}
                <div className="lg:col-span-9 space-y-12">

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-4 bg-error-container dark:bg-red-950/40 text-on-error-container dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-800"
                      >
                        <span className="material-symbols-outlined">error</span>
                        <p className="text-sm font-body">{error}</p>
                        <button onClick={() => setError("")} className="ml-auto material-symbols-outlined text-sm opacity-60 hover:opacity-100">close</button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="step1" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-8">
                      {/* Location + Weather */}
                      <motion.section variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2rem] p-8 md:p-10 editorial-shadow border border-outline-variant/10 dark:border-white/5">
                        <div className="flex justify-between items-end mb-8">
                          <div>
                            <h2 className="text-2xl font-headline font-bold tracking-tight text-on-surface dark:text-white">Field Location</h2>
                            <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm mt-1 font-body">Enter your city to auto-fill climate data.</p>
                          </div>
                          <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-4xl">location_on</span>
                        </div>

                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline dark:text-[#c0c9bb]/60">location_on</span>
                            <input name="location" value={form.location} onChange={handleChange} onKeyDown={(e) => e.key === "Enter" && fetchWeather()} placeholder="e.g. Bhubaneswar, Cuttack, Ludhiana" className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 pl-12 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-on-surface dark:text-white" />
                          </div>
                          <button onClick={fetchWeather} disabled={loadingWeather || !form.location.trim()} className="px-6 py-4 bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                            {loadingWeather ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">wb_sunny</span>}
                            <span className="hidden sm:inline">{loadingWeather ? "Fetching..." : "Auto-fill"}</span>
                          </button>
                        </div>

                        {weatherData && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-wrap gap-4 p-5 bg-primary/5 dark:bg-primary-fixed/5 rounded-2xl border border-primary/20 dark:border-primary-fixed/20">
                            <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-lg">thermostat</span><span className="text-sm font-bold text-on-surface dark:text-white">{weatherData.temperature}°C</span><span className="text-xs text-outline dark:text-[#c0c9bb]/60 font-body">Temp</span></div>
                            <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-lg">humidity_percentage</span><span className="text-sm font-bold text-on-surface dark:text-white">{weatherData.humidity}%</span><span className="text-xs text-outline dark:text-[#c0c9bb]/60 font-body">Humidity</span></div>
                            <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-lg">water_drop</span><span className="text-sm font-bold text-on-surface dark:text-white">{weatherData.rainfall_mm}mm</span><span className="text-xs text-outline dark:text-[#c0c9bb]/60 font-body">Rainfall</span></div>
                          </motion.div>
                        )}
                      </motion.section>

                      {/* Soil Inputs */}
                      <motion.section variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2rem] p-8 md:p-10 editorial-shadow border border-outline-variant/10 dark:border-white/5">
                        <div className="flex justify-between items-end mb-10">
                          <div>
                            <h2 className="text-3xl font-headline font-bold tracking-tight text-on-surface dark:text-white">Soil Vitality Inputs</h2>
                            <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm mt-1 font-body">Enter your most recent soil test lab results.</p>
                          </div>
                          <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-4xl">biotech</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/30 mb-8 gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2 mb-1"><span className="material-symbols-outlined text-[18px]">satellite_alt</span>Estimate Soil Baselines</p>
                            <p className="text-xs text-amber-700/80 dark:text-amber-500/80 leading-relaxed max-w-lg font-body"><strong>Disclaimer:</strong> Satellite data provides regional averages. For precision agriculture, we strongly recommend using a physical NPK testing meter.</p>
                          </div>
                          <button onClick={fetchSoil} disabled={loadingSoil || !form.location.trim()} className="bg-amber-600 dark:bg-amber-500 text-white dark:text-[#002204] px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap">
                            {loadingSoil ? <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Scanning...</> : <><span className="material-symbols-outlined text-[18px]">travel_explore</span> Auto-fill Soil</>}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb] font-headline">Nitrogen (N) Content</label>
                            <div className="relative">
                              <input name="N" value={form.N} onChange={handleChange} className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-on-surface dark:text-white" placeholder="90" type="number" />
                              <span className="absolute right-4 top-4 text-outline dark:text-[#c0c9bb]/60 text-sm font-bold">kg/ha</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb] font-headline">Phosphorus (P) Level</label>
                            <div className="relative">
                              <input name="P" value={form.P} onChange={handleChange} className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-on-surface dark:text-white" placeholder="42" type="number" />
                              <span className="absolute right-4 top-4 text-outline dark:text-[#c0c9bb]/60 text-sm font-bold">kg/ha</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb] font-headline">Potassium (K) Reserve</label>
                            <div className="relative">
                              <input name="K" value={form.K} onChange={handleChange} className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-on-surface dark:text-white" placeholder="43" type="number" />
                              <span className="absolute right-4 top-4 text-outline dark:text-[#c0c9bb]/60 text-sm font-bold">kg/ha</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb] font-headline">Soil pH Level</label>
                            <input name="ph" value={form.ph} onChange={handleChange} className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-on-surface dark:text-white" placeholder="6.5" step="0.1" type="number" />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb] font-headline">Temperature</label>
                            <div className="relative">
                              <input name="temperature" value={form.temperature} onChange={handleChange} className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-on-surface dark:text-white" placeholder="25" type="number" step="0.1" />
                              <span className="absolute right-4 top-4 text-outline dark:text-[#c0c9bb]/60 text-sm font-bold">°C</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb] font-headline">Humidity</label>
                            <div className="relative">
                              <input name="humidity" value={form.humidity} onChange={handleChange} className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-on-surface dark:text-white" placeholder="80" type="number" />
                              <span className="absolute right-4 top-4 text-outline dark:text-[#c0c9bb]/60 text-sm font-bold">%</span>
                            </div>
                          </div>
                          <div className="space-y-2 md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb] font-headline">Annual Rainfall</label>
                            <div className="relative">
                              <input name="rainfall" value={form.rainfall} onChange={handleChange} className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-on-surface dark:text-white" placeholder="200" type="number" />
                              <span className="absolute right-4 top-4 text-outline dark:text-[#c0c9bb]/60 text-sm font-bold">mm</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-10 flex justify-end">
                          <button onClick={handleAnalyze} disabled={loadingAnalyze} className="bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60">
                            {loadingAnalyze ? <><span className="material-symbols-outlined animate-spin">progress_activity</span> Analyzing...</> : <><span>Analyze Soil Profile</span><span className="material-symbols-outlined">arrow_forward</span></>}
                          </button>
                        </div>
                      </motion.section>
                    </motion.div>
                  )}

                  {/* STEP 2: RECOMMENDATIONS */}
                  {step === 2 && (
                    <motion.div key="step2" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-8">
                      <motion.section variants={itemVariants} className="bg-surface-container-low dark:bg-[#303030] rounded-[2rem] overflow-hidden editorial-shadow border border-outline-variant/10 dark:border-white/5">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-2/5 relative min-h-[300px] bg-primary/10 dark:bg-[#002204] flex items-center justify-center">
                            <span style={{ fontSize: "120px" }}>{getCropMeta(recommendations[0]?.crop).emoji}</span>
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 dark:from-[#002204]/90 to-transparent flex flex-col justify-end p-8">
                              <span className="inline-block bg-primary-container dark:bg-[#065f18] text-on-primary-container dark:text-[#a3f69c] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 w-fit font-label border border-white/10">Algorithm Pick</span>
                              <h3 className="text-4xl font-headline font-extrabold text-white tracking-tight">{capitalize(recommendations[0]?.crop)}</h3>
                            </div>
                          </div>

                          <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-label uppercase text-outline dark:text-[#c0c9bb] font-bold tracking-widest">Confidence Score</h4>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-5xl font-headline font-extrabold text-primary dark:text-primary-fixed-dim">{recommendations[0]?.confidence?.toFixed(1)}%</span>
                                  <div className="flex-1 bg-surface-container-highest dark:bg-[#1b1c1c] h-2 w-32 rounded-full overflow-hidden">
                                    <div className="bg-primary dark:bg-primary-fixed-dim h-full rounded-full transition-all duration-700" style={{ width: `${recommendations[0]?.confidence}%` }} />
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <h4 className="text-xs font-label uppercase text-outline dark:text-[#c0c9bb] font-bold tracking-widest">Duration</h4>
                                <p className="text-2xl font-headline font-bold text-on-surface dark:text-white mt-1">{getCropMeta(recommendations[0]?.crop).duration}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                              <div className="p-5 bg-surface-container-highest dark:bg-[#1b1c1c] rounded-2xl border border-transparent dark:border-white/5">
                                <p className="text-[10px] text-on-surface-variant dark:text-[#c0c9bb] font-bold uppercase tracking-widest mb-1 font-label">Risk Level</p>
                                <p className="text-2xl font-headline font-extrabold text-primary dark:text-primary-fixed-dim">{getCropMeta(recommendations[0]?.crop).risk}</p>
                              </div>
                              <div className="p-5 bg-surface-container-highest dark:bg-[#1b1c1c] rounded-2xl border border-transparent dark:border-white/5">
                                <p className="text-[10px] text-on-surface-variant dark:text-[#c0c9bb] font-bold uppercase tracking-widest mb-1 font-label">Farm Area</p>
                                <p className="text-2xl font-headline font-extrabold text-secondary dark:text-secondary-fixed">{form.acres} Ac</p>
                              </div>
                            </div>

                            <button onClick={() => handleGetROI(recommendations[0])} disabled={loadingROI} className="mt-8 w-full bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60">
                              {loadingROI ? <><span className="material-symbols-outlined animate-spin">progress_activity</span> Calculating...</> : <><span>Get Full ROI Forecast</span><span className="material-symbols-outlined">arrow_forward</span></>}
                            </button>
                          </div>
                        </div>
                      </motion.section>

                      <motion.section variants={itemVariants}>
                        <h3 className="text-xl font-headline font-bold text-on-surface dark:text-white mb-5">All Recommendations Ranked</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {recommendations.map((rec, i) => {
                            const meta = getCropMeta(rec.crop);
                            return (
                              <button key={i} onClick={() => handleGetROI(rec)} disabled={loadingROI} className="bg-surface-container-lowest dark:bg-[#303030] rounded-2xl p-6 border border-outline-variant/10 dark:border-white/5 editorial-shadow hover:border-primary/30 dark:hover:border-primary-fixed-dim/30 transition-all text-left group">
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-4xl">{meta.emoji}</span>
                                  <span className={`text-xs font-bold px-3 py-1 rounded-full font-label ${i === 0 ? "bg-primary/10 text-primary dark:text-primary-fixed-dim" : "bg-surface-container-high dark:bg-[#1b1c1c] text-outline dark:text-[#c0c9bb]"}`}>#{i + 1} Pick</span>
                                </div>
                                <h4 className="text-xl font-headline font-bold text-on-surface dark:text-white mb-1">{capitalize(rec.crop)}</h4>
                                <p className="text-sm text-outline dark:text-[#c0c9bb] font-body mb-4">{meta.duration} · {meta.risk} risk</p>
                                <div className="w-full bg-surface-container-high dark:bg-[#1b1c1c] h-1.5 rounded-full overflow-hidden mb-2">
                                  <div className="bg-primary dark:bg-primary-fixed-dim h-full rounded-full transition-all duration-700" style={{ width: `${rec.confidence}%` }} />
                                </div>
                                <p className="text-xs font-bold text-primary dark:text-primary-fixed-dim">{rec.confidence?.toFixed(1)}% match</p>
                              </button>
                            );
                          })}
                        </div>
                      </motion.section>

                      <motion.div variants={itemVariants} className="flex justify-start">
                        <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed-dim transition-colors">
                          <span className="material-symbols-outlined text-lg">arrow_back</span> Modify Soil Inputs
                        </button>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* STEP 3: ROI FORECAST */}
                  {step === 3 && roiResult && (
                    <motion.div key="step3" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-8">
                      <motion.section variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2rem] p-8 md:p-10 editorial-shadow border border-outline-variant/10 dark:border-white/5">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                          <div>
                            <h3 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface dark:text-white">Financial ROI Projection</h3>
                            <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm mt-1 font-body">{capitalize(roiResult.crop)} · {roiResult.acres} acres · Based on current mandi pricing</p>
                          </div>
                          <button onClick={() => window.print()} className="text-primary dark:text-primary-fixed-dim font-bold flex items-center gap-2 text-sm hover:opacity-80 transition-opacity">
                            <span className="material-symbols-outlined">download</span> Export Ledger
                          </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                          <div className="lg:col-span-1 space-y-4">
                            <div className="p-6 rounded-2xl bg-surface-container-low dark:bg-[#1b1c1c] border border-transparent dark:border-white/5">
                              <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant dark:text-[#c0c9bb] mb-2 font-bold">Total Investment</p>
                              <p className="text-3xl font-headline font-bold text-on-surface dark:text-white">{formatINR(roiResult.total_investment)}</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-surface-container-low dark:bg-[#1b1c1c] border border-transparent dark:border-white/5">
                              <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant dark:text-[#c0c9bb] mb-2 font-bold">Gross Revenue</p>
                              <p className="text-3xl font-headline font-bold text-on-surface dark:text-white">{formatINR(roiResult.expected_revenue)}</p>
                            </div>
                            <div className={`p-6 rounded-2xl text-on-primary dark:text-white border border-transparent dark:border-white/10 shadow-lg relative overflow-hidden ${roiResult.is_profitable ? "bg-primary dark:bg-[#00450d]" : "bg-error dark:bg-red-900"}`}>
                              <div className="relative z-10">
                                <p className="text-xs font-label uppercase tracking-widest opacity-80 mb-2 font-bold">Net Profit Forecast</p>
                                <p className="text-4xl font-headline font-black">{formatINR(roiResult.net_profit)}</p>
                                <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-lg backdrop-blur-md">
                                  <span className="material-symbols-outlined text-sm">{roiResult.is_profitable ? "trending_up" : "trending_down"}</span>
                                  <span className="text-xs font-bold">ROI: {roiResult.roi_percent}%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-2">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-outline-variant/20 dark:border-white/10">
                                    <th className="py-4 text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Expense Category</th>
                                    <th className="py-4 text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold text-right">Estimated Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/10 dark:divide-white/5 font-body">
                                  {[
                                    { label: "Seed Material",      key: "seed_cost" },
                                    { label: "Fertilizer / NPK",   key: "fertilizer_cost" },
                                    { label: "Labour",             key: "labour_cost" },
                                    { label: "Irrigation",         key: "irrigation_cost" },
                                    { label: "Pesticide",          key: "pesticide_cost" },
                                    { label: "Miscellaneous",      key: "misc_cost" },
                                  ].map((row) => (
                                    <tr key={row.key} className="hover:bg-surface-container-low dark:hover:bg-[#1b1c1c] transition-colors group">
                                      <td className="py-5 px-2 font-bold text-on-surface dark:text-white group-hover:pl-4 transition-all">{row.label}</td>
                                      <td className="py-5 font-bold text-right text-on-surface dark:text-white">{roiResult[row.key] ? formatINR(roiResult[row.key]) : "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-surface-container-low dark:bg-[#1b1c1c]">
                                    <td className="py-6 px-4 font-headline font-bold text-on-surface dark:text-white rounded-bl-xl">Total Operational Cost</td>
                                    <td className="py-6 px-4 font-headline font-black text-xl text-right text-primary dark:text-primary-fixed-dim rounded-br-xl">{formatINR(roiResult.total_investment)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </div>
                      </motion.section>

                      <motion.div variants={itemVariants} className="flex justify-between items-center">
                        <button onClick={() => setStep(2)} className="flex items-center gap-2 text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">arrow_back</span>Back to Recommendations</button>
                        <button onClick={() => { setStep(1); setRecommendations([]); setRoiResult(null); setWeatherData(null); setForm({ N:"",P:"",K:"",ph:"",temperature:"",humidity:"",rainfall:"",location:"",acres:"1" }); }} className="flex items-center gap-2 px-6 py-3 bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] rounded-xl font-bold text-sm hover:shadow-lg transition-all"><span className="material-symbols-outlined text-lg">refresh</span>New Analysis</button>
                      </motion.div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================
              TOOL 2: DISEASE VISION AI 
          ========================================================= */}
          {activeTool === "VISION" && (
            <motion.div key="vision" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="max-w-4xl mx-auto space-y-8">
              
              {/* Upload Zone */}
              <div 
                className={`relative w-full h-80 md:h-[400px] rounded-[2.5rem] border-2 transition-colors flex items-center justify-center overflow-hidden ${visionImage ? 'border-transparent bg-black/5 dark:bg-white/5' : 'border-dashed border-outline-variant/30 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary-fixed-dim/50 bg-surface-container-lowest dark:bg-[#1b1c1c] cursor-pointer'}`}
                onClick={() => !isScanning && fileInputRef.current?.click()}
              >
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} disabled={isScanning} />
                
                {visionImage ? (
                  <>
                    <img src={visionImage} alt="Crop to analyze" className={`w-full h-full object-contain md:object-cover transition-all duration-700 ${isScanning ? 'scale-105 opacity-50 blur-sm' : ''}`} />
                    
                    {/* Elegant Professional Scanning Overlay */}
                    <AnimatePresence>
                      {isScanning && (
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-surface-container-lowest/60 dark:bg-[#0c120f]/60 backdrop-blur-md"
                        >
                          <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-4xl animate-spin mb-4">progress_activity</span>
                          <h3 className="font-headline font-bold text-xl text-on-surface dark:text-white mb-2 tracking-tight">Analyzing Morphology</h3>
                          <p className="text-sm font-body text-on-surface-variant dark:text-[#c0c9bb]">Cross-referencing pathogen database...</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="text-center px-6">
                    <div className="w-16 h-16 bg-surface-container-high dark:bg-[#303030] rounded-full flex items-center justify-center mx-auto mb-6 text-outline dark:text-[#c0c9bb]">
                      <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                    </div>
                    <h3 className="font-headline font-bold text-xl text-on-surface dark:text-white mb-2">Upload Leaf Sample</h3>
                    <p className="text-sm font-body text-on-surface-variant dark:text-[#c0c9bb]">Supports JPG, PNG (Max 5MB)</p>
                  </div>
                )}
              </div>

              {/* Reset Button */}
              {visionImage && !isScanning && (
                <div className="flex justify-center">
                  <button onClick={resetVision} className="flex items-center gap-2 px-6 py-2 rounded-full bg-surface-container-high dark:bg-[#1b1c1c] text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb] hover:text-error transition-colors border border-transparent dark:border-white/5">
                    <span className="material-symbols-outlined text-[18px]">replay</span> Scan Another Image
                  </button>
                </div>
              )}

              {/* Diagnostic Result Card */}
              <AnimatePresence>
                {visionResult && !isScanning && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2.5rem] overflow-hidden editorial-shadow border border-outline-variant/10 dark:border-white/5"
                  >
                    <div className="bg-error/10 dark:bg-red-900/20 p-8 md:p-10 border-b border-error/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center shrink-0 shadow-lg shadow-error/30">
                          <span className="material-symbols-outlined text-3xl">coronavirus</span>
                        </div>
                        <div>
                          <p className="text-xs font-label uppercase tracking-widest text-error font-bold mb-1">Pathogen Detected</p>
                          <h2 className="text-3xl md:text-4xl font-headline font-black text-on-surface dark:text-white">{visionResult.disease}</h2>
                        </div>
                      </div>
                      <div className="bg-surface-container-highest dark:bg-[#1b1c1c] px-6 py-4 rounded-2xl text-center border border-transparent dark:border-white/5">
                        <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-1">AI Confidence</p>
                        <span className="text-3xl font-headline font-extrabold text-primary dark:text-primary-fixed-dim">{visionResult.confidence}%</span>
                      </div>
                    </div>

                    <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 text-lg font-headline font-bold text-on-surface dark:text-white border-b border-outline-variant/20 dark:border-white/10 pb-3">
                          <span className="material-symbols-outlined text-amber-500">visibility</span> Clinical Symptoms
                        </h3>
                        <p className="text-on-surface-variant dark:text-[#c0c9bb] font-body text-sm leading-relaxed">{visionResult.symptoms}</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h3 className="flex items-center gap-2 text-sm font-headline font-bold text-error dark:text-red-400">
                            <span className="material-symbols-outlined">science</span> Chemical Treatment
                          </h3>
                          <p className="text-on-surface-variant dark:text-[#c0c9bb] font-body text-sm bg-surface-container-high dark:bg-[#1b1c1c] p-4 rounded-xl border border-transparent dark:border-white/5">{visionResult.solutions.chemical}</p>
                        </div>
                        <div className="space-y-3">
                          <h3 className="flex items-center gap-2 text-sm font-headline font-bold text-primary dark:text-primary-fixed-dim">
                            <span className="material-symbols-outlined">compost</span> Organic Control
                          </h3>
                          <p className="text-on-surface-variant dark:text-[#c0c9bb] font-body text-sm bg-surface-container-high dark:bg-[#1b1c1c] p-4 rounded-xl border border-transparent dark:border-white/5">{visionResult.solutions.organic}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low dark:bg-[#1b1c1c] w-full py-12 px-6 md:px-8 border-t border-outline-variant/20 dark:border-white/5 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-headline font-black text-primary dark:text-primary-fixed-dim text-2xl tracking-tight">AgroNXT</span>
            <p className="font-body text-sm tracking-wide text-on-surface-variant dark:text-[#c0c9bb]">© {new Date().getFullYear()} AgroNXT. Precision for the Modern Cultivator.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {["Privacy Policy","Terms of Service","Sustainability","Contact"].map((l) => (
              <Link key={l} href="#" className="text-on-surface-variant dark:text-[#c0c9bb] uppercase text-[0.75rem] tracking-widest hover:text-primary dark:hover:text-primary-fixed-dim transition-colors font-bold font-label">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}