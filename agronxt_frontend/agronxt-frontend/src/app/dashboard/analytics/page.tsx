"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateROI } from "@/lib/api";

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

// --- HELPERS ---
function formatINR(n?: number | null) {
  if (n === null || n === undefined) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [locationStr, setLocationStr] = useState("Your Farm");
  const [error, setError] = useState("");

  // Aggregated Financial State
  const [financials, setFinancials] = useState({
    totalRevenue: 0,
    totalInvestment: 0,
    netProfit: 0,
    blendedROI: 0,
    costs: { seed: 0, fert: 0, labour: 0, irrigation: 0, pesticide: 0, misc: 0 }
  });

  // Sector-by-Sector State
  const [sectorAnalytics, setSectorAnalytics] = useState<any[]>([]);
  const [activeSectorIdx, setActiveSectorIdx] = useState(0); // <-- NEW: Controls the interactive tabs

  // Procurement State
  const [procurement, setProcurement] = useState<any[]>([]);
  const [totalAcres, setTotalAcres] = useState(0);

  useEffect(() => {
    const generateAnalytics = async () => {
      setIsLoading(true);
      setError("");
      try {
        // SECURITY COMPLIANCE: Local Storage Only
        const savedProfile = localStorage.getItem("agronxt_farm_profile");
        if (!savedProfile) throw new Error("No farm profile found.");
        
        const data = JSON.parse(savedProfile);
        setLocationStr(data.city || data.district || "Your Farm");

        const sectors = data.sectors || [];
        if (sectors.length === 0) {
          setIsLoading(false);
          return;
        }

        // 1. Calculate Total Active Acreage
        const tAcres = sectors.reduce((sum: number, s: any) => sum + (parseFloat(s.acreage) || 0), 0);
        setTotalAcres(tAcres);

        // 2. Fetch ML ROI Data for ALL sectors simultaneously
        const roiPromises = sectors.map((s: any) => 
          calculateROI({ crop: s.crop, acres: parseFloat(s.acreage) } as any)
            .catch(() => null) 
        );
        const roiResults = await Promise.all(roiPromises);

        // 3. Map detailed data back to each individual sector
        const detailedSectors = sectors.map((sector: any, index: number) => {
          const fin = roiResults[index]?.status === "ok" ? roiResults[index] : null;
          return { ...sector, financials: fin };
        });
        setSectorAnalytics(detailedSectors);

        // 4. Aggregate Farm-Wide Financials
        let rev = 0, inv = 0, prof = 0;
        let cSeed = 0, cFert = 0, cLab = 0, cIrr = 0, cPest = 0, cMisc = 0;

        roiResults.forEach(res => {
          if (res && res.status === "ok") {
            rev += res.expected_revenue || 0;
            inv += res.total_investment || 0;
            prof += res.net_profit || 0;
            
            cSeed += res.seed_cost || 0;
            cFert += res.fertilizer_cost || 0;
            cLab += res.labour_cost || 0;
            cIrr += res.irrigation_cost || 0;
            cPest += res.pesticide_cost || 0;
            cMisc += res.misc_cost || 0;
          }
        });

        const blendedROI = inv > 0 ? (prof / inv) * 100 : 0;

        setFinancials({
          totalRevenue: rev, totalInvestment: inv, netProfit: prof, blendedROI,
          costs: { seed: cSeed, fert: cFert, labour: cLab, irrigation: cIrr, pesticide: cPest, misc: cMisc }
        });

        // 5. Generate Agronomic Procurement List
        const n = parseFloat(data.nitrogen) || 45; 
        const p = parseFloat(data.phosphorus) || 20;
        const k = parseFloat(data.potassium) || 120;
        const ph = parseFloat(data.phLevel) || 5.8;

        const shoppingList = [];
        if (n < 60) shoppingList.push({ name: "Urea (46-0-0)", qty: Math.ceil(45 * tAcres), unit: "kg", reason: "Critical Nitrogen deficit across fields.", icon: "eco", color: "text-green-500", bg: "bg-green-500/10" });
        if (p < 25) shoppingList.push({ name: "DAP (18-46-0)", qty: Math.ceil(25 * tAcres), unit: "kg", reason: "Low Phosphorus. Needed for root vigor.", icon: "grass", color: "text-emerald-500", bg: "bg-emerald-500/10" });
        if (k < 120) shoppingList.push({ name: "MOP (0-0-60)", qty: Math.ceil(20 * tAcres), unit: "kg", reason: "Potassium shortage. Vital for drought resistance.", icon: "water_drop", color: "text-blue-500", bg: "bg-blue-500/10" });
        if (ph < 5.8) shoppingList.push({ name: "Agricultural Lime", qty: Math.ceil(0.5 * tAcres), unit: "Tons", reason: "Soil acidity is locking up macro-nutrients.", icon: "science", color: "text-amber-500", bg: "bg-amber-500/10" });
        else if (ph > 7.8) shoppingList.push({ name: "Elemental Sulfur", qty: Math.ceil(100 * tAcres), unit: "kg", reason: "High alkalinity. Sulfur required to balance pH.", icon: "science", color: "text-amber-500", bg: "bg-amber-500/10" });

        if (shoppingList.length === 0) {
          shoppingList.push({ name: "NPK 19-19-19", qty: Math.ceil(10 * tAcres), unit: "kg", reason: "Maintenance dose for optimal soil health.", icon: "verified", color: "text-primary dark:text-primary-fixed-dim", bg: "bg-primary/10" });
        }

        setProcurement(shoppingList);

      } catch (err) {
        console.error(err);
        setError("Failed to generate analytics. Please ensure your farm is profiled and backend is running.");
      } finally {
        setIsLoading(false);
      }
    };

    generateAnalytics();
  }, []);

  const costTotal = financials.totalInvestment > 0 ? financials.totalInvestment : 1;
  const getWidth = (val: number) => `${Math.max((val / costTotal) * 100, 2)}%`;

  const activeSector = sectorAnalytics[activeSectorIdx];

  return (
    <main className="lg:ml-64 pt-28 pb-24 px-6 md:px-8 min-h-screen transition-colors duration-300 font-body">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.header {...fadeUpConfig} className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="text-primary dark:text-primary-fixed-dim font-label text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Intelligence
            </span>
            <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface dark:text-white mt-2 mb-4">
              Farm Analytics
            </h1>
            <p className="text-lg text-on-surface-variant dark:text-[#c0c9bb] max-w-2xl font-body leading-relaxed flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">domain</span> Aggregating {totalAcres > 0 ? `${totalAcres} Acres` : "Data"} in {locationStr}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="bg-surface-container-high dark:bg-[#303030] hover:bg-surface-container-highest dark:hover:bg-[#41493e] px-5 py-2.5 rounded-xl border border-transparent dark:border-white/10 flex items-center gap-2 text-sm font-bold text-on-surface dark:text-white transition-all">
              <span className="material-symbols-outlined text-[18px]">download</span> Export Report
            </button>
          </div>
        </motion.header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-5xl animate-spin mb-4">query_stats</span>
            <p className="font-bold font-body text-on-surface-variant dark:text-[#c0c9bb] animate-pulse">Running financial models...</p>
          </div>
        ) : error ? (
          <div className="bg-error-container/20 border border-error/30 p-6 rounded-2xl flex items-start gap-4">
            <span className="material-symbols-outlined text-error text-3xl">error</span>
            <div>
              <h3 className="font-bold text-error text-lg font-headline">Data Sync Failed</h3>
              <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm mt-1">{error}</p>
            </div>
          </div>
        ) : totalAcres === 0 ? (
          <div className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2rem] p-12 text-center editorial-shadow border border-outline-variant/10 dark:border-white/5">
            <span className="material-symbols-outlined text-6xl text-outline dark:text-[#c0c9bb]/50 mb-4">analytics</span>
            <h2 className="text-2xl font-headline font-bold text-on-surface dark:text-white mb-2">No Operations Found</h2>
            <p className="text-on-surface-variant dark:text-[#c0c9bb] mb-6 max-w-md mx-auto">
              Analytics require active crop sectors. Please configure your fields in the Farm Profiling setup.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
              
              {/* --- 1. EXECUTIVE FINANCIAL SUMMARY --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] p-6 rounded-[2rem] border border-outline-variant/10 dark:border-white/5 editorial-shadow relative overflow-hidden group">
                  <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-1">Projected Revenue</p>
                  <h3 className="text-3xl font-headline font-black text-on-surface dark:text-white">{formatINR(financials.totalRevenue)}</h3>
                  <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-6xl text-on-surface/5 dark:text-white/5 group-hover:scale-110 transition-transform">account_balance_wallet</span>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] p-6 rounded-[2rem] border border-outline-variant/10 dark:border-white/5 editorial-shadow relative overflow-hidden group">
                  <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-1">Total Operating Cost</p>
                  <h3 className="text-3xl font-headline font-black text-on-surface dark:text-white">{formatINR(financials.totalInvestment)}</h3>
                  <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-6xl text-on-surface/5 dark:text-white/5 group-hover:scale-110 transition-transform">receipt_long</span>
                </motion.div>

                <motion.div variants={itemVariants} className={`p-6 rounded-[2rem] border shadow-lg relative overflow-hidden group lg:col-span-2 ${financials.netProfit >= 0 ? "bg-primary dark:bg-primary-fixed-dim text-on-primary dark:text-[#002204] border-transparent" : "bg-error dark:bg-red-900 text-white border-transparent"}`}>
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-label uppercase tracking-widest opacity-80 font-bold mb-1">Estimated Net Profit</p>
                      <h3 className="text-4xl md:text-5xl font-headline font-black">{formatINR(financials.netProfit)}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-label uppercase tracking-widest opacity-80 font-bold mb-1">Blended ROI</p>
                      <h3 className="text-3xl font-headline font-black">{financials.blendedROI.toFixed(1)}%</h3>
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none" />
                </motion.div>
              </div>

              {/* --- 2. INTERACTIVE CROP-WISE SECTOR ANALYSIS --- */}
              <motion.div variants={itemVariants}>
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-headline font-bold text-on-surface dark:text-white">Sector Analysis</h2>
                    <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] mt-1">Select a field to view its specific financial breakdown.</p>
                  </div>
                  
                  {/* Interactive Tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
                    {sectorAnalytics.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSectorIdx(idx)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all border ${
                          activeSectorIdx === idx
                            ? "bg-primary dark:bg-primary-fixed-dim text-on-primary dark:text-[#002204] border-transparent shadow-md"
                            : "bg-surface-container-lowest dark:bg-[#1b1c1c] text-outline dark:text-[#c0c9bb] border-outline-variant/20 dark:border-white/10 hover:bg-surface-container-high dark:hover:bg-white/5"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">grass</span>
                        {s.name} ({s.crop})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Sector Details Area */}
                <div className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2rem] border border-outline-variant/10 dark:border-white/5 editorial-shadow overflow-hidden min-h-[300px]">
                  <AnimatePresence mode="wait">
                    {activeSector && activeSector.financials ? (
                      <motion.div 
                        key={activeSectorIdx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col h-full"
                      >
                        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container-low/50 dark:bg-[#1b1c1c]/50 border-b border-outline-variant/5 dark:border-white/5 gap-4">
                          <div>
                            <h4 className="text-2xl font-headline font-black text-on-surface dark:text-white uppercase">{activeSector.name}</h4>
                            <p className="text-sm font-label font-bold text-primary dark:text-primary-fixed-dim tracking-widest mt-1">
                              {activeSector.crop} • {activeSector.acreage} ACRES
                            </p>
                          </div>
                          
                          <div className="flex gap-4 w-full md:w-auto">
                            <div className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-surface dark:bg-[#181c1b] border border-outline-variant/10 dark:border-white/5 text-right">
                              <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-1">Total Cost</p>
                              <p className="font-bold text-on-surface dark:text-white">{formatINR(activeSector.financials.total_investment)}</p>
                            </div>
                            <div className={`flex-1 md:flex-none px-4 py-3 rounded-xl flex flex-col items-end shadow-sm ${activeSector.financials.is_profitable ? "bg-[#146b34]/10 dark:bg-[#86d995]/10 text-[#146b34] dark:text-[#86d995]" : "bg-error/10 text-error"}`}>
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Est. ROI</span>
                              <span className="text-xl font-headline font-black">{activeSector.financials.roi_percent}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 md:p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Profit Breakdown */}
                          <div className="space-y-4">
                            <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Revenue & Profit</p>
                            <div className="p-4 rounded-xl bg-surface-container-high dark:bg-[#1b1c1c] flex justify-between items-center">
                              <span className="font-bold text-sm text-on-surface-variant dark:text-[#c0c9bb]">Expected Gross Yield</span>
                              <span className="font-bold text-on-surface dark:text-white">{activeSector.financials.expected_yield_q} qtl</span>
                            </div>
                            <div className="p-4 rounded-xl bg-surface-container-high dark:bg-[#1b1c1c] flex justify-between items-center">
                              <span className="font-bold text-sm text-on-surface-variant dark:text-[#c0c9bb]">Market Value Rate</span>
                              <span className="font-bold text-on-surface dark:text-white">₹{activeSector.financials.market_price}/qtl</span>
                            </div>
                            <div className="p-4 rounded-xl bg-surface-container-high dark:bg-[#1b1c1c] flex justify-between items-center">
                              <span className="font-bold text-sm text-on-surface-variant dark:text-[#c0c9bb]">Projected Revenue</span>
                              <span className="font-bold text-on-surface dark:text-white">{formatINR(activeSector.financials.expected_revenue)}</span>
                            </div>
                            <div className={`p-4 rounded-xl flex justify-between items-center ${activeSector.financials.is_profitable ? "bg-[#146b34]/20 dark:bg-[#86d995]/20 text-[#146b34] dark:text-[#86d995]" : "bg-error/20 text-error"}`}>
                              <span className="font-bold text-sm">Net Profit Forecast</span>
                              <span className="font-bold font-headline text-xl">{formatINR(activeSector.financials.net_profit)}</span>
                            </div>
                          </div>

                          {/* Line Item Breakdown */}
                          <div>
                            <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-4">Line-Item Expenditures</p>
                            <div className="space-y-3">
                              {[
                                { label: "Seed Material", val: activeSector.financials.seed_cost, color: "bg-amber-500" },
                                { label: "Fertilizer / NPK", val: activeSector.financials.fertilizer_cost, color: "bg-emerald-500" },
                                { label: "Labor & Manpower", val: activeSector.financials.labour_cost, color: "bg-blue-500" },
                                { label: "Irrigation & Water", val: activeSector.financials.irrigation_cost, color: "bg-cyan-400" },
                                { label: "Pesticide / Treatment", val: activeSector.financials.pesticide_cost, color: "bg-red-400" },
                                { label: "Miscellaneous", val: activeSector.financials.misc_cost, color: "bg-gray-400" }
                              ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-outline-variant/10 dark:border-white/5 last:border-0">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                                    <span className="text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb]">{item.label}</span>
                                  </div>
                                  <span className="text-sm font-bold text-on-surface dark:text-white">{formatINR(item.val)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 h-full text-center">
                        <span className="material-symbols-outlined text-4xl text-outline dark:text-[#c0c9bb]/50 mb-3">warning</span>
                        <p className="font-bold text-on-surface dark:text-white">Analysis Failed</p>
                        <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] mt-1">Could not fetch predictive financial data for {activeSector?.name}.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* --- 3. FARM-WIDE OPERATIONAL COST BREAKDOWN --- */}
              <motion.div variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] p-8 md:p-10 rounded-[2.5rem] border border-outline-variant/10 dark:border-white/5 editorial-shadow">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-headline font-bold text-on-surface dark:text-white">Farm-Wide Capital Distribution</h2>
                    <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] mt-1">Aggregated operating budget allocation across all sectors.</p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-outline dark:text-[#c0c9bb]/50">pie_chart</span>
                </div>

                <div className="space-y-6">
                  {[
                    { label: "Fertilizer & Nutrition", val: financials.costs.fert, color: "bg-emerald-500", icon: "science" },
                    { label: "Labor & Manpower", val: financials.costs.labour, color: "bg-blue-500", icon: "engineering" },
                    { label: "Seed Procurement", val: financials.costs.seed, color: "bg-amber-500", icon: "potted_plant" },
                    { label: "Pest Management", val: financials.costs.pesticide, color: "bg-red-400", icon: "pest_control" },
                    { label: "Irrigation & Water", val: financials.costs.irrigation, color: "bg-cyan-400", icon: "water_drop" },
                    { label: "Miscellaneous", val: financials.costs.misc, color: "bg-gray-400", icon: "more_horiz" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${item.color}`}>
                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-1">
                          <span className="font-bold text-sm text-on-surface dark:text-white">{item.label}</span>
                          <span className="font-bold text-sm text-on-surface-variant dark:text-[#c0c9bb]">{formatINR(item.val)}</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container-highest dark:bg-[#1b1c1c] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: getWidth(item.val) }} transition={{ duration: 1, delay: idx * 0.1 }}
                            className={`h-full rounded-full ${item.color}`}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-right shrink-0">
                        <span className="text-xs font-bold text-outline dark:text-[#c0c9bb]">{((item.val / costTotal) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* --- 4. PROCUREMENT SHOPPING LIST --- */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-headline font-bold text-on-surface dark:text-white">Seasonal Procurement List</h2>
                    <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] mt-1">Calculated based on your soil health and total acreage.</p>
                  </div>
                  <span className="hidden md:inline-flex text-xs font-bold bg-surface-container-high dark:bg-[#1b1c1c] px-3 py-1.5 rounded-md text-outline dark:text-white uppercase tracking-widest font-label border border-transparent dark:border-white/5">Auto-Calculated</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {procurement.map((item, idx) => (
                    <div key={idx} className={`p-6 rounded-[2rem] border border-transparent dark:border-white/5 flex flex-col sm:flex-row gap-5 items-start sm:items-center ${item.bg} dark:bg-[#303030] editorial-shadow hover:-translate-y-1 transition-transform`}>
                      <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center bg-white dark:bg-[#1b1c1c] shadow-sm ${item.color}`}>
                        <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-1 mb-1">
                          <h4 className="text-lg font-headline font-black text-gray-900 dark:text-white">{item.name}</h4>
                          <span className={`text-[12px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-white dark:bg-[#1b1c1c] shadow-sm ${item.color}`}>
                            {item.qty.toLocaleString("en-IN")} {item.unit}
                          </span>
                        </div>
                        <p className="text-sm font-body text-gray-700 dark:text-[#c0c9bb] leading-relaxed">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}