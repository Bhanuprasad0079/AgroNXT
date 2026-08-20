"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const fadeUpConfig = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] as const }
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // States
  const [captchaText, setCaptchaText] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  
  // Smart OTP State
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // --- Step 1: Send OTP ---
  const handleSendOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (userCaptcha !== captchaText) {
      setErrorMsg("Incorrect CAPTCHA code. Please try again.");
      generateCaptcha(); 
      return;
    }

    setIsLoading(true);
    setTargetEmail(email);

    try {
      const res = await fetch("https://agronxt.onrender.com/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.detail || "An error occurred.");
        generateCaptcha();
      } else {
        setStep(2);
      }
    } catch (err) {
      setErrorMsg("Cannot connect to server. Please ensure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2: OTP Input Handlers ---
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow numbers
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Auto-retreat to previous input on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (otp.join("").length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP.");
      return;
    }
    // Just move to step 3, we will verify OTP + Password together in one API call
    setStep(3);
  };

  // --- Step 3: Reset Password ---
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setErrorMsg("Password must be at least 8 characters with letters & numbers.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("https://agronxt.onrender.com/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: targetEmail,
          otp: otp.join(""),
          new_password: newPassword
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.detail || "Failed to reset password.");
        if (data.detail?.includes("OTP")) setStep(2); // Kick back to OTP if invalid
      } else {
        alert("Password successfully reset! Redirecting to login...");
        router.push("/login");
      }
    } catch (err) {
      setErrorMsg("Cannot connect to server. Please ensure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface dark:bg-inverse-surface text-on-surface dark:text-white transition-colors duration-300 min-h-screen flex flex-col justify-center">
      <main className="w-full max-w-6xl mx-auto px-6 md:px-8 pt-28 pb-16 flex-grow flex items-center justify-center">
        <motion.div 
          {...fadeUpConfig}
          className="w-full grid grid-cols-1 md:grid-cols-2 bg-surface-container-low dark:bg-[#1b1c1c] rounded-[2.5rem] overflow-hidden editorial-shadow border border-outline-variant/10 dark:border-white/5"
        >
          {/* Left Side: Visual/Branding Editorial */}
          <div className="hidden md:block relative p-12 overflow-hidden bg-gradient-to-br from-primary to-primary-container dark:from-[#002204] dark:to-[#00450d]">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="bg-tertiary-fixed/20 dark:bg-tertiary-fixed-dim/20 text-tertiary-fixed dark:text-tertiary-fixed-dim px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest w-fit mb-6 font-label border border-transparent dark:border-tertiary-fixed-dim/30">
                  Secure Access
                </div>
                <h1 className="text-4xl font-headline font-extrabold text-white leading-tight mb-4 tracking-tight">
                  Precision insights at your fingertips.
                </h1>
                <p className="text-primary-fixed dark:text-primary-fixed-dim text-lg font-body max-w-sm opacity-90">
                  Secure your account to continue monitoring soil health and crop yields across your estates.
                </p>
              </div>
              
              <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-6 rounded-2xl border border-white/10 dark:border-white/5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container dark:bg-secondary-fixed/20 flex items-center justify-center text-secondary dark:text-secondary-fixed font-black font-headline">
                    RK
                  </div>
                  <div>
                    <div className="text-white font-bold font-headline">Rajesh Kumar</div>
                    <div className="text-primary-fixed dark:text-primary-fixed-dim text-xs font-body">Estate Manager, Punjab</div>
                  </div>
                </div>
                <p className="text-white/80 text-sm italic font-body leading-relaxed">
                  "AgroNXT's security protocols give me peace of mind while managing over 500 acres of wheat."
                </p>
              </div>
            </div>
            
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary dark:bg-secondary-fixed rounded-full blur-[100px] opacity-20"></div>
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-tertiary dark:bg-tertiary-fixed rounded-full blur-[100px] opacity-20"></div>
            <img className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 dark:opacity-20" alt="Close-up of healthy green crops" src="https://images.unsplash.com/photo-1586771107445-d3afcb84d41e?q=80&w=2070&auto=format&fit=crop" />
          </div>

          {/* Right Side: Multi-Step Form Flow */}
          <div className="bg-surface-container-lowest dark:bg-[#303030] p-8 md:p-14 flex flex-col justify-center relative overflow-hidden">
            
            <AnimatePresence>
              {errorMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 p-4 bg-error-container dark:bg-red-950/40 text-on-error-container dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-800">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                  <p className="text-sm font-bold font-body">{errorMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* STEP 1: Request Reset */}
              {step === 1 && (
                <motion.section key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <header>
                    <h2 className="text-3xl font-headline font-extrabold text-primary dark:text-white mb-2 tracking-tight">Forgot Password?</h2>
                    <p className="text-on-surface-variant dark:text-[#c0c9bb] font-body text-sm">Enter your registered email to receive a verification code.</p>
                  </header>
                  
                  <form onSubmit={handleSendOTP} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary dark:text-[#c0c9bb] uppercase tracking-widest font-label">Email Address</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline dark:text-[#c0c9bb] text-sm">alternate_email</span>
                        <input required name="email" onChange={() => setErrorMsg("")} className="w-full pl-12 pr-4 py-4 bg-surface-container-low dark:bg-[#1b1c1c] border-none rounded-xl focus:ring-2 focus:ring-primary transition-all text-on-surface dark:text-white font-body placeholder:text-outline/50 dark:placeholder:text-[#c0c9bb]/40" placeholder="e.g. rajesh@agronxt.in" type="email" />
                      </div>
                    </div>
                    
                    {/* RELOADABLE CAPTCHA */}
                    <div className="flex flex-col gap-2 pt-2">
                      <label className="font-label font-bold text-primary dark:text-[#c0c9bb] text-xs uppercase tracking-widest">Security Verification</label>
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-full sm:w-1/2 bg-surface-container-highest dark:bg-[#1b1c1c] p-4 rounded-xl flex items-center justify-between relative overflow-hidden border border-outline-variant/20 dark:border-white/5">
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEg0VjRIMEoiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PC9wYXRoPjwvc3ZnPg==')] opacity-50"></div>
                          <span className="font-mono text-3xl tracking-[0.3em] font-black italic text-on-surface dark:text-white select-none line-through decoration-outline decoration-2 z-10">{captchaText}</span>
                          <button type="button" onClick={generateCaptcha} className="text-outline hover:text-primary dark:hover:text-primary-fixed-dim z-10 transition-transform hover:rotate-180 duration-500">
                            <span className="material-symbols-outlined">refresh</span>
                          </button>
                        </div>
                        <div className="w-full sm:w-1/2">
                          <input required value={userCaptcha} onChange={(e) => {setUserCaptcha(e.target.value); setErrorMsg("");}} className="w-full bg-surface-container-low dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary transition-all font-body text-on-surface dark:text-white" placeholder="Type the code" type="text" />
                        </div>
                      </div>
                    </div>
                    
                    <button disabled={isLoading} className="w-full py-4 bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] font-headline font-bold text-lg rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-xl" type="submit">
                      {isLoading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : "Send OTP"}
                    </button>
                  </form>

                  <div className="pt-4 border-t border-outline-variant/10 dark:border-white/5 text-center">
                    <Link className="text-sm font-bold text-secondary dark:text-primary-fixed-dim hover:underline transition-colors font-body" href="/login">
                      Back to Login
                    </Link>
                  </div>
                </motion.section>
              )}

              {/* STEP 2: OTP Verification */}
              {step === 2 && (
                <motion.section key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="w-14 h-14 rounded-2xl bg-secondary-container dark:bg-secondary-fixed/20 flex items-center justify-center text-secondary dark:text-secondary-fixed mb-6 border border-transparent dark:border-secondary-fixed/30">
                    <span className="material-symbols-outlined text-2xl">mark_email_read</span>
                  </div>
                  
                  <header>
                    <h2 className="text-3xl font-headline font-extrabold text-primary dark:text-white mb-2 tracking-tight">Verify OTP</h2>
                    <p className="text-on-surface-variant dark:text-[#c0c9bb] font-body text-sm leading-relaxed">
                      Email sent to <span className="text-primary dark:text-primary-fixed-dim font-bold">{targetEmail}</span>
                    </p>
                  </header>
                  
                  <form onSubmit={handleVerifyOTP} className="space-y-8">
                    {/* SMART OTP INPUT */}
                    <div className="flex justify-between gap-2">
                      {otp.map((digit, index) => (
                        <input 
                          key={index} 
                          ref={(el) => { otpRefs.current[index] = el; }}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          required 
                          className="w-10 h-12 sm:w-14 sm:h-16 text-center text-2xl font-black font-headline bg-surface-container-low dark:bg-[#1b1c1c] border-none rounded-xl focus:ring-2 focus:ring-primary text-on-surface dark:text-white transition-all" 
                          maxLength={1} 
                          type="text" 
                        />
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={() => alert("OTP Resent! (Check your email)")} className="text-sm font-bold text-secondary dark:text-primary-fixed-dim hover:underline font-body transition-all">
                        Resend OTP
                      </button>
                    </div>
                    
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setStep(1)} className="px-6 py-4 bg-surface-container-high dark:bg-[#1b1c1c] text-on-surface dark:text-white font-headline font-bold rounded-xl hover:bg-surface-variant transition-colors border border-transparent dark:border-white/5">Back</button>
                      <button className="flex-1 py-4 bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] font-headline font-bold text-lg rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl" type="submit">Verify & Continue</button>
                    </div>
                  </form>

                  <div className="pt-4 border-t border-outline-variant/10 dark:border-white/5 text-center">
                    <Link className="text-sm font-bold text-secondary dark:text-primary-fixed-dim hover:underline transition-colors font-body" href="/login">
                      Back to Login
                    </Link>
                  </div>
                </motion.section>
              )}

              {/* STEP 3: Reset Password */}
              {step === 3 && (
                <motion.section key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <header>
                    <h2 className="text-3xl font-headline font-extrabold text-primary dark:text-white mb-2 tracking-tight">Create New Password</h2>
                    <p className="text-on-surface-variant dark:text-[#c0c9bb] font-body text-sm">Your new password must be different from previous passwords.</p>
                  </header>
                  
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary dark:text-[#c0c9bb] uppercase tracking-widest font-label">New Password</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline dark:text-[#c0c9bb] text-sm">lock</span>
                        <input required name="newPassword" onChange={() => setErrorMsg("")} className="w-full pl-12 pr-12 py-4 bg-surface-container-low dark:bg-[#1b1c1c] border-none rounded-xl focus:ring-2 focus:ring-primary text-on-surface dark:text-white transition-all font-body placeholder:text-outline/50" placeholder="••••••••" type={showPassword ? "text" : "password"} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline dark:text-[#c0c9bb] hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-sm">{showPassword ? "visibility_off" : "visibility"}</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary dark:text-[#c0c9bb] uppercase tracking-widest font-label">Confirm Password</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline dark:text-[#c0c9bb] text-sm">lock_reset</span>
                        <input required name="confirmPassword" onChange={() => setErrorMsg("")} className="w-full pl-12 pr-4 py-4 bg-surface-container-low dark:bg-[#1b1c1c] border-none rounded-xl focus:ring-2 focus:ring-primary text-on-surface dark:text-white transition-all font-body placeholder:text-outline/50" placeholder="••••••••" type="password" />
                      </div>
                    </div>
                    
                    <button disabled={isLoading} className="w-full py-4 bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] font-headline font-bold text-lg rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-70 flex justify-center items-center" type="submit">
                      {isLoading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : "Reset Password"}
                    </button>
                  </form>

                  <div className="pt-4 border-t border-outline-variant/10 dark:border-white/5 text-center">
                    <Link className="text-sm font-bold text-secondary dark:text-primary-fixed-dim hover:underline transition-colors font-body" href="/login">
                      Back to Login
                    </Link>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Minimal Footer */}
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