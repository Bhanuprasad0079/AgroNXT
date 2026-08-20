"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// --- ANIMATION CONFIGS (Matched to ToolsPage) ---
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

// --- INTERFACES ---
interface SoilData {
  n: number;
  p: number;
  k: number;
  ph: number;
  location: string;
}

interface FertilizerRec {
  type: string;
  action: string;
  reason: string;
  icon: string;
  theme: "primary" | "secondary" | "error" | "amber" | "blue";
}

export default function SoilHealthPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [healthScore, setHealthScore] = useState(0);
  const [recommendations, setRecommendations] = useState<FertilizerRec[]>([]);

  useEffect(() => {
    // SECURITY COMPLIANCE: Securely reading from Local Storage. No frontend DB calls.
    const loadLocalData = () => {
      setIsLoading(true);
      try {
        const savedProfile = localStorage.getItem("agronxt_farm_profile");
        
        if (savedProfile) {
          const data = JSON.parse(savedProfile);
          const n = parseFloat(data.nitrogen) || 45; 
          const p = parseFloat(data.phosphorus) || 20;
          const k = parseFloat(data.potassium) || 120;
          const ph = parseFloat(data.phLevel) || 5.8;
          const location = data.city || data.district || "Your Farm";

          setSoilData({ n, p, k, ph, location });
          calculateHealthAndFertilizer(n, p, k, ph);
        } else {
          // Graceful fallback if unconfigured
          setSoilData({ n: 40, p: 15, k: 110, ph: 5.2, location: "Unconfigured Farm" });
          calculateHealthAndFertilizer(40, 15, 110, 5.2);
        }
      } catch (err) {
        console.error("Failed to load local profile data", err);
      } finally {
        setTimeout(() => setIsLoading(false), 500); 
      }
    };

    loadLocalData();
  }, []);

  // --- LOCAL AGRONOMY ENGINE ---
  const calculateHealthAndFertilizer = (n: number, p: number, k: number, ph: number) => {
    let score = 100;
    const recs: FertilizerRec[] = [];

    if (n < 60) {
      score -= 20;
      recs.push({ type: "Urea (46-0-0)", action: "Apply 45 kg/acre", reason: "Nitrogen levels are critically low. Essential for vegetative growth.", icon: "eco", theme: "primary" });
    } else if (n > 140) {
      score -= 10;
      recs.push({ type: "Reduce Nitrogen", action: "Halt N-Fertilizers", reason: "Excessive Nitrogen detected. Risk of crop burning.", icon: "warning", theme: "error" });
    }

    if (p < 25) {
      score -= 15;
      recs.push({ type: "DAP (18-46-0)", action: "Apply 25 kg/acre", reason: "Phosphorus deficit. Essential for strong root development.", icon: "grass", theme: "amber" });
    }

    if (k < 120) {
      score -= 15;
      recs.push({ type: "MOP (0-0-60)", action: "Apply 20 kg/acre", reason: "Potassium is low. Required for disease resistance.", icon: "water_drop", theme: "blue" });
    }

    if (ph < 5.8) {
      score -= 25; 
      recs.push({ type: "Agricultural Lime", action: "Apply 500 kg/acre", reason: "Soil is too acidic. Lime will neutralize it and unlock nutrients.", icon: "science", theme: "secondary" });
    } else if (ph > 7.8) {
      score -= 20;
      recs.push({ type: "Elemental Sulfur", action: "Apply 100 kg/acre", reason: "Soil is too alkaline. Sulfur will lower the pH to optimal ranges.", icon: "science", theme: "secondary" });
    }

    if (recs.length === 0) {
      recs.push({ type: "Balanced NPK (19-19-19)", action: "Maintenance Dose", reason: "Your soil health is spectacular. Use a light dose to maintain vitality.", icon: "verified", theme: "primary" });
    }

    setHealthScore(Math.max(0, score));
    setRecommendations(recs);
  };

  const getThemeClasses = (theme: string) => {
    switch(theme) {
      case 'primary': return "text-primary dark:text-primary-fixed-dim bg-primary/10 border-primary/20";
      case 'secondary': return "text-secondary dark:text-secondary-fixed bg-secondary/10 border-secondary/20";
      case 'error': return "text-error dark:text-red-400 bg-error/10 border-error/20";
      case 'amber': return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
      case 'blue': return "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20";
      default: return "text-outline bg-surface-container-high border-outline-variant/20";
    }
  };

  return (
    <main className="lg:ml-64 pt-28 pb-24 px-6 md:px-8 min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header matched to ToolsPage */}
        <motion.header {...fadeUpConfig} className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="text-primary dark:text-primary-fixed-dim font-label text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Agronomy Engine
            </span>
            <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface dark:text-white mt-2 mb-4">
              Soil Diagnostics
            </h1>
            <p className="text-lg text-on-surface-variant dark:text-[#c0c9bb] max-w-2xl font-body leading-relaxed flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">location_on</span> {soilData?.location || "Loading..."}
            </p>
          </div>
          <Link href="/profiling" className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-high dark:bg-[#303030] text-on-surface dark:text-white border border-transparent dark:border-white/10 rounded-xl font-bold text-sm transition-all hover:bg-surface-container-highest dark:hover:bg-[#41493e]">
            <span className="material-symbols-outlined text-[18px]">edit_document</span>
            Update Lab Data
          </Link>
        </motion.header>

        {isLoading || !soilData ? (
          <div className="flex flex-col items-center justify-center py-32">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-4xl animate-spin mb-4">science</span>
            <p className="font-bold font-body text-on-surface-variant dark:text-[#c0c9bb] animate-pulse">Analyzing soil compounds...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
              
              {/* --- TOP ROW: Health Score & pH --- */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Health Score Card */}
                <motion.div variants={itemVariants} className="lg:col-span-8 bg-surface-container-lowest dark:bg-[#303030] rounded-[2rem] p-8 md:p-10 editorial-shadow border border-outline-variant/10 dark:border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-2xl font-headline font-bold tracking-tight text-on-surface dark:text-white">
                        Vitality Score
                      </h2>
                      <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm mt-1 font-body">
                        Based on your NPK and pH balance.
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary-fixed-dim/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim">analytics</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-end gap-3 mb-6">
                      <span className="text-7xl font-headline font-extrabold text-on-surface dark:text-white tracking-tighter leading-none">
                        {healthScore}
                      </span>
                      <span className="text-xl font-bold text-outline dark:text-[#c0c9bb]/60 mb-1">/ 100</span>
                    </div>

                    <div className="w-full bg-surface-container-highest dark:bg-[#1b1c1c] h-2 rounded-full overflow-hidden mb-4">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                        className={`h-full rounded-full ${healthScore > 80 ? 'bg-primary dark:bg-primary-fixed-dim' : healthScore > 50 ? 'bg-secondary dark:bg-secondary-fixed' : 'bg-error'}`}
                      />
                    </div>
                    <p className="text-sm font-body text-on-surface-variant dark:text-[#c0c9bb] leading-relaxed">
                      {healthScore > 80 ? "Your soil is in excellent condition. Highly fertile and ready for high-yield crops." : 
                       healthScore > 50 ? "Your soil needs attention. Specific nutrient deficits are currently limiting your maximum yield potential." : 
                       "Critical condition. Immediate fertilization and pH balancing is required before sowing."}
                    </p>
                  </div>
                </motion.div>

                {/* pH Card */}
                <motion.div variants={itemVariants} className="lg:col-span-4 bg-surface-container-lowest dark:bg-[#303030] rounded-[2rem] p-8 md:p-10 editorial-shadow border border-outline-variant/10 dark:border-white/5 flex flex-col justify-center">
                  <p className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-2">Soil Acidity</p>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-5xl font-headline font-extrabold text-on-surface dark:text-white">{soilData.ph}</span>
                    <span className="text-sm font-bold text-outline dark:text-[#c0c9bb]/60 font-body">pH Level</span>
                  </div>
                  <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] font-body leading-relaxed pt-4 border-t border-outline-variant/10 dark:border-white/5">
                    {soilData.ph < 6.0 ? "Highly acidic. Macronutrients are likely locked up." : 
                     soilData.ph > 7.5 ? "Highly alkaline. Micronutrient deficiencies are likely." : 
                     "Perfectly balanced. Nutrients are fully available to plant roots."}
                  </p>
                </motion.div>
              </div>

              {/* --- MIDDLE ROW: NPK Breakdown --- */}
              <motion.div variants={itemVariants}>
                <h3 className="text-xl font-headline font-bold text-on-surface dark:text-white mb-5">
                  Macronutrient Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* N */}
                  <div className="bg-surface-container-low dark:bg-[#1b1c1c] rounded-[1.5rem] p-6 border border-transparent dark:border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Nitrogen (N)</span>
                      <span className={`material-symbols-outlined text-sm ${soilData.n < 60 || soilData.n > 140 ? 'text-error' : 'text-primary dark:text-primary-fixed-dim'}`}>
                        {soilData.n < 60 || soilData.n > 140 ? 'warning' : 'verified'}
                      </span>
                    </div>
                    <div className="flex items-end gap-1 mb-3">
                      <span className="text-3xl font-headline font-extrabold text-on-surface dark:text-white">{soilData.n}</span>
                      <span className="text-xs font-bold text-outline dark:text-[#c0c9bb]/60 mb-1">kg/ha</span>
                    </div>
                    <div className="w-full bg-surface-container-highest dark:bg-[#303030] h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${Math.min((soilData.n / 150) * 100, 100)}%` }} transition={{ delay: 0.2 }}
                        className={`h-full rounded-full ${soilData.n < 60 || soilData.n > 140 ? 'bg-error' : 'bg-primary dark:bg-primary-fixed-dim'}`} 
                      />
                    </div>
                    <p className="text-[10px] text-outline dark:text-[#c0c9bb]/60 mt-3 font-body font-bold text-right">Target: 80 - 120</p>
                  </div>

                  {/* P */}
                  <div className="bg-surface-container-low dark:bg-[#1b1c1c] rounded-[1.5rem] p-6 border border-transparent dark:border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Phosphorus (P)</span>
                      <span className={`material-symbols-outlined text-sm ${soilData.p < 25 ? 'text-amber-500' : 'text-primary dark:text-primary-fixed-dim'}`}>
                        {soilData.p < 25 ? 'warning' : 'verified'}
                      </span>
                    </div>
                    <div className="flex items-end gap-1 mb-3">
                      <span className="text-3xl font-headline font-extrabold text-on-surface dark:text-white">{soilData.p}</span>
                      <span className="text-xs font-bold text-outline dark:text-[#c0c9bb]/60 mb-1">kg/ha</span>
                    </div>
                    <div className="w-full bg-surface-container-highest dark:bg-[#303030] h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${Math.min((soilData.p / 80) * 100, 100)}%` }} transition={{ delay: 0.3 }}
                        className={`h-full rounded-full ${soilData.p < 25 ? 'bg-amber-500' : 'bg-primary dark:bg-primary-fixed-dim'}`} 
                      />
                    </div>
                    <p className="text-[10px] text-outline dark:text-[#c0c9bb]/60 mt-3 font-body font-bold text-right">Target: 30 - 60</p>
                  </div>

                  {/* K */}
                  <div className="bg-surface-container-low dark:bg-[#1b1c1c] rounded-[1.5rem] p-6 border border-transparent dark:border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Potassium (K)</span>
                      <span className={`material-symbols-outlined text-sm ${soilData.k < 120 ? 'text-blue-500' : 'text-primary dark:text-primary-fixed-dim'}`}>
                        {soilData.k < 120 ? 'warning' : 'verified'}
                      </span>
                    </div>
                    <div className="flex items-end gap-1 mb-3">
                      <span className="text-3xl font-headline font-extrabold text-on-surface dark:text-white">{soilData.k}</span>
                      <span className="text-xs font-bold text-outline dark:text-[#c0c9bb]/60 mb-1">kg/ha</span>
                    </div>
                    <div className="w-full bg-surface-container-highest dark:bg-[#303030] h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${Math.min((soilData.k / 300) * 100, 100)}%` }} transition={{ delay: 0.4 }}
                        className={`h-full rounded-full ${soilData.k < 120 ? 'bg-blue-500' : 'bg-primary dark:bg-primary-fixed-dim'}`} 
                      />
                    </div>
                    <p className="text-[10px] text-outline dark:text-[#c0c9bb]/60 mt-3 font-body font-bold text-right">Target: 150 - 250</p>
                  </div>

                </div>
              </motion.div>

              {/* --- BOTTOM ROW: Fertilizer Recommendations --- */}
              <motion.section variants={itemVariants}>
                <div className="flex items-center justify-between mb-6 border-t border-outline-variant/10 dark:border-white/5 pt-8">
                  <h3 className="text-xl font-headline font-bold text-on-surface dark:text-white">Prescribed Fertilizers</h3>
                  <span className="text-xs font-bold bg-surface-container-high dark:bg-[#1b1c1c] px-3 py-1.5 rounded-md text-outline dark:text-[#c0c9bb] font-label uppercase tracking-widest">
                    Auto-Generated
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {recommendations.map((rec, idx) => {
                    const themeClasses = getThemeClasses(rec.theme);
                    return (
                      <div key={idx} className={`p-6 rounded-2xl border flex flex-col sm:flex-row gap-5 items-start sm:items-center ${themeClasses}`}>
                        <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center bg-surface dark:bg-[#181c1b] shadow-sm">
                          <span className="material-symbols-outlined text-2xl">{rec.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-1 mb-2">
                            <h4 className="text-base font-headline font-bold text-on-surface dark:text-white">{rec.type}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-widest font-label opacity-80">
                              {rec.action}
                            </span>
                          </div>
                          <p className="text-sm font-body text-on-surface-variant dark:text-[#c0c9bb] leading-relaxed">
                            {rec.reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}