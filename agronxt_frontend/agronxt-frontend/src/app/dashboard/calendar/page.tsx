"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// --- ANIMATION CONFIGS ---
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


// --- INTERFACES & CROP DATA ---
interface Sector {
  id: string;
  name: string;
  crop: string;
  acreage: string;
  sowingDate: string;
  status: string;
  duration?: number; // Fetched from ML Model during Profiling
}

// Exactly matched to the Tools Page dictionary for consistency
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

// Helper to determine growth stage based on percentage
const getGrowthStage = (progress: number) => {
  if (progress <= 0) return { stage: "Planned", icon: "calendar_month", color: "text-outline dark:text-[#c0c9bb]" };
  if (progress < 15) return { stage: "Seedling", icon: "psychiatry", color: "text-emerald-500" };
  if (progress < 40) return { stage: "Vegetative", icon: "grass", color: "text-green-500" };
  if (progress < 70) return { stage: "Flowering / Fruiting", icon: "local_florist", color: "text-amber-500" };
  if (progress < 100) return { stage: "Maturation", icon: "eco", color: "text-orange-500" };
  return { stage: "Ready for Harvest", icon: "agriculture", color: "text-primary dark:text-primary-fixed-dim" };
};

export default function CropCalendarPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [locationStr, setLocationStr] = useState("Your Farm");

  useEffect(() => {
    // SECURITY COMPLIANCE: Reading securely from Local Storage
    const loadData = () => {
      setIsLoading(true);
      try {
        const savedProfile = localStorage.getItem("agronxt_farm_profile");
        if (savedProfile) {
          const data = JSON.parse(savedProfile);
          if (data.sectors && Array.isArray(data.sectors)) {
            // Sort by closest to harvest (oldest sowing date first)
            const sortedSectors = data.sectors.sort((a: Sector, b: Sector) => 
              new Date(a.sowingDate).getTime() - new Date(b.sowingDate).getTime()
            );
            setSectors(sortedSectors);
          }
          if (data.city || data.district) {
            setLocationStr(data.city || data.district);
          }
        }
      } catch (err) {
        console.error("Failed to load calendar data", err);
      } finally {
        setTimeout(() => setIsLoading(false), 400); // Smooth UI transition
      }
    };
    loadData();
  }, []);

  const calculateTimeline = (sector: Sector) => {
    const start = new Date(sector.sowingDate);
    const meta = getCropMeta(sector.crop);
    
    // Use the explicit duration from the ML model if it exists, otherwise parse it from the dictionary
    const hasMLDuration = sector.duration !== undefined && sector.duration !== null;
    const durationDays = hasMLDuration ? Number(sector.duration) : (parseInt(meta.duration) || 120);
    const dataSource = hasMLDuration ? "ML Estimate" : "Fixed Data";
    
    // Calculate Harvest Date
    const harvest = new Date(start);
    harvest.setDate(harvest.getDate() + durationDays);
    
    // Calculate Progress
    const today = new Date();
    const totalTime = harvest.getTime() - start.getTime();
    const elapsedTime = today.getTime() - start.getTime();
    
    let progress = (elapsedTime / totalTime) * 100;
    if (progress < 0) progress = 0;
    if (progress > 100) progress = 100;
    
    const daysLeft = Math.ceil((harvest.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      startDateStr: start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      harvestDateStr: harvest.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      progress: Math.round(progress),
      daysLeft: daysLeft < 0 ? 0 : daysLeft,
      durationDays,
      dataSource,
      emoji: meta.emoji
    };
  };

  return (
    <main className="lg:ml-64 pt-28 pb-24 px-6 md:px-8 min-h-screen transition-colors duration-300 font-body">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.header {...fadeUpConfig} className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="text-primary dark:text-primary-fixed-dim font-label text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Operations
            </span>
            <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface dark:text-white mt-2 mb-4">
              Crop Calendar
            </h1>
            <p className="text-lg text-on-surface-variant dark:text-[#c0c9bb] max-w-2xl font-body leading-relaxed flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">location_on</span> {locationStr}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-surface-container-high dark:bg-[#303030] px-5 py-2.5 rounded-xl border border-transparent dark:border-white/10 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-[18px]">calendar_today</span>
              <span className="text-sm font-bold text-on-surface dark:text-white">{new Date().toLocaleDateString("en-US", { weekday: 'short', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </motion.header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-4xl animate-spin mb-4">calendar_month</span>
            <p className="font-bold font-body text-on-surface-variant dark:text-[#c0c9bb] animate-pulse">Calculating harvest timelines...</p>
          </div>
        ) : sectors.length === 0 ? (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2rem] p-12 text-center editorial-shadow border border-outline-variant/10 dark:border-white/5">
            <span className="material-symbols-outlined text-6xl text-outline dark:text-[#c0c9bb]/50 mb-4">event_busy</span>
            <h2 className="text-2xl font-headline font-bold text-on-surface dark:text-white mb-2">No Active Crops Found</h2>
            <p className="text-on-surface-variant dark:text-[#c0c9bb] mb-6 max-w-md mx-auto">
              You haven't configured any crop sectors yet. Go to your Farm Profiling settings to add your current plantations.
            </p>
            <Link href="/profiling" className="inline-flex items-center gap-2 bg-primary dark:bg-primary-fixed-dim text-on-primary dark:text-[#002204] px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">add</span> Configure Sectors
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
              
              {/* Timeline Cards */}
              {sectors.map((sector, index) => {
                const tl = calculateTimeline(sector);
                const stageInfo = getGrowthStage(tl.progress);
                const isReady = tl.progress >= 100;

                return (
                  <motion.div 
                    key={sector.id} 
                    variants={itemVariants}
                    className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2rem] p-6 md:p-8 editorial-shadow border border-outline-variant/10 dark:border-white/5 relative overflow-hidden group hover:border-primary/30 dark:hover:border-primary-fixed-dim/30 transition-colors"
                  >
                    {/* Background Graphic (Using stage icon instead of emoji for elegance) */}
                    <div className="absolute -right-6 -bottom-6 text-[150px] opacity-5 pointer-events-none transform group-hover:scale-110 transition-transform duration-700">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{stageInfo.icon}</span>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row gap-8">
                      
                      {/* Left: Identity */}
                      <div className="w-full md:w-1/4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-outline-variant/20 dark:border-white/10 pb-6 md:pb-0 md:pr-6">
                        <span className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-2">
                          Sector: {sector.name}
                        </span>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{tl.emoji}</span>
                          <h2 className="text-3xl font-headline font-black text-on-surface dark:text-white capitalize">
                            {sector.crop}
                          </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-surface-container-high dark:bg-[#1b1c1c] text-on-surface dark:text-white px-3 py-1 rounded-md text-xs font-bold border border-transparent dark:border-white/5">
                            {sector.acreage} Acres
                          </span>
                          <span className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 bg-surface-container-high dark:bg-white/5 ${stageInfo.color}`}>
                            <span className="material-symbols-outlined text-[14px]">{stageInfo.icon}</span>
                            {stageInfo.stage}
                          </span>
                        </div>
                      </div>

                      {/* Right: Timeline & Progress */}
                      <div className="w-full md:w-3/4 flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-1">Sown</p>
                            <p className="text-sm font-bold text-on-surface dark:text-white">{tl.startDateStr}</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-headline font-black text-primary dark:text-primary-fixed-dim mb-1">
                              {tl.progress}%
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-1">Est. Harvest</p>
                            <p className={`text-sm font-bold ${isReady ? 'text-primary dark:text-primary-fixed-dim' : 'text-on-surface dark:text-white'}`}>
                              {tl.harvestDateStr}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative w-full h-3 bg-surface-container-highest dark:bg-[#1b1c1c] rounded-full overflow-hidden mb-4">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${tl.progress}%` }} 
                            transition={{ duration: 1.5, delay: index * 0.2, ease: "easeOut" }}
                            className={`absolute top-0 left-0 h-full rounded-full ${isReady ? 'bg-primary dark:bg-primary-fixed-dim' : 'bg-secondary dark:bg-secondary-fixed'}`}
                          />
                        </div>

                        {/* Footer Status */}
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-on-surface-variant dark:text-[#c0c9bb] font-body flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            {tl.durationDays} Day Lifecycle <span className="opacity-60 ml-1 font-bold">({tl.dataSource})</span>
                          </p>
                          {isReady ? (
                            <span className="text-sm font-bold text-primary dark:text-primary-fixed-dim animate-pulse">
                              Ready to Harvest!
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-on-surface dark:text-white">
                              {tl.daysLeft} Days Remaining
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                  </motion.div>
                );
              })}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}