"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

// 🚀 FIX: Helper function to safely read the token from cookies
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

export default function AccountPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    state: "",
    district: "",
  });

  const [originalData, setOriginalData] = useState({ ...userData });

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError("");
      try {
        // Grab token securely from cookie
        const token = getCookie("agronxt_token"); 
        
        if (!token) {
          throw new Error("No active session found. Please log in again.");
        }

        const res = await fetch("http://localhost:8000/users/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch account details.");
        
        const data = await res.json();
        
        const fetchedData = {
          name: data.full_name || "", // 🚀 Pulls full_name to match backend
          email: data.email || "",
          phone: data.phone || "",
          state: data.state || "",
          district: data.district || "",
        };

        setUserData(fetchedData);
        setOriginalData(fetchedData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Could not load account details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getCookie("agronxt_token");
      const res = await fetch("http://localhost:8000/users/me", {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: userData.name, // Sends it back as full_name
          phone: userData.phone,
          state: userData.state,
          district: userData.district
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update profile.");
      }

      setOriginalData({ ...userData });
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Something went wrong while saving.");
      setUserData({ ...originalData });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setUserData({ ...originalData });
    setIsEditing(false);
    setError("");
  };

  const getInitials = (name: string) => {
    if (!name) return "AN";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <main className="lg:ml-64 pt-28 pb-24 px-6 md:px-8 min-h-screen transition-colors duration-300 font-body">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.header {...fadeUpConfig} className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="text-primary dark:text-primary-fixed-dim font-label text-[0.75rem] uppercase tracking-[0.05em] font-bold">
              Settings
            </span>
            <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface dark:text-white mt-2 mb-2">
              Account Profile
            </h1>
            <p className="text-lg text-on-surface-variant dark:text-[#c0c9bb] max-w-2xl font-body leading-relaxed flex items-center gap-2">
              Manage your personal information and security details.
            </p>
          </div>
          
          {!isLoading && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-surface-container-high dark:bg-[#303030] hover:bg-surface-container-highest dark:hover:bg-[#41493e] px-6 py-3 rounded-xl border border-transparent dark:border-white/10 flex items-center gap-2 text-sm font-bold text-on-surface dark:text-white transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span> 
              Edit Details
            </button>
          )}
        </motion.header>

        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8 flex items-center gap-3 p-4 bg-error-container/20 border border-error/30 text-error rounded-2xl">
              <span className="material-symbols-outlined">error</span>
              <p className="text-sm font-bold">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8 flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 text-primary dark:text-primary-fixed-dim rounded-2xl">
              <span className="material-symbols-outlined">check_circle</span>
              <p className="text-sm font-bold">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-4xl animate-spin mb-4">sync</span>
            <p className="font-bold font-body text-on-surface-variant dark:text-[#c0c9bb] animate-pulse">Loading profile...</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
            
            {/* Top Identity Card */}
            <motion.div variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2.5rem] p-8 md:p-10 editorial-shadow border border-outline-variant/10 dark:border-white/5 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 dark:bg-primary-fixed-dim/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              
              <div className="w-32 h-32 rounded-full bg-primary-container dark:bg-[#065f18] text-primary dark:text-[#a3f69c] flex items-center justify-center text-4xl font-headline font-black shadow-lg border-4 border-surface dark:border-inverse-surface shrink-0 z-10">
                {getInitials(userData.name)}
              </div>
              
              <div className="text-center sm:text-left z-10 flex-1 mt-2 sm:mt-0">
                <h2 className="text-3xl font-headline font-black text-on-surface dark:text-white mb-2">
                  {userData.name || "Farmer"}
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 text-on-surface-variant dark:text-[#c0c9bb] font-body text-sm">
                  <span className="flex items-center justify-center sm:justify-start gap-1">
                    <span className="material-symbols-outlined text-[16px]">mail</span> {userData.email}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center justify-center sm:justify-start gap-1">
                    <span className="material-symbols-outlined text-[16px]">call</span> {userData.phone || "No phone added"}
                  </span>
                </div>
                
                <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 bg-surface-container-high dark:bg-[#1b1c1c] text-[10px] font-bold text-outline dark:text-[#c0c9bb] rounded-full uppercase tracking-widest border border-transparent dark:border-white/5">
                    Registered User
                  </span>
                  {userData.state && (
                    <span className="px-3 py-1 bg-surface-container-high dark:bg-[#1b1c1c] text-[10px] font-bold text-outline dark:text-[#c0c9bb] rounded-full uppercase tracking-widest border border-transparent dark:border-white/5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">location_on</span> {userData.state}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Editable Details Form */}
            <motion.div variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2.5rem] p-8 md:p-10 editorial-shadow border border-outline-variant/10 dark:border-white/5 relative">
              <div className="flex items-center gap-3 mb-8 border-b border-outline-variant/10 dark:border-white/5 pb-6">
                <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-3xl">manage_accounts</span>
                <h3 className="text-2xl font-headline font-bold text-on-surface dark:text-white">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline dark:text-[#c0c9bb]/60">person</span>
                    <input 
                      name="name" value={userData.name} onChange={handleChange} disabled={!isEditing}
                      className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 pl-12 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-sm text-on-surface dark:text-white outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold flex items-center justify-between">
                    Email Address <span className="text-[10px] text-primary dark:text-primary-fixed-dim">Read Only</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline dark:text-[#c0c9bb]/60">mail</span>
                    <input 
                      name="email" value={userData.email} disabled 
                      className="w-full bg-surface-container-highest dark:bg-[#1b1c1c]/50 border-none rounded-xl p-4 pl-12 font-body text-sm text-on-surface-variant dark:text-[#c0c9bb] outline-none opacity-60 cursor-not-allowed" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline dark:text-[#c0c9bb]/60">call</span>
                    <input 
                      name="phone" value={userData.phone} onChange={handleChange} disabled={!isEditing}
                      className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 pl-12 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-sm text-on-surface dark:text-white outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">State</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline dark:text-[#c0c9bb]/60">map</span>
                    <input 
                      name="state" value={userData.state} onChange={handleChange} disabled={!isEditing} placeholder="e.g. Odisha"
                      className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 pl-12 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-sm text-on-surface dark:text-white outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">District / City</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline dark:text-[#c0c9bb]/60">location_city</span>
                    <input 
                      name="district" value={userData.district} onChange={handleChange} disabled={!isEditing} placeholder="e.g. Bhubaneswar"
                      className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 pl-12 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-sm text-on-surface dark:text-white outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all" 
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-10 pt-6 border-t border-outline-variant/10 dark:border-white/5 flex flex-col-reverse sm:flex-row justify-end gap-4"
                  >
                    <button 
                      onClick={handleCancel} disabled={isSaving}
                      className="px-6 py-3 rounded-xl font-bold text-sm text-on-surface-variant dark:text-[#c0c9bb] hover:bg-surface-container-highest dark:hover:bg-[#41493e] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave} disabled={isSaving}
                      className="px-8 py-3 bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] rounded-xl font-bold text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isSaving ? (
                        <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Saving...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[18px]">save</span> Save Changes</>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </motion.div>
        )}
      </div>
    </main>
  );
}