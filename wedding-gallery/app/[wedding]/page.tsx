"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function WeddingWelcomePage() {
  const params = useParams();
  const router = useRouter();
  const weddingSlug = params.wedding as string;

  const [weddingInfo, setWeddingInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    if (!weddingSlug) return;
    const fetchWedding = async () => {
      const { data, error } = await supabase.from('weddings').select('*').eq('slug', weddingSlug).single();
      if (data) setWeddingInfo(data);
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
      router.push(`/${weddingSlug}/gallery`); // <--- නිවැරදි ගැලරි ලින්ක් එකට යවනවා
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

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
      
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-pink-100 w-full max-w-sm z-10 animate-fade-in-up text-center">
        <div className="w-20 h-20 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
          💒
        </div>
        {/* Database එකෙන් එන නම සහ දිනය පෙන්නනවා */}
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