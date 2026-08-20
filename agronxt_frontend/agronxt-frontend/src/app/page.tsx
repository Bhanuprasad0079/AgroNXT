"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// Reusable animation configuration for a premium, subtle fade-up effect
const fadeUpConfig = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  // Adding "as const" fixes the TypeScript error by locking the tuple type
  transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0] as const }
};

export default function HomePage() {
  return (
    <div className="bg-surface dark:bg-inverse-surface text-on-surface dark:text-inverse-on-surface transition-colors duration-300">
      
      {/* Note: The Navbar is automatically injected here by layout.tsx.
        The pt-20 on the main tag pushes the content down so it doesn't hide behind the fixed nav. 
      */}
      <main className="pt-20">
        
        {/* Hero Section */}
        <section className="relative min-h-[870px] flex items-center overflow-hidden px-6 lg:px-24">
          <div className="absolute inset-0 z-0">
            <img 
              alt="Modern Indian farmer standing in a lush green field" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDK4iiPpjRV6cafw44a_oJRuOOg74AVJVSvh2XKpUi6OxqWPQaC2BlpBtKGiZM8sNa2Oiw0jMTiDkwDmp8CLP6PWpdVsM7izUBXzSIGccH3kk5BOAMGpdcxrEtFczjwDO0Zv28mqhc97N1VLgcuav-cBu0CrhLhR3syxZYfEzDiwrfAwmH_iX0M4wxAtxh1pnSunNOtKA-zjWx4o9sKn-6kDMJ9uos_z_pXPyPq4yjuO6sHxIoKUllQgJS2TSUXvw7qxxeyiHcJww"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface dark:from-[#1b1c1c] via-surface/80 dark:via-[#1b1c1c]/80 to-transparent"></div>
          </div>
          
          <motion.div 
            className="relative z-10 max-w-2xl"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-fixed dark:bg-primary-fixed-dim text-on-primary-fixed dark:text-primary-fixed font-semibold mb-6 shadow-sm">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="text-sm font-label uppercase tracking-widest">India's Leading Precision Agri-Platform</span>
            </div>
            <h1 className="font-headline text-5xl lg:text-7xl font-extrabold text-on-surface dark:text-white leading-tight mb-6">
              Data-Driven <span className="text-primary dark:text-primary-fixed-dim italic">Farming</span> for the Next Generation.
            </h1>
            <p className="text-on-surface-variant dark:text-[#c0c9bb] text-lg lg:text-xl max-w-lg mb-8 leading-relaxed font-body">
              Empowering Indian farmers with real-time insights, AI-driven crop intelligence, and precise financial forecasting. Reimaging your yield through the lens of technology.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register" className="bg-gradient-to-r from-primary to-primary-container dark:from-[#88d982] dark:to-[#a3f69c] text-on-primary dark:text-[#002204] px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transition-all active:scale-95">
                Get Started Free
              </Link>
              <Link href="/contact" className="bg-surface-container-lowest dark:bg-[#303030] text-primary dark:text-[#88d982] px-8 py-4 rounded-full font-bold text-lg hover:bg-surface-container-low dark:hover:bg-[#41493e] transition-colors active:scale-95 border border-outline-variant/20 dark:border-white/10">
                View Demo
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="bg-surface-container-low dark:bg-[#1b1c1c] py-16 px-6 transition-colors duration-300">
          <motion.div 
            className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              initial: { opacity: 0 },
              whileInView: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
          >
            {[
              { stat: "1.2M+", label: "Acres Monitored" },
              { stat: "24%", label: "Revenue Increase" },
              { stat: "₹4.5B", label: "Farmer Profit" },
              { stat: "15k+", label: "Active Farmers" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={{
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
                className="text-center p-6 bg-surface-container-lowest dark:bg-[#303030] rounded-xl shadow-sm border border-transparent dark:border-white/5"
              >
                <div className="font-headline text-4xl font-extrabold text-primary dark:text-primary-fixed-dim mb-2">{item.stat}</div>
                <div className="text-on-surface-variant dark:text-[#c0c9bb] font-medium">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Precision Ecosystem Bento Grid */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <motion.div {...fadeUpConfig} className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="font-headline text-4xl font-bold mb-4 dark:text-white">Precision Ecosystem</h2>
            <p className="text-on-surface-variant dark:text-[#c0c9bb] text-lg font-body">Integrated tools designed to work together, providing a 360-degree view of your farm's performance and potential.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Card 1: Large Feature */}
            <motion.div 
              {...fadeUpConfig}
              className="md:col-span-2 md:row-span-2 bg-primary-container/10 dark:bg-primary-fixed-dim/10 rounded-xl p-8 relative overflow-hidden group border border-transparent dark:border-white/5"
            >
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-4xl mb-4">psychology</span>
                  <h3 className="text-3xl font-headline font-bold mb-2 dark:text-white">Smart Crop Recommender</h3>
                  <p className="text-on-surface-variant dark:text-[#c0c9bb] max-w-sm text-lg">Our AI analyzes soil health, weather patterns, and market demand to suggest the most profitable crops for your specific plot.</p>
                </div>
                <Link href="/tools" className="flex items-center gap-2 text-primary dark:text-primary-fixed-dim font-bold hover:gap-4 transition-all">
                  Explore Intelligence <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
              <img 
                alt="Precision Ag" 
                className="absolute right-[-10%] bottom-[-10%] w-2/3 h-2/3 object-cover rounded-tl-3xl transform group-hover:scale-105 transition-transform duration-700 opacity-60 dark:opacity-40" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvycEDLN_YRbtQlkhJIYwrBMxPzaSz5sVBDY4t7UlUw129ft_HUiyYF9g-27yFSfX7SDjdTjYMhJzqUGgDNNsg31L_enspmjN-3MzXjCrpU50N72aXjjMhF1W7NFMuNL4fXaxsZr-Vp-IpHaMOVGDiN2w5fImntJj9PNf33PxSYoJbsvanKYCXxnOVHOQliftgu-AXeh8X7sApPpp--mplwUErn6IHko4ZqVeR5e-379iox9KzYXfp3ACfazzD5xE0fPuwwGgJKg"
              />
            </motion.div>

            {/* Card 2: ROI Estimator */}
            <motion.div {...fadeUpConfig} transition={{ duration: 0.7, delay: 0.1 }} className="bg-secondary-container/20 dark:bg-secondary-fixed-dim/10 rounded-xl p-6 flex flex-col justify-between border border-transparent dark:border-white/5">
              <div>
                <span className="material-symbols-outlined text-secondary dark:text-secondary-fixed-dim text-3xl mb-3">calculate</span>
                <h3 className="text-xl font-headline font-bold mb-1 dark:text-white">ROI Estimator</h3>
                <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm">Calculate precise profit margins before you even sow the first seed.</p>
              </div>
              <div className="text-2xl font-headline font-bold text-secondary dark:text-secondary-fixed-dim">
                ₹12,400/acre <span className="text-sm font-normal text-on-surface-variant dark:text-outline-variant font-body">avg boost</span>
              </div>
            </motion.div>

            {/* Card 3: Farm Mapping */}
            <motion.div {...fadeUpConfig} transition={{ duration: 0.7, delay: 0.2 }} className="bg-surface-container-highest dark:bg-[#303030] rounded-xl p-6 relative overflow-hidden border border-transparent dark:border-white/5">
              <div className="relative z-10">
                <span className="material-symbols-outlined text-on-surface dark:text-white text-3xl mb-3">map</span>
                <h3 className="text-xl font-headline font-bold mb-1 dark:text-white">Farm Mapping</h3>
                <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm">Satellite-based boundary mapping and moisture tracking.</p>
              </div>
              <div className="absolute bottom-0 right-0 left-0 h-1/2 bg-gradient-to-t from-surface-container-highest dark:from-[#303030] to-transparent z-10"></div>
              <div className="mt-4 rounded-lg overflow-hidden h-24 bg-surface-dim dark:bg-[#1b1c1c] border border-outline-variant/20 dark:border-white/5 relative z-0">
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=60&w=300')] bg-cover opacity-40 dark:opacity-20 grayscale dark:invert"></div>
              </div>
            </motion.div>

            {/* Card 4: Community */}
            <motion.div {...fadeUpConfig} transition={{ duration: 0.7, delay: 0.3 }} className="md:col-span-1 bg-tertiary-fixed dark:bg-[#563300] rounded-xl p-6 flex flex-col justify-center items-center text-center border border-transparent dark:border-white/5">
              <div className="w-16 h-16 rounded-full bg-on-tertiary-fixed dark:bg-[#ffb866] flex items-center justify-center mb-4 shadow-inner">
                <span className="material-symbols-outlined text-tertiary-fixed dark:text-[#2b1700] text-3xl">groups</span>
              </div>
              <h3 className="text-xl font-headline font-bold mb-1 dark:text-white">AgroCommunity</h3>
              <p className="text-on-tertiary-fixed-variant dark:text-[#ffddba] text-sm mb-4">Connect with 5,000+ progressive farmers across India.</p>
              <Link href="/community" className="bg-on-tertiary-fixed dark:bg-[#ffb866] text-tertiary-fixed dark:text-[#2b1700] px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform">
                Join Now
              </Link>
            </motion.div>
          </div>
        </section>

        {/* High-Impact CTA */}
        <section className="py-24 px-6">
          <motion.div {...fadeUpConfig} className="max-w-5xl mx-auto rounded-[3rem] bg-[#00450d] overflow-hidden relative p-12 lg:p-20 text-center shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-fixed via-transparent to-transparent"></div>
            </div>
            <div className="relative z-10">
              <h2 className="font-headline text-4xl lg:text-6xl font-bold text-white mb-8 tracking-tight">Ready to Reimagine Your Yield?</h2>
              <p className="text-primary-fixed text-lg lg:text-xl max-w-2xl mx-auto mb-10 opacity-90 font-body">
                Join thousands of forward-thinking Indian farmers using AgroNxt to secure their financial future. Start your data journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="bg-primary-fixed text-[#002204] px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform active:scale-95 shadow-xl">
                  Register Your Farm
                </Link>
                <Link href="/contact" className="bg-transparent text-white border-2 border-primary-fixed px-10 py-5 rounded-full font-bold text-xl hover:bg-primary-fixed/10 transition-colors">
                  Contact an Expert
                </Link>
              </div>
              <p className="mt-8 text-white/60 text-sm font-body">No setup fees. No hidden costs. Just pure farming intelligence.</p>
            </div>
          </motion.div>
        </section>

      </main>

      {/* Modern Footer specific to Landing Page */}
      <footer className="bg-[#f6f3f2] dark:bg-[#1b1c1c] w-full rounded-t-[3rem] mt-12 transition-colors duration-300 border-t border-transparent dark:border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8 py-16 max-w-7xl mx-auto">
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-black text-[#1B5E20] dark:text-[#a3f69c] mb-4 font-headline tracking-tight">AgroNxt</div>
            <p className="font-body text-sm text-[#41493e] dark:text-[#c0c9bb] max-w-xs leading-relaxed">
              Building the digital infrastructure for the next generation of Indian agriculture.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-[#1B5E20] dark:text-[#a3f69c] mb-6 uppercase text-xs tracking-widest font-headline">Platform</h4>
            <ul className="space-y-4">
              <li><Link className="font-body text-sm text-[#41493e] dark:text-[#c0c9bb] hover:text-[#1B5E20] dark:hover:text-[#a3f69c] transition-colors" href="/about">About Us</Link></li>
              <li><Link className="font-body text-sm text-[#41493e] dark:text-[#c0c9bb] hover:text-[#1B5E20] dark:hover:text-[#a3f69c] transition-colors" href="/market">Mandi Rates</Link></li>
              <li><Link className="font-body text-sm text-[#41493e] dark:text-[#c0c9bb] hover:text-[#1B5E20] dark:hover:text-[#a3f69c] transition-colors" href="/schemes">PM Kisan Info</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#1B5E20] dark:text-[#a3f69c] mb-6 uppercase text-xs tracking-widest font-headline">Support</h4>
            <ul className="space-y-4">
              <li><Link className="font-body text-sm text-[#41493e] dark:text-[#c0c9bb] hover:text-[#1B5E20] dark:hover:text-[#a3f69c] transition-colors" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="font-body text-sm text-[#41493e] dark:text-[#c0c9bb] hover:text-[#1B5E20] dark:hover:text-[#a3f69c] transition-colors" href="/contact">Contact Support</Link></li>
              <li><Link className="font-body text-sm text-[#41493e] dark:text-[#c0c9bb] hover:text-[#1B5E20] dark:hover:text-[#a3f69c] transition-colors" href="/helpline">Farmer Helpline</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#1B5E20] dark:text-[#a3f69c] mb-6 uppercase text-xs tracking-widest font-headline">Connect</h4>
            <div className="flex gap-4">
              <button className="w-10 h-10 rounded-full bg-surface-container-highest dark:bg-[#303030] flex items-center justify-center text-[#41493e] dark:text-[#c0c9bb] hover:bg-primary-fixed hover:text-[#002204] transition-colors">
                <span className="material-symbols-outlined text-lg">share</span>
              </button>
              <button className="w-10 h-10 rounded-full bg-surface-container-highest dark:bg-[#303030] flex items-center justify-center text-[#41493e] dark:text-[#c0c9bb] hover:bg-primary-fixed hover:text-[#002204] transition-colors">
                <span className="material-symbols-outlined text-lg">mail</span>
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-outline-variant/20 dark:border-white/5 max-w-7xl mx-auto px-8 py-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-sm text-[#41493e] dark:text-[#c0c9bb] opacity-80">
            © {new Date().getFullYear()} AgroNxt Digital Agronomist. Indian Agriculture Reimagined.
          </p>
          <div className="flex items-center gap-2 text-sm text-outline dark:text-outline-variant">
            <span className="material-symbols-outlined text-sm">public</span>
            <span>English (IN)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}