"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const fadeUpConfig = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0] as const }
};

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Captcha State
  const [captchaText, setCaptchaText] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    village: "",
    district: "",
    state: "Odisha", // Updated default
    farmSize: "",
    sizeUnit: "Acres"
  });

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; 
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserCaptcha(""); 
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(""); 
  };

  const handlePhase1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setErrorMsg("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (userCaptcha !== captchaText) {
      setErrorMsg("Incorrect CAPTCHA code. Please try again.");
      generateCaptcha(); 
      return;
    }

    setCurrentStep(2);
  };

  const prevStep = () => {
    setCurrentStep(1);
    setErrorMsg("");
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    const payload = {
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      village: formData.village,
      district: formData.district,
      state: formData.state,
      farm_size: parseFloat(formData.farmSize) || 0,
      size_unit: formData.sizeUnit,
      soil_type: "Not Specified",
      primary_crops: [] 
    };

    try {
      const res = await fetch("https://agronxt.onrender.com/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        let detailStr = "";
        
        if (typeof errData.detail === "string") {
          detailStr = errData.detail;
        } else if (Array.isArray(errData.detail)) {
          detailStr = errData.detail.map((err: any) => err.msg).join(", ");
        }

        if (detailStr.toLowerCase().includes("already registered")) {
          setErrorMsg("Account already exists. Please log in instead.");
        } else {
          setErrorMsg(detailStr || "Registration failed. Please try again.");
        }
      } else {
        const data = await res.json();
        document.cookie = `agronxt_token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
        
        // 🚀 THE FIX: Redirect to the profiling setup page instead of the dashboard
        router.push("/profiling");
      }
    } catch (err) {
      setErrorMsg("Could not connect to the server. Make sure your FastAPI backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface dark:bg-inverse-surface text-on-surface dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
      <main className="flex-grow max-w-7xl mx-auto px-6 md:px-8 pt-28 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start w-full">
        
        <motion.div {...fadeUpConfig} className="lg:col-span-5 space-y-8 lg:sticky lg:top-36">
          <div className="space-y-4">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-tertiary-fixed dark:bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant dark:text-tertiary-fixed-dim text-xs font-bold tracking-widest uppercase font-label border border-transparent dark:border-tertiary-fixed-dim/30">
              Onboarding
            </span>
            <h1 className="text-5xl font-headline font-extrabold text-primary dark:text-primary-fixed-dim leading-[1.1] tracking-tight">
              Join the Digital <br/> <span className="text-secondary dark:text-white italic">Agronomy Revolution.</span>
            </h1>
            <p className="text-on-surface-variant dark:text-[#c0c9bb] text-lg leading-relaxed max-w-md font-body">
              Start your journey with precision insights tailored to the Indian soil. Access weather alerts, soil health diagnostics, and market trends.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <div className={`h-2 rounded-full transition-all duration-500 ${currentStep >= 1 ? 'w-12 bg-primary dark:bg-primary-fixed-dim' : 'w-4 bg-surface-container-high dark:bg-[#303030]'}`}></div>
            <div className={`h-2 rounded-full transition-all duration-500 ${currentStep >= 2 ? 'w-12 bg-primary dark:bg-primary-fixed-dim' : 'w-4 bg-surface-container-high dark:bg-[#303030]'}`}></div>
            <span className="ml-2 text-xs font-bold text-outline dark:text-[#c0c9bb] uppercase tracking-widest font-label">
              Step {currentStep} of 2
            </span>
          </div>

          <div className="p-8 rounded-[2rem] bg-surface-container-low dark:bg-[#303030] relative overflow-hidden editorial-shadow border border-transparent dark:border-white/5 mt-8 hidden md:block">
            <div className="relative z-10">
              <p className="text-primary dark:text-primary-fixed-dim font-bold italic text-xl font-headline leading-snug">
                "AgroNXT helped us increase yield by 24% in the first season across our Maharashtra belt."
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-container dark:bg-[#065f18] flex items-center justify-center text-on-primary-container dark:text-[#a3f69c] font-black font-headline">RK</div>
                <div>
                  <p className="font-bold text-primary dark:text-white font-headline tracking-tight">Rajesh Kulkarni</p>
                  <p className="text-xs text-on-surface-variant dark:text-[#c0c9bb] font-body">Progressive Farmer, Pune</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/5 dark:bg-primary-fixed-dim/5 rounded-full blur-2xl"></div>
          </div>
        </motion.div>

        <div className="lg:col-span-7 w-full">
          
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-6 flex items-center gap-3 p-4 bg-error-container dark:bg-red-950/40 text-on-error-container dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-800"
              >
                <span className="material-symbols-outlined text-[20px]">warning</span>
                <p className="text-sm font-bold font-body">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-surface-container-lowest dark:bg-[#303030] p-8 md:p-12 rounded-[2rem] editorial-shadow border border-outline-variant/10 dark:border-white/5 overflow-hidden">
            <AnimatePresence mode="wait">
              
              {/* ================= STEP 1 ================= */}
              {currentStep === 1 && (
                <motion.form 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: "easeInOut" }}
                  onSubmit={handlePhase1Next} 
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4 border-b border-outline-variant/20 dark:border-white/10 pb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary dark:bg-[#00450d] flex items-center justify-center text-on-primary dark:text-[#a3f69c]">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-headline font-extrabold text-primary dark:text-white">Basic Information</h2>
                      <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] font-body">Your personal contact details for secure access.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label font-bold text-primary dark:text-[#c0c9bb] text-xs uppercase tracking-widest">Full Name</label>
                      <input required name="fullName" value={formData.fullName} onChange={handleChange} className="bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-all font-body text-on-surface dark:text-white" placeholder="e.g. Arjun Singh" type="text"/>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="font-label font-bold text-primary dark:text-[#c0c9bb] text-xs uppercase tracking-widest">Email Address</label>
                      <input required name="email" value={formData.email} onChange={handleChange} className="bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-all font-body text-on-surface dark:text-white" placeholder="arjun@agronxt.in" type="email"/>
                    </div>
                    
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="font-label font-bold text-primary dark:text-[#c0c9bb] text-xs uppercase tracking-widest">Phone Number</label>
                      <div className="flex gap-2">
                        <span className="bg-surface-container-high dark:bg-[#1b1c1c] px-4 flex items-center rounded-xl text-on-surface-variant dark:text-[#c0c9bb] font-bold font-body">+91</span>
                        <input required name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-all font-body text-on-surface dark:text-white" placeholder="98765 43210" type="tel"/>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="font-label font-bold text-primary dark:text-[#c0c9bb] text-xs uppercase tracking-widest">Password</label>
                      <input required name="password" value={formData.password} onChange={handleChange} className="bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-all font-body text-on-surface dark:text-white" placeholder="••••••••" type="password"/>
                      <p className="text-[10px] text-outline dark:text-outline-variant font-body">Must be 8+ chars with letters & numbers.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-label font-bold text-primary dark:text-[#c0c9bb] text-xs uppercase tracking-widest">Confirm Password</label>
                      <input required name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-all font-body text-on-surface dark:text-white" placeholder="••••••••" type="password"/>
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2 mt-4 pt-6 border-t border-outline-variant/10 dark:border-white/5">
                      <label className="font-label font-bold text-primary dark:text-[#c0c9bb] text-xs uppercase tracking-widest">Security Verification</label>
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-full sm:w-1/2 bg-surface-container-highest dark:bg-[#1b1c1c] p-4 rounded-xl flex items-center justify-between relative overflow-hidden border border-outline-variant/20 dark:border-white/5">
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEg0VjRIMEoiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PC9wYXRoPjwvc3ZnPg==')] opacity-50"></div>
                          <span className="font-mono text-3xl tracking-[0.3em] font-black italic text-on-surface dark:text-white select-none line-through decoration-outline decoration-2 z-10">
                            {captchaText}
                          </span>
                          <button type="button" onClick={generateCaptcha} className="text-outline hover:text-primary dark:hover:text-primary-fixed-dim z-10 transition-transform hover:rotate-180 duration-500">
                            <span className="material-symbols-outlined">refresh</span>
                          </button>
                        </div>
                        <div className="w-full sm:w-1/2">
                          <input required value={userCaptcha} onChange={(e) => {setUserCaptcha(e.target.value); setErrorMsg("");}} className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-all font-body text-on-surface dark:text-white" placeholder="Type the code" type="text" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                    <Link href="/login" className="text-sm font-bold text-secondary dark:text-primary-fixed-dim hover:underline font-body">Already have an account?</Link>
                    <button type="submit" className="w-full sm:w-auto bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] px-8 py-4 rounded-xl font-bold font-headline flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
                      Continue to Next Step
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ================= STEP 2 ================= */}
              {currentStep === 2 && (
                <motion.form 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: "easeInOut" }}
                  onSubmit={submitForm}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4 border-b border-outline-variant/20 dark:border-white/10 pb-6">
                    <button type="button" onClick={prevStep} className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-[#1b1c1c] flex items-center justify-center text-on-surface dark:text-white hover:bg-surface-variant dark:hover:bg-[#41493e] transition-colors mr-2 shrink-0">
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="w-12 h-12 rounded-2xl bg-secondary dark:bg-[#7a5649] flex items-center justify-center text-on-secondary dark:text-white shrink-0">
                      <span className="material-symbols-outlined">map</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-headline font-extrabold text-primary dark:text-white">Regional Profile</h2>
                      <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] font-body leading-tight mt-1">Help us customize market and weather insights for your location.</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="font-label font-bold text-primary dark:text-[#c0c9bb] text-xs uppercase tracking-widest">Village / City</label>
                        <input required name="village" value={formData.village} onChange={handleChange} className="bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-all font-body text-on-surface dark:text-white" placeholder="e.g. Bhubaneswar" type="text"/>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label font-bold text-primary dark:text-[#c0c9bb] text-xs uppercase tracking-widest">District</label>
                        <input required name="district" value={formData.district} onChange={handleChange} className="bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-all font-body text-on-surface dark:text-white" placeholder="District" type="text"/>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label font-bold text-primary dark:text-[#c0c9bb] text-xs uppercase tracking-widest">State</label>
                        <select required name="state" value={formData.state} onChange={handleChange} className="bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-all font-body text-on-surface dark:text-white appearance-none cursor-pointer">
                          <option>Odisha</option>
                          <option>Maharashtra</option>
                          <option>Punjab</option>
                          <option>Haryana</option>
                          <option>Karnataka</option>
                          <option>Uttar Pradesh</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2 md:col-span-1">
                        <label className="font-label font-bold text-primary dark:text-[#c0c9bb] text-xs uppercase tracking-widest">Total Farm Size (Optional)</label>
                        <div className="flex gap-0 rounded-xl overflow-hidden bg-surface-container-high dark:bg-[#1b1c1c] focus-within:ring-2 focus-within:ring-primary dark:focus-within:ring-primary-fixed-dim transition-all">
                          <input name="farmSize" value={formData.farmSize} onChange={handleChange} className="flex-grow bg-transparent border-none p-4 focus:ring-0 outline-none font-body text-on-surface dark:text-white" placeholder="e.g. 5" type="number"/>
                          <select name="sizeUnit" value={formData.sizeUnit} onChange={handleChange} className="bg-surface-container-highest dark:bg-[#41493e] border-none p-4 font-bold text-primary dark:text-primary-fixed-dim outline-none focus:ring-0 cursor-pointer">
                            <option>Acres</option>
                            <option>Hectares</option>
                            <option>Bigha</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-outline-variant/20 dark:border-white/10 flex flex-col md:flex-row items-center justify-end gap-6">
                    <button disabled={isLoading} type="submit" className="w-full md:w-auto bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] px-10 py-4 rounded-xl font-headline font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-70">
                      {isLoading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">how_to_reg</span>}
                      {isLoading ? "Creating..." : "Create Account"}
                    </button>
                  </div>
                  <p className="text-xs text-on-surface-variant dark:text-outline-variant text-center md:text-right font-body">
                    By creating an account, you agree to AgroNXT's <Link className="text-primary dark:text-primary-fixed-dim hover:underline" href="/terms">Terms of Service</Link>.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="bg-surface-container-low dark:bg-[#1b1c1c] w-full py-12 px-6 md:px-8 border-t border-outline-variant/20 dark:border-white/5 transition-colors duration-300 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-headline font-black text-primary dark:text-primary-fixed-dim text-2xl tracking-tight">AgroNXT</span>
            <p className="font-body text-sm tracking-wide text-on-surface-variant dark:text-[#c0c9bb]">© {new Date().getFullYear()} AgroNXT. Precision for the Modern Cultivator.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link href="/privacy" className="text-on-surface-variant dark:text-[#c0c9bb] uppercase text-[0.75rem] tracking-widest hover:text-primary dark:hover:text-primary-fixed-dim transition-colors font-bold font-label">Privacy Policy</Link>
            <Link href="/terms" className="text-on-surface-variant dark:text-[#c0c9bb] uppercase text-[0.75rem] tracking-widest hover:text-primary dark:hover:text-primary-fixed-dim transition-colors font-bold font-label">Terms of Service</Link>
            <Link href="/support" className="text-on-surface-variant dark:text-[#c0c9bb] uppercase text-[0.75rem] tracking-widest hover:text-primary dark:hover:text-primary-fixed-dim transition-colors font-bold font-label">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}