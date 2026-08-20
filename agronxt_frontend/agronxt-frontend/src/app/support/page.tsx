"use client";

import { useState } from "react";
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

// --- DUMMY DATA ---
const HELP_CATEGORIES = [
  { icon: "account_circle", title: "Account & Profile", desc: "Manage your farm profile, password, and secure login settings." },
  { icon: "biotech", title: "ML Tools & Analytics", desc: "Troubleshooting Crop Advisor, Disease Vision, and ROI models." },
  { icon: "real_estate_agent", title: "Farm Management", desc: "Help with adding sectors, mapping, and the crop calendar." },
  { icon: "receipt_long", title: "Government Schemes", desc: "Assistance with eligibility matching and documentation." },
];

const FAQS = [
  { 
    q: "How accurate is the Disease Vision AI?", 
    a: "Our Disease Vision AI cross-references uploaded leaf images with a vast database of crop pathogens. While highly accurate (usually 90%+ confidence), we always recommend using it as a guidance tool alongside traditional agricultural extensions." 
  },
  { 
    q: "Can I update my soil data after completing the initial Farm Profile?", 
    a: "Yes. You can navigate to your Dashboard, click on 'Soil Health', and enter new NPK/pH values from your latest lab tests. The ML models will automatically recalculate your recommendations based on the fresh data." 
  },
  { 
    q: "Are the Mandi prices and Scheme data real-time?", 
    a: "Yes! Our platform integrates with central agricultural APIs to pull live Mandi rates and the latest active government schemes to ensure you always have up-to-date financial data." 
  },
  { 
    q: "I forgot my password. How do I recover my account?", 
    a: "Go to the login page and click 'Forgot Password'. We will send a secure OTP to your registered mobile number to help you reset your credentials instantly." 
  }
];

export default function SupportPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [formState, setFormState] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormState({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="bg-background dark:bg-[#1b1c1c] text-on-surface dark:text-white transition-colors duration-300 min-h-screen">
      
      <main className="pt-28 pb-12 max-w-7xl mx-auto px-6">
        
        {/* --- HERO SECTION --- */}
        <motion.section {...fadeUpConfig} className="mb-16 text-center max-w-3xl mx-auto">
          <span className="text-primary dark:text-primary-fixed-dim font-label text-[0.75rem] uppercase tracking-[0.05em] font-bold">
            AgroNXT Help Center
          </span>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-on-surface dark:text-white leading-tight mt-4 mb-6">
            How can we help you <span className="text-primary dark:text-primary-fixed italic">grow?</span>
          </h1>
          <p className="text-on-surface-variant dark:text-[#c0c9bb] text-lg leading-relaxed font-body">
            Whether you need help calibrating your ML models, updating your farm profile, or navigating government schemes, our support team is here for you.
          </p>
          
          {/* Quick Search Bar */}
          <div className="mt-8 relative max-w-xl mx-auto editorial-shadow">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline dark:text-[#c0c9bb]/60 text-xl">search</span>
            <input 
              type="text" 
              placeholder="Search for guides, tools, or troubleshooting..." 
              className="w-full bg-surface-container-lowest dark:bg-[#303030] border border-outline-variant/20 dark:border-white/10 rounded-full py-4 pl-14 pr-6 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-on-surface dark:text-white shadow-sm transition-all outline-none"
            />
          </div>
        </motion.section>

        {/* --- CATEGORIES GRID --- */}
        <motion.section 
          variants={containerVariants} initial="hidden" animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24"
        >
          {HELP_CATEGORIES.map((cat, i) => (
            <motion.div 
              key={i} variants={itemVariants}
              className="bg-surface-container-lowest dark:bg-[#303030] p-8 rounded-[2rem] editorial-shadow border border-outline-variant/10 dark:border-white/5 hover:-translate-y-1 hover:border-primary/30 dark:hover:border-primary-fixed-dim/30 transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 bg-surface-container-high dark:bg-[#1b1c1c] rounded-2xl flex items-center justify-center text-primary dark:text-primary-fixed-dim mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
              </div>
              <h3 className="font-headline text-xl font-bold dark:text-white mb-2">{cat.title}</h3>
              <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] font-body leading-relaxed">{cat.desc}</p>
            </motion.div>
          ))}
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          
          {/* --- FAQ SECTION (Left) --- */}
          <motion.section {...fadeUpConfig} className="lg:col-span-7">
            <h2 className="font-headline text-3xl font-extrabold text-on-surface dark:text-white mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {FAQS.map((faq, i) => {
                const isActive = activeFaq === i;
                return (
                  <div 
                    key={i} 
                    className={`rounded-2xl border transition-colors duration-300 overflow-hidden ${isActive ? 'bg-surface-container-lowest dark:bg-[#303030] border-primary/20 dark:border-primary-fixed/20' : 'bg-transparent border-outline-variant/20 dark:border-white/5 hover:bg-surface-container-lowest/50 dark:hover:bg-[#303030]/50'}`}
                  >
                    <button 
                      onClick={() => setActiveFaq(isActive ? null : i)}
                      className="w-full text-left p-6 flex justify-between items-center gap-4"
                    >
                      <h3 className="font-headline font-bold text-lg dark:text-white">{faq.q}</h3>
                      <span className={`material-symbols-outlined text-outline dark:text-[#c0c9bb] transition-transform duration-300 ${isActive ? 'rotate-180 text-primary dark:text-primary-fixed-dim' : ''}`}>
                        keyboard_arrow_down
                      </span>
                    </button>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 pb-6 text-on-surface-variant dark:text-[#c0c9bb] font-body text-sm leading-relaxed"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* --- CONTACT FORM (Right) --- */}
          <motion.section {...fadeUpConfig} className="lg:col-span-5">
            <div className="bg-surface-container-lowest dark:bg-[#303030] rounded-[2.5rem] p-8 md:p-10 editorial-shadow border border-outline-variant/10 dark:border-white/5 relative overflow-hidden">
              
              <h2 className="font-headline text-2xl font-extrabold text-on-surface dark:text-white mb-2 relative z-10">
                Submit a Support Ticket
              </h2>
              <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] font-body mb-8 relative z-10">
                Our technical agronomy team will respond within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Full Name</label>
                    <input required name="name" value={formState.name} onChange={handleFormChange} type="text" placeholder="Somya Barik" className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-sm text-on-surface dark:text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Email Address</label>
                    <input required name="email" value={formState.email} onChange={handleFormChange} type="email" placeholder="somya213@gmail.com" className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-sm text-on-surface dark:text-white outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Issue Category</label>
                  <select required name="subject" value={formState.subject} onChange={handleFormChange} className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-sm text-on-surface dark:text-white outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Select an issue...</option>
                    <option value="account">Account & Authentication</option>
                    <option value="ml_tools">ML Tool Accuracy (Disease/Crop)</option>
                    <option value="profiling">Farm Profiling / Geography</option>
                    <option value="schemes">Government Schemes Query</option>
                    <option value="other">Other Technical Issue</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold">Detailed Message</label>
                  <textarea required name="message" value={formState.message} onChange={handleFormChange} rows={4} placeholder="Please describe the issue you are facing..." className="w-full bg-surface-container-high dark:bg-[#1b1c1c] border-none rounded-xl p-4 focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim font-body text-sm text-on-surface dark:text-white outline-none resize-none" />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || isSuccess}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm font-body ${isSuccess ? 'bg-secondary dark:bg-secondary-fixed text-white dark:text-[#002113]' : 'bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] hover:opacity-90 active:scale-[0.98]'}`}
                >
                  {isSubmitting ? (
                    <><span className="material-symbols-outlined animate-spin">progress_activity</span> Sending...</>
                  ) : isSuccess ? (
                    <><span className="material-symbols-outlined">check_circle</span> Ticket Submitted!</>
                  ) : (
                    <><span className="material-symbols-outlined">send</span> Send Message</>
                  )}
                </button>
              </form>
            </div>
          </motion.section>
        </div>

        {/* --- DIRECT CONTACT CARDS --- */}
        <motion.section {...fadeUpConfig} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-low dark:bg-[#303030] p-8 rounded-3xl border border-outline-variant/10 dark:border-white/5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container-highest dark:bg-[#1b1c1c] flex items-center justify-center text-primary dark:text-primary-fixed-dim shrink-0">
              <span className="material-symbols-outlined">mail</span>
            </div>
            <div>
              <p className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-1">Email Support</p>
              <p className="font-headline font-bold text-lg dark:text-white">support@agronxt.in</p>
              <p className="text-xs text-on-surface-variant dark:text-[#c0c9bb] mt-1 font-body">Guaranteed reply within 24h</p>
            </div>
          </div>
          
          <div className="bg-surface-container-low dark:bg-[#303030] p-8 rounded-3xl border border-outline-variant/10 dark:border-white/5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container-highest dark:bg-[#1b1c1c] flex items-center justify-center text-secondary dark:text-secondary-fixed shrink-0">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <p className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-1">Kisan Helpline</p>
              <p className="font-headline font-bold text-lg dark:text-white">77350-34481</p>
              <p className="text-xs text-on-surface-variant dark:text-[#c0c9bb] mt-1 font-body">Toll-Free, 10 regional languages</p>
            </div>
          </div>

          <div className="bg-surface-container-low dark:bg-[#303030] p-8 rounded-3xl border border-outline-variant/10 dark:border-white/5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container-highest dark:bg-[#1b1c1c] flex items-center justify-center text-tertiary dark:text-tertiary-fixed-dim shrink-0">
              <span className="material-symbols-outlined">corporate_fare</span>
            </div>
            <div>
              <p className="text-xs font-label uppercase tracking-widest text-outline dark:text-[#c0c9bb] font-bold mb-1">Headquarters</p>
              <p className="font-headline font-bold text-base dark:text-white leading-tight">AgroNXT Tech Hub,<br/>Bhubaneswar, Odisha</p>
            </div>
          </div>
        </motion.section>

      </main>

      {/* --- FOOTER --- */}
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
              <li><Link className="text-primary dark:text-primary-fixed text-sm font-bold transition-colors font-body" href="/support">Help Center</Link></li>
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

    </div>
  );
}