"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

// --- ANIMATION CONFIGS ---
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] as const } } };

// --- INTERFACES & HELPERS ---
interface Sector { id: string; name: string; crop: string; acreage: string; sowingDate: string; status: string; x?: number; y?: number; }
interface FarmProfile { state: string; district: string; city: string; farmSize: string; sizeUnit: string; nitrogen: string; phosphorus: string; potassium: string; phLevel: string; sectors: Sector[]; }

const CROP_COLORS: Record<string, string> = {
  "WHEAT": "bg-[#5a8c46]/90 border-[#3d682d]", "CORN": "bg-[#5a8c46]/90 border-[#3d682d]",
  "SOYBEAN": "bg-[#b88b4c]/90 border-[#8f6834]", "RICE": "bg-[#4a7c9c]/90 border-[#325873]", 
  "COTTON": "bg-[#a0aec0]/90 border-[#64748b]", "SUGARCANE": "bg-[#146b34]/90 border-[#0c4a22]", 
  "DEFAULT": "bg-[#5a8c46]/90 border-[#3d682d]"
};

const STANDARD_DURATIONS: Record<string, number> = { WHEAT: 120, CORN: 90, SOYBEAN: 130, RICE: 150, COTTON: 160, SUGARCANE: 360, DEFAULT: 120 };

export default function DashboardOverview() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("Farmer");
  const [profile, setProfile] = useState<FarmProfile | null>(null);
  const [weather, setWeather] = useState<{ temp: number; humidity: number; rain: number; wind: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- CAROUSEL & ROI STATE ---
  const [activeSectorIdx, setActiveSectorIdx] = useState(0);
  const [roiCache, setRoiCache] = useState<Record<string, any>>({});
  const [isRoiLoading, setIsRoiLoading] = useState(false);

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('agronxt_token='))?.split('=')[1];
    if (!token) { router.push("/login"); return; }

    const loadData = async () => {
      try {
        const userRes = await fetch("https://agronxt.onrender.com/users/me", { headers: { Authorization: `Bearer ${token}` } });
        if (userRes.ok) { const userData = await userRes.json(); setUserName(userData.full_name.split(" ")[0]); }

        const profileRes = await fetch("https://agronxt.onrender.com/farm-profile", { headers: { Authorization: `Bearer ${token}` } });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.status === "ok") {
            setProfile(profileData.data);
            
            const loc = profileData.data.city || profileData.data.district;
            if (loc) {
              const weatherRes = await fetch("https://agronxt.onrender.com/weather", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ location: loc })
              });
              if (weatherRes.ok) {
                const wData = await weatherRes.json();
                setWeather({ temp: wData.current.temperature, humidity: wData.current.humidity, rain: wData.current.rainfall_mm, wind: 12 });
              }
            }
          }
        }
      } catch (err) { console.error("Dashboard Load Error:", err); }
      setIsLoading(false);
    };
    loadData();
  }, [router]);

  // --- FETCH DYNAMIC ROI FOR ACTIVE CROP ---
  const activeSector = profile?.sectors?.[activeSectorIdx] || null;

  useEffect(() => {
    if (activeSector && !roiCache[activeSector.id]) {
      setIsRoiLoading(true);
      fetch("https://agronxt.onrender.com/calculate-roi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop: activeSector.crop, acres: parseFloat(activeSector.acreage) || 1 })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === "ok") {
          setRoiCache(prev => ({ ...prev, [activeSector.id]: data }));
        }
      })
      .catch(err => console.error("ROI Fetch Error", err))
      .finally(() => setIsRoiLoading(false));
    }
  }, [activeSector, roiCache]);

  // --- CAROUSEL CONTROLS ---
  const nextSector = () => {
    if (profile?.sectors) setActiveSectorIdx((prev) => (prev + 1) % profile.sectors.length);
  };
  const prevSector = () => {
    if (profile?.sectors) setActiveSectorIdx((prev) => (prev - 1 + profile.sectors.length) % profile.sectors.length);
  };

  // --- DYNAMIC CALCULATIONS ---
  let harvestProgress = 0;
  if (activeSector && activeSector.sowingDate) {
    const daysElapsed = Math.floor((new Date().getTime() - new Date(activeSector.sowingDate).getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = STANDARD_DURATIONS[activeSector.crop] || STANDARD_DURATIONS.DEFAULT;
    harvestProgress = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
  }

  const currentRoiData = activeSector ? roiCache[activeSector.id] : null;
  const n = parseFloat(profile?.nitrogen || "0");
  const soilInsight = n > 100 ? "Nitrogen levels are optimal." : n > 0 ? "Nitrogen levels are slightly low. Consider supplementing." : "No soil data recorded. Run a soil test soon.";

  // --- EXPORT REPORT LOGIC ---
  const handleExport = () => {
    if (!profile) return alert("No profile data to export.");
    
    let csvContent = "AgroNXT Farm Report\n\n";
    csvContent += `Farmer,${userName}\nLocation,${profile.city}, ${profile.district}, ${profile.state}\nTotal Area,${profile.farmSize} ${profile.sizeUnit}\n\n`;
    csvContent += `Soil Health\nNitrogen (N),${profile.nitrogen || "N/A"} kg/ha\nPhosphorus (P),${profile.phosphorus || "N/A"} kg/ha\nPotassium (K),${profile.potassium || "N/A"} kg/ha\npH Level,${profile.phLevel || "N/A"}\n\n`;
    csvContent += `Active Crop Sectors\nName,Crop,Acreage,Sowing Date\n`;
    
    profile.sectors.forEach(s => {
      csvContent += `${s.name},${s.crop},${s.acreage},${s.sowingDate || "Unknown"}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AgroNXT_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- MOBILE NAV ITEMS ---
  const mobileNavItems = [
    { name: "Overview", path: "/dashboard" },
    { name: "Soil Health", path: "/dashboard/soil-health" },
    { name: "Calendar", path: "/dashboard/calendar" },
    { name: "Weather", path: "/dashboard/weather" },
    { name: "Analytics", path: "/dashboard/analytics" }
  ];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center lg:ml-64"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
  }

  return (
    <main className="lg:ml-64 pt-24 md:pt-28 pb-20 md:pb-12 px-4 md:px-8 min-h-screen transition-colors duration-300">
      
      {/* MOBILE SECONDARY NAVIGATION (Horizontal Scroll) */}
      <div className="lg:hidden flex overflow-x-auto no-scrollbar gap-2 mb-6 border-b border-outline-variant/20 dark:border-white/10 pb-3 w-full snap-x">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path} 
              className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${isActive ? "bg-[#146b34] dark:bg-[#86d995] text-white dark:text-[#002204] shadow-md" : "bg-surface-container-high dark:bg-[#2d3130] text-on-surface-variant dark:text-[#c0c9bb]"}`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>

      <motion.div className="max-w-7xl mx-auto space-y-8 md:space-y-10" variants={containerVariants} initial="hidden" animate="show">
        
        {/* HEADER SECTION */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <span className="text-xs md:text-sm font-bold uppercase tracking-[0.1em] text-primary dark:text-primary-fixed-dim font-label mb-2 block">
              Daily Briefing
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-on-surface dark:text-white tracking-tight mb-3 font-headline">
              Farm Overview
            </h1>
            <p className="text-sm md:text-base text-on-surface-variant dark:text-[#c0c9bb] max-w-xl leading-relaxed font-body">
              Good morning, {userName}. Your {activeSector ? activeSector.crop.toLowerCase() : 'fields'} are showing <span className="text-primary dark:text-primary-fixed-dim font-bold">optimal growth parameters</span> today. {weather?.rain ? "Recent rainfall recorded." : "Soil moisture levels are steady."}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={handleExport} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-3 md:py-2.5 bg-surface-container-high dark:bg-[#303030] text-on-surface dark:text-white border border-transparent dark:border-white/10 rounded-xl font-bold text-sm transition-all hover:bg-surface-container-highest dark:hover:bg-[#41493e]">
              <span className="material-symbols-outlined text-lg">download</span>
              <span className="hidden sm:inline">Export</span>
            </button>
            <Link href="/profiling" className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 md:py-2.5 bg-primary dark:bg-primary-fixed-dim text-on-primary dark:text-[#002204] rounded-xl font-bold text-sm shadow-lg shadow-primary/20 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95">
              <span className="material-symbols-outlined text-lg">add</span>
              New Entry
            </Link>
          </div>
        </motion.div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Quick Stats Bento Grid */}
          <div className="md:col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
            
            {/* Total Farm Area */}
            <motion.div variants={itemVariants} className="col-span-2 p-5 md:p-6 bg-surface-container-lowest dark:bg-[#303030] rounded-[1.5rem] md:rounded-3xl flex flex-col justify-between min-h-[140px] md:min-h-[160px] border border-outline-variant/20 dark:border-white/5 editorial-shadow">
              <div className="flex justify-between items-start mb-4 md:mb-6">
                <span className="p-3 bg-secondary-container/50 dark:bg-secondary-fixed/20 text-secondary dark:text-secondary-fixed rounded-2xl material-symbols-outlined">landscape</span>
                <span className="text-[10px] md:text-xs font-bold text-secondary dark:text-secondary-fixed bg-secondary-container/30 dark:bg-secondary-fixed/10 px-3 py-1.5 rounded-md font-label uppercase tracking-widest">+ ACTIVE</span>
              </div>
              <div>
                <p className="text-on-surface-variant dark:text-[#c0c9bb] text-xs md:text-sm font-medium mb-1 font-body">Total Farm Area</p>
                <h3 className="text-3xl md:text-4xl font-black text-on-surface dark:text-white font-headline">
                  {profile?.farmSize || "0.0"} {profile?.sizeUnit || "Acres"}
                </h3>
              </div>
            </motion.div>

            {/* Current Crop Slider */}
            <motion.div variants={itemVariants} className="col-span-1 p-5 md:p-6 bg-surface-container-lowest dark:bg-[#303030] rounded-[1.5rem] md:rounded-3xl border border-outline-variant/20 dark:border-white/5 editorial-shadow flex flex-col justify-between relative">
              <div className="flex justify-between items-center mb-2">
                <p className="text-on-surface-variant dark:text-[#c0c9bb] text-[9px] md:text-[10px] font-bold uppercase tracking-wider font-label">Current Crop</p>
                {/* Carousel Controls */}
                {profile?.sectors && profile.sectors.length > 1 && (
                  <div className="flex gap-1">
                    <button onClick={prevSector} className="text-outline hover:text-primary dark:hover:text-primary-fixed-dim transition-colors"><span className="material-symbols-outlined text-[16px]">chevron_left</span></button>
                    <button onClick={nextSector} className="text-outline hover:text-primary dark:hover:text-primary-fixed-dim transition-colors"><span className="material-symbols-outlined text-[16px]">chevron_right</span></button>
                  </div>
                )}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={activeSectorIdx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <h4 className="text-xl md:text-2xl font-bold text-on-surface dark:text-white mb-1 font-headline truncate">{activeSector?.crop || "None"}</h4>
                  <p className="text-[9px] md:text-[10px] font-bold text-primary dark:text-primary-fixed-dim">{activeSector?.name}</p>
                </motion.div>
              </AnimatePresence>
              <div className="mt-4">
                <div className="w-full bg-surface-container-highest dark:bg-[#1b1c1c] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary dark:bg-primary-fixed-dim h-full rounded-full transition-all duration-1000" style={{ width: `${harvestProgress}%` }}></div>
                </div>
                <p className="text-[9px] md:text-[10px] font-bold text-on-surface-variant dark:text-[#c0c9bb] mt-2 uppercase">{harvestProgress}% to Harvest</p>
              </div>
            </motion.div>

            {/* Est ROI for Active Crop */}
            <motion.div variants={itemVariants} className="col-span-1 p-5 md:p-6 bg-primary dark:bg-primary-fixed-dim text-on-primary dark:text-[#002204] rounded-[1.5rem] md:rounded-3xl shadow-xl shadow-primary/20 dark:shadow-none flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-on-primary/80 dark:text-[#002204]/70 text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-2 font-label">Est. ROI</p>
                {isRoiLoading ? (
                  <span className="material-symbols-outlined animate-spin text-2xl my-2">progress_activity</span>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={activeSectorIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <h4 className="text-2xl md:text-4xl font-black mb-1 font-headline">{currentRoiData ? `${currentRoiData.roi_percent}%` : "--"}</h4>
                      <div className="flex items-center gap-1 text-primary-fixed dark:text-[#00450d] text-[9px] md:text-[10px] font-bold mt-2">
                        <span className="material-symbols-outlined text-[12px] md:text-sm">payments</span>
                        <span className="truncate">{currentRoiData ? `₹${(currentRoiData.net_profit / 1000).toFixed(1)}k Profit` : "Wait"}</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/20 dark:bg-black/10 rounded-full blur-2xl"></div>
            </motion.div>

            {/* Weather Widget */}
            <motion.div variants={itemVariants} className="col-span-2 p-5 md:p-6 bg-surface-container-lowest dark:bg-[#303030] rounded-[1.5rem] md:rounded-3xl border border-outline-variant/20 dark:border-white/5 editorial-shadow">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-tertiary-fixed/30 dark:bg-tertiary-fixed-dim/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary dark:text-tertiary-fixed-dim">
                      {weather?.rain && weather.rain > 0 ? 'rainy' : 'wb_sunny'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold text-on-surface dark:text-white leading-tight font-headline">Local Weather</p>
                    <p className="text-[10px] md:text-xs text-on-surface-variant dark:text-[#c0c9bb] font-body truncate max-w-[100px] md:max-w-[120px]">{profile?.city || profile?.district || "Unknown"}</p>
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-on-surface dark:text-white font-headline">{weather?.temp || "--"}°C</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="text-center p-2 md:p-3 bg-surface-container-low dark:bg-[#1b1c1c] rounded-[1rem] md:rounded-2xl">
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-[#c0c9bb] mb-1 text-[16px] md:text-sm">opacity</span>
                  <p className="text-[10px] md:text-xs font-bold text-on-surface dark:text-white font-headline">{weather?.humidity || "--"}%</p>
                </div>
                <div className="text-center p-2 md:p-3 bg-surface-container-low dark:bg-[#1b1c1c] rounded-[1rem] md:rounded-2xl">
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-[#c0c9bb] mb-1 text-[16px] md:text-sm">water_drop</span>
                  <p className="text-[10px] md:text-xs font-bold text-on-surface dark:text-white font-headline">{weather?.rain || "0"}mm</p>
                </div>
                <div className="text-center p-2 md:p-3 bg-surface-container-low dark:bg-[#1b1c1c] rounded-[1rem] md:rounded-2xl">
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-[#c0c9bb] mb-1 text-[16px] md:text-sm">air</span>
                  <p className="text-[10px] md:text-xs font-bold text-on-surface dark:text-white font-headline">{weather?.wind || "--"}km/h</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: 🚀 PIXEL-PERFECT INTERACTIVE MAP 🚀 */}
          <motion.div variants={itemVariants} className="md:col-span-12 lg:col-span-8 bg-surface-container-lowest dark:bg-[#303030] rounded-[1.5rem] md:rounded-[2rem] border border-outline-variant/20 dark:border-white/5 editorial-shadow overflow-hidden flex flex-col min-h-[400px] md:min-h-[500px]">
            <div className="p-4 md:p-6 border-b border-outline-variant/20 dark:border-white/5 flex justify-between items-center bg-surface-container-lowest dark:bg-[#303030] relative z-20 shrink-0">
              <h3 className="text-lg md:text-xl font-bold text-on-surface dark:text-white font-headline">Interactive Farm Map</h3>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 bg-[#86d995]/20 dark:bg-primary-fixed-dim/20 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-[#146b34] dark:bg-primary-fixed-dim animate-pulse"></div>
                  <span className="text-[9px] md:text-[10px] font-bold text-[#146b34] dark:text-primary-fixed-dim uppercase tracking-wider font-label hidden sm:inline">Active</span>
                </div>
              </div>
            </div>
            
            {/* 🚀 THE PANNABLE WRAPPER for Mobile 🚀 */}
            <div className="flex-1 w-full overflow-auto relative no-scrollbar group rounded-b-[1.5rem] md:rounded-b-[2rem]">
              
              {/* Swipe Hint for Mobile */}
              <div className="md:hidden absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none shadow-lg">
                <span className="material-symbols-outlined text-[14px]">swipe</span> Pan Map
              </div>

              {/* The Fixed Canvas (Maintains exact X/Y pixels, scales background correctly) */}
              <div className="relative min-w-[900px] min-h-[480px] md:min-w-full md:min-h-full bg-gray-200 dark:bg-[#1a1a1a] overflow-hidden">
                
                {/* Fixed Background Image with Smooth Hover Zoom */}
                <div className="absolute inset-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-80 dark:opacity-40 transition-transform duration-1000 group-hover:scale-105 origin-center"></div>
                <div className="absolute inset-0 bg-black/10 dark:bg-black/30 pointer-events-none z-0"></div>
                
                {profile?.sectors?.length ? (
                  profile.sectors.map((sector, index) => {
                    const totalArea = parseFloat(profile.farmSize) || 1;
                    const sectorAcres = parseFloat(sector.acreage) || 1;
                    const baseAreaPx = 150000;
                    const sectorAreaPx = (sectorAcres / totalArea) * baseAreaPx;
                    const calculatedHeight = Math.max(80, Math.sqrt(sectorAreaPx / 1.5));
                    const calculatedWidth = Math.max(120, calculatedHeight * 1.5);
                    const styling = CROP_COLORS[sector.crop] || CROP_COLORS["DEFAULT"];
                    
                    // 🚀 EXACT X/Y COORDINATES RESTORED FROM PROFILING
                    const rawY = sector.y !== undefined ? sector.y : 40 + (index * 20);
                    const rawX = sector.x !== undefined ? sector.x : 40 + (index * 40);
                    const safeTop = typeof rawY === 'number' ? `${rawY}px` : rawY;
                    const safeLeft = typeof rawX === 'number' ? `${rawX}px` : rawX;

                    return (
                      <motion.div
                        key={sector.id}
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        className={`absolute ${styling} border-[2px] backdrop-blur-md rounded-2xl flex flex-col items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 ${index === activeSectorIdx ? 'ring-4 ring-white dark:ring-[#86d995] shadow-[0_0_20px_rgba(255,255,255,0.4)] z-20 opacity-100' : 'z-10 opacity-80 hover:opacity-100 hover:ring-2 hover:ring-white/50'}`}
                        style={{ width: `${calculatedWidth}px`, height: `${calculatedHeight}px`, top: safeTop, left: safeLeft }}
                        onClick={() => setActiveSectorIdx(index)}
                      >
                        <span className="font-headline font-black tracking-wide text-white drop-shadow-md text-sm md:text-xl uppercase text-center leading-tight px-2">{sector.name}</span>
                        <span className="mt-2 bg-white/90 text-gray-900 text-[9px] md:text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm text-center">
                          {sector.crop} • {sector.acreage} {profile.sizeUnit}
                        </span>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                    <div className="bg-white/90 dark:bg-black/60 backdrop-blur-md p-6 rounded-2xl text-center shadow-xl border border-white/20">
                      <span className="material-symbols-outlined text-4xl text-outline mb-2">map</span>
                      <p className="text-sm font-bold text-on-surface dark:text-white font-headline">Map not configured.</p>
                      <Link href="/profiling" className="mt-3 text-xs text-primary font-bold hover:underline inline-block">Setup Farm Profile &rarr;</Link>
                    </div>
                  </div>
                )}
                
                {/* Floating "Scaled" Badge overlaying the canvas */}
                <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold text-gray-700 dark:text-gray-300 pointer-events-none z-20 border border-white/10 shadow-lg">
                  <span className="material-symbols-outlined text-[12px] md:text-[14px] align-middle mr-1">straighten</span>
                  Scaled to {profile?.farmSize || 0} {profile?.sizeUnit || 'Acres'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 🚀 NEW: REFINED MOBILE QUICK ACCESS NAV (Matches Screenshot exactly) 🚀
        <div className="grid md:hidden grid-cols-4 gap-3">
          <Link href="/dashboard/soil-health" className="bg-surface-container-lowest dark:bg-[#303030] p-4 rounded-[1.25rem] border border-outline-variant/20 dark:border-white/5 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-2xl text-primary dark:text-[#86d995]">science</span>
          </Link>
          <Link href="/dashboard/calendar" className="bg-surface-container-lowest dark:bg-[#303030] p-4 rounded-[1.25rem] border border-outline-variant/20 dark:border-white/5 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-2xl text-[#b88b4c]">calendar_today</span>
          </Link>
          <Link href="/dashboard/weather" className="bg-surface-container-lowest dark:bg-[#303030] p-4 rounded-[1.25rem] border border-outline-variant/20 dark:border-white/5 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-2xl text-[#4a7c9c]">wb_sunny</span>
          </Link>
          <Link href="/dashboard/analytics" className="bg-surface-container-lowest dark:bg-[#303030] p-4 rounded-[1.25rem] border border-outline-variant/20 dark:border-white/5 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-2xl text-tertiary dark:text-tertiary-fixed-dim">analytics</span>
          </Link>
        </div> */}

        {/* BOTTOM ROW: Deep Analysis Insights (Desktop Only) */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] p-8 rounded-[2rem] border border-outline-variant/20 dark:border-white/5 editorial-shadow relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="relative z-10">
              <h4 className="text-2xl font-bold mb-4 tracking-tight font-headline dark:text-white">Soil Nutrient Analysis</h4>
              <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] mb-6 leading-relaxed font-body h-10 line-clamp-2">{soilInsight}</p>
              <Link href="/dashboard/soil-health" className="text-primary dark:text-primary-fixed-dim font-bold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                View detailed labs <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-primary/5 dark:text-primary-fixed-dim/5 rotate-12 pointer-events-none">science</span>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] p-8 rounded-[2rem] border border-outline-variant/20 dark:border-white/5 editorial-shadow relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-2xl font-bold tracking-tight font-headline dark:text-white">Pest Risk Forecast</h4>
                <div className="w-8 h-8 rounded-full bg-error-container text-error flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">warning</span>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] mb-6 leading-relaxed font-body h-10 line-clamp-2">Low risk of Aphid infestation for the next 10 days based on humidity trends.</p>
              <button className="text-error font-bold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Check protocols <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-error/5 rotate-12 pointer-events-none">bug_report</span>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] p-8 rounded-[2rem] border border-outline-variant/20 dark:border-white/5 editorial-shadow relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="relative z-10">
              <h4 className="text-2xl font-bold mb-4 tracking-tight font-headline dark:text-white">Market Intelligence</h4>
              <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] mb-6 leading-relaxed font-body h-10 line-clamp-2">{activeSector ? `${activeSector.crop} futures are trending upwards. Consider holding.` : "Add crops to get live market intelligence."}</p>
              <Link href="/community" className="text-tertiary dark:text-tertiary-fixed-dim font-bold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Go to Live Prices <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl text-tertiary/5 dark:text-tertiary-fixed-dim/5 rotate-12 pointer-events-none">trending_up</span>
          </motion.div>
        </div>

      </motion.div>

      {/* Footer */}
      <footer className="mt-12 md:mt-20 border-t border-outline-variant/20 dark:border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-sm text-on-surface-variant dark:text-[#c0c9bb] font-body">
        <p>© {new Date().getFullYear()} AgroNXT. Precision for the Modern Cultivator.</p>
        <div className="flex gap-4 md:gap-6 font-bold uppercase tracking-wider text-[9px] md:text-[10px]">
          <Link href="/support" className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors">Support</Link>
          <Link href="/privacy" className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors">Terms</Link>
        </div>
      </footer>
    </main>
  );
}