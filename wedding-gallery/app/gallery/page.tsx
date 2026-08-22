"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { AppConfig } from "@/lib/config";

// --- Image Compressor Helper (Fix for iPhone HEIC issue included in input accept tags) ---
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
          } else {
            resolve(file);
          }
        }, "image/jpeg", 0.75);
      };
    };
  });
}

// -------------------------------------------------------------
// Guest Feed Post Component
// -------------------------------------------------------------
const GuestFeedPost = ({ post, currentUserName, onRefresh }: any) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showHeart, setShowHeart] = useState(false);
  
  // Local states for immediate Like updates
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [hasLikedLocally, setHasLikedLocally] = useState(false);

  const handleScroll = (e: any) => { setActiveIndex(Math.round(e.target.scrollLeft / e.target.clientWidth)); };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserName) return;
    await supabase.from('comments').insert([{ post_id: post.id, user_name: currentUserName, text: newComment }]);
    setNewComment("");
    onRefresh();
  };

  const handleLike = async () => {
    if (hasLikedLocally) return; // එක සැරයක් ලයික් කළාම මේ session එකේ ආයෙත් එකතු වෙන්නේ නෑ
    setHasLikedLocally(true);
    setLikesCount((prev: number) => prev + 1);
    
    // Admin එකේ use කරන "likes" column එකම update කරනවා
    await supabase.from('posts').update({ likes: (post.likes || 0) + 1 }).eq('id', post.id);
  };

  const handleDoubleTap = (e: any) => {
    e.preventDefault();
    handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000); // 1s animation duration
  };

  const isHostPost = post.user_name === AppConfig.hostName;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-pink-100 overflow-hidden relative">
      <div className={`p-3 flex items-center justify-between ${isHostPost ? 'bg-pink-100' : 'bg-pink-50'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${isHostPost ? 'bg-pink-500 text-white' : 'bg-pink-200 text-pink-600'}`}>
            {isHostPost ? '👑' : post.user_name.charAt(0).toUpperCase()}
          </div>
          <span className={`text-sm ${isHostPost ? 'font-extrabold text-pink-600 tracking-wide' : 'font-bold text-gray-700'}`}>
            {post.user_name}
          </span>
        </div>
      </div>
      
      {/* Images Slider (No Fullscreen on Click, Double Tap to Like) */}
      <div className="relative w-full group select-none" onDoubleClick={handleDoubleTap}>
        <div onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none' }}>
          {post.urls.map((url: string, index: number) => (
            <div key={index} className="w-full h-auto max-h-[500px] flex-shrink-0 snap-center relative">
              <img src={url} alt="Wedding" className="w-full h-full object-cover max-h-[500px] pointer-events-none" />
            </div>
          ))}
        </div>
        
        {/* Instagram Style Rose Heart Animation */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="text-rose-500 text-[8rem] drop-shadow-2xl animate-insta-heart leading-none">♥</div>
          </div>
        )}
        
        {post.urls.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {post.urls.map((_: string, i: number) => <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex ? "w-5 bg-pink-500" : "w-2 bg-white bg-opacity-80"}`} />)}
          </div>
        )}
      </div>
      
      {/* Like and Comment Area */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-6">
          <button onClick={handleLike} className="flex items-center gap-1.5 text-gray-500 hover:text-rose-500 transition-colors">
            <span className={`text-3xl leading-none transition-transform ${hasLikedLocally ? 'scale-110 text-rose-500' : 'hover:scale-110 text-gray-400'}`}>
              {hasLikedLocally ? '♥' : '♡'}
            </span>
            <span className="font-bold">{likesCount}</span>
          </button>
          <button onClick={() => setIsCommentOpen(true)} className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors">
            <span className="text-2xl">💬</span><span className="font-bold text-sm">{(post.comments || []).length} Comments</span>
          </button>
        </div>
        {post.liked_by_host && (
          <div className="text-xs text-gray-600 font-medium flex items-center gap-1">
            Liked by <span className="font-bold text-pink-600">👩‍❤️‍👨 {AppConfig.hostName}</span>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {isCommentOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh] animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-gray-800 text-base">Comments</h3>
              <button onClick={() => setIsCommentOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none">×</button>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 mb-4" style={{ scrollbarWidth: 'thin' }}>
              {(post.comments || []).length === 0 && <p className="text-center text-gray-400 text-sm py-8">තවම කමෙන්ට්ස් නැත.</p>}
              {(post.comments || []).map((c: any) => {
                const isHostComment = c.user_name === AppConfig.hostName;
                return (
                  <div key={c.id} className={`p-3 rounded-2xl border flex items-start justify-between gap-2.5 ${isHostComment ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${isHostComment ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'}`}>
                        {isHostComment ? '👑' : c.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className={`text-xs block mb-0.5 ${isHostComment ? 'font-extrabold text-pink-600 text-sm' : 'font-bold text-gray-800'}`}>{c.user_name}</span>
                        <p className="text-gray-700 text-sm">{c.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2 border-t border-gray-100">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 border border-pink-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 bg-pink-50/50 text-gray-800" />
              <button type="submit" className="bg-pink-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-pink-600 transition shadow-sm">Post</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Main Gallery Page
// -------------------------------------------------------------
export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState("feed");
  const [viewType, setViewType] = useState("feed"); 
  const [posts, setPosts] = useState<any[]>([]);
  const [greetings, setGreetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userName, setUserName] = useState("");
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [tempName, setTempName] = useState("");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [greetingText, setGreetingText] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Initialize Music Player safely
  useEffect(() => {
    audioRef.current = new Audio(AppConfig.backgroundMusicUrl);
    audioRef.current.loop = true;
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem("wedding_guest_name");
    if (savedName) {
      setUserName(savedName);
    } else {
      setIsEditNameOpen(true);
    }
  }, []);

  const saveName = () => {
    if (tempName.trim()) {
      setUserName(tempName);
      localStorage.setItem("wedding_guest_name", tempName);
      setIsEditNameOpen(false);
    } else {
      alert("කරුණාකර ඔබේ නම ඇතුළත් කරන්න.");
    }
  };

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    const { data: postsData } = await supabase.from('posts').select('*, comments(*)').order('created_at', { ascending: false });
    const { data: greetingsData } = await supabase.from('greetings').select('*').order('created_at', { ascending: false });
    if (postsData) setPosts(postsData);
    if (greetingsData) setGreetings(greetingsData);
    if (!isSilent) setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, []);

  // Show ONLY selected_photos (Favorites) in the Slideshow
  const slideshowUrls = posts.flatMap(p => p.selected_photos || []);

  useEffect(() => {
    if (!isProjectorOpen || slideshowUrls.length === 0) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slideshowUrls.length), 4000);
    return () => clearInterval(timer);
  }, [isProjectorOpen, slideshowUrls.length]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlayingMusic(true))
          .catch(() => alert("කරුණාකර බ්‍රවුසරයේ අවසර ලබාදීමට නැවත වරක් Music බොත්තම ඔබන්න."));
      }
    }
  };

  const handleCloseProjector = () => {
    setIsProjectorOpen(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    }
  };

  const handlePhotoUpload = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;
    
    if (!userName.trim()) {
      setIsEditNameOpen(true);
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgressText(`Compressing image (${i + 1}/${files.length})...`);
        const compressed = await compressImage(files[i]);
        
        setUploadProgressText(`Uploading image (${i + 1}/${files.length})...`);
        const ext = compressed.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        
        const { error: uploadError } = await supabase.storage.from('wedding-photos').upload(fileName, compressed);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('wedding-photos').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      await supabase.from('posts').insert([{ user_name: userName, urls: uploadedUrls, likes: 0 }]);
      setIsUploadOpen(false);
      setUploading(false);
      fetchData(true);
      alert("Photos uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  // Voice Recording Functions
  const startVoiceRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setVoiceBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      alert("Microphone access denied!");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    clearInterval(timerRef.current);
    setIsRecordingVoice(false);
  };

  const handleSendGreeting = async (type: string) => {
    if (!userName.trim()) {
      setIsEditNameOpen(true);
      return;
    }
    if (type === 'text' && !greetingText.trim()) return;
    if (type === 'voice' && !voiceBlob) return;

    setUploading(true);
    setUploadProgressText("Sending greeting...");

    try {
      let contentUrl = "";
      if (type === 'voice' && voiceBlob) {
        const fileName = `voice_${Date.now()}.mp3`;
        const { error } = await supabase.storage.from('wedding-photos').upload(fileName, voiceBlob);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('wedding-photos').getPublicUrl(fileName);
        contentUrl = publicUrl;
      }

      await supabase.from('greetings').insert([{
        user_name: userName,
        type: type,
        content: type === 'text' ? greetingText : contentUrl
      }]);

      setGreetingText("");
      setVoiceBlob(null);
      setUploading(false);
      fetchData(true);
      alert("Greeting added successfully!");
    } catch (e) {
      alert("Failed to send.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 font-sans pb-28 relative">
      {/* Instagram Heart Animation CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes instaHeart {
          0% { transform: scale(0); opacity: 0; }
          15% { transform: scale(1.2); opacity: 1; }
          30% { transform: scale(1); opacity: 1; }
          70% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }
        .animate-insta-heart {
          animation: instaHeart 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />

      {/* Header */}
      <div className="bg-white px-4 py-3 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-20 flex items-center justify-between border-b-4 border-pink-500">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setTempName(userName); setIsEditNameOpen(true); }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-inner bg-pink-100 text-pink-600 border border-pink-200" title="Change Name">
            {userName ? userName.charAt(0).toUpperCase() : '👤'}
          </div>
        </div>
        
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center pointer-events-none flex flex-col items-center">
          <h2 className="text-gray-800 font-extrabold text-xl leading-tight mt-1">{AppConfig.coupleNames}</h2>
        </div>
        
        <div className="w-9"></div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-4 px-4">
        <div className="bg-white rounded-full flex w-full max-w-sm shadow-sm border border-pink-100 p-1">
          <button onClick={() => setActiveTab("feed")} className={`flex-1 py-2 rounded-full text-sm font-bold transition ${activeTab === "feed" ? "bg-pink-500 text-white shadow" : "text-gray-500 hover:bg-pink-50"}`}>📸 Photos</button>
          <button onClick={() => setActiveTab("guestbook")} className={`flex-1 py-2 rounded-full text-sm font-bold transition ${activeTab === "guestbook" ? "bg-pink-500 text-white shadow" : "text-gray-500 hover:bg-pink-50"}`}>📖 Guestbook</button>
        </div>
      </div>

      <div className="px-2 max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-40"><p className="text-pink-500 font-bold animate-pulse">Loading Gallery...</p></div>
        ) : activeTab === "feed" ? (
          <div>
            <div className="flex justify-between items-center mb-3 px-2">
              <h3 className="font-bold text-gray-700 text-sm">Gallery</h3>
              <div className="flex gap-2 items-center">
                {slideshowUrls.length > 0 && viewType === 'grid' && (
                  <button onClick={() => { setIsProjectorOpen(true); setCurrentSlide(0); }} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1 transition-transform transform hover:scale-105 animate-pulse">
                    🎬 Favorites ({slideshowUrls.length})
                  </button>
                )}
                
                <div className="flex gap-1 bg-white p-1 rounded-lg border border-pink-200 shadow-sm">
                  <button onClick={() => setViewType("grid")} className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${viewType === 'grid' ? 'bg-pink-100 text-pink-600 font-bold' : 'text-gray-400'}`}>⊞ Grid</button>
                  <button onClick={() => setViewType("feed")} className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${viewType === 'feed' ? 'bg-pink-100 text-pink-600 font-bold' : 'text-gray-400'}`}>☰ Feed</button>
                </div>
              </div>
            </div>

            {viewType === "grid" ? (
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden shadow-sm">
                {posts.flatMap(post => post.urls).map((url: string, index: number) => (
                  <div key={index} className="relative group overflow-hidden aspect-square cursor-pointer" onClick={() => setFullscreenImage(url)}>
                    <img src={url} alt="Wedding" className="object-cover w-full h-full hover:scale-105 transition duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {posts.map((post) => (
                  <GuestFeedPost key={post.id} post={post} currentUserName={userName} onRefresh={() => fetchData(true)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6 px-1">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-pink-200 flex flex-col gap-3">
              <h3 className="font-bold text-gray-800 text-sm">ඔබේ සුබපැතුම එක් කරන්න ✍️</h3>
              <textarea value={greetingText} onChange={(e) => setGreetingText(e.target.value)} placeholder="සුබපැතුම් පණිවිඩයක් ලියන්න..." className="border border-pink-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500 bg-pink-50/30 text-gray-800 h-20 resize-none" />
              <button onClick={() => handleSendGreeting('text')} className="bg-pink-500 text-white py-2.5 rounded-xl font-bold text-sm shadow hover:bg-pink-600 transition">පණිවිඩය යවන්න</button>

              <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                <span className="text-xs text-gray-500 font-medium">හඬ පටයක් (Voice Note) එකතු කරන්න:</span>
                {!isRecordingVoice ? (
                  <button onClick={startVoiceRecording} className="bg-purple-100 text-purple-700 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:bg-purple-200 transition">🎙️ රෙකෝඩ් කිරීම ආරම්භ කරන්න</button>
                ) : (
                  <div className="flex items-center justify-between bg-red-50 p-2 rounded-xl border border-red-200">
                    <span className="text-xs text-red-600 font-bold animate-pulse">Recording... 00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}</span>
                    <button onClick={stopVoiceRecording} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold">නවත්වා යවන්න</button>
                  </div>
                )}
                {voiceBlob && !isRecordingVoice && (
                  <div className="flex items-center justify-between bg-green-50 p-2 rounded-xl border border-green-200 text-xs text-green-700 font-bold">
                    <span>✅ හඬ පටය සූදානම්!</span>
                    <button onClick={() => handleSendGreeting('voice')} className="bg-green-600 text-white px-3 py-1 rounded-lg">යවන්න</button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {greetings.map((greeting) => {
                const isHostMsg = greeting.user_name === AppConfig.hostName;
                return (
                  <div key={greeting.id} className={`bg-white p-4 rounded-2xl shadow-sm border ${isHostMsg ? 'border-pink-300 bg-pink-50/30' : 'border-pink-100'} relative`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isHostMsg ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'}`}>
                        {isHostMsg ? '👑' : greeting.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div><span className={`text-sm block ${isHostMsg ? 'font-extrabold text-pink-600' : 'font-bold text-gray-800'}`}>{greeting.user_name}</span></div>
                    </div>
                    {greeting.type === "text" && <p className="text-gray-600 text-sm leading-relaxed bg-pink-50/50 p-3 rounded-xl italic">"{greeting.content}"</p>}
                    {greeting.type === "voice" && <audio controls src={greeting.content} className="w-full h-10 outline-none rounded-full bg-purple-50" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => setIsUploadOpen(true)} className="fixed bottom-6 right-6 bg-pink-500 text-white w-14 h-14 rounded-full shadow-lg text-3xl flex items-center justify-center hover:bg-pink-600 z-40">＋</button>

      {/* Upload Popup Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Add Photos 📸</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">×</button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label className="bg-pink-50 text-pink-600 font-bold py-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-pink-100 transition cursor-pointer border border-pink-100">
                <span className="text-3xl">📷</span>
                <span className="text-sm">Camera</span>
                {/* Fixed for iPhone: HEIC format converted to JPG automatically by iOS */}
                <input type="file" accept="image/jpeg, image/png, image/jpg" capture="environment" onChange={handlePhotoUpload} className="hidden" />
              </label>

              <label className="bg-purple-50 text-purple-600 font-bold py-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-purple-100 transition cursor-pointer border border-purple-100">
                <span className="text-3xl">🖼️</span>
                <span className="text-sm">Gallery</span>
                {/* Fixed for iPhone */}
                <input type="file" accept="image/jpeg, image/png, image/jpg" multiple onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">Photos will be compressed automatically.</p>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {isEditNameOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-fade-in-up flex flex-col gap-4">
            <h3 className="font-bold text-gray-800 text-center text-lg">{userName ? "ඔබේ නම වෙනස් කරන්න" : "කරුණාකර නම ඇතුළත් කරන්න"}</h3>
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center text-3xl font-bold shadow-inner">
                {tempName ? tempName.charAt(0).toUpperCase() : '👤'}
              </div>
            </div>
            <input 
              type="text" 
              value={tempName} 
              onChange={(e) => setTempName(e.target.value)} 
              placeholder="Your Name..." 
              className="border-2 border-pink-200 rounded-xl px-4 py-3 text-center font-bold text-gray-800 focus:outline-none focus:border-pink-500 bg-pink-50/50" 
            />
            <button onClick={saveName} className="bg-pink-500 text-white font-bold py-3 rounded-xl shadow-md hover:bg-pink-600 transition">
              Save Name
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-bold text-sm tracking-wide">{uploadProgressText}</p>
        </div>
      )}

      {fullscreenImage && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-2" onClick={() => setFullscreenImage(null)}>
          <button className="absolute top-4 right-4 text-white text-3xl font-bold bg-white/20 w-10 h-10 rounded-full flex items-center justify-center">×</button>
          <img src={fullscreenImage} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      {isProjectorOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center backdrop-blur-xl">
          <button onClick={handleCloseProjector} className="absolute top-6 right-6 text-white bg-white/20 hover:bg-red-600 rounded-full w-12 h-12 flex items-center justify-center text-2xl z-50">×</button>
          <button onClick={toggleMusic} className="absolute top-6 left-6 bg-white/90 text-gray-800 px-4 py-2 rounded-full font-bold text-xs z-50 shadow-lg flex items-center gap-2">
            {isPlayingMusic ? "🎵 Music Playing (Pause)" : "🔇 Play Background Music"}
          </button>
          {slideshowUrls.length > 0 && (
            <img src={slideshowUrls[currentSlide]} alt="Slide" className="absolute inset-0 w-full h-full object-contain" />
          )}
        </div>
      )}
    </div>
  );
}