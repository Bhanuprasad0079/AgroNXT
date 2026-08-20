// // src/app/dashboard/layout.tsx
// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useTheme } from "next-themes";
// import { useEffect, useState } from "react";

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const { theme, setTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);
//   const pathname = usePathname();

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   const menuItems = [
//     { name: "Overview", icon: "dashboard", href: "/dashboard", fill: true },
//     { name: "Soil Health", icon: "grass", href: "/dashboard/soil-health", fill: false },
//     { name: "Crop Calendar", icon: "calendar_today", href: "/dashboard/calendar", fill: false },
//     { name: "Weather", icon: "wb_sunny", href: "/dashboard/weather", fill: false },
//     { name: "Analytics", icon: "analytics", href: "/dashboard/analytics", fill: false },
//   ];

//   return (
//     <>
//       <style dangerouslySetInnerHTML={{__html: `
//         .asymmetric-mask { clip-path: polygon(0 0, 100% 0, 100% 100%, 2rem 100%); }
//         .dark .map-overlay { background: rgba(13, 18, 17, 0.85); }
//       `}} />

//       {/* Top Navigation Shell */}
//       <header className="fixed top-0 w-full z-50 bg-[#f7faf8]/80 dark:bg-[#0d1211]/80 backdrop-blur-md shadow-[0px_12px_32px_rgba(24,28,27,0.04)] dark:shadow-[0px_12px_32px_rgba(0,0,0,0.3)]">
        
//       </header>

//       {/* Sidebar Navigation Shell */}
//       <aside className="hidden lg:flex flex-col p-6 space-y-4 h-screen w-64 fixed left-0 top-20 bg-surface-container-low dark:bg-[#181c1b] font-headline tracking-[-0.01em] border-r border-outline-variant/10">
//         <div className="mb-8 px-2">
//           <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline dark:text-outline-variant mb-4">Management</p>
//           <div className="space-y-1">
//             {menuItems.map((item) => {
//               const isActive = pathname === item.href;
//               return (
//                 <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:translate-x-1 ${isActive ? "bg-white dark:bg-[#2d3130] text-primary dark:text-[#86d995] font-bold shadow-sm" : "text-outline dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-[#2d3130]"}`}>
//                   <span className="material-symbols-outlined" style={isActive && item.fill ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
//                   <span>{item.name}</span>
//                 </Link>
//               );
//             })}
//           </div>
//         </div>
//         <div className="mt-auto px-2 pb-24">
//           <Link href="/dashboard/support" className="flex items-center gap-3 px-4 py-3 text-outline dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-[#2d3130] rounded-xl transition-all">
//             <span className="material-symbols-outlined">help</span>
//             <span>Support</span>
//           </Link>
//           <Link href="/dashboard/account" className="flex items-center gap-3 px-4 py-3 text-outline dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-[#2d3130] rounded-xl transition-all">
//             <span className="material-symbols-outlined">person</span>
//             <span>Account</span>
//           </Link>
//         </div>
//       </aside>

//       {/* Dynamic Page Content Injected Here */}
//       {children}

//       {/* Footer Shell */}
//       <footer className="bg-surface-container-low dark:bg-[#0d1211] w-full py-12 px-8 border-t border-outline-variant/20 dark:border-outline-variant/5 mt-12 transition-colors duration-300">
//         <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-7xl mx-auto">
//           <div className="space-y-2 text-center md:text-left">
//             <span className="font-headline font-bold text-[#146b34] dark:text-[#86d995] text-xl">AgroNXT</span>
//             <p className="font-body text-sm text-outline dark:text-outline-variant tracking-wide">© {new Date().getFullYear()} AgroNXT. Precision for the Modern Cultivator.</p>
//           </div>
//           <div className="flex flex-wrap justify-center gap-8 font-body text-sm tracking-wide">
//             <Link href="/privacy" className="text-outline dark:text-outline-variant uppercase text-[0.75rem] tracking-[0.05em] hover:text-primary dark:hover:text-[#86d995] transition-colors">Privacy Policy</Link>
//             <Link href="/terms" className="text-outline dark:text-outline-variant uppercase text-[0.75rem] tracking-[0.05em] hover:text-primary dark:hover:text-[#86d995] transition-colors">Terms of Service</Link>
//             <Link href="/sustainability" className="text-outline dark:text-outline-variant uppercase text-[0.75rem] tracking-[0.05em] hover:text-primary dark:hover:text-[#86d995] transition-colors">Sustainability Report</Link>
//             <Link href="/contact" className="text-outline dark:text-outline-variant uppercase text-[0.75rem] tracking-[0.05em] hover:text-primary dark:hover:text-[#86d995] transition-colors">Contact</Link>
//           </div>
//         </div>
//       </footer>
//     </>
//   );
// }


// src/app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { name: "Overview", icon: "dashboard", href: "/dashboard", fill: true },
    { name: "Soil Health", icon: "grass", href: "/dashboard/soil-health", fill: false },
    { name: "Crop Calendar", icon: "calendar_today", href: "/dashboard/calendar", fill: false },
    { name: "Weather", icon: "wb_sunny", href: "/dashboard/weather", fill: false },
    { name: "Analytics", icon: "analytics", href: "/dashboard/analytics", fill: false },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .asymmetric-mask { clip-path: polygon(0 0, 100% 0, 100% 100%, 2rem 100%); }
        .dark .map-overlay { background: rgba(13, 18, 17, 0.85); }
      `}} />

      {/* Top Navigation Shell */}
      <header className="fixed top-0 w-full z-50 bg-[#f7faf8]/80 dark:bg-[#0d1211]/80 backdrop-blur-md shadow-[0px_12px_32px_rgba(24,28,27,0.04)] dark:shadow-[0px_12px_32px_rgba(0,0,0,0.3)]">
        
      </header>

      {/* Sidebar Navigation Shell */}
      <aside className="hidden lg:flex flex-col p-6 space-y-4 h-screen w-64 fixed left-0 top-20 bg-surface-container-low dark:bg-[#181c1b] font-headline tracking-[-0.01em] border-r border-outline-variant/10">
        <div className="mb-8 px-2">
          <p className="text-xs font-bold uppercase tracking-[0.05em] text-outline dark:text-outline-variant mb-4">Management</p>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:translate-x-1 ${isActive ? "bg-white dark:bg-[#2d3130] text-primary dark:text-[#86d995] font-bold shadow-sm" : "text-outline dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-[#2d3130]"}`}>
                  <span className="material-symbols-outlined" style={isActive && item.fill ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="mt-auto px-2 pb-24">
          {/* 🚀 BRUTE FORCE ROUTING: Bypasses Next.js router entirely using window.location.href */}
          <button onClick={() => window.location.href = '/dashboard/support'} className="w-full flex items-center gap-3 px-4 py-3 text-outline dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-[#2d3130] rounded-xl transition-all text-left">
            <span className="material-symbols-outlined">help</span>
            <span>Support</span>
          </button>
          <button onClick={() => window.location.href = '/dashboard/accounts'} className="w-full flex items-center gap-3 px-4 py-3 text-outline dark:text-outline-variant hover:bg-surface-container-high dark:hover:bg-[#2d3130] rounded-xl transition-all text-left">
            <span className="material-symbols-outlined">person</span>
            <span>Account</span>
          </button>
        </div>
      </aside>

      {/* Dynamic Page Content Injected Here */}
      {children}

      {/* Footer Shell */}
      <footer className="bg-surface-container-low dark:bg-[#0d1211] w-full py-12 px-8 border-t border-outline-variant/20 dark:border-outline-variant/5 mt-12 transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-7xl mx-auto">
          <div className="space-y-2 text-center md:text-left">
            <span className="font-headline font-bold text-[#146b34] dark:text-[#86d995] text-xl">AgroNXT</span>
            <p className="font-body text-sm text-outline dark:text-outline-variant tracking-wide">© {new Date().getFullYear()} AgroNXT. Precision for the Modern Cultivator.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 font-body text-sm tracking-wide">
            <Link href="/privacy" className="text-outline dark:text-outline-variant uppercase text-[0.75rem] tracking-[0.05em] hover:text-primary dark:hover:text-[#86d995] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-outline dark:text-outline-variant uppercase text-[0.75rem] tracking-[0.05em] hover:text-primary dark:hover:text-[#86d995] transition-colors">Terms of Service</Link>
            <Link href="/sustainability" className="text-outline dark:text-outline-variant uppercase text-[0.75rem] tracking-[0.05em] hover:text-primary dark:hover:text-[#86d995] transition-colors">Sustainability Report</Link>
            <Link href="/contact" className="text-outline dark:text-outline-variant uppercase text-[0.75rem] tracking-[0.05em] hover:text-primary dark:hover:text-[#86d995] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </>
  );
}