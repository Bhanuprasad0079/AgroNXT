"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Helper to grab the secure token cookie
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total_users: 0, total_posts: 0, total_acres_tracked: 0 });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = getCookie("agronxt_token");
      if (!token) return router.push("/login");

      try {
        // 1. Verify this is the admin
        const meRes = await fetch("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!meRes.ok) throw new Error("Not authorized");
        
        const meData = await meRes.json();
        
        // 🚀 BULLETPROOF BOUNCER
        const adminEmails = [
          "admin@agronxt.in", 
          "akash@agronxt.in", 
          "support.agronxt@gmail.com" // Your email is officially here!
        ];
        
        // Clean the email from the database to remove accidental spaces or caps
        const cleanUserEmail = meData.email ? meData.email.trim().toLowerCase() : "";
        
        if (!adminEmails.includes(cleanUserEmail)) {
          console.warn("🚨 Bouncer kicked out:", cleanUserEmail); // Tells us if the DB has a weird typo
          return router.push("/dashboard"); 
        }

        // 2. Fetch Stats
        const statsRes = await fetch("http://localhost:8000/admin/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats(s.data);
        }

        // 3. Fetch User Directory
        const usersRes = await fetch("http://localhost:8000/admin/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const u = await usersRes.json();
          setUsers(u.data);
        }

      } catch (err) {
        console.error("Admin fetch error:", err);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7faf8] dark:bg-[#0c120f]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#146b34] dark:text-[#86d995]">sync</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf8] dark:bg-[#0c120f] pt-28 pb-24 px-6 md:px-12 font-body text-on-surface dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-10">
          <span className="text-[#146b34] dark:text-[#86d995] font-label text-[0.75rem] uppercase tracking-[0.05em] font-bold">System Overview</span>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight mt-2 mb-2 text-gray-900 dark:text-white">Admin Control Center</h1>
          <p className="text-gray-600 dark:text-[#aab4aa]">Monitor platform health, user registrations, and community activity.</p>
        </motion.div>

        {/* Analytics KPIs */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <div className="bg-white dark:bg-[#181c1b] p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden">
            <span className="material-symbols-outlined text-5xl absolute -bottom-2 -right-2 text-[#146b34]/10 dark:text-[#86d995]/10">groups</span>
            <p className="text-sm font-bold text-gray-500 dark:text-[#aab4aa] uppercase tracking-widest mb-2">Total Users</p>
            <p className="text-5xl font-headline font-black text-[#146b34] dark:text-white">{stats.total_users}</p>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white dark:bg-[#181c1b] p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden">
            <span className="material-symbols-outlined text-5xl absolute -bottom-2 -right-2 text-[#146b34]/10 dark:text-[#86d995]/10">forum</span>
            <p className="text-sm font-bold text-gray-500 dark:text-[#aab4aa] uppercase tracking-widest mb-2">Community Posts</p>
            <p className="text-5xl font-headline font-black text-[#146b34] dark:text-white">{stats.total_posts}</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-[#181c1b] p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden">
            <span className="material-symbols-outlined text-5xl absolute -bottom-2 -right-2 text-[#146b34]/10 dark:text-[#86d995]/10">landscape</span>
            <p className="text-sm font-bold text-gray-500 dark:text-[#aab4aa] uppercase tracking-widest mb-2">Acres Tracked</p>
            <p className="text-5xl font-headline font-black text-[#146b34] dark:text-white">{stats.total_acres_tracked}</p>
          </div>
        </motion.div>

        {/* User Directory Table */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white dark:bg-[#181c1b] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#2d3130]/30 flex justify-between items-center">
            <h2 className="text-xl font-headline font-bold text-gray-900 dark:text-white">Registered Farmers Directory</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-[#181c1b] text-xs uppercase tracking-widest text-gray-500 dark:text-[#aab4aa] border-b border-gray-200 dark:border-white/5">
                  <th className="p-4 font-bold">ID</th>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Contact</th>
                  <th className="p-4 font-bold">Location</th>
                  <th className="p-4 font-bold">Farm Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#2d3130]/30 transition-colors">
                    <td className="p-4 font-mono text-sm text-gray-500 dark:text-[#aab4aa]">#{u.id}</td>
                    <td className="p-4 font-bold text-sm text-gray-900 dark:text-white">
                      {u.name}
                      {["admin@agronxt.in", "akash@agronxt.in", "support.agronxt@gmail.com"].includes(u.email.toLowerCase().trim()) && (
                        <span className="ml-2 text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-md uppercase tracking-widest">Admin</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span>{u.email}</span>
                        <span className="text-gray-500 dark:text-[#aab4aa] text-xs">{u.phone}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-[#aab4aa] flex items-center gap-1">
                       <span className="material-symbols-outlined text-[14px]">location_on</span> {u.state !== "N/A" && u.state !== "" ? u.state : "Not Provided"}
                    </td>
                    <td className="p-4 text-sm font-bold text-[#146b34] dark:text-[#86d995]">
                      {u.farm_size} Acres
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-[#aab4aa] text-sm">No users registered yet.</div>
            )}
          </div>
        </motion.div>

      </div>
    </main>
  );
}