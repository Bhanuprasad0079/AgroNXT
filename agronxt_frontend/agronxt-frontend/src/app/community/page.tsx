"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION CONFIGS ---
const fadeUpConfig = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-50px" }, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0] as const } };
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] as const } } };

// --- DATA ARRAYS ---
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// --- INTERFACES ---
interface MandiData { id: number; state: string; mandi: string; commodity: string; min_price: number; max_price: number; modal_price: number; trend: number; update_date: string; }
interface PostData { id: number; author_id: number; author_name: string; title: string; content: string; topic: string; state: string; district: string; image_url?: string; likes_count: number; is_liked: boolean; comments_count: number; created_at: string; }
interface CommentData { id: number; author_id: number; author_name: string; content: string; created_at: string; }

// --- HELPERS ---
const getCropVisuals = (crop: string) => {
  const lower = crop.toLowerCase();
  if (lower.includes("wheat")) return { emoji: "🌾", bg: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" };
  if (lower.includes("tomato")) return { emoji: "🍅", bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" };
  if (lower.includes("rice") || lower.includes("basmati")) return { emoji: "🍚", bg: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400" };
  if (lower.includes("onion")) return { emoji: "🧅", bg: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" };
  if (lower.includes("potato")) return { emoji: "🥔", bg: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" };
  if (lower.includes("soybean")) return { emoji: "🫘", bg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" };
  if (lower.includes("cotton")) return { emoji: "☁️", bg: "bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300" };
  if (lower.includes("maize") || lower.includes("corn")) return { emoji: "🌽", bg: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" };
  if (lower.includes("sugarcane")) return { emoji: "🎋", bg: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" };
  if (lower.includes("mustard")) return { emoji: "🌼", bg: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" };
  return { emoji: "🌱", bg: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" };
};

const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr + "Z");
  const diffMins = Math.round((new Date().getTime() - date.getTime()) / 60000);
  if (diffMins < 60) return `${diffMins || 1} mins ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hours ago`;
  return `${Math.floor(diffHrs / 24)} days ago`;
};

export default function CommunityPage() {
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState<{id?: number, full_name: string} | null>(null);
  
  // Post States
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [postSearch, setPostSearch] = useState("");
  const [postStateFilter, setPostStateFilter] = useState("All States");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [postComments, setPostComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newPost, setNewPost] = useState({ title: "", content: "", topic: "General Discussion", state: "Odisha", district: "" });

  // Upload States
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 3-Dot Menus
  const [openPostMenuId, setOpenPostMenuId] = useState<number | null>(null);

  // Mandi States
  const [mandiPrices, setMandiPrices] = useState<MandiData[]>([]);
  const [mandiSearch, setMandiSearch] = useState("");
  const [mandiState, setMandiState] = useState("All States");
  const [isMandiExpanded, setIsMandiExpanded] = useState(false);

  useEffect(() => {
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('agronxt_token='))?.split('=')[1];
    
    if (cookieToken) {
      setToken(cookieToken);
      fetch("https://agronxt.onrender.com/users/me", { headers: { Authorization: `Bearer ${cookieToken}` } })
        .then(res => res.json())
        .then(data => setCurrentUser(data));

      fetch("https://agronxt.onrender.com/community/posts", { headers: { Authorization: `Bearer ${cookieToken}` } })
        .then(res => res.json())
        .then(data => { if(data.status === "ok") setPosts(data.data); setIsPostsLoading(false); });
    } else {
      setIsPostsLoading(false);
    }

    fetch("https://agronxt.onrender.com/mandi-prices")
      .then(res => res.json())
      .then(data => { if(data.status === "ok") setMandiPrices(data.data); });
  }, []);

  // --- ACTIONS ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert("Please log in to post.");
    
    const formData = new FormData();
    formData.append("title", newPost.title);
    formData.append("content", newPost.content);
    formData.append("topic", newPost.topic);
    formData.append("state", newPost.state);
    formData.append("district", newPost.district);
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      const res = await fetch("https://agronxt.onrender.com/community/posts", {
        method: "POST", 
        headers: { "Authorization": `Bearer ${token}` }, 
        body: formData
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewPost({ title: "", content: "", topic: "General Discussion", state: "Odisha", district: "" });
        setSelectedImage(null);
        setImagePreview(null);
        const fetchRes = await fetch("https://agronxt.onrender.com/community/posts", { headers: { Authorization: `Bearer ${token}` } });
        const data = await fetchRes.json();
        setPosts(data.data);
      }
    } catch (err) { console.error(err); }
  };

  const deletePost = async (postId: number) => {
    if (!confirm("Are you sure you want to permanently delete this discussion?")) return;
    try {
      const res = await fetch(`https://agronxt.onrender.com/community/posts/${postId}`, {
        method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setPosts(posts.filter(p => p.id !== postId));
    } catch (err) { console.error(err); }
  };

  const handleLike = async (postId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`https://agronxt.onrender.com/community/posts/${postId}/like`, {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: data.likes, is_liked: data.action === 'liked' } : p));
    } catch (err) { console.error(err); }
  };

  const toggleComments = async (postId: number) => {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    setPostComments([]);
    try {
      const res = await fetch(`https://agronxt.onrender.com/community/posts/${postId}/comments`);
      const data = await res.json();
      if (res.ok) setPostComments(data.data);
    } catch (err) { console.error(err); }
  };

  const submitComment = async (postId: number) => {
    if (!token || !newComment.trim()) return;
    try {
      const res = await fetch(`https://agronxt.onrender.com/community/posts/${postId}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        setNewComment("");
        const cRes = await fetch(`https://agronxt.onrender.com/community/posts/${postId}/comments`);
        const data = await cRes.json();
        setPostComments(data.data);
        setPosts(posts.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
      }
    } catch (err) { console.error(err); }
  };

  const deleteComment = async (postId: number, commentId: number) => {
    if (!confirm("Delete this reply?")) return;
    try {
      const res = await fetch(`https://agronxt.onrender.com/community/comments/${commentId}`, {
        method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setPostComments(postComments.filter(c => c.id !== commentId));
        setPosts(posts.map(p => p.id === postId ? { ...p, comments_count: p.comments_count - 1 } : p));
      }
    } catch (err) { console.error(err); }
  };

  // --- FILTERS ---
  const filteredPosts = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(postSearch.toLowerCase()) || p.topic.toLowerCase().includes(postSearch.toLowerCase());
    const matchState = postStateFilter === "All States" || p.state === postStateFilter;
    return matchSearch && matchState;
  });

  const availableStates = ["All States", ...Array.from(new Set(mandiPrices.map(item => item.state))).sort()];
  const filteredMandi = mandiPrices.filter(item => {
    return (item.commodity.toLowerCase().includes(mandiSearch.toLowerCase()) || item.mandi.toLowerCase().includes(mandiSearch.toLowerCase())) &&
           (mandiState === "All States" || item.state === mandiState);
  });
  const displayedMandi = isMandiExpanded ? filteredMandi : filteredMandi.slice(0, 5);

  return (
    <div className="bg-surface dark:bg-inverse-surface text-on-surface dark:text-white transition-colors duration-300 min-h-screen">
      
      {/* POST DISCUSSION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-surface-container-lowest dark:bg-[#1b1c1b] w-full max-w-2xl rounded-3xl p-6 md:p-8 editorial-shadow border border-white/10 z-10 max-h-[90vh] overflow-y-auto scrollbar-thin">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black font-headline text-primary dark:text-white">Create Post</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-surface-variant dark:bg-white/10 rounded-full hover:scale-110 transition-transform"><span className="material-symbols-outlined text-sm">close</span></button>
              </div>
              <form onSubmit={submitPost} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-outline uppercase tracking-widest mb-1 block">State</label>
                    <select required value={newPost.state} onChange={e => setNewPost({...newPost, state: e.target.value})} className="w-full bg-surface-container-high dark:bg-[#303030] rounded-xl px-4 py-3 font-body text-sm border-none focus:ring-2 focus:ring-primary appearance-none">
                      {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase tracking-widest mb-1 block">District</label>
                    <input required value={newPost.district} onChange={e => setNewPost({...newPost, district: e.target.value})} className="w-full bg-surface-container-high dark:bg-[#303030] rounded-xl px-4 py-3 font-body text-sm border-none focus:ring-2 focus:ring-primary" placeholder="District" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-outline uppercase tracking-widest mb-1 block">Topic</label>
                  <select value={newPost.topic} onChange={e => setNewPost({...newPost, topic: e.target.value})} className="w-full bg-surface-container-high dark:bg-[#303030] rounded-xl px-4 py-3 font-body text-sm border-none focus:ring-2 focus:ring-primary appearance-none">
                    <option>Weather Alerts</option><option>Market Trends</option><option>Pest Control</option><option>Crop Cultivation</option><option>General Discussion</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-outline uppercase tracking-widest mb-1 block">Discussion Title</label>
                  <input required value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full bg-surface-container-high dark:bg-[#303030] rounded-xl px-4 py-3 font-headline font-bold border-none focus:ring-2 focus:ring-primary" placeholder="What's your question or insight?" />
                </div>
                
                {/* REAL FILE UPLOAD BOX */}
                <div>
                  <label className="text-xs font-bold text-outline uppercase tracking-widest mb-1 block">Attach Photo (Optional)</label>
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-outline-variant/30 dark:border-white/10 rounded-xl cursor-pointer hover:bg-surface-container dark:hover:bg-white/5 transition-colors relative overflow-hidden group">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full">Change Photo</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-outline dark:text-[#c0c9bb]">
                        <span className="material-symbols-outlined text-3xl mb-2">image</span>
                        <span className="text-sm font-bold font-body">Click to upload photo</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {imagePreview && (
                    <div className="flex justify-end mt-2">
                      <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="text-xs text-error font-bold font-body hover:underline">
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-outline uppercase tracking-widest mb-1 block">Details</label>
                  <textarea required value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} rows={4} className="w-full bg-surface-container-high dark:bg-[#303030] rounded-xl px-4 py-3 font-body text-sm border-none focus:ring-2 focus:ring-primary resize-none" placeholder="Share more details with the community..."></textarea>
                </div>
                <button type="submit" className="w-full py-4 bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] font-bold font-headline rounded-xl shadow-lg hover:scale-[1.02] transition-transform mt-4">
                  Publish to Feed
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: COMMUNITY FEED */}
          <motion.section className="lg:col-span-7 space-y-6" variants={containerVariants} initial="hidden" animate="show">
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-headline font-black text-on-surface dark:text-white tracking-tight mb-2">Farmer Community</h1>
                <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm font-body">Connect with 50,000+ progressive farmers nationwide</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] px-6 py-3 rounded-full font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-sm">add_circle</span> Post Discussion
              </button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-4 mb-8">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline dark:text-outline-variant text-sm">search</span>
                <input value={postSearch} onChange={e => setPostSearch(e.target.value)} type="text" placeholder="Search discussions or topics..." className="w-full bg-surface-container-lowest dark:bg-[#303030] border border-outline-variant/10 dark:border-white/5 rounded-full pl-11 pr-4 py-3 text-sm font-body text-on-surface dark:text-white focus:ring-2 focus:ring-primary transition-all shadow-sm" />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center">
                {["All States", "Odisha", "Punjab", "Haryana", "Maharashtra"].map(state => (
                  <button key={state} onClick={() => setPostStateFilter(state)} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap font-label uppercase tracking-widest transition-colors shrink-0 ${postStateFilter === state ? "bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] shadow-sm" : "bg-surface-container-highest dark:bg-[#303030] text-on-surface-variant dark:text-[#c0c9bb] hover:bg-surface-variant dark:hover:bg-[#41493e] border border-transparent dark:border-white/5"}`}>
                    {state}
                  </button>
                ))}
                
                <div className="relative shrink-0">
                  <select value={postStateFilter} onChange={e => setPostStateFilter(e.target.value)} className={`px-5 pl-4 pr-8 py-2 rounded-full text-xs font-bold whitespace-nowrap font-label uppercase tracking-widest transition-colors cursor-pointer appearance-none border ${!["All States", "Odisha", "Punjab", "Haryana", "Maharashtra"].includes(postStateFilter) ? "bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] border-transparent shadow-sm" : "bg-surface-container-highest dark:bg-[#303030] text-on-surface-variant dark:text-[#c0c9bb] hover:bg-surface-variant dark:hover:bg-[#41493e] border-transparent dark:border-white/5"}`}>
                    <option value="All States" className="hidden">More States</option>
                    {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none opacity-70">expand_more</span>
                </div>
              </div>
            </motion.div>

            {isPostsLoading ? (
               <div className="py-20 flex justify-center"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-lowest dark:bg-[#303030] rounded-[2rem] border border-white/5 text-outline">
                <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                <p className="font-bold">No discussions found.</p>
                <p className="text-sm">Be the first to start a conversation!</p>
              </div>
            ) : (
              filteredPosts.map(post => {
                const isAuthor = currentUser ? (post.author_id == currentUser.id || post.author_name === currentUser.full_name) : false;

                return (
                  <motion.article key={post.id} variants={itemVariants} className="bg-surface-container-lowest dark:bg-[#303030] p-6 md:p-8 rounded-[2rem] editorial-shadow border border-transparent dark:border-white/5 transition-all duration-300 hover:border-primary/20 dark:hover:border-primary-fixed/30 relative z-10">
                    <div className="flex gap-4 sm:gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-secondary dark:bg-[#146b34] text-white flex items-center justify-center font-black text-xl shrink-0 uppercase shadow-inner">
                        {post.author_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold font-headline text-on-surface dark:text-white text-lg truncate pr-2">{post.author_name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="bg-secondary-container/50 dark:bg-secondary-fixed/20 text-secondary dark:text-secondary-fixed text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest font-label shrink-0">{post.state}</span>
                            
                            {/* FIXED 3-DOT MENU FOR POST */}
                            {isAuthor && (
                              <div className="relative">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setOpenPostMenuId(openPostMenuId === post.id ? null : post.id); }} 
                                  className="p-1 text-outline hover:text-primary transition-colors rounded-full hover:bg-white/5"
                                >
                                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                </button>
                                
                                {/* Invisible Full-Screen Overlay to close the menu when clicking away */}
                                {openPostMenuId === post.id && (
                                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenPostMenuId(null); }} />
                                )}
                                
                                <AnimatePresence>
                                  {openPostMenuId === post.id && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 mt-1 w-32 bg-surface-container-high dark:bg-[#1b1c1b] rounded-xl shadow-xl border border-outline-variant/10 dark:border-white/5 z-50 overflow-hidden editorial-shadow">
                                      <button onClick={(e) => { e.stopPropagation(); deletePost(post.id); setOpenPostMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error-container/20 font-bold flex items-center gap-2 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-on-surface-variant dark:text-[#c0c9bb] text-xs mb-3 font-body">{timeAgo(post.created_at)} • {post.topic}</p>
                        <h4 className="text-xl font-headline font-bold text-on-surface dark:text-white mb-2 leading-tight">{post.title}</h4>
                        <p className="text-on-surface-variant dark:text-[#c0c9bb] text-sm leading-relaxed mb-4 font-body whitespace-pre-wrap">{post.content}</p>
                        
                        {/* ATTACHED IMAGE VIEW */}
                        {post.image_url && (
                          <div className="mb-6 rounded-[1.5rem] overflow-hidden aspect-video relative border border-outline-variant/10 dark:border-white/5 bg-surface-container dark:bg-[#1b1c1b]">
                            <img alt="Post Attachment" className="w-full h-full object-contain hover:scale-105 transition-transform duration-700 dark:brightness-90" src={post.image_url} onError={(e) => e.currentTarget.style.display = 'none'} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 sm:gap-6 border-t border-outline-variant/10 dark:border-white/5 pt-4">
                          <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1.5 sm:gap-2 transition-colors active:scale-110 ${post.is_liked ? "text-primary dark:text-[#86d995]" : "text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed"}`}>
                            <span className="material-symbols-outlined text-lg" style={post.is_liked ? { fontVariationSettings: "'FILL' 1" } : {}}>thumb_up</span>
                            <span className="text-sm font-bold">{post.likes_count}</span>
                          </button>
                          <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 sm:gap-2 text-on-surface-variant dark:text-[#c0c9bb] hover:text-primary dark:hover:text-primary-fixed transition-colors">
                            <span className="material-symbols-outlined text-lg">chat_bubble</span>
                            <span className="text-sm font-bold">{post.comments_count}</span>
                          </button>
                        </div>

                        {/* COMMENTS WRAPPER */}
                        <AnimatePresence>
                          {expandedPost === post.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="pt-6 mt-4 border-t border-outline-variant/10 dark:border-white/5 space-y-4">
                                {postComments.length === 0 ? (
                                  <p className="text-xs text-outline italic text-center">No replies yet.</p>
                                ) : (
                                  postComments.map(c => {
                                    const isCommentAuthor = currentUser ? (c.author_id == currentUser.id || c.author_name === currentUser.full_name) : false;

                                    return (
                                      <div key={c.id} className="bg-surface-container-high dark:bg-[#1b1c1b] p-4 rounded-2xl group relative">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="font-bold text-sm dark:text-white font-headline">{c.author_name}</span>
                                          <div className="flex items-center gap-1 relative">
                                            <span className="text-[10px] text-outline mr-1">{timeAgo(c.created_at)}</span>
                                            
                                            {/* INLINE DELETE FOR COMMENT (Fixes clipping issue entirely) */}
                                            {isCommentAuthor && (
                                              <button onClick={(e) => { e.stopPropagation(); deleteComment(post.id, c.id); }} className="text-outline hover:text-error transition-colors flex items-center justify-center p-1 rounded-full opacity-0 group-hover:opacity-100" title="Delete Reply">
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm text-on-surface-variant dark:text-[#c0c9bb] font-body">{c.content}</p>
                                      </div>
                                    );
                                  })
                                )}
                                <div className="flex gap-2 pt-2">
                                  <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitComment(post.id)} placeholder="Write a reply..." className="flex-1 bg-surface-container-high dark:bg-[#1b1c1b] rounded-full px-4 text-sm font-body border-none focus:ring-1 focus:ring-primary" />
                                  <button onClick={() => submitComment(post.id)} className="w-10 h-10 rounded-full bg-primary dark:bg-primary-fixed text-on-primary dark:text-[#002204] flex items-center justify-center shrink-0 hover:scale-105">
                                    <span className="material-symbols-outlined text-sm">send</span>
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.article>
                );
              })
            )}
          </motion.section>

          {/* RIGHT: MARKET MANDI PRICES */}
          <aside className="lg:col-span-5">
            <div className="sticky top-28 space-y-8">
              <motion.div {...fadeUpConfig} className="bg-surface-container-low dark:bg-[#1b1c1c] rounded-[2rem] p-6 sm:p-8 editorial-shadow border border-outline-variant/10 dark:border-white/5 flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <h2 className="text-2xl font-black font-headline text-on-surface dark:text-white tracking-tight">Mandi Prices</h2>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-secondary dark:text-secondary-fixed bg-secondary-container/40 dark:bg-secondary-fixed/10 px-3 py-1.5 rounded-full font-label uppercase tracking-widest border border-secondary/20 dark:border-secondary-fixed/20 shrink-0">
                    <span className="w-1.5 h-1.5 bg-secondary dark:bg-secondary-fixed rounded-full animate-pulse"></span> LIVE
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant dark:text-[#c0c9bb] font-body mb-6 shrink-0">All prices are in <strong className="text-primary dark:text-primary-fixed-dim">₹ per Quintal (100 kg)</strong></p>

                <div className="grid grid-cols-2 gap-3 mb-6 shrink-0">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline dark:text-[#c0c9bb] text-sm">search</span>
                    <input value={mandiSearch} onChange={(e) => setMandiSearch(e.target.value)} className="w-full bg-surface-container-lowest dark:bg-[#303030] border border-outline-variant/20 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-body text-on-surface dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-primary-fixed-dim transition-all" placeholder="Search..." type="text" />
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline dark:text-[#c0c9bb] text-sm">location_on</span>
                    <select value={mandiState} onChange={(e) => setMandiState(e.target.value)} className="w-full bg-surface-container-lowest dark:bg-[#303030] border border-outline-variant/20 dark:border-white/10 rounded-xl pl-10 pr-8 py-3 text-sm font-body text-on-surface dark:text-white focus:ring-2 focus:ring-primary appearance-none cursor-pointer">
                      <option value="All States">All States</option>
                      {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline dark:text-[#c0c9bb] text-sm pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] font-black text-on-surface-variant dark:text-[#c0c9bb] uppercase tracking-widest font-label shrink-0">
                  <span className="col-span-5">Crop</span><span className="col-span-2 text-right">Min</span><span className="col-span-2 text-right">Max</span><span className="col-span-3 text-right">Trend</span>
                </div>

                <div className={`space-y-2 pr-2 overflow-y-auto transition-all duration-500 ${isMandiExpanded ? "flex-1 min-h-[300px] scrollbar-thin" : ""}`}>
                  {displayedMandi.map((item) => {
                    const visual = getCropVisuals(item.commodity);
                    const pseudoPercent = ((item.id % 5) + 0.8).toFixed(1);
                    return (
                      <div key={item.id} className="grid grid-cols-12 items-center gap-1 sm:gap-2 bg-surface-container-lowest dark:bg-[#303030] px-3 sm:px-5 py-3 sm:py-4 rounded-2xl shadow-sm hover:scale-[1.02] transition-transform cursor-pointer border border-transparent dark:border-white/5 group relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface dark:bg-white text-inverse-on-surface dark:text-[#181c1b] px-3 py-1 text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {item.mandi}, {item.state}
                        </div>
                        <div className="col-span-5 flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${visual.bg} flex items-center justify-center shrink-0`}><span className="text-xs sm:text-sm">{visual.emoji}</span></div>
                          <span className="text-xs sm:text-sm font-bold text-on-surface dark:text-white font-headline truncate pr-1">{item.commodity}</span>
                        </div>
                        <span className="col-span-2 text-right text-xs sm:text-sm font-bold text-on-surface dark:text-white font-body truncate">₹{item.min_price}</span>
                        <span className="col-span-2 text-right text-xs sm:text-sm font-bold text-on-surface dark:text-white font-body truncate">₹{item.max_price}</span>
                        <div className="col-span-3 flex justify-end items-center gap-0.5 sm:gap-1">
                          {item.trend === 1 && <><span className="material-symbols-outlined text-[16px] sm:text-lg text-[#146b34] dark:text-[#86d995]">trending_up</span><span className="text-[9px] sm:text-[10px] font-bold font-body text-[#146b34] dark:text-[#86d995]">+{pseudoPercent}%</span></>}
                          {item.trend === -1 && <><span className="material-symbols-outlined text-[16px] sm:text-lg text-error dark:text-red-400">trending_down</span><span className="text-[9px] sm:text-[10px] font-bold font-body text-error dark:text-red-400">-{pseudoPercent}%</span></>}
                          {item.trend === 0 && <><span className="material-symbols-outlined text-[16px] sm:text-lg text-outline">horizontal_rule</span><span className="text-[9px] sm:text-[10px] font-bold font-body text-outline">0.0%</span></>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isPostsLoading && filteredMandi.length > 5 && (
                  <button onClick={() => setIsMandiExpanded(!isMandiExpanded)} className="w-full mt-6 py-4 shrink-0 text-xs font-black text-primary dark:text-primary-fixed bg-surface-container-highest dark:bg-[#303030] rounded-xl flex items-center justify-center gap-2">
                    {isMandiExpanded ? "Show Less" : `View ${filteredMandi.length - 5} More Mandis`} <span className={`material-symbols-outlined text-sm transition-transform ${isMandiExpanded ? "rotate-180" : ""}`}>expand_more</span>
                  </button>
                )}
              </motion.div>
            </div>
          </aside>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-surface-container-low dark:bg-[#1b1c1c] w-full py-12 px-6 md:px-8 border-t border-outline-variant/20 dark:border-white/5 transition-colors duration-300 mt-12">
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