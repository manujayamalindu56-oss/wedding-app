"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppConfig } from "@/lib/config"; // Config එක සම්බන්ධ කිරීම

export default function SplashScreen() {
  const [walk, setWalk] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 1. මිලි තත්පර 100කින් දෙපැත්තෙන් ඇවිදගෙන එන ඇනිමේෂන් එක පටන් ගනී
    const walkTimer = setTimeout(() => setWalk(true), 100);

    // 2. තත්පර 1.6කට පස්සේ රූප මැකී ගොස් නම් සහ හර්ට් එක මතුවීම පටන් ගනී
    const nameTimer = setTimeout(() => setShowNames(true), 1600);

    // 3. තත්පර 5කට පස්සේ දෙවන පිටුවට මාරු වේ
    const redirectTimer = setTimeout(() => {
      router.push("/welcome");
    }, 5000);

    return () => {
      clearTimeout(walkTimer);
      clearTimeout(nameTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  const nameParts = AppConfig.coupleNames.split("&");
  const name1 = nameParts[0]?.trim() || "Saman";
  const name2 = nameParts[1]?.trim() || "Lilly";

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center font-sans overflow-hidden">

      {/* Animation එක සිදුවන ප්‍රධාන කොටුව (හර්ට් එකට ඉඩ ඇතිවීමට උස වැඩි කර ඇත) */}
      <div className="relative w-full max-w-sm h-[340px] flex items-center justify-center">

        {/* ================= LAYER 1: පින්තූර දෙකේ ඇනිමේෂන් එක ================= */}
        {/* මනාලයාගේ පින්තූරය */}
        <div 
          className={`absolute left-0 top-16 w-32 h-32 flex items-center justify-center transition-all duration-[1500ms] ease-out ${
            walk ? "translate-x-12 opacity-100" : "-translate-x-16 opacity-0"
          }`}
        >
          <img 
            src="/groom.png" 
            alt="Groom"
            className={`w-full h-full object-contain transition-opacity duration-1000 ${showNames ? "opacity-0" : "opacity-100"}`}
            onError={(e) => { e.currentTarget.style.border = "2px solid red"; }} 
          />
        </div>

        {/* මනාලියගේ පින්තූරය */}
        <div 
          className={`absolute right-0 bottom-16 w-32 h-32 flex items-center justify-center transition-all duration-[1500ms] ease-out ${
            walk ? "-translate-x-12 opacity-100" : "translate-x-16 opacity-0"
          }`}
        >
          <img 
            src="/bride.png" 
            alt="Bride"
            className={`w-full h-full object-contain transition-opacity duration-1000 ${showNames ? "opacity-0" : "opacity-100"}`}
            onError={(e) => { e.currentTarget.style.border = "2px solid red"; }}
          />
        </div>

        {/* ================= LAYER 2: Line Heart සහ නම් පෙන්වන කොටස ================= */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out ${
            showNames ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          
          {/* ලා රෝස පාට Line Heart එක (Outline පමණයි) */}
          <svg 
            className="absolute w-[520px] h-[500px] text-pink-400 opacity-60 drop-shadow-sm" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="0.1"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>

          {/* නම් සහ & සලකුණ (සමාන පරතරයන් සහිතව) */}
          <div className="flex flex-col w-full max-w-[260px] z-10">
            
            {/* නම 1 (වම් පසට බරව) */}
            <div className="self-start text-left pl-2 mb-2">
              <span className="text-4xl md:text-5xl font-serif font-bold text-gray-800 drop-shadow-sm leading-none">
                {name1}
              </span>
            </div>
            
            {/* & සලකුණ (හරියටම මැද) */}
            <div className="self-center my-1">
              <span className="text-[3.5rem] text-pink-500 italic drop-shadow-sm leading-none">
                &
              </span>
            </div>
            
            {/* නම 2 (දකුණු පසට බරව) */}
            <div className="self-end text-right pr-2 mt-2">
              <span className="text-4xl md:text-5xl font-serif font-bold text-gray-800 drop-shadow-sm leading-none">
                {name2}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* මංගල දිනය (හර්ට් එකේ ගෑවෙන්නේ නැති වෙන්න ගොඩක් පල්ලෙහාට ගෙන ඇත) */}
      <div 
        className={`mt-12 transition-all duration-1000 ${
          showNames ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        }`}
      >
        <p className="text-xl text-gray-500 font-bold tracking-[0.35em] bg-white/40 px-4 py-1.5 rounded-full shadow-sm border border-pink-100/50">
          {AppConfig.weddingDate}
        </p>
      </div>

    </div>
  );
}