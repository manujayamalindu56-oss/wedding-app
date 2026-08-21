"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppConfig } from "@/lib/config";

export default function SplashScreen() {
  const [walk, setWalk] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const walkTimer = setTimeout(() => setWalk(true), 100);
    const nameTimer = setTimeout(() => setShowNames(true), 1600);
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
      <div className="relative w-full max-w-sm h-72 flex items-center justify-center">
        
        {/* මනාලයාගේ පින්තූරය */}
        <div className={`absolute left-0 top-16 w-32 h-32 flex items-center justify-center transition-all duration-[1500ms] ease-out ${walk ? "translate-x-12 opacity-100" : "-translate-x-16 opacity-0"}`}>
          <img src="/groom.png" alt="Groom" className={`w-full h-full object-contain transition-opacity duration-1000 ${showNames ? "opacity-0" : "opacity-100"}`} />
        </div>

        {/* මනාලියගේ පින්තූරය */}
        <div className={`absolute right-0 bottom-16 w-32 h-32 flex items-center justify-center transition-all duration-[1500ms] ease-out ${walk ? "-translate-x-12 opacity-100" : "translate-x-16 opacity-0"}`}>
          <img src="/bride.png" alt="Bride" className={`w-full h-full object-contain transition-opacity duration-1000 ${showNames ? "opacity-0" : "opacity-100"}`} />
        </div>

        {/* නම් සහ & සලකුණ */}
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
          {AppConfig.weddingDate}
        </p>
      </div>
    </div>
  );
}