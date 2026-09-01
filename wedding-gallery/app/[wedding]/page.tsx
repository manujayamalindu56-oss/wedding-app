"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// --- Premium Themes Configuration ---
const THEMES: Record<string, any> = {
  pink: { main: 'bg-pink-500', text: 'text-pink-600', bgLight: 'bg-pink-50', border: 'border-pink-200', iconBg: 'bg-pink-100', outline: 'focus:border-pink-500', borderMain: 'border-pink-500', fill: '#ec4899', stroke: '#fdf2f8' },
  gold: { main: 'bg-yellow-500', text: 'text-yellow-700', bgLight: 'bg-yellow-50', border: 'border-yellow-200', iconBg: 'bg-yellow-100', outline: 'focus:border-yellow-500', borderMain: 'border-yellow-500', fill: '#eab308', stroke: '#fefce8' },
  emerald: { main: 'bg-emerald-500', text: 'text-emerald-600', bgLight: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', outline: 'focus:border-emerald-500', borderMain: 'border-emerald-500', fill: '#10b981', stroke: '#ecfdf5' },
  blue: { main: 'bg-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', outline: 'focus:border-blue-500', borderMain: 'border-blue-500', fill: '#3b82f6', stroke: '#eff6ff' },
  purple: { main: 'bg-purple-500', text: 'text-purple-600', bgLight: 'bg-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-100', outline: 'focus:border-purple-500', borderMain: 'border-purple-500', fill: '#a855f7', stroke: '#faf5ff' },
  black: { main: 'bg-gray-900', text: 'text-gray-900', bgLight: 'bg-gray-100', border: 'border-gray-300', iconBg: 'bg-gray-200', outline: 'focus:border-gray-900', borderMain: 'border-gray-900', fill: '#111827', stroke: '#f3f4f6' },
  maroon: { main: 'bg-[#800000]', text: 'text-[#800000]', bgLight: 'bg-[#800000]/10', border: 'border-[#800000]/30', iconBg: 'bg-[#800000]/20', outline: 'focus:border-[#800000]', borderMain: 'border-[#800000]', fill: '#800000', stroke: '#fdf2f8' }
};

// -------------------------------------------------------------
// Guest Splash Screen Component
// -------------------------------------------------------------
const GuestSplashScreen = ({ onFinish, coupleNames, weddingDate, theme }: any) => {
  const [walk, setWalk] = useState(false);
  const [showNames, setShowNames] = useState(false);

  useEffect(() => {
    const walkTimer = setTimeout(() => setWalk(true), 100);
    const nameTimer = setTimeout(() => setShowNames(true), 1600);
    const redirectTimer = setTimeout(() => onFinish(), 5000);
    return () => { clearTimeout(walkTimer); clearTimeout(nameTimer); clearTimeout(redirectTimer); };
  }, [onFinish]);

  const nameParts = coupleNames ? coupleNames.split("&") : ["Groom", "Bride"];
  const name1 = nameParts[0]?.trim() || "Groom";
  const name2 = nameParts[1]?.trim() || "Bride";

  return (
    <div className={`min-h-screen ${theme.bgLight} flex flex-col items-center justify-center font-sans overflow-hidden transition-colors duration-500`}>
      <div className="relative w-full max-w-sm h-72 flex items-center justify-center">
        <div className={`absolute left-0 top-16 w-32 h-32 flex items-center justify-center transition-all duration-[1500ms] ease-out ${walk ? "translate-x-12 opacity-100" : "-translate-x-16 opacity-0"}`}>
          <img src="/groom.png" alt="Groom" className={`w-full h-full object-contain transition-opacity duration-1000 ${showNames ? "opacity-0" : "opacity-100"}`} />
        </div>
        <div className={`absolute right-0 bottom-16 w-32 h-32 flex items-center justify-center transition-all duration-[1500ms] ease-out ${walk ? "-translate-x-12 opacity-100" : "translate-x-16 opacity-0"}`}>
          <img src="/bride.png" alt="Bride" className={`w-full h-full object-contain transition-opacity duration-1000 ${showNames ? "opacity-0" : "opacity-100"}`} />
        </div>
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out ${showNames ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
          <div className="flex flex-col w-full max-w-[260px] z-10">
            <div className="self-start text-left pl-2 mb-2">
              <span className="text-4xl md:text-5xl font-serif font-bold text-gray-800 drop-shadow-sm leading-none">{name1}</span>
            </div>
            <div className="self-center my-1">
              <span className={`text-[3.5rem] ${theme.text} italic drop-shadow-sm leading-none transition-colors duration-500`}>&</span>
            </div>
            <div className="self-end text-right pr-2 mt-2">
              <span className="text-4xl md:text-5xl font-serif font-bold text-gray-800 drop-shadow-sm leading-none">{name2}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={`mt-12 transition-all duration-1000 ${showNames ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
        <p className={`text-xl text-gray-500 font-bold tracking-[0.35em] bg-white/60 px-4 py-1.5 rounded-full shadow-sm border ${theme.border} transition-colors duration-500`}>
          {weddingDate || "Wedding Date"}
        </p>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Main Welcome Page Component
// -------------------------------------------------------------
export default function WeddingWelcomePage() {
  const params = useParams();
  const router = useRouter();
  const weddingSlug = params.wedding as string;

  const [weddingInfo, setWeddingInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [showSplash, setShowSplash] = useState(false);
  
  // Theme State
  const [activeTheme, setActiveTheme] = useState<any>(THEMES.pink);

  useEffect(() => {
    if (!weddingSlug) return;
    
    // Initial fetch
    const fetchWedding = async () => {
      const { data } = await supabase.from('weddings').select('*').eq('slug', weddingSlug).single();
      if (data) {
        setWeddingInfo(data);
        setActiveTheme(THEMES[data.theme_color] || THEMES.pink);
        setShowSplash(true); 
      }
      setIsLoading(false);
    };
    fetchWedding();

    // Live sync for theme change
    const realtimeSub = supabase
      .channel('welcome-theme-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'weddings' }, (payload) => {
        if (payload.new.slug === weddingSlug) {
          setActiveTheme(THEMES[payload.new.theme_color] || THEMES.pink);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(realtimeSub); };
  }, [weddingSlug]);

  useEffect(() => {
    const savedName = localStorage.getItem(`wedding_guest_name_${weddingSlug}`);
    if (savedName) setGuestName(savedName);
  }, [weddingSlug]);

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim()) {
      localStorage.setItem(`wedding_guest_name_${weddingSlug}`, guestName);
      router.push(`/${weddingSlug}/gallery`);
    } else {
      alert("Please enter your name to continue.");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans"><div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div></div>;

  if (!weddingInfo) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm">
        <div className="text-6xl mb-4">💔</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Wedding Not Found</h2>
        <p className="text-gray-500 text-sm">Please ensure you have the correct wedding link.</p>
      </div>
    </div>
  );

  if (showSplash) {
    return <GuestSplashScreen onFinish={() => setShowSplash(false)} coupleNames={weddingInfo.couple_names} weddingDate={weddingInfo.wedding_date} theme={activeTheme} />;
  }

  return (
    <div className={`min-h-screen ${activeTheme.bgLight} flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden transition-colors duration-500`}>
      {/* Background Decorations */}
      <div className={`absolute top-[-10%] left-[-10%] w-64 h-64 ${activeTheme.main} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse transition-colors duration-500`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-64 h-64 ${activeTheme.main} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse transition-colors duration-500 delay-1000`}></div>
      
      <div className={`bg-white p-8 rounded-3xl shadow-2xl border ${activeTheme.border} w-full max-w-sm z-10 animate-fade-in-up text-center transition-colors duration-500`}>
        <div className={`w-20 h-20 ${activeTheme.iconBg} ${activeTheme.text} rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner transition-colors duration-500`}>
          💒
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-800 mb-1 font-serif italic">{weddingInfo.couple_names}</h1>
        <p className="text-sm text-gray-500 font-bold tracking-widest mb-8">{weddingInfo.wedding_date}</p>
        
        <p className="text-gray-600 mb-4 text-sm font-medium">Welcome to our special day! Please enter your name to join the gallery.</p>
        
        <form onSubmit={handleEnter} className="flex flex-col gap-4">
          <input 
            type="text" 
            value={guestName} 
            onChange={(e) => setGuestName(e.target.value)} 
            placeholder="Enter Your Name" 
            className={`w-full border-2 ${activeTheme.border} rounded-xl px-4 py-3 text-center font-bold focus:outline-none ${activeTheme.outline} text-gray-800 ${activeTheme.bgLight} bg-opacity-50 transition-colors duration-500`} 
          />
          <button type="submit" className={`w-full ${activeTheme.main} text-white font-bold py-3.5 rounded-xl shadow-lg hover:opacity-90 transition transform hover:scale-[1.02] duration-500`}>
            Enter Gallery
          </button>
        </form>
      </div>
      
      <div className="mt-8 z-10 text-center">
        <p className="text-xs text-gray-400 font-bold">Powered by</p>
        <p className={`text-sm ${activeTheme.text} font-extrabold tracking-widest transition-colors duration-500`}>MX TECH</p>
      </div>
    </div>
  );
}