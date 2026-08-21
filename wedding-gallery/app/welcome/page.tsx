"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppConfig } from "@/lib/config"; // Config එක import කරගැනීම

export default function WelcomePage() {
  const [name, setName] = useState("");
  const router = useRouter();

  const handleNext = () => {
    if (name.trim() !== "") {
      localStorage.setItem("guestName", name.trim());
      router.push("/gallery");
    } else {
      alert("කරුණාකර ඉදිරියට යාමට පෙර ඔබේ නම ඇතුළත් කරන්න!");
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col p-6 font-sans">
      <div className="flex justify-between items-center w-full max-w-md mx-auto mt-4">
        <button className="text-gray-600 text-3xl">☰</button>
        <button className="bg-white px-4 py-1 rounded-full shadow-sm text-sm font-bold text-gray-700 border border-gray-200">
          සිං | EN
        </button>
      </div>

      <div className="flex flex-col items-center justify-center flex-grow w-full max-w-md mx-auto">
        <div className="bg-white w-full p-8 rounded-3xl shadow-lg border border-pink-100 flex flex-col gap-8">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-3">
              ඔබේ නම (Your Name)
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Your Name" 
                className="w-full border-2 border-gray-300 p-3 rounded-xl focus:outline-none focus:border-pink-400 text-gray-800"
              />
              <button onClick={handleNext} className="bg-pink-500 text-white p-3 rounded-xl hover:bg-pink-600 transition flex-shrink-0 text-xl">
                ✔️
              </button>
            </div>
          </div>

          <div className="bg-pink-50 p-5 rounded-2xl border border-pink-200 text-center shadow-inner">
            <p className="text-gray-700 font-medium font-serif italic mb-2">
              "{AppConfig.welcomeMessage}"  {/* Config එකෙන් පණිවිඩය ගනී */}
            </p>
            <p className="text-pink-600 font-bold">
              - {AppConfig.coupleNames} -  {/* Config එකෙන් නම ගනී */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}