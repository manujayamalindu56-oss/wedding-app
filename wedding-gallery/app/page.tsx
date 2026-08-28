"use client";

export default function MXTechLandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Awesome background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
      
      <div className="z-10 text-center max-w-2xl">
        <div className="w-24 h-24 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-2xl transform rotate-12">
          🚀
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">MX TECH</span>
        </h1>
        <p className="text-gray-300 text-lg md:text-xl mb-10 leading-relaxed">
          The ultimate premium Digital Wedding Gallery & Guestbook platform. 
          Capture memories instantly, share love effortlessly.
        </p>
        
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-3xl mb-8">
          <p className="text-sm text-gray-400 mb-2 uppercase tracking-widest font-bold">To access a wedding gallery:</p>
          <p className="text-pink-400 font-mono">Please use the specific link provided by the couple.</p>
          <p className="text-xs text-gray-500 mt-2">(e.g., mxtech.com/saman-lilly)</p>
        </div>

        <button onClick={() => alert("WhatsApp/Call: 0785508792")} className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
          Start Your Project (Contact Us)
        </button>
      </div>
    </div>
  );
}