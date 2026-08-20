"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // REAL AUTH STATE
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // For the 3 dots

  // 🚀 ROLE CHECK
  const adminEmails = ["support.agronxt@gmail.com", "admin@agronxt.in", "akash@agronxt.in"];
  const isAdmin = user?.email ? adminEmails.includes(user.email.toLowerCase()) : false;

  useEffect(() => {
    setMounted(true);
    
    // Securely check session on load
    const token = document.cookie.split('; ').find(row => row.startsWith('agronxt_token='))?.split('=')[1];
    if (token) {
      fetch("http://localhost:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then(data => {
        setUser(data);
        setIsLoggedIn(true);
      })
      .catch(() => {
        handleSignOut();
      });
    }
  }, [pathname]);

  // 🚀 DYNAMIC NAVIGATION LINKS: Swaps Dashboard for Admin Dashboard if admin
  const topLinks = isLoggedIn 
    ? [
        { name: "Home", href: "/" },
        { name: isAdmin ? "Admin Dashboard" : "Dashboard", href: isAdmin ? "/admin" : "/dashboard" },
        { name: "Tools", href: "/tools" },
        { name: "Community", href: "/community" },
        { name: "Schemes", href: "/schemes" }
      ]
    : [
        { name: "Home", href: "/" },
        { name: "Schemes", href: "/schemes" }
      ];

  const handleSignOut = () => {
    document.cookie = "agronxt_token=; path=/; max-age=0; SameSite=Strict";
    setIsLoggedIn(false);
    setUser(null);
    setProfileOpen(false);
    setMobileMenuOpen(false);
    router.push("/login");
  };

  // LOGIC: Is the user currently anywhere inside the dashboard?
  const isDashboard = pathname?.startsWith('/dashboard');

  // LOGIC: Sidebar should ONLY show if logged in AND inside the dashboard (and not admin)
  const showSidebarAndSearch = isLoggedIn && isDashboard && !isAdmin;

  return (
    <>
      {/* 1. TOP NAVIGATION BAR (Consistently translucent across all pages) */}
      <header className="fixed top-0 w-full z-50 bg-[#f7faf8]/80 dark:bg-[#181c1b]/80 backdrop-blur-md shadow-[0px_12px_32px_rgba(24,28,27,0.04)] dark:shadow-[0px_12px_32px_rgba(0,0,0,0.3)] border-b border-transparent dark:border-white/5 transition-colors duration-300">
        <nav className="flex justify-between items-center px-8 h-20 w-full max-w-none relative">
          <div className="flex items-center gap-12">
            <Link href="/" className="text-2xl font-extrabold tracking-[-0.04em] text-[#146b34] dark:text-[#86d995] font-headline flex items-center gap-2">
              AgroNXT
              {isAdmin && <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-md uppercase tracking-widest font-bold hidden sm:inline-block">Admin</span>}
            </Link>
            
            <div className="hidden md:flex items-center gap-8 font-headline font-bold tracking-[-0.02em]">
              {topLinks.map((link) => {
                const isActive = pathname === link.href || (pathname?.startsWith(link.href) && link.href !== '/');
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`transition-colors duration-200 ${
                      isActive 
                        ? "text-[#005123] dark:text-[#86d995] border-b-2 border-[#005123] dark:border-[#86d995] pb-1"
                        : "text-[#707a6f] dark:text-[#bfc9bc] hover:text-[#005123] dark:hover:text-[#86d995]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-on-surface-variant/20 rounded-full transition-all group relative flex items-center justify-center"
                title="Toggle theme"
              >
                {mounted && theme === 'dark' ? (
                  <span className="material-symbols-outlined">light_mode</span>
                ) : (
                  <span className="material-symbols-outlined">dark_mode</span>
                )}
              </button>

              {isLoggedIn ? (
                <>
                  <button className="p-2 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-on-surface-variant/20 rounded-full transition-colors hidden sm:flex items-center justify-center">
                    <span className="material-symbols-outlined">notifications</span>
                  </button>
                  
                  {/* SETTINGS ICON (Hidden for Admins so they don't get routed incorrectly) */}
                  {!isAdmin && (
                    <Link 
                      href="/account" 
                      className="p-2 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-on-surface-variant/20 rounded-full transition-colors hidden sm:flex items-center justify-center"
                      title="Account Settings"
                    >
                      <span className="material-symbols-outlined">settings</span>
                    </Link>
                  )}
                  
                  {/* Profile Dropdown */}
                  <div className="relative hidden sm:block">
                    <button 
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="w-10 h-10 rounded-full bg-surface-container-highest dark:bg-white/10 overflow-hidden border border-transparent dark:border-white/20 focus:ring-2 focus:ring-[#86d995] transition-all flex items-center justify-center font-bold text-[#146b34] dark:text-[#86d995] uppercase"
                    >
                      {/* Dynamically show first letter of name */}
                      {user?.full_name?.charAt(0).toUpperCase() || "U"}
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1d211f] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 py-2 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 mb-2">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.full_name || "User"}</p>
                          <p className="text-xs text-gray-500 dark:text-[#aab4aa] truncate">{user?.email}</p>
                        </div>
                        <button 
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-[#ffb4ab] hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">logout</span>
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Logged Out State: Login/Register buttons */
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login" className="p-2 px-4 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-on-surface-variant/20 rounded-full transition-colors flex items-center justify-center font-bold text-sm">
                    Log in
                  </Link>
                  <Link href="/register" className="p-2 px-4 bg-[#146b34] dark:bg-[#86d995] text-white dark:text-[#005123] rounded-full transition-colors flex items-center justify-center font-bold text-sm">
                    Register
                  </Link>
                </div>
              )}

              {/* THREE DOTS MOBILE MENU (Access other pages) */}
              <div className="md:hidden relative">
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-on-surface-variant/20 rounded-full transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>

                <AnimatePresence>
                  {mobileMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1d211f] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 py-2 z-50 overflow-hidden"
                    >
                      {topLinks.map((link) => (
                        <Link 
                          key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)}
                          className="block px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 font-bold border-b border-gray-100 dark:border-white/5 last:border-0"
                        >
                          {link.name}
                        </Link>
                      ))}
                      
                      {/* Mobile Auth Actions inside 3 dots */}
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
                        {isLoggedIn ? (
                          <>
                            {/* NEW ACCOUNT & SUPPORT LINKS FOR MOBILE */}
                            <Link href="/support" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 font-bold border-b border-gray-100 dark:border-white/5">
                              <span className="material-symbols-outlined text-sm">help</span> Support
                            </Link>
                            {!isAdmin && (
                              <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 font-bold border-b border-gray-100 dark:border-white/5">
                                <span className="material-symbols-outlined text-sm">person</span> Account
                              </Link>
                            )}
                            <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-[#ffb4ab] hover:bg-red-50 dark:hover:bg-red-900/20 font-bold flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">logout</span> Sign Out
                            </button>
                          </>
                        ) : (
                          <>
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 font-bold">
                              Log in
                            </Link>
                            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm text-[#146b34] dark:text-[#86d995] hover:bg-gray-50 dark:hover:bg-white/5 font-bold">
                              Register
                            </Link>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </nav>
      </header>

      {/* 2. LEFT SIDEBAR (ONLY visible in Dashboard) */}
      {showSidebarAndSearch && (
        <aside className="hidden lg:flex flex-col p-6 space-y-4 h-screen w-64 fixed left-0 top-20 bg-[#f7faf8] dark:bg-[#181c1b] font-headline tracking-[-0.01em] border-r border-[#e0e3e1] dark:border-white/5 z-40 transition-colors duration-300">
          <div className="mb-8 px-2">
            <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline dark:text-[#aab4aa] mb-4">Management</p>
            <div className="space-y-1">
              <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:translate-x-1 ${pathname === '/dashboard' ? 'bg-white dark:bg-[#2d3130] text-primary dark:text-[#86d995] font-bold shadow-sm' : 'text-outline dark:text-[#aab4aa] hover:bg-surface-container-high dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined" style={pathname === '/dashboard' ? { fontVariationSettings: "'FILL' 1" } : {}}>dashboard</span>
                <span>Overview</span>
              </Link>
              <Link href="/dashboard/soil-health" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:translate-x-1 ${pathname?.includes('/soil-health') ? 'bg-white dark:bg-[#2d3130] text-primary dark:text-[#86d995] font-bold shadow-sm' : 'text-outline dark:text-[#aab4aa] hover:bg-surface-container-high dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">science</span>
                <span>Soil Health</span>
              </Link>
              <Link href="/dashboard/calendar" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:translate-x-1 ${pathname?.includes('/calendar') ? 'bg-white dark:bg-[#2d3130] text-primary dark:text-[#86d995] font-bold shadow-sm' : 'text-outline dark:text-[#aab4aa] hover:bg-surface-container-high dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">calendar_today</span>
                <span>Crop Calendar</span>
              </Link>
              <Link href="/dashboard/weather" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:translate-x-1 ${pathname?.includes('/weather') ? 'bg-white dark:bg-[#2d3130] text-primary dark:text-[#86d995] font-bold shadow-sm' : 'text-outline dark:text-[#aab4aa] hover:bg-surface-container-high dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">wb_sunny</span>
                <span>Weather</span>
              </Link>
              <Link href="/dashboard/analytics" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:translate-x-1 ${pathname?.includes('/analytics') ? 'bg-white dark:bg-[#2d3130] text-primary dark:text-[#86d995] font-bold shadow-sm' : 'text-outline dark:text-[#aab4aa] hover:bg-surface-container-high dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">analytics</span>
                <span>Analytics</span>
              </Link>
            </div>
          </div>
          <div className="mt-auto px-2 pb-24">
            <Link href="/support" className="flex items-center gap-3 px-4 py-3 text-outline dark:text-[#aab4aa] hover:bg-surface-container-high dark:hover:bg-white/5 rounded-xl transition-all">
              <span className="material-symbols-outlined">help</span>
              <span>Support</span>
            </Link>
            <Link href="/account" className="flex items-center gap-3 px-4 py-3 text-outline dark:text-[#aab4aa] hover:bg-surface-container-high dark:hover:bg-white/5 rounded-xl transition-all">
              <span className="material-symbols-outlined">person</span>
              <span>Account</span>
            </Link>
          </div>
        </aside>
      )}

      {/* 3. REWRITTEN MOBILE BOTTOM NAV (ONLY visible in Dashboard) */}
      {showSidebarAndSearch && (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#f7faf8]/95 dark:bg-[#0c120f]/95 backdrop-blur-xl border-t border-[#e0e3e1] dark:border-white/5 z-50 px-2 py-3 flex justify-around items-center transition-colors duration-300 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          
          <Link href="/dashboard/soil-health" className={`flex flex-col items-center gap-1 transition-colors ${pathname?.includes('soil-health') ? 'text-[#146b34] dark:text-[#86d995]' : 'text-outline dark:text-[#aab4aa]'}`}>
            <span className="material-symbols-outlined text-[24px]" style={pathname?.includes('soil-health') ? { fontVariationSettings: "'FILL' 1" } : {}}>science</span>
            <span className="text-[10px] font-bold tracking-wide"></span>
          </Link>
          
          <Link href="/dashboard/calendar" className={`flex flex-col items-center gap-1 transition-colors ${pathname?.includes('calendar') ? 'text-[#146b34] dark:text-[#86d995]' : 'text-outline dark:text-[#aab4aa]'}`}>
            <span className="material-symbols-outlined text-[24px]" style={pathname?.includes('calendar') ? { fontVariationSettings: "'FILL' 1" } : {}}>calendar_today</span>
            <span className="text-[10px] font-bold tracking-wide"></span>
          </Link>

          <Link href="/dashboard" className={`flex flex-col items-center gap-1 transition-colors ${pathname?.includes('dashboard') ? 'text-[#146b34] dark:text-[#86d995]' : 'text-outline dark:text-[#aab4aa]'}`}>
            <span className="material-symbols-outlined text-[24px]" style={pathname?.includes('calendar') ? { fontVariationSettings: "'FILL' 1" } : {}}>dashboard</span>
            <span className="text-[10px] font-bold tracking-wide"></span>
          </Link>
          
          <Link href="/dashboard/weather" className={`flex flex-col items-center gap-1 transition-colors ${pathname?.includes('weather') ? 'text-[#146b34] dark:text-[#86d995]' : 'text-outline dark:text-[#aab4aa]'}`}>
            <span className="material-symbols-outlined text-[24px]" style={pathname?.includes('weather') ? { fontVariationSettings: "'FILL' 1" } : {}}>wb_sunny</span>
            <span className="text-[10px] font-bold tracking-wide"></span>
          </Link>
          
          <Link href="/dashboard/analytics" className={`flex flex-col items-center gap-1 transition-colors ${pathname?.includes('analytics') ? 'text-[#146b34] dark:text-[#86d995]' : 'text-outline dark:text-[#aab4aa]'}`}>
            <span className="material-symbols-outlined text-[24px]" style={pathname?.includes('analytics') ? { fontVariationSettings: "'FILL' 1" } : {}}>analytics</span>
            <span className="text-[10px] font-bold tracking-wide"></span>
          </Link>

        </div>
      )}
    </>
  );
}