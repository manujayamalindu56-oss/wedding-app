"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// -------------------------------------------------------------
// Guest Splash Screen Component
// -------------------------------------------------------------
const GuestSplashScreen = ({ onFinish, coupleNames, weddingDate }: { onFinish: () => void, coupleNames: string, weddingDate: string }) => {
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
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center font-sans overflow-hidden">
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
              <span className="text-[3.5rem] text-pink-500 italic drop-shadow-sm leading-none">&</span>
            </div>
            <div className="self-end text-right pr-2 mt-2">
              <span className="text-4xl md:text-5xl font-serif font-bold text-gray-800 drop-shadow-sm leading-none">{name2}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={`mt-12 transition-all duration-1000 ${showNames ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
        <p className="text-xl text-gray-500 font-bold tracking-[0.35em] bg-white/40 px-4 py-1.5 rounded-full shadow-sm border border-pink-100/50">
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
  
  // අලුත් Splash Screen State එක
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (!weddingSlug) return;
    const fetchWedding = async () => {
      const { data, error } = await supabase.from('weddings').select('*').eq('slug', weddingSlug).single();
      if (data) {
        setWeddingInfo(data);
        setShowSplash(true); // දත්ත ආවම මුලින්ම Splash එක පෙන්නන්න
      }
      setIsLoading(false);
    };
    fetchWedding();
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
      alert("කරුණාකර ඔබේ නම ඇතුළත් කරන්න.");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-pink-50 flex items-center justify-center font-sans"><div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!weddingInfo) return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm">
        <div className="text-6xl mb-4">💔</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Wedding Not Found</h2>
        <p className="text-gray-500 text-sm">කරුණාකර නිවැරදි ලින්ක් එක භාවිතා කරන්න.</p>
      </div>
    </div>
  );

  // Splash Screen එක පේන වෙලාව
  if (showSplash) {
    return <GuestSplashScreen onFinish={() => setShowSplash(false)} coupleNames={weddingInfo.couple_names} weddingDate={weddingInfo.wedding_date} />;
  }

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
      
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-pink-100 w-full max-w-sm z-10 animate-fade-in-up text-center">
        <div className="w-20 h-20 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
          💒
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-800 mb-1 font-serif italic">{weddingInfo.couple_names}</h1>
        <p className="text-sm text-gray-500 font-bold tracking-widest mb-8">{weddingInfo.wedding_date}</p>
        
        <p className="text-gray-600 mb-4 text-sm font-medium">අපගේ මංගල දිනයට සාදරයෙන් පිළිගනිමු! කරුණාකර ඔබේ නම ඇතුළත් කරන්න.</p>
        
        <form onSubmit={handleEnter} className="flex flex-col gap-4">
          <input 
            type="text" 
            value={guestName} 
            onChange={(e) => setGuestName(e.target.value)} 
            placeholder="ඔබේ නම (Your Name)" 
            className="w-full border-2 border-pink-200 rounded-xl px-4 py-3 text-center font-bold focus:outline-none focus:border-pink-500 text-gray-800 bg-pink-50/50" 
          />
          <button type="submit" className="w-full bg-pink-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-pink-600 transition transform hover:scale-[1.02]">
            ඇතුල් වන්න (Enter)
          </button>
        </form>
      </div>
      
      <div className="mt-8 z-10 text-center">
        <p className="text-xs text-gray-400 font-bold">Powered by</p>
        <p className="text-sm text-pink-500 font-extrabold tracking-widest">MX TECH</p>
      </div>
    </div>
  );
}