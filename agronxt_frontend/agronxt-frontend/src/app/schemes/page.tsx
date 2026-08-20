"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION CONFIGS ---
const fadeUpConfig = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0] as const }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] as const } }
};

// --- DATA: ALL 15 SCHEMES ---
const SCHEMES_DATA = [
  {
    id: "s1", title: "PM-KISAN Samman Nidhi", category: "Direct Benefit", announced: 2019, sortAmount: 6000,
    benefit: "₹6,000/year (₹2,000 in 3 installments)",
    eligibility: "Landholding farmers",
    required: ["Aadhaar", "Bank account", "Land records", "Mobile number"],
    tags: ["DBT", "income support", "direct transfer"],
    portal: "https://pmkisan.gov.in/",
    description: "Provides annual income support directly to the bank accounts of eligible landholding farmers.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB9kzxlCpNBUxKNgz0nAp7ycfCKJ80ToU3R3TIl_oMJdD25VuT72JtWAImr01SOJla-N3xCkfKB-LU_9Y5elLLArX7CXs0d7I2hR90YnvcwKrMdeoue4LupFJwTDTn7BwUnMHaY-Hdgt1Tg-N5kSB4_RzmPoBY7HtMtKFisbfxI-T0tyA6dE5G34wRtdk6LstQ78-pBRRFI7w8Zu3SoQaEcIiDl5SnftHrfiML4WkKVesf-p2rt3vRMj4rLqzHS2x9wRIrpY6PYhig",
    theme: "primary", icon: "payments"
  },
  {
    id: "s2", title: "PM Fasal Bima Yojana (PMFBY)", category: "Insurance", announced: 2016, sortAmount: 0,
    benefit: "Crop insurance against natural disasters, pests, and drought",
    eligibility: "Farmers growing notified crops",
    required: ["Aadhaar", "Bank account", "Land/crop details", "Sowing proof"],
    tags: ["insurance", "crop loss", "disaster protection"],
    portal: "https://pmfby.gov.in/",
    description: "Government-backed crop insurance scheme launched in 2016. Premium: 2% Kharif, 1.5% Rabi, 5% horticulture.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbNxerfjAKiU3JFGv0JNJxev_XuEKEDkzuCJgbx3-3ZQxHQ7obTshHLVcUsn47j1AG-cQcmCoQWIK6RZNWv2f6dxD9rq_JH3o-v4YtX-PS3sywrR4P2wfqBH5NmIdPxHqWpTrEJw1h2DCbRqkyoIOLNkw1vTXst0LI8Q3IVoWb1oZE3JK0_9J6-usIwhNm74JnL7chQGosdGTm6OmsMwqBU1WsYkyHeNB9AEgrpLCXt2YZ2gaCc5Xm2qBtRQHKoHZhVYDSDZZq6wE",
    theme: "secondary", icon: "policy"
  },
  {
    id: "s3", title: "PM Krishi Sinchai Yojana", category: "Irrigation", announced: 2015, sortAmount: 90,
    benefit: "50–90% subsidy for Drip & Sprinklers",
    eligibility: "Farmers with cultivable land",
    required: ["Aadhaar", "Land documents", "Water source details", "Bank account"],
    tags: ["irrigation", "drip", "sprinkler", "water saving"],
    portal: "https://pmksy.gov.in/",
    description: "Supports 'Per Drop More Crop' irrigation efficiency and water conservation.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAna0NifQJ9ZUGznEXlnMF4lTAAsBJszBbtYUvuzii4UYI6abOQ6YO9aG4174fKIYgZ0NWdNdAAIw9fMnJAzl4VqTI_wfceDEKlbfSf4fwdKaMwyRxRuh-BV3vIefpDV2-wewhZkv-f8nHWHkqgVKSnSIT57KO6yge_LRC76pGPOtPuoIH1UAnpqOfzKXKNN9t-kEipz4mFFiDfNETzCZ53LuTG41vZBlsJ1zVzLpGZ-b7cr2ytncxUbugbp8ejlaBwddouM_J1KrU",
    theme: "tertiary", icon: "water_drop"
  },
  {
    id: "s4", title: "Kisan Credit Card (KCC)", category: "Loans & Credit", announced: 2019, sortAmount: 300000,
    benefit: "Loans up to ₹3 lakh at low interest",
    eligibility: "Farmers, Dairy farmers, Fishery sector",
    required: ["Aadhaar", "PAN", "Land records", "Bank documents"],
    tags: ["loan", "agriculture credit", "dairy", "fishery"],
    portal: "https://pmkisan.gov.in/", // Generally applied via banks
    description: "Provides accessible agricultural credit to farmers for operational expenses and allied activities.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9NTfQGQaqx9XfUOLXcyEi5iYQH0GtCWStHKCiM1b6IR3k3A8wulQ5fJqA_EtlhP55Pu4t43STKTTbohfIiEbPxsE_tFLsILeHAJBnthKmFbXH8QXqlh09eHBUcdz6c2WAtPOepu4f7-UfKV9nWNMKlJk9uCNjJteypLQaldI1D5zd0Fjh-qNuYUX7gjPZpjzeWTiePlXnAazJ78X6CLEaMOOdyHaqw5Pg8XHxwouc1vk1RAzYlYwOYPvCMvWVg7LgCIa7wBnkcDc",
    theme: "primary", icon: "credit_card"
  },
  {
    id: "s5", title: "Agri-Mechanization (SMAM)", category: "Equipment", announced: 2014, sortAmount: 80,
    benefit: "40–80% subsidy on Tractors, Harvesters, Drones",
    eligibility: "Farmers, FPOs, SHGs",
    required: ["Aadhaar", "Land proof", "Invoice/quotation", "Bank account"],
    tags: ["tractor", "machinery", "harvester", "drone"],
    portal: "https://agrimachinery.nic.in/",
    description: "Financial assistance for purchasing agricultural machinery to promote modern farming.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuASMbgNoLV4X4TJ41CN3Z9aAa1yIU9rAe_SnymdMjoQNEopKkoW2rSep9123AoktsqOSERdAzWp7T0tESwKq_cECpipNXuACvMMaP1j4hytjuYKtCAoOk_AN2RWvUlN9kjgEDqUDpBN12nXLp9zoAP2wqzPZSuX5YizWw21BXw4bBWVFjhljmXtZfo5yY_pg0-fpfLVbTO8Fzy92vzT9O1LccdQDn_YHV_J0_DAxnm5bl9Q02oUfWpIa5toAE15YdZUTOUUMrZvug",
    theme: "secondary", icon: "precision_manufacturing"
  },
  {
    id: "s6", title: "PM-KUSUM", category: "Energy", announced: 2019, sortAmount: 60,
    benefit: "Solar pump subsidy (Up to 60%)",
    eligibility: "Farmers with land/pumps",
    required: ["Aadhaar", "Land records", "Electricity details"],
    tags: ["solar", "pump", "renewable energy"],
    portal: "https://pmkusum.mnre.gov.in/",
    description: "Supports solar-powered agriculture infrastructure and grid-connected solar power plants.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB9kzxlCpNBUxKNgz0nAp7ycfCKJ80ToU3R3TIl_oMJdD25VuT72JtWAImr01SOJla-N3xCkfKB-LU_9Y5elLLArX7CXs0d7I2hR90YnvcwKrMdeoue4LupFJwTDTn7BwUnMHaY-Hdgt1Tg-N5kSB4_RzmPoBY7HtMtKFisbfxI-T0tyA6dE5G34wRtdk6LstQ78-pBRRFI7w8Zu3SoQaEcIiDl5SnftHrfiML4WkKVesf-p2rt3vRMj4rLqzHS2x9wRIrpY6PYhig",
    theme: "tertiary", icon: "solar_power"
  },
  {
    id: "s7", title: "e-NAM", category: "Market Access", announced: 2016, sortAmount: 0,
    benefit: "Online mandi trading & Better price discovery",
    eligibility: "Farmers, Traders, FPOs",
    required: ["Aadhaar", "Mobile number", "Bank account"],
    tags: ["mandi", "online market", "crop selling"],
    portal: "https://enam.gov.in/",
    description: "National Agriculture Market (eNAM) is a pan-India electronic trading portal networking existing APMC mandis.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbNxerfjAKiU3JFGv0JNJxev_XuEKEDkzuCJgbx3-3ZQxHQ7obTshHLVcUsn47j1AG-cQcmCoQWIK6RZNWv2f6dxD9rq_JH3o-v4YtX-PS3sywrR4P2wfqBH5NmIdPxHqWpTrEJw1h2DCbRqkyoIOLNkw1vTXst0LI8Q3IVoWb1oZE3JK0_9J6-usIwhNm74JnL7chQGosdGTm6OmsMwqBU1WsYkyHeNB9AEgrpLCXt2YZ2gaCc5Xm2qBtRQHKoHZhVYDSDZZq6wE",
    theme: "primary", icon: "storefront"
  },
  {
    id: "s8", title: "PM Kisan Maandhan Yojana", category: "Pension", announced: 2019, sortAmount: 3000,
    benefit: "₹3,000/month pension after age 60",
    eligibility: "Small & marginal farmers (Age 18–40)",
    required: ["Aadhaar", "Bank account", "Land details"],
    tags: ["pension", "old age support", "welfare"],
    portal: "https://maandhan.in/",
    description: "Farmer pension scheme offering long-term social security for aging cultivators.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAna0NifQJ9ZUGznEXlnMF4lTAAsBJszBbtYUvuzii4UYI6abOQ6YO9aG4174fKIYgZ0NWdNdAAIw9fMnJAzl4VqTI_wfceDEKlbfSf4fwdKaMwyRxRuh-BV3vIefpDV2-wewhZkv-f8nHWHkqgVKSnSIT57KO6yge_LRC76pGPOtPuoIH1UAnpqOfzKXKNN9t-kEipz4mFFiDfNETzCZ53LuTG41vZBlsJ1zVzLpGZ-b7cr2ytncxUbugbp8ejlaBwddouM_J1KrU",
    theme: "secondary", icon: "savings"
  },
  {
    id: "s9", title: "Soil Health Card Scheme", category: "Soil & Fertility", announced: 2015, sortAmount: 0,
    benefit: "Free soil testing & Fertilizer recommendations",
    eligibility: "All farmers",
    required: ["Soil sample", "Land details"],
    tags: ["soil", "fertilizer", "testing"],
    portal: "https://soilhealth.dac.gov.in/",
    description: "Providing farmers with crop-wise nutrient recommendations for individual farms based on soil chemistry.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9NTfQGQaqx9XfUOLXcyEi5iYQH0GtCWStHKCiM1b6IR3k3A8wulQ5fJqA_EtlhP55Pu4t43STKTTbohfIiEbPxsE_tFLsILeHAJBnthKmFbXH8QXqlh09eHBUcdz6c2WAtPOepu4f7-UfKV9nWNMKlJk9uCNjJteypLQaldI1D5zd0Fjh-qNuYUX7gjPZpjzeWTiePlXnAazJ78X6CLEaMOOdyHaqw5Pg8XHxwouc1vk1RAzYlYwOYPvCMvWVg7LgCIa7wBnkcDc",
    theme: "tertiary", icon: "science"
  },
  {
    id: "s10", title: "PKVY (Organic Farming)", category: "Organic Farming", announced: 2015, sortAmount: 50000,
    benefit: "₹50,000/hectare over 3 years",
    eligibility: "Organic farming clusters/groups",
    required: ["Aadhaar", "Land proof", "Cluster participation"],
    tags: ["organic", "natural farming", "eco farming"],
    portal: "https://pgsindia-ncof.gov.in/",
    description: "Paramparagat Krishi Vikas Yojana promotes organic, natural, and sustainable eco-farming practices.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuASMbgNoLV4X4TJ41CN3Z9aAa1yIU9rAe_SnymdMjoQNEopKkoW2rSep9123AoktsqOSERdAzWp7T0tESwKq_cECpipNXuACvMMaP1j4hytjuYKtCAoOk_AN2RWvUlN9kjgEDqUDpBN12nXLp9zoAP2wqzPZSuX5YizWw21BXw4bBWVFjhljmXtZfo5yY_pg0-fpfLVbTO8Fzy92vzT9O1LccdQDn_YHV_J0_DAxnm5bl9Q02oUfWpIa5toAE15YdZUTOUUMrZvug",
    theme: "primary", icon: "compost"
  },
  {
    id: "s11", title: "Agriculture Infrastructure Fund", category: "Infrastructure", announced: 2020, sortAmount: 0,
    benefit: "Interest subvention & Credit guarantee for cold storage",
    eligibility: "Farmers, FPOs, Agri entrepreneurs",
    required: ["Project report", "Bank application"],
    tags: ["warehouse", "cold storage", "infrastructure"],
    portal: "https://agriinfra.dac.gov.in/",
    description: "Financial support for post-harvest agricultural infrastructure like warehouses and processing units.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB9kzxlCpNBUxKNgz0nAp7ycfCKJ80ToU3R3TIl_oMJdD25VuT72JtWAImr01SOJla-N3xCkfKB-LU_9Y5elLLArX7CXs0d7I2hR90YnvcwKrMdeoue4LupFJwTDTn7BwUnMHaY-Hdgt1Tg-N5kSB4_RzmPoBY7HtMtKFisbfxI-T0tyA6dE5G34wRtdk6LstQ78-pBRRFI7w8Zu3SoQaEcIiDl5SnftHrfiML4WkKVesf-p2rt3vRMj4rLqzHS2x9wRIrpY6PYhig",
    theme: "secondary", icon: "warehouse"
  },
  {
    id: "s12", title: "National Bamboo Mission", category: "Plantation", announced: 2018, sortAmount: 0,
    benefit: "Bamboo plantation support & Nursery assistance",
    eligibility: "Farmers, Entrepreneurs, FPOs",
    required: ["Land details", "Aadhaar"],
    tags: ["bamboo", "plantation", "agroforestry"],
    portal: "https://nbm.nic.in/",
    description: "Promotes bamboo cultivation, value addition, and integration into the bamboo-based economy.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbNxerfjAKiU3JFGv0JNJxev_XuEKEDkzuCJgbx3-3ZQxHQ7obTshHLVcUsn47j1AG-cQcmCoQWIK6RZNWv2f6dxD9rq_JH3o-v4YtX-PS3sywrR4P2wfqBH5NmIdPxHqWpTrEJw1h2DCbRqkyoIOLNkw1vTXst0LI8Q3IVoWb1oZE3JK0_9J6-usIwhNm74JnL7chQGosdGTm6OmsMwqBU1WsYkyHeNB9AEgrpLCXt2YZ2gaCc5Xm2qBtRQHKoHZhVYDSDZZq6wE",
    theme: "tertiary", icon: "forest"
  },
  {
    id: "s13", title: "Mission on Natural Farming", category: "Natural Farming", announced: 2021, sortAmount: 0,
    benefit: "Financial support & Natural farming training",
    eligibility: "Farmers shifting to natural farming",
    required: ["Aadhaar", "Land details"],
    tags: ["natural farming", "zero budget farming", "sustainable"],
    portal: "https://naturalfarming.dac.gov.in/",
    description: "Encourages chemical-free, zero budget natural farming practices for soil rejuvenation.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAna0NifQJ9ZUGznEXlnMF4lTAAsBJszBbtYUvuzii4UYI6abOQ6YO9aG4174fKIYgZ0NWdNdAAIw9fMnJAzl4VqTI_wfceDEKlbfSf4fwdKaMwyRxRuh-BV3vIefpDV2-wewhZkv-f8nHWHkqgVKSnSIT57KO6yge_LRC76pGPOtPuoIH1UAnpqOfzKXKNN9t-kEipz4mFFiDfNETzCZ53LuTG41vZBlsJ1zVzLpGZ-b7cr2ytncxUbugbp8ejlaBwddouM_J1KrU",
    theme: "primary", icon: "psychiatry"
  },
  {
    id: "s14", title: "National Mission on Edible Oils", category: "Plantation", announced: 2021, sortAmount: 29000,
    benefit: "Up to ₹29,000/hectare support for Oil Palm",
    eligibility: "Farmers in suitable regions",
    required: ["Land details", "Plantation documents"],
    tags: ["oil palm", "plantation", "edible oils"],
    portal: "https://nmeo.dac.gov.in/",
    description: "Supports domestic edible oil production to reduce import dependency through oil palm farming.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9NTfQGQaqx9XfUOLXcyEi5iYQH0GtCWStHKCiM1b6IR3k3A8wulQ5fJqA_EtlhP55Pu4t43STKTTbohfIiEbPxsE_tFLsILeHAJBnthKmFbXH8QXqlh09eHBUcdz6c2WAtPOepu4f7-UfKV9nWNMKlJk9uCNjJteypLQaldI1D5zd0Fjh-qNuYUX7gjPZpjzeWTiePlXnAazJ78X6CLEaMOOdyHaqw5Pg8XHxwouc1vk1RAzYlYwOYPvCMvWVg7LgCIa7wBnkcDc",
    theme: "secondary", icon: "local_florist"
  },
  {
    id: "s15", title: "PM Matsya Sampada Yojana", category: "Fisheries", announced: 2020, sortAmount: 0,
    benefit: "Fish farming support, Cold chain, Insurance",
    eligibility: "Fish farmers, Fishermen, Cooperatives",
    required: ["Aadhaar", "Fishery documents", "Bank account"],
    tags: ["fishery", "aquaculture", "fisheries"],
    portal: "https://pmmsy.dof.gov.in/",
    description: "Boosts fisheries and aquaculture sector development with heavy infrastructure subsidies.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuASMbgNoLV4X4TJ41CN3Z9aAa1yIU9rAe_SnymdMjoQNEopKkoW2rSep9123AoktsqOSERdAzWp7T0tESwKq_cECpipNXuACvMMaP1j4hytjuYKtCAoOk_AN2RWvUlN9kjgEDqUDpBN12nXLp9zoAP2wqzPZSuX5YizWw21BXw4bBWVFjhljmXtZfo5yY_pg0-fpfLVbTO8Fzy92vzT9O1LccdQDn_YHV_J0_DAxnm5bl9Q02oUfWpIa5toAE15YdZUTOUUMrZvug",
    theme: "tertiary", icon: "sailing"
  }
];

const THEME_STYLES: Record<string, string> = {
  primary: "bg-primary-container dark:bg-[#065f18] text-primary dark:text-[#a3f69c]",
  secondary: "bg-secondary dark:bg-[#7a5649] text-white",
  tertiary: "bg-tertiary dark:bg-[#563300] text-white",
};

export default function SchemesPage() {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest First");
  const [selectedScheme, setSelectedScheme] = useState<any | null>(null);

  // Filters available in UI
  const categories = ["All", "Direct Benefit", "Insurance", "Irrigation", "Equipment", "Loans & Credit"];

  // Filter & Sort Logic
  const processedSchemes = useMemo(() => {
    let filtered = SCHEMES_DATA;
    if (filter !== "All") {
      filtered = filtered.filter(s => s.category === filter);
    }
    
    return [...filtered].sort((a, b) => {
      if (sort === "Highest Amount") return b.sortAmount - a.sortAmount;
      if (sort === "Expiring Soon") return a.title.localeCompare(b.title); // Mock sort for expiry
      return b.announced - a.announced; // Default: Newest
    });
  }, [filter, sort]);

  return (
    <div className="bg-background dark:bg-[#1b1c1c] text-on-surface dark:text-white transition-colors duration-300 min-h-screen relative">
      
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-6">
        
        {/* Hero Section */}
        <motion.section {...fadeUpConfig} className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-on-surface dark:text-white leading-tight mb-6">
                Empowering Growth Through <br /> <span className="text-primary dark:text-primary-fixed italic">Direct Support.</span>
              </h1>
              <p className="text-on-surface-variant dark:text-[#c0c9bb] text-lg max-w-xl mb-8 leading-relaxed font-body">
                Navigate the complex landscape of Indian agricultural subsidies and schemes. AgroNxt simplifies eligibility and application processes for central and state benefits.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="bg-surface-container-lowest dark:bg-[#303030] p-6 rounded-xl flex items-center gap-4 editorial-shadow border border-outline-variant/10 dark:border-white/5">
                  <div className="bg-secondary-container dark:bg-secondary-fixed/20 p-3 rounded-lg text-secondary dark:text-secondary-fixed">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-headline dark:text-white">15+</div>
                    <div className="text-xs font-bold text-on-surface-variant dark:text-[#c0c9bb] uppercase tracking-widest font-label">Curated Schemes</div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest dark:bg-[#303030] p-6 rounded-xl flex items-center gap-4 editorial-shadow border border-outline-variant/10 dark:border-white/5">
                  <div className="bg-tertiary-fixed dark:bg-tertiary-fixed-dim/20 p-3 rounded-lg text-on-tertiary-fixed dark:text-tertiary-fixed-dim">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-headline dark:text-white">₹2.4T</div>
                    <div className="text-xs font-bold text-on-surface-variant dark:text-[#c0c9bb] uppercase tracking-widest font-label">Annual Disbursement</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5 relative">
              <div className="aspect-square rounded-[2rem] overflow-hidden bg-surface-container-high dark:bg-[#303030] relative border border-transparent dark:border-white/5">
                <img 
                  className="w-full h-full object-cover opacity-90 mix-blend-multiply dark:mix-blend-overlay transition-transform duration-1000 hover:scale-105" 
                  alt="Modern Indian farmer using a digital tablet in a lush green field" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfr2bWwMoaDrNWvGdx4503aYliY8evN1q8OUtKoLhQurVhDz389SApKW8iuTE7fsTW9m24DOEsr7pX-WAURQoS5ZY2Ti9JTgnUGhBlkDK6PeTRFwedHJQZKWAot2jf0KN4qSY_yatb8q3cDscOBH9vIRtb0AtPq0Q10Vnpd9vnsyzCof6SqmFfhh2Qw6svcigMZhIV5--tfCOmeh4RIBsITrXyDvVIvyUs0qkcvOz_p9apPqmUWY3PkKZE9f9CnALLZKII8n7GV1c" 
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-surface-container-lowest/90 dark:bg-[#1b1c1c]/90 backdrop-blur-xl p-5 rounded-2xl shadow-xl flex items-center gap-3 max-w-xs border border-outline-variant/15 dark:border-white/10">
                <div className="w-12 h-12 rounded-full bg-primary-container dark:bg-[#065f18] flex items-center justify-center text-on-primary-container dark:text-[#a3f69c] shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <p className="text-sm font-bold leading-tight dark:text-white font-body">Smart Match: Find schemes based on your soil profile and history.</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Filter Shell (Sticky) */}
        <section className="mb-12 sticky top-24 z-40">
          <div className="bg-surface-container-low/95 dark:bg-[#1b1c1c]/95 backdrop-blur-xl rounded-2xl p-4 flex flex-wrap items-center gap-4 border border-outline-variant/15 dark:border-white/10 editorial-shadow">
            <div className="flex items-center gap-2 bg-surface-container-lowest dark:bg-[#303030] px-4 py-2.5 rounded-xl border border-outline-variant/10 dark:border-white/5 shrink-0">
              <span className="material-symbols-outlined text-sm text-primary dark:text-primary-fixed">filter_list</span>
              <span className="text-sm font-bold dark:text-white">Filter:</span>
            </div>
            
            {/* Scrollable Filters */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 flex-1">
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 border ${filter === cat ? "bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] border-transparent" : "bg-surface-container-highest dark:bg-[#303030] text-on-surface-variant dark:text-[#c0c9bb] border-transparent dark:border-white/5 hover:bg-surface-variant dark:hover:bg-[#41493e]"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-black text-on-surface-variant dark:text-[#c0c9bb] uppercase tracking-widest mr-1 font-label">Sort</span>
              <select 
                value={sort} onChange={(e) => setSort(e.target.value)}
                className="bg-surface-container-highest dark:bg-[#303030] rounded-lg px-3 py-1.5 border-none text-sm font-bold text-primary dark:text-primary-fixed focus:ring-0 cursor-pointer outline-none"
              >
                <option>Newest First</option>
                <option>Highest Amount</option>
                <option>Alphabetical</option>
              </select>
            </div>
          </div>
        </section>

        {/* Dynamic Bento Grid Directory */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants} initial="hidden" animate="show"
        >
          <AnimatePresence mode="popLayout">
            {processedSchemes.map((scheme) => (
              <motion.article 
                layout
                key={scheme.id}
                variants={itemVariants}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}
                className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2rem] overflow-hidden group hover:-translate-y-1 hover:shadow-2xl border border-outline-variant/10 dark:border-white/5 flex flex-col editorial-shadow cursor-pointer"
                onClick={() => setSelectedScheme(scheme)}
              >
                <div className={`h-44 relative ${THEME_STYLES[scheme.theme].split(' ')[0]}`}>
                  <img className="w-full h-full object-cover opacity-30 mix-blend-overlay" alt={scheme.category} src={scheme.image} />
                  <div className="absolute top-6 left-6 bg-white/20 dark:bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20 font-label">
                    {scheme.category}
                  </div>
                  <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                    <span className="material-symbols-outlined text-[18px]">{scheme.icon}</span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="font-headline text-2xl font-bold mb-3 group-hover:text-primary dark:group-hover:text-primary-fixed transition-colors dark:text-white line-clamp-1">{scheme.title}</h3>
                  <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm mb-6 line-clamp-2 font-body h-10">{scheme.description}</p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-on-surface-variant dark:text-[#c0c9bb] uppercase tracking-widest font-label">Benefit</span>
                      <span className={`text-lg font-black font-headline ${scheme.theme === 'primary' ? 'text-primary dark:text-primary-fixed' : scheme.theme === 'secondary' ? 'text-secondary dark:text-secondary-fixed' : 'text-tertiary dark:text-tertiary-fixed-dim'}`}>
                        {scheme.benefit.split(' ')[0]} {scheme.benefit.split(' ')[1]}
                      </span>
                    </div>
                    <div className="bg-surface-container-low dark:bg-[#1b1c1c] rounded-xl p-4 border border-transparent dark:border-white/5">
                      <h4 className="text-[10px] font-black text-on-surface-variant dark:text-[#c0c9bb] uppercase tracking-widest mb-1 flex items-center gap-1 font-label">
                        <span className="material-symbols-outlined text-sm">groups</span> Eligibility
                      </h4>
                      <p className="text-sm font-bold dark:text-white font-body line-clamp-1">{scheme.eligibility}</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-outline-variant/15 dark:border-white/10">
                    <span className="text-primary dark:text-primary-fixed font-bold text-sm flex items-center gap-1 font-body">
                      View Details <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>

          {/* AI Assistant Promo Card */}
          <motion.article layout variants={itemVariants} className="bg-surface-container-low dark:bg-[#1b1c1c] rounded-[2rem] p-8 flex flex-col justify-center items-center text-center border-2 border-dashed border-outline-variant/30 dark:border-white/10">
            <div className="w-16 h-16 bg-white dark:bg-[#303030] rounded-full flex items-center justify-center text-primary dark:text-primary-fixed mb-6 shadow-sm">
              <span className="material-symbols-outlined text-3xl">lightbulb</span>
            </div>
            <h3 className="font-headline text-xl font-bold mb-4 dark:text-white">Need Guidance?</h3>
            <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm mb-8 px-4 font-body">Our AI assistant can scan 140+ schemes against your specific profile in seconds.</p>
            <button className="w-full bg-white dark:bg-[#303030] text-on-surface dark:text-white px-6 py-4 rounded-xl text-sm font-bold shadow-sm hover:bg-surface-container-lowest dark:hover:bg-[#41493e] transition-colors flex items-center justify-center gap-2 border border-transparent dark:border-white/5">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              Start AI Eligibility Check
            </button>
          </motion.article>

        </motion.div>

        {/* Featured Resource: Documentation Checklist */}
        <motion.section {...fadeUpConfig} className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center bg-surface-container-low dark:bg-[#303030] rounded-[2.5rem] p-8 md:p-16 overflow-hidden relative border border-transparent dark:border-white/5">
          <div className="order-2 lg:order-1 relative">
            <div className="aspect-video lg:aspect-square rounded-3xl overflow-hidden editorial-shadow">
              <img className="w-full h-full object-cover" alt="Farmer using smartphone" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASMbgNoLV4X4TJ41CN3Z9aAa1yIU9rAe_SnymdMjoQNEopKkoW2rSep9123AoktsqOSERdAzWp7T0tESwKq_cECpipNXuACvMMaP1j4hytjuYKtCAoOk_AN2RWvUlN9kjgEDqUDpBN12nXLp9zoAP2wqzPZSuX5YizWw21BXw4bBWVFjhljmXtZfo5yY_pg0-fpfLVbTO8Fzy92vzT9O1LccdQDn_YHV_J0_DAxnm5bl9Q02oUfWpIa5toAE15YdZUTOUUMrZvug" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface dark:text-white mb-8 leading-tight">
              Confused about <br/><span className="text-primary dark:text-primary-fixed-dim italic">documentation?</span>
            </h2>
            <div className="space-y-8">
              
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-fixed dark:bg-primary-fixed-dim text-on-primary-fixed dark:text-[#002204] rounded-full flex items-center justify-center text-lg font-black font-headline shadow-sm">1</div>
                <div>
                  <h4 className="font-bold text-on-surface dark:text-white mb-1 font-headline">E-KYC Verification</h4>
                  <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] leading-relaxed font-body">Update your Aadhaar linked mobile number for OTP verification on all government portals.</p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-surface-container-highest dark:bg-[#1b1c1c] text-primary dark:text-primary-fixed rounded-full flex items-center justify-center text-lg font-black font-headline shadow-sm">2</div>
                <div>
                  <h4 className="font-bold text-on-surface dark:text-white mb-1 font-headline">Digital Land Records</h4>
                  <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] leading-relaxed font-body">Ensure your 'Khatauni' records are digitised. Most schemes now fetch data directly from state land portals.</p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-surface-container-highest dark:bg-[#1b1c1c] text-primary dark:text-primary-fixed rounded-full flex items-center justify-center text-lg font-black font-headline shadow-sm">3</div>
                <div>
                  <h4 className="font-bold text-on-surface dark:text-white mb-1 font-headline">NPCI Bank Seeding</h4>
                  <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] leading-relaxed font-body">Your primary bank account must be seeded with NPCI for Direct Benefit Transfer (DBT) success.</p>
                </div>
              </div>

            </div>
            <button className="mt-12 px-10 py-5 bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] font-bold rounded-full hover:shadow-lg transition-all active:scale-95 flex items-center gap-2">
              Download Document Checklist
              <span className="material-symbols-outlined text-sm">download</span>
            </button>
          </div>
        </motion.section>

      </main>

      {/* --- POP-UP MODAL ENGINE --- */}
      <AnimatePresence>
        {selectedScheme && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedScheme(null)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-surface-container-lowest dark:bg-[#1b1c1c] w-full max-w-2xl max-h-[90vh] rounded-[2rem] overflow-hidden editorial-shadow flex flex-col pointer-events-auto border border-outline-variant/10 dark:border-white/10">
                
                {/* Modal Header Image */}
                <div className={`h-40 relative flex-shrink-0 ${THEME_STYLES[selectedScheme.theme].split(' ')[0]}`}>
                  <img className="w-full h-full object-cover opacity-30 mix-blend-overlay" alt="" src={selectedScheme.image} />
                  <button 
                    onClick={() => setSelectedScheme(null)}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/50 transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                  <div className="absolute bottom-4 left-6 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm">
                      <span className="material-symbols-outlined text-2xl">{selectedScheme.icon}</span>
                    </div>
                    <div>
                      <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-widest font-label border border-white/20">
                        {selectedScheme.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="p-8 overflow-y-auto font-body">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-3xl font-headline font-black text-on-surface dark:text-white leading-tight pr-4">{selectedScheme.title}</h2>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Announced</p>
                      <p className="font-bold dark:text-white">{selectedScheme.announced}</p>
                    </div>
                  </div>
                  
                  <p className="text-on-surface-variant dark:text-[#c0c9bb] mb-8 leading-relaxed">{selectedScheme.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-surface-container-high dark:bg-[#303030] p-5 rounded-2xl border border-transparent dark:border-white/5">
                      <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-2">Core Benefit</p>
                      <p className={`text-xl font-headline font-black ${selectedScheme.theme === 'primary' ? 'text-primary dark:text-primary-fixed' : selectedScheme.theme === 'secondary' ? 'text-secondary dark:text-secondary-fixed' : 'text-tertiary dark:text-tertiary-fixed-dim'}`}>
                        {selectedScheme.benefit}
                      </p>
                    </div>
                    <div className="bg-surface-container-high dark:bg-[#303030] p-5 rounded-2xl border border-transparent dark:border-white/5">
                      <p className="text-[10px] font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-2">Who is Eligible?</p>
                      <p className="text-sm font-bold dark:text-white">{selectedScheme.eligibility}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-headline font-bold text-lg dark:text-white flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary dark:text-primary-fixed">assignment</span> 
                      Required Documentation
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedScheme.required.map((req: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-on-surface-variant dark:text-[#c0c9bb]">
                          <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed opacity-70">check_circle</span>
                          {req}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 bg-surface-container-low dark:bg-[#303030] border-t border-outline-variant/10 dark:border-white/5 shrink-0 flex items-center justify-between">
                  <div className="flex gap-2">
                    {selectedScheme.tags.slice(0,2).map((t: string) => (
                      <span key={t} className="px-2 py-1 bg-surface-container-highest dark:bg-[#1b1c1c] text-[10px] font-bold text-outline dark:text-[#c0c9bb] rounded uppercase tracking-widest border border-transparent dark:border-white/5">#{t}</span>
                    ))}
                  </div>
                  <a 
                    href={selectedScheme.portal} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] px-8 py-3 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                  >
                    Apply on Portal <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer Specific to Schemes Page */}
      <footer className="bg-surface-container-low dark:bg-[#1b1c1c] rounded-t-[2.5rem] mt-20 border-t border-outline-variant/10 dark:border-white/5 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 py-16 max-w-7xl mx-auto">
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-black text-primary dark:text-primary-fixed mb-6 font-headline">AgroNxt</div>
            <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm leading-relaxed max-w-xs font-body">
              Empowering Indian farmers through digital innovation and transparent government integration since 2024.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-on-surface dark:text-white mb-6 uppercase tracking-widest text-xs font-headline">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link className="text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed text-sm font-medium transition-colors font-body" href="#">About AgroNxt</Link></li>
              <li><Link className="text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed text-sm font-medium transition-colors font-body" href="#">Mandi Rates Today</Link></li>
              <li><Link className="text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed text-sm font-medium transition-colors font-body" href="#">PM Kisan Status</Link></li>
              <li><Link className="text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed text-sm font-medium transition-colors font-body" href="#">Farmer Community</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-on-surface dark:text-white mb-6 uppercase tracking-widest text-xs font-headline">Support & Legal</h4>
            <ul className="space-y-4">
              <li><Link className="text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed text-sm font-medium transition-colors font-body" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed text-sm font-medium transition-colors font-body" href="/terms">Terms of Service</Link></li>
              <li><Link className="text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed text-sm font-medium transition-colors font-body" href="/support">Help Center</Link></li>
              <li><Link className="text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed text-sm font-medium transition-colors font-body" href="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-on-surface dark:text-white mb-6 uppercase tracking-widest text-xs font-headline">Kisan Helpline</h4>
            <div className="p-6 bg-surface-container-highest dark:bg-[#303030] rounded-2xl border border-outline-variant/10 dark:border-white/5">
              <p className="text-[10px] text-on-surface-variant dark:text-[#c0c9bb] mb-2 font-black uppercase tracking-widest font-label">Toll-Free Assistance</p>
              <p className="text-2xl font-black text-primary dark:text-primary-fixed font-headline">1800-180-1551</p>
              <p className="text-xs text-on-surface-variant dark:text-[#c0c9bb] mt-3 leading-tight font-body">Available 24/7 in 12 regional languages.</p>
            </div>
          </div>
        </div>
        <div className="border-t border-outline-variant/10 dark:border-white/5 max-w-7xl mx-auto px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-on-surface-variant dark:text-[#c0c9bb] font-bold font-body">© {new Date().getFullYear()} AgroNxt Digital Agronomist. All rights reserved.</p>
          <div className="flex gap-6">
            <Link className="text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#"><span className="material-symbols-outlined text-xl">share</span></Link>
            <Link className="text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#"><span className="material-symbols-outlined text-xl">mail</span></Link>
            <Link className="text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#"><span className="material-symbols-outlined text-xl">rss_feed</span></Link>
          </div>
        </div>
      </footer>

      {/* FAB for quick assistance */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="w-16 h-16 rounded-full bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] shadow-2xl flex items-center justify-center group transform transition-all active:scale-95 hover:scale-105 border border-transparent dark:border-white/10">
          <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">support_agent</span>
        </button>
      </div>

    </div>
  );
}