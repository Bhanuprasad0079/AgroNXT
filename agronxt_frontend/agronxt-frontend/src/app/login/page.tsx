"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const fadeUpConfig = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] as const }
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Anti-Brute Force State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captchaText, setCaptchaText] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    // Enforce Captcha if they failed 2 or more times
    if (failedAttempts >= 2 && userCaptcha !== captchaText) {
      setErrorMsg("Incorrect CAPTCHA. Please try again.");
      generateCaptcha();
      setUserCaptcha("");
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const identity = formData.get("identity") as string;
    const password = formData.get("password") as string;

    try {
      // FastAPI OAuth2 requires form data (URLSearchParams), not JSON
      const apiFormData = new URLSearchParams();
      apiFormData.append("username", identity);
      apiFormData.append("password", password);

      const res = await fetch("https://agronxt.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: apiFormData,
      });

      if (!res.ok) {
        setFailedAttempts((prev) => prev + 1);
        setErrorMsg("Incorrect email or password.");
        setUserCaptcha("");
        if (failedAttempts + 1 >= 2) generateCaptcha();
      } else {
        const data = await res.json();
        // SUCCESS! Set the cookie so Middleware knows we are logged in
        document.cookie = `agronxt_token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
        
        // 🚀 ROLE-BASED ROUTING: Admin goes to /admin, everyone else to /dashboard
        if (identity.toLowerCase() === "support.agronxt@gmail.com") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setErrorMsg("Could not connect to the server. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface dark:bg-inverse-surface text-on-surface dark:text-white transition-colors duration-300 min-h-screen flex flex-col justify-center">
      <main className="w-full max-w-6xl mx-auto px-6 md:px-8 pt-28 pb-16 flex-grow flex items-center justify-center">
        <motion.div 
          {...fadeUpConfig}
          className="w-full grid grid-cols-1 md:grid-cols-12 bg-surface-container-lowest dark:bg-[#303030] rounded-[2.5rem] overflow-hidden editorial-shadow border border-outline-variant/10 dark:border-white/5"
        >
          {/* Left Column: Login Form */}
          <section className="md:col-span-5 lg:col-span-5 p-8 md:p-12 flex flex-col justify-center bg-surface-container-lowest dark:bg-[#303030]">
            <div className="mb-10">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container dark:bg-secondary-fixed/20 text-secondary dark:text-secondary-fixed text-[10px] font-bold tracking-widest uppercase font-label mb-4 border border-transparent dark:border-secondary-fixed/30">
                Welcome Back
              </span>
              <h1 className="font-headline text-4xl font-extrabold text-primary dark:text-white tracking-tight mb-2">AgroNXT</h1>
              <p className="text-on-surface-variant dark:text-[#c0c9bb] font-medium font-body text-sm">Access your digital farm assistant.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              
              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="p-4 bg-error-container/20 border border-error/30 rounded-xl text-error text-sm font-bold flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="block font-label text-xs font-bold text-primary dark:text-[#c0c9bb] uppercase tracking-widest" htmlFor="identity">Email or Phone</label>
                <div className="relative">
                  <input 
                    required
                    className="w-full px-4 py-4 bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim text-on-surface dark:text-white placeholder:text-outline/50 dark:placeholder:text-[#c0c9bb]/40 transition-all font-body" 
                    id="identity" 
                    name="identity" 
                    placeholder="e.g. rajesh@agronxt.in" 
                    type="text"
                    onChange={() => setErrorMsg("")}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block font-label text-xs font-bold text-primary dark:text-[#c0c9bb] uppercase tracking-widest" htmlFor="password">Password</label>
                <div className="relative flex items-center">
                  <input 
                    required
                    className="w-full px-4 py-4 bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim text-on-surface dark:text-white placeholder:text-outline/50 dark:placeholder:text-[#c0c9bb]/40 transition-all font-body pr-12" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    onChange={() => setErrorMsg("")}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-outline dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed transition-colors flex items-center justify-center"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* ANTI-BRUTE FORCE CAPTCHA */}
              <AnimatePresence>
                {failedAttempts >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-2 pt-2 overflow-hidden"
                  >
                    <label className="block font-label text-xs font-bold text-error uppercase tracking-widest">Security Verification Required</label>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="w-full sm:w-1/2 bg-surface-container-highest dark:bg-[#1b1c1c] p-4 rounded-xl flex items-center justify-center relative overflow-hidden border border-outline-variant/20 dark:border-white/5">
                        <span className="font-mono text-2xl tracking-[0.3em] font-black italic text-on-surface dark:text-white select-none line-through decoration-outline decoration-2">
                          {captchaText}
                        </span>
                      </div>
                      <input 
                        required={failedAttempts >= 2}
                        value={userCaptcha} 
                        onChange={(e) => { setUserCaptcha(e.target.value); setErrorMsg(""); }} 
                        className="w-full sm:w-1/2 bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim text-on-surface dark:text-white font-body" 
                        placeholder="Type code here" 
                        type="text" 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    className="w-5 h-5 rounded border-outline-variant dark:border-white/20 text-primary dark:text-primary-fixed focus:ring-primary dark:focus:ring-primary-fixed bg-transparent cursor-pointer transition-all" 
                    type="checkbox"
                  />
                  <span className="text-sm font-bold text-on-surface-variant dark:text-[#c0c9bb] group-hover:text-primary dark:group-hover:text-white transition-colors font-body">Remember Me</span>
                </label>
                <Link className="text-sm font-bold text-secondary dark:text-primary-fixed-dim hover:underline font-body transition-colors" href="/forgot-password">
                  Forgot Password?
                </Link>
              </div>
              
              <div className="pt-4 space-y-6">
                <button disabled={isLoading} className="w-full bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] font-headline font-bold text-lg py-4 rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2" type="submit">
                  {isLoading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : "Secure Login"}
                </button>
                <div className="text-center font-body border-t border-outline-variant/10 dark:border-white/5 pt-6">
                  <span className="text-sm text-on-surface-variant dark:text-[#c0c9bb]">Don't have an account? </span>
                  <Link className="text-sm font-bold text-primary dark:text-primary-fixed-dim hover:underline ml-1" href="/register">
                    Create Account
                  </Link>
                </div>
              </div>
            </form>
          </section>

          {/* Right Column: Image & Testimonial (Hidden on Mobile) */}
          <section className="hidden md:block md:col-span-7 lg:col-span-7 relative min-h-[600px] bg-primary dark:bg-[#002204]">
            <img 
              alt="Experienced Indian farmer in a vibrant green rice paddy field" 
              className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-overlay dark:mix-blend-luminosity" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7FnvHB-69gxkmQvVZumgXxkTJ319BF_Euq4BDqo0YGfwb8tCKj2EI2MYodDFRfIKRMeYXTJVoZVgXTyfyFSbJOiHF9T-qZG0t2h-dckuneIgOOtPRn-Wv29x_4xYTZ3DFbOwn3YGfeYH8DlY8jr3kgqeQW1q_k71EOW8GW4iX5s_rWWa6x9VpPUr6hP_kmWELeyOKEda1-yXfKolabEYPtDZDfHT5ocgli7_Z34p78YNIygQ5PqhP9X87wavAuQr-2vMK5DfaXcE"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
            
            <div className="absolute bottom-10 left-10 right-10 bg-white/10 dark:bg-black/30 backdrop-blur-md p-8 rounded-2xl border border-white/20 editorial-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="material-symbols-outlined text-tertiary-fixed dark:text-tertiary-fixed-dim text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="text-white font-headline text-xl lg:text-2xl font-bold leading-snug mb-6 drop-shadow-md">
                "AgroNXT has transformed how I monitor my crop health. The precision data is like having an expert agronomist in my pocket 24/7."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary-container dark:bg-[#1b1c1c] flex items-center justify-center text-secondary dark:text-white font-black font-headline shadow-inner">
                  AK
                </div>
                <div>
                  <p className="text-sm font-bold text-white font-headline tracking-wide">Anil Kumar</p>
                  <p className="text-xs text-white/70 font-body mt-0.5">Progressive Farmer, Maharashtra</p>
                </div>
              </div>
            </div>
          </section>

        </motion.div>
      </main>

      {/* Minimal Footer for Auth Pages */}
      <footer className="w-full pb-8 pt-4 px-6 flex justify-center">
        <div className="flex items-center gap-6 text-xs font-bold text-on-surface-variant dark:text-[#c0c9bb] font-body uppercase tracking-widest">
          <Link href="/privacy" className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors">Privacy Policy</Link>
          <span className="w-1 h-1 rounded-full bg-outline-variant/50 dark:bg-white/20"></span>
          <Link href="/terms" className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors">Terms of Service</Link>
          <span className="w-1 h-1 rounded-full bg-outline-variant/50 dark:bg-white/20"></span>
          <Link href="/support" className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors">Help Center</Link>
        </div>
      </footer>
    </div>
  );
}