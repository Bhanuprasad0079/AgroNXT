"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- INTERFACES ---
interface Sector { id: string; name: string; crop: string; acreage: string; sowingDate: string; status: "OPTIMAL" | "REVIEW" | "CRITICAL"; x?: number; y?: number; }
interface Recommendation { rank: number; crop: string; confidence: number; }

const CROP_COLORS: Record<string, string> = {
  "WHEAT": "bg-[#5a8c46]/90 border-[#3d682d]", "CORN": "bg-[#5a8c46]/90 border-[#3d682d]",
  "SOYBEAN": "bg-[#b88b4c]/90 border-[#8f6834]", "RICE": "bg-[#4a7c9c]/90 border-[#325873]", 
  "COTTON": "bg-[#a0aec0]/90 border-[#64748b]", "SUGARCANE": "bg-[#146b34]/90 border-[#0c4a22]", 
  "DEFAULT": "bg-[#5a8c46]/90 border-[#3d682d]"
};

export default function FarmProfilingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [token, setToken] = useState("");
  
  const [profileData, setProfileData] = useState({
    state: "Odisha", district: "Khordha", city: "Bhubaneswar", farmSize: "5.0", sizeUnit: "Acres",
    nitrogen: "", phosphorus: "", potassium: "", phLevel: "",
    temperature: "", humidity: "", rainfall: ""
  });

  const [strategyMode, setStrategyMode] = useState<"CHOICE" | "MANUAL" | "RECOMMEND">("CHOICE");
  const [isPredicting, setIsPredicting] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  // Auto-fill states
  const [isFetchingClimate, setIsFetchingClimate] = useState(false);
  const [isFetchingSoil, setIsFetchingSoil] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [newSectorName, setNewSectorName] = useState("");
  const [newSectorCrop, setNewSectorCrop] = useState("WHEAT");
  const [newSectorAcreage, setNewSectorAcreage] = useState("");
  const [newSectorDate, setNewSectorDate] = useState("");

  useEffect(() => {
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('agronxt_token='))?.split('=')[1];
    if (cookieToken) {
      setToken(cookieToken);
      fetch("https://agronxt.onrender.com/farm-profile", { headers: { Authorization: `Bearer ${cookieToken}` } })
        .then(res => res.json())
        .then(data => {
          if (data.status === "ok") {
            setProfileData({
              state: data.data.state || "Odisha", 
              district: data.data.district || "Khordha", 
              city: data.data.city || data.data.village || "Bhubaneswar",
              farmSize: data.data.farmSize || "5.0", 
              sizeUnit: data.data.sizeUnit || "Acres",
              nitrogen: data.data.nitrogen ? String(data.data.nitrogen) : "", 
              phosphorus: data.data.phosphorus ? String(data.data.phosphorus) : "", 
              potassium: data.data.potassium ? String(data.data.potassium) : "", 
              phLevel: data.data.phLevel ? String(data.data.phLevel) : "",
              temperature: data.data.temperature ? String(data.data.temperature) : "",
              humidity: data.data.humidity ? String(data.data.humidity) : "",
              rainfall: data.data.rainfall ? String(data.data.rainfall) : "",
            });
            if (data.data.sectors && data.data.sectors.length > 0) {
              setSectors(data.data.sectors);
            }
          }
        });
    }
  }, []);

  const updateData = (field: string, value: string) => setProfileData(prev => ({ ...prev, [field]: value }));
  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const totalAllocated = sectors.reduce((sum, s) => sum + (parseFloat(s.acreage) || 0), 0);
  const totalFarmArea = parseFloat(profileData.farmSize) || 0;
  const remainingArea = totalFarmArea - totalAllocated;
  
  // --- Auto-Fill Climate Data ---
  const handleAutoFillClimate = async () => {
    const locationStr = profileData.city || profileData.district;
    if (!locationStr) return alert("Please set a City or District in Step 1 first.");
    
    setIsFetchingClimate(true);
    try {
      const res = await fetch("https://agronxt.onrender.com/weather/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: locationStr }) 
      });
      
      const responseData = await res.json();
      
      if (responseData.status === "ok" && responseData.data?.current) {
        const w = responseData.data.current;
        const realAnnualRain = responseData.data.annual_rainfall > 0 ? responseData.data.annual_rainfall.toString() : ""; 
        setWeatherData(w); 
        setProfileData((prev) => ({
          ...prev,
          temperature: w.temperature_2m?.toString() || prev.temperature,
          humidity: w.relative_humidity_2m?.toString() || prev.humidity,
          rainfall: realAnnualRain || prev.rainfall,
        }));
      } else {
        alert("Failed to fetch climate data for this region. You may enter it manually.");
      }
    } catch (err) {
      console.error("Weather fetch error:", err);
      alert("Could not fetch weather. Make sure your Python backend is running.");
    } finally {
      setIsFetchingClimate(false);
    }
  };

  // --- Auto-Fill Soil Data via Satellite (ISRIC) ---
  const handleAutoFillSoil = async () => {
    const locationStr = profileData.city || profileData.district;
    if (!locationStr) return alert("Please set a City or District in Step 1 first.");
    
    setIsFetchingSoil(true);
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${locationStr}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
         throw new Error("Location not found");
      }
      
      const lat = geoData.results[0].latitude;
      const lng = geoData.results[0].longitude;

      const res = await fetch("https://agronxt.onrender.com/soil/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }) 
      });
      
      const responseData = await res.json();
      
      if (responseData.status === "ok") {
        const s = responseData.data;
        setProfileData((prev) => ({
          ...prev,
          nitrogen: s.N?.toString() || prev.nitrogen,
          phosphorus: s.P?.toString() || prev.phosphorus,
          potassium: s.K?.toString() || prev.potassium,
          phLevel: s.ph?.toString() || prev.phLevel,
        }));
      } else {
        alert("Failed to fetch satellite soil data. You may enter it manually.");
      }
    } catch (err) {
      console.error("Soil fetch error:", err);
      alert("Could not fetch satellite soil data. Please enter values manually.");
    } finally {
      setIsFetchingSoil(false);
    }
  };

  const fetchRecommendations = async () => {
    setIsPredicting(true); setStrategyMode("RECOMMEND");
    try {
      const res = await fetch("https://agronxt.onrender.com/predict-crop", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: profileData.city || profileData.district,
          N: parseFloat(profileData.nitrogen) || 90, 
          P: parseFloat(profileData.phosphorus) || 42, 
          K: parseFloat(profileData.potassium) || 43,
          ph: parseFloat(profileData.phLevel) || 6.5, 
          temperature: parseFloat(profileData.temperature) || 25.0, 
          humidity: parseFloat(profileData.humidity) || 80.0, 
          rainfall: parseFloat(profileData.rainfall) || 200.0
        })
      });
      const data = await res.json();
      if (data.status === "ok") setRecommendations(data.recommendations);
    } catch (err) { console.error(err); }
    setIsPredicting(false);
  };

  const selectRecommendation = (cropName: string) => { setNewSectorCrop(cropName.toUpperCase()); setStrategyMode("MANUAL"); };

  const addSector = () => {
    if (!newSectorName || !newSectorAcreage || !newSectorDate) return alert("Please fill all sector fields.");
    const acreage = parseFloat(newSectorAcreage);
    if (acreage <= 0) return alert("Acreage must be greater than 0.");
    if (acreage > remainingArea) return alert(`You only have ${remainingArea.toFixed(1)} ${profileData.sizeUnit} left to allocate!`);

    setSectors([...sectors, { id: Date.now().toString(), name: newSectorName.toUpperCase(), crop: newSectorCrop.toUpperCase(), acreage: newSectorAcreage, sowingDate: newSectorDate, status: "OPTIMAL" }]);
    setNewSectorName(""); setNewSectorAcreage(""); setNewSectorDate(""); setStrategyMode("CHOICE");
  };

  const removeSector = (id: string) => setSectors(sectors.filter(s => s.id !== id));

  const handleSave = async () => {
    setIsSaving(true);
    
    const cleanProfileData = {
      ...profileData,
      nitrogen: profileData.nitrogen || "",
      phosphorus: profileData.phosphorus || "",
      potassium: profileData.potassium || "",
      phLevel: profileData.phLevel || "",
      temperature: profileData.temperature || "",
      humidity: profileData.humidity || "",
      rainfall: profileData.rainfall || ""
    };

    const finalProfile = { ...cleanProfileData, sectors: sectors, lastUpdated: new Date().toISOString() };
    localStorage.setItem("agronxt_farm_profile", JSON.stringify(finalProfile));

    if (token) {
      try {
        await fetch("https://agronxt.onrender.com/farm-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ ...cleanProfileData, village: cleanProfileData.city, sectors: sectors })
        });
      } catch (err) { console.error("Failed to sync to database", err); }
    }

    setTimeout(() => { setIsSaving(false); router.push("/dashboard"); }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] dark:bg-[#0c120f] flex flex-col transition-colors duration-300 font-body">
      <header className="w-full h-20 flex items-center justify-between px-8 border-b border-[#e0e3e1] dark:border-white/5 bg-[#f7faf8]/80 dark:bg-[#181c1b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#146b34] dark:text-[#86d995] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          <span className="font-headline font-extrabold text-xl text-[#146b34] dark:text-[#86d995] tracking-tight">AgroNXT Setup</span>
        </div>
        <Link href="/dashboard" className="text-sm font-bold text-outline dark:text-[#aab4aa] hover:text-error transition-colors flex items-center gap-2 bg-surface-container-high dark:bg-white/5 px-4 py-2 rounded-full">
          <span className="material-symbols-outlined text-[18px]">close</span> Cancel
        </Link>
      </header>

      <main className="flex-grow flex flex-col items-center py-10 px-4 md:px-8 overflow-x-hidden">
        
        {/* Progress Tracker */}
        <div className="w-full max-w-3xl mb-10 flex justify-between items-center relative px-2">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#e0e3e1] dark:bg-[#303030] rounded-full -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#146b34] dark:bg-[#86d995] rounded-full transition-all duration-500 ease-out -z-10" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-sm border-4 border-[#f7faf8] dark:border-[#0c120f] ${step >= num ? 'bg-[#146b34] dark:bg-[#86d995] text-white dark:text-[#002204]' : 'bg-[#e0e3e1] dark:bg-[#303030] text-[#707a6f] dark:text-[#aab4aa]'}`}>
              {step > num ? <span className="material-symbols-outlined text-[18px]">check</span> : num}
            </div>
          ))}
        </div>

        <div className="w-full max-w-4xl bg-white dark:bg-[#181c1b] rounded-[2.5rem] shadow-[0px_12px_32px_rgba(0,0,0,0.05)] dark:shadow-[0px_12px_32px_rgba(0,0,0,0.4)] border border-transparent dark:border-white/5 overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-6 md:p-12 flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: GENERAL INFO */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-headline font-black text-gray-900 dark:text-white mb-3">Farm Geography</h2>
                    <p className="text-gray-500 dark:text-[#aab4aa] font-body">Set your location and total farm size to configure the map bounds.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-[#aab4aa] uppercase tracking-widest">State</label>
                      <input value={profileData.state} onChange={e => updateData('state', e.target.value)} className="w-full bg-gray-50 dark:bg-[#2d3130] rounded-xl px-4 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-[#aab4aa] uppercase tracking-widest">District</label>
                      <input value={profileData.district} onChange={e => updateData('district', e.target.value)} className="w-full bg-gray-50 dark:bg-[#2d3130] rounded-xl px-4 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-[#aab4aa] uppercase tracking-widest">City / Location</label>
                      <input value={profileData.city} onChange={e => updateData('city', e.target.value)} placeholder="e.g. Bhubaneswar" className="w-full bg-gray-50 dark:bg-[#2d3130] rounded-xl px-4 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-[#aab4aa] uppercase tracking-widest">Farm Area</label>
                        <input type="number" step="0.1" value={profileData.farmSize} onChange={e => updateData('farmSize', e.target.value)} className="w-full bg-gray-50 dark:bg-[#2d3130] rounded-xl px-4 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] transition-all font-bold text-lg" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-[#aab4aa] uppercase tracking-widest">Unit</label>
                        <select value={profileData.sizeUnit} onChange={e => updateData('sizeUnit', e.target.value)} className="w-full bg-gray-50 dark:bg-[#2d3130] rounded-xl px-4 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] transition-all appearance-none cursor-pointer">
                          <option>Acres</option><option>Hectares</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: SOIL VITALITY INPUTS */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center w-full">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-headline font-black text-gray-900 dark:text-white mb-2">Soil Vitality Inputs</h2>
                      <p className="text-gray-500 dark:text-[#aab4aa] font-body text-sm md:text-base">Enter your most recent lab results or estimate via satellite.</p>
                    </div>
                    <span className="material-symbols-outlined text-[#146b34] dark:text-[#86d995] text-4xl hidden sm:block">science</span>
                  </div>

                  {/* SOIL Auto-fill Control with Warning */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-amber-50 dark:bg-amber-900/10 p-4 md:p-5 rounded-2xl border border-amber-200 dark:border-amber-900/30 mb-8 gap-4">
                    <div>
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
                        Estimate Soil Baselines
                      </p>
                      <p className="text-[10px] md:text-xs text-amber-700/80 dark:text-amber-500/80 mt-1 max-w-sm leading-relaxed">
                        <strong>Disclaimer:</strong> Satellite data provides regional averages. For precision agriculture and true ML accuracy, we strongly recommend using a physical NPK testing meter in your field.
                      </p>
                    </div>
                    <button 
                      onClick={handleAutoFillSoil}
                      disabled={isFetchingSoil || !profileData.city}
                      className="bg-amber-600 dark:bg-amber-500 text-white dark:text-[#002204] px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                    >
                      {isFetchingSoil ? (
                        <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Scanning...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[18px]">travel_explore</span> Auto-fill Soil</>
                      )}
                    </button>
                  </div>

                  {/* Climate Auto-fill Control */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#146b34]/5 dark:bg-[#86d995]/10 p-4 md:p-5 rounded-2xl border border-[#146b34]/20 dark:border-[#86d995]/20 mb-8 gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#146b34] dark:text-[#86d995] text-[18px]">wb_sunny</span>
                        Meteorological Sync
                      </p>
                      <p className="text-[10px] md:text-xs text-gray-500 dark:text-[#aab4aa] mt-1">Auto-fill temperature, humidity, and true historical rainfall based on your city.</p>
                    </div>
                    <button 
                      onClick={handleAutoFillClimate}
                      disabled={isFetchingClimate || !profileData.city}
                      className="bg-[#146b34] dark:bg-[#86d995] text-white dark:text-[#002204] px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                    >
                      {isFetchingClimate ? (
                        <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Fetching...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[18px]">cloud_sync</span> Sync Climate</>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 md:gap-y-8">
                    {/* NPK Row */}
                    <div>
                      <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">Nitrogen (N) Content</label>
                      <div className="relative">
                        <input type="number" value={profileData.nitrogen} onChange={e => updateData('nitrogen', e.target.value)} className="w-full bg-gray-100 dark:bg-[#2d3130] rounded-xl pl-4 pr-16 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] text-lg" placeholder="90" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">kg/ha</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Range: 0 - 140</p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">Phosphorus (P) Level</label>
                      <div className="relative">
                        <input type="number" value={profileData.phosphorus} onChange={e => updateData('phosphorus', e.target.value)} className="w-full bg-gray-100 dark:bg-[#2d3130] rounded-xl pl-4 pr-16 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] text-lg" placeholder="42" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">kg/ha</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Range: 5 - 145</p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">Potassium (K) Reserve</label>
                      <div className="relative">
                        <input type="number" value={profileData.potassium} onChange={e => updateData('potassium', e.target.value)} className="w-full bg-gray-100 dark:bg-[#2d3130] rounded-xl pl-4 pr-16 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] text-lg" placeholder="43" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">kg/ha</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Range: 5 - 205</p>
                    </div>

                    {/* Env Row */}
                    <div>
                      <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">Soil pH Level</label>
                      <input type="number" step="0.1" value={profileData.phLevel} onChange={e => updateData('phLevel', e.target.value)} className="w-full bg-gray-100 dark:bg-[#2d3130] rounded-xl px-4 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] text-lg" placeholder="6.5" />
                      <p className="text-[10px] text-gray-400 mt-2">Range: 3.5 - 10.0</p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        Temperature
                        {weatherData && <span className="text-[9px] bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">Auto-filled</span>}
                      </label>
                      <div className="relative">
                        <input type="number" step="0.1" value={profileData.temperature} onChange={e => updateData('temperature', e.target.value)} className="w-full bg-gray-100 dark:bg-[#2d3130] rounded-xl pl-4 pr-12 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] text-lg" placeholder="25" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">°C</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        Humidity
                        {weatherData && <span className="text-[9px] bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">Auto-filled</span>}
                      </label>
                      <div className="relative">
                        <input type="number" step="1" value={profileData.humidity} onChange={e => updateData('humidity', e.target.value)} className="w-full bg-gray-100 dark:bg-[#2d3130] rounded-xl pl-4 pr-12 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] text-lg" placeholder="80" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">%</span>
                      </div>
                    </div>

                    {/* Rainfall - Full Width on Mobile */}
                    <div className="md:col-span-3">
                      <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        Annual Rainfall
                        {weatherData && <span className="text-[9px] bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">Auto-filled</span>}
                      </label>
                      <div className="relative">
                        <input type="number" step="1" value={profileData.rainfall} onChange={e => updateData('rainfall', e.target.value)} className="w-full bg-gray-100 dark:bg-[#2d3130] rounded-xl pl-4 pr-16 py-4 font-body text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-[#146b34] text-lg" placeholder="200" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">mm</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Range: 20 - 3000 mm (True historical average)</p>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* STEP 3: CROP STRATEGY */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-headline font-black text-gray-900 dark:text-white mb-3">Crop Sectors</h2>
                    <p className="text-gray-500 dark:text-[#aab4aa] font-body text-sm md:text-base">
                      {remainingArea.toFixed(1)} {profileData.sizeUnit} remaining to allocate.
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    {strategyMode === "CHOICE" && (
                      <motion.div key="choice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button onClick={fetchRecommendations} className="flex flex-col items-center justify-center p-8 md:p-10 bg-[#146b34]/5 dark:bg-[#86d995]/10 border-2 border-[#146b34]/20 dark:border-[#86d995]/30 rounded-[2rem] hover:scale-[1.02] transition-transform group">
                          <span className="material-symbols-outlined text-5xl text-[#146b34] dark:text-[#86d995] mb-4 group-hover:animate-pulse">psychology</span>
                          <h3 className="font-headline font-black text-lg md:text-xl text-gray-900 dark:text-white mb-2">Get AI Recommendation</h3>
                          <p className="text-xs md:text-sm text-gray-500 dark:text-[#aab4aa] font-body text-center">Analyze my soil data to find the most profitable crops to plant.</p>
                        </button>
                        <button onClick={() => setStrategyMode("MANUAL")} className="flex flex-col items-center justify-center p-8 md:p-10 bg-gray-50 dark:bg-[#2d3130] border-2 border-gray-200 dark:border-white/10 rounded-[2rem] hover:scale-[1.02] transition-transform group">
                          <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-[#aab4aa] mb-4">edit_square</span>
                          <h3 className="font-headline font-black text-lg md:text-xl text-gray-900 dark:text-white mb-2">I Know What I'm Growing</h3>
                          <p className="text-xs md:text-sm text-gray-500 dark:text-[#aab4aa] font-body text-center">Manually add crops that are already planted or planned.</p>
                        </button>
                      </motion.div>
                    )}

                    {strategyMode === "RECOMMEND" && (
                      <motion.div key="recommend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                        {isPredicting ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <span className="material-symbols-outlined text-[#146b34] dark:text-[#86d995] text-5xl animate-spin mb-4">progress_activity</span>
                            <p className="font-bold text-gray-900 dark:text-white animate-pulse text-sm md:text-base text-center">Running ML Models for {profileData.city || profileData.district}...</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">Top Recommendations for Your Soil</h3>
                              <button onClick={() => setStrategyMode("CHOICE")} className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white underline">Back</button>
                            </div>
                            {recommendations.map((rec, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-[#181c1b] p-4 rounded-2xl border border-[#146b34]/20 dark:border-[#86d995]/20 shadow-sm gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-[#146b34]/10 dark:bg-[#86d995]/10 flex items-center justify-center font-black text-[#146b34] dark:text-[#86d995]">#{rec.rank}</div>
                                  <div>
                                    <span className="block font-headline font-black text-lg text-gray-900 dark:text-white capitalize">{rec.crop}</span>
                                    <span className="text-xs text-gray-500 dark:text-[#aab4aa] font-bold">{rec.confidence}% Match Score</span>
                                  </div>
                                </div>
                                <button onClick={() => selectRecommendation(rec.crop)} className="w-full sm:w-auto bg-[#146b34] dark:bg-[#86d995] text-white dark:text-[#002204] px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform">Select</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {strategyMode === "MANUAL" && (
                      <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                        <div className="bg-gray-50 dark:bg-[#2d3130] p-4 md:p-6 rounded-3xl mb-8 border border-gray-100 dark:border-white/5">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">Add Sector Details</h3>
                            <button onClick={() => setStrategyMode("CHOICE")} className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white underline">Cancel</button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Name</label>
                              <input value={newSectorName} onChange={e=>setNewSectorName(e.target.value)} placeholder="Sector A" className="w-full bg-white dark:bg-[#181c1b] rounded-lg px-3 py-2 text-sm border-none focus:ring-2 focus:ring-[#146b34]" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Crop</label>
                              <input value={newSectorCrop} onChange={e=>setNewSectorCrop(e.target.value.toUpperCase())} placeholder="WHEAT" className="w-full bg-white dark:bg-[#181c1b] rounded-lg px-3 py-2 text-sm border-none focus:ring-2 focus:ring-[#146b34] uppercase" />
                            </div>
                            <div className="col-span-1 md:col-span-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Acreage</label>
                              <input type="number" step="0.1" value={newSectorAcreage} onChange={e=>setNewSectorAcreage(e.target.value)} placeholder="1.5" className="w-full bg-white dark:bg-[#181c1b] rounded-lg px-3 py-2 text-sm border-none focus:ring-2 focus:ring-[#146b34]" />
                            </div>
                            <div className="col-span-1 md:col-span-1">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Date Sown</label>
                              <input type="date" value={newSectorDate} onChange={e=>setNewSectorDate(e.target.value)} className="w-full bg-white dark:bg-[#181c1b] rounded-lg px-3 py-2 text-sm border-none focus:ring-2 focus:ring-[#146b34] dark:text-white" />
                            </div>
                            <div className="col-span-2 md:col-span-1 h-full mt-2 md:mt-0">
                              <button onClick={addSector} className="w-full h-[36px] bg-[#146b34] dark:bg-[#86d995] text-white dark:text-[#002204] rounded-lg font-bold text-sm hover:scale-[1.02] transition-transform">Save</button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {sectors.length > 0 && (
                    <div className="mt-8 space-y-3 border-t border-gray-100 dark:border-white/5 pt-6">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Saved Sectors</h4>
                      {sectors.map(s => (
                        <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-[#181c1b] p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm gap-4">
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-900 dark:text-white text-sm md:text-base">{s.name}</span>
                            <span className="text-[10px] md:text-xs bg-gray-100 dark:bg-[#2d3130] text-gray-600 dark:text-[#aab4aa] px-2 py-1 rounded-md font-bold">{s.crop}</span>
                          </div>
                          <div className="flex items-center gap-4 md:gap-6 justify-between sm:justify-end w-full sm:w-auto">
                            <div className="text-left sm:text-right">
                              <span className="block text-[9px] md:text-[10px] text-gray-500 uppercase font-bold tracking-widest">Planted</span>
                              <span className="text-xs md:text-sm font-body dark:text-white">{s.sowingDate}</span>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="block text-[9px] md:text-[10px] text-gray-500 uppercase font-bold tracking-widest">Area</span>
                              <span className="text-xs md:text-sm font-bold text-[#146b34] dark:text-[#86d995]">{s.acreage} {profileData.sizeUnit}</span>
                            </div>
                            <button onClick={() => removeSector(s.id)} className="text-gray-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 4: INTERACTIVE MAP & REVIEW (Pannable Mobile Map Fix) */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col w-full h-full">
                  <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-2">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-headline font-black text-gray-900 dark:text-white mb-1">Map & Review</h2>
                      <p className="text-gray-500 dark:text-[#aab4aa] font-body text-xs md:text-sm">Drag your mathematically scaled blocks to mirror your actual farm layout.</p>
                    </div>
                  </div>

                  {/* 🚀 THE PANNABLE WRAPPER 🚀 */}
                  <div className="relative w-full h-[400px] md:h-[450px] rounded-[1.5rem] md:rounded-[2rem] overflow-auto no-scrollbar shadow-inner border border-outline-variant/20 dark:border-white/5 group bg-gray-200 dark:bg-[#1a1a1a]">
                    
                    {/* Mobile Swipe Hint */}
                    <div className="md:hidden sticky top-4 left-1/2 -translate-x-1/2 w-max z-30 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center justify-center gap-1 opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none shadow-lg">
                      <span className="material-symbols-outlined text-[14px]">swipe</span> Swipe to pan map
                    </div>

                    {/* Fixed Size Canvas to keep X/Y coordinates universal */}
                    <div className="relative min-w-[800px] min-h-[450px] overflow-hidden">
                      <div className="absolute inset-0 bg-cover bg-center opacity-80 dark:opacity-50" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop')` }} />
                      <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

                      {sectors.map((sector, index) => {
                        const sectorAcres = parseFloat(sector.acreage) || 1;
                        const baseAreaPx = 150000;
                        const sectorAreaPx = (sectorAcres / totalFarmArea) * baseAreaPx;
                        const calculatedHeight = Math.max(90, Math.sqrt(sectorAreaPx / 1.5));
                        const calculatedWidth = Math.max(140, calculatedHeight * 1.5);
                        const styling = CROP_COLORS[sector.crop] || CROP_COLORS["DEFAULT"];
                        
                        const startX = sector.x !== undefined ? sector.x : 40 + (index * 40);
                        const startY = sector.y !== undefined ? sector.y : 40 + (index * 20);

                        return (
                          <motion.div
                            key={sector.id}
                            initial={{ x: startX, y: startY, opacity: 0, scale: 0.8 }}
                            animate={{ x: startX, y: startY, opacity: 1, scale: 1 }}
                            drag 
                            dragMomentum={false}
                            dragConstraints={{ left: 0, right: 800 - calculatedWidth, top: 0, bottom: 450 - calculatedHeight }}
                            onDragEnd={(event, info) => {
                              const newSectors = [...sectors];
                              newSectors[index].x = startX + info.offset.x;
                              newSectors[index].y = startY + info.offset.y;
                              
                              // Clamp to strict canvas bounds
                              newSectors[index].x = Math.max(0, Math.min(newSectors[index].x as number, 800 - calculatedWidth));
                              newSectors[index].y = Math.max(0, Math.min(newSectors[index].y as number, 450 - calculatedHeight));
                              
                              setSectors(newSectors);
                            }}
                            className={`absolute left-0 top-0 ${styling} border-[2px] backdrop-blur-sm rounded-xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shadow-2xl group/sector transition-shadow hover:shadow-[#146b34]/20`}
                            style={{ width: `${calculatedWidth}px`, height: `${calculatedHeight}px` }}
                          >
                            <span className="font-headline font-black tracking-wide text-white drop-shadow-md text-lg md:text-xl uppercase px-2 text-center leading-tight">{sector.name}</span>
                            <span className="mt-1 bg-white text-gray-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                              {sector.crop}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          <div className="bg-gray-50 dark:bg-[#2d3130] p-4 md:p-6 border-t border-gray-100 dark:border-white/5 flex justify-between items-center mt-auto shrink-0">
            <button onClick={handleBack} disabled={step === 1 || isSaving} className={`px-4 md:px-6 py-2 md:py-3 font-bold text-xs md:text-sm rounded-full transition-colors ${step === 1 ? 'opacity-0 cursor-default pointer-events-none' : 'text-gray-600 dark:text-[#aab4aa] hover:bg-gray-200 dark:hover:bg-white/10'}`}>
              Back
            </button>
            {step < 4 ? (
              <button onClick={handleNext} className="bg-[#146b34] dark:bg-[#86d995] text-white dark:text-[#002204] px-6 md:px-8 py-2 md:py-3 rounded-full font-bold text-xs md:text-sm shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                Continue <span className="material-symbols-outlined text-[16px] md:text-[18px]">arrow_forward</span>
              </button>
            ) : (
              <button onClick={handleSave} disabled={isSaving} className="bg-[#146b34] dark:bg-[#86d995] text-white dark:text-[#002204] px-6 md:px-10 py-2 md:py-3 rounded-full font-bold text-xs md:text-sm shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2 whitespace-nowrap">
                {isSaving ? <><span className="material-symbols-outlined animate-spin text-[16px] md:text-[18px]">progress_activity</span> <span className="hidden sm:inline">Syncing Profile...</span></> : <><span className="material-symbols-outlined text-[16px] md:text-[18px]">dashboard_customize</span> <span className="hidden sm:inline">Save & Initialize Dashboard</span><span className="sm:hidden">Finish</span></>}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}