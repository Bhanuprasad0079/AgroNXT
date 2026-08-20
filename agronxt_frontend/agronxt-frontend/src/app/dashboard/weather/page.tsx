"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Helper to translate Open-Meteo WMO weather codes
const getWeatherDescription = (code?: number) => {
  if (code === undefined) return { text: "Unknown", icon: "cloud", color: "text-gray-500" };
  if (code === 0) return { text: "Clear Sky", icon: "clear_day", color: "text-yellow-500" };
  if (code === 1 || code === 2 || code === 3) return { text: "Partly Cloudy", icon: "partly_cloudy_day", color: "text-gray-400 dark:text-gray-300" };
  if (code === 45 || code === 48) return { text: "Fog / Precipitation", icon: "foggy", color: "text-gray-400" };
  if (code >= 51 && code <= 67) return { text: "Drizzle / Light Rain", icon: "rainy", color: "text-blue-400" };
  if (code >= 71 && code <= 77) return { text: "Heavy Rain / Snow", icon: "heavy_rain", color: "text-blue-600 dark:text-blue-400" };
  if (code >= 80 && code <= 82) return { text: "Showers", icon: "water_drop", color: "text-blue-500" };
  if (code >= 95) return { text: "Thunderstorm", icon: "thunderstorm", color: "text-purple-600 dark:text-purple-400" };
  return { text: "Unknown", icon: "cloud", color: "text-gray-500" };
};

const getDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const getWindDirection = (degree?: number) => {
  if (degree === undefined) return "Unknown";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degree / 45) % 8];
};

const formatTime = (timeStr?: string) => {
  if (!timeStr) return "--:--";
  return new Date(timeStr).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
};

export default function WeatherPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [locationName, setLocationName] = useState("Loading...");
  const [locationCoords, setLocationCoords] = useState({ lat: 20.2961, lng: 85.8245 });

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('agronxt_token='))?.split('=')[1];
        let activeLat = locationCoords.lat;
        let activeLng = locationCoords.lng;

        if (token) {
          const profileRes = await fetch("http://localhost:8000/farm-profile", { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.status === "ok" && profileData.data.city) {
                setLocationName(profileData.data.city);
            }
          }
        }

        // 🔥 ARCHITECTURE FIX: Fetching from your Python Backend instead of directly
        const res = await fetch("http://localhost:8000/weather/advanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: activeLat, longitude: activeLng })
        });
        
        const responseData = await res.json();
        
        if (responseData.status === "ok" && responseData.data?.current) {
          setWeather(responseData.data);
        } else {
          console.error("Backend returned an error or malformed data:", responseData);
          setWeather(null);
        }
      } catch (error) {
        console.error("Failed to fetch weather from backend:", error);
        setWeather(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [locationCoords.lat, locationCoords.lng]);

  const isGoodSprayingDay = weather?.current?.wind_gusts_10m < 15;

  return (
    <main className="lg:ml-64 pt-28 pb-24 px-6 md:px-8 min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.1em] text-primary dark:text-primary-fixed-dim font-label mb-2 block">
              AgroMETEO
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface dark:text-white tracking-tight mb-2 font-headline">
              Field Conditions
            </h1>
            <p className="text-gray-500 dark:text-[#aab4aa] font-body flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">location_on</span> {locationName}
            </p>
          </div>
          
          <button 
            onClick={() => setLocationCoords({...locationCoords})}
            className="flex items-center gap-2 bg-white dark:bg-[#181c1b] px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 hover:border-[#146b34] dark:hover:border-[#86d995] transition-colors"
          >
            <span className={`material-symbols-outlined text-[#146b34] dark:text-[#86d995] ${isLoading ? 'animate-spin' : ''}`}>sync</span>
            <span className="text-sm font-bold dark:text-white">Refresh Data</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32">
            <span className="material-symbols-outlined text-[#146b34] dark:text-[#86d995] text-5xl animate-spin mb-4">progress_activity</span>
            <p className="font-bold text-gray-900 dark:text-white animate-pulse">Syncing with backend...</p>
          </div>
        ) : !weather || !weather.current ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32">
            <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
            <p className="font-bold text-gray-900 dark:text-white">Weather data unavailable.</p>
            <p className="text-sm text-gray-500 mt-2">Please check your Python backend connection.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              
              {/* --- ROW 1: CURRENT WEATHER HERO --- */}
              <div className="lg:col-span-8 bg-[#146b34] dark:bg-[#002204] rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[350px]">
                <div className="absolute -top-24 -right-24 text-[250px] opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {getWeatherDescription(weather?.current?.weather_code).icon}
                  </span>
                </div>
                
                <div>
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 inline-block border border-white/10">Current Conditions</span>
                  <div className="flex items-end gap-6 mt-4">
                    <h2 className="text-7xl md:text-9xl font-headline font-black tracking-tighter">
                      {Math.round(weather?.current?.temperature_2m || 0)}°
                    </h2>
                    <div className="pb-3 md:pb-5">
                      <span className="block text-2xl md:text-3xl font-bold opacity-90">
                        {getWeatherDescription(weather?.current?.weather_code).text}
                      </span>
                      <span className="text-sm font-body opacity-70">Feels like {Math.round(weather?.current?.apparent_temperature || 0)}°C</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">Precipitation</p>
                    <p className="font-bold text-lg">{weather?.current?.precipitation || 0} mm</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">Humidity</p>
                    <p className="font-bold text-lg">{weather?.current?.relative_humidity_2m || 0}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">Wind Speed</p>
                    <p className="font-bold text-lg">{weather?.current?.wind_speed_10m || 0} km/h</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">Observation</p>
                    <p className="font-bold text-lg">Live Data</p>
                  </div>
                </div>
              </div>

              {/* --- AGRO METRICS --- */}
              <div className="lg:col-span-4 bg-white dark:bg-[#181c1b] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 shadow-[0px_12px_32px_rgba(0,0,0,0.05)] flex flex-col justify-center">
                <h3 className="font-headline font-black text-xl text-gray-900 dark:text-white mb-6">Water Cycle</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">water_drop</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-[#aab4aa] uppercase tracking-widest">Expected Rain (Today)</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">{weather?.daily?.precipitation_sum?.[0] || 0} <span className="text-sm">mm</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">ev_shadow</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-[#aab4aa] uppercase tracking-widest">Evapotranspiration</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">{weather?.daily?.et0_fao_evapotranspiration?.[0] || 0} <span className="text-sm">mm</span></p>
                      <p className="text-[10px] text-gray-400 mt-1">Water lost to atmosphere today</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- ROW 2: FIELD OPERATIONS & SOIL DATA --- */}
              <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#181c1b] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-500">
                    <span className="material-symbols-outlined text-3xl">landscape</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Topsoil Temp (10cm)</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{weather?.current?.soil_temperature_10cm || 0}°C</p>
                    <p className="text-xs text-gray-500 mt-1">Optimal for seed germination</p>
                  </div>
                </div>

                <div className={`rounded-3xl p-6 border shadow-sm flex items-center gap-5 ${isGoodSprayingDay ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isGoodSprayingDay ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}>
                    <span className="material-symbols-outlined text-3xl">pest_control</span>
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isGoodSprayingDay ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                      Spraying Conditions
                    </p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                      {isGoodSprayingDay ? 'Optimal' : 'Caution'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Gusts at {weather?.current?.wind_gusts_10m || 0} km/h from {getWindDirection(weather?.current?.wind_direction_10m)}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#181c1b] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-500 text-lg">wb_twilight</span>
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Sunrise</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{formatTime(weather?.daily?.sunrise?.[0])}</span>
                  </div>
                  <div className="w-full h-[1px] bg-gray-100 dark:bg-white/10 my-2"></div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-500 text-lg">nights_stay</span>
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Sunset</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{formatTime(weather?.daily?.sunset?.[0])}</span>
                  </div>
                </div>
              </div>

              {/* --- ROW 3: 7-DAY FORECAST --- */}
              <div className="lg:col-span-12 bg-white dark:bg-[#181c1b] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 shadow-[0px_12px_32px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-headline font-black text-xl text-gray-900 dark:text-white">7-Day Outlook</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {weather?.daily?.time?.map((date: string, index: number) => {
                    const desc = getWeatherDescription(weather.daily.weather_code[index]);
                    return (
                      <div key={index} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-[#2d3130] border border-transparent hover:border-[#146b34]/30 transition-colors group">
                        <span className="text-sm font-bold text-gray-500 dark:text-[#aab4aa] mb-1 uppercase">
                          {index === 0 ? 'Today' : getDayName(date)}
                        </span>
                        <span className="text-xs text-gray-400 mb-4">{date.split("-").slice(1).join("/")}</span>
                        
                        <span className={`material-symbols-outlined text-4xl mb-4 group-hover:scale-110 transition-transform ${desc.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {desc.icon}
                        </span>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900 dark:text-white">{Math.round(weather.daily.temperature_2m_max[index])}°</span>
                          <span className="text-sm font-bold text-gray-400">{Math.round(weather.daily.temperature_2m_min[index])}°</span>
                        </div>

                        <div className="flex items-center gap-1 bg-blue-100/50 dark:bg-blue-900/20 px-2 py-1 rounded-md mt-auto">
                          <span className="material-symbols-outlined text-[14px] text-blue-500">water_drop</span>
                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">{weather.daily.precipitation_sum[index]}mm</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}