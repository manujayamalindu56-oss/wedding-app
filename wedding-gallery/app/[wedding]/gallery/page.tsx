"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import imageCompression from 'browser-image-compression';

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
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
          else resolve(file);
        }, "image/jpeg", 0.75);
      };
    };
  });
}

// -------------------------------------------------------------
// Smooth Image Component (For Loading Animation)
// -------------------------------------------------------------
const SmoothImage = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className={`relative ${className} overflow-hidden bg-gray-100`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
          <span className="text-gray-400 text-3xl opacity-50">🖼️</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
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
            <div className="self-start text-left pl-2 mb-2"><span className="text-4xl md:text-5xl font-serif font-bold text-gray-800 drop-shadow-sm leading-none">{name1}</span></div>
            <div className="self-center my-1"><span className={`text-[3.5rem] ${theme.text} italic drop-shadow-sm leading-none transition-colors duration-500`}>&</span></div>
            <div className="self-end text-right pr-2 mt-2"><span className="text-4xl md:text-5xl font-serif font-bold text-gray-800 drop-shadow-sm leading-none">{name2}</span></div>
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
// Guest Feed Post Component
// -------------------------------------------------------------
const GuestFeedPost = ({ post, currentUserName, onRefresh, weddingSlug, coupleNames, theme, onDeletePost, onDeleteComment }: any) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showHeart, setShowHeart] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [hasLikedLocally, setHasLikedLocally] = useState(false);

  const isProcessingLike = useRef(false);

  useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem(`liked_posts_${weddingSlug}`) || "[]");
    if (likedPosts.includes(post.id)) {
      setHasLikedLocally(true);
    }
  }, [post.id, weddingSlug]);

  const handleScroll = (e: any) => { setActiveIndex(Math.round(e.target.scrollLeft / e.target.clientWidth)); };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserName) return;
    await supabase.from('comments').insert([{ post_id: post.id, user_name: currentUserName, text: newComment, wedding_slug: weddingSlug }]);
    setNewComment("");
    onRefresh();
  };

  const handleLike = async () => {
    if (isProcessingLike.current) return; 
    isProcessingLike.current = true; 
    
    const likedPosts = JSON.parse(localStorage.getItem(`liked_posts_${weddingSlug}`) || "[]");

    if (hasLikedLocally) {
      // 🟢 Un-like Feature
      setHasLikedLocally(false);
      setLikesCount((prev: number) => Math.max(0, prev - 1));
      const updatedLikes = likedPosts.filter((id: string) => id !== post.id);
      localStorage.setItem(`liked_posts_${weddingSlug}`, JSON.stringify(updatedLikes));
      await supabase.from('posts').update({ likes: Math.max(0, (post.likes || 1) - 1) }).eq('id', post.id);
    } else {
      // 🟢 Like Feature
      setHasLikedLocally(true);
      setLikesCount((prev: number) => prev + 1);
      if (!likedPosts.includes(post.id)) {
        likedPosts.push(post.id);
        localStorage.setItem(`liked_posts_${weddingSlug}`, JSON.stringify(likedPosts));
      }
      await supabase.from('posts').update({ likes: (post.likes || 0) + 1 }).eq('id', post.id);
    }
    
    setTimeout(() => { isProcessingLike.current = false; }, 1000);
  };

  const handleDoubleTap = (e: any) => {
    e.preventDefault();
    if (!hasLikedLocally) {
      handleLike();
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000); 
  };

  const isHostPost = post.user_name === "Mr & Mrs" || post.user_name === coupleNames;
  const isMyPost = post.user_name === currentUserName;

  // 🟢 Pinned Host Comments Logic
  const sortedComments = [...(post.comments || [])].sort((a, b) => {
    const isAHost = a.user_name === "Mr & Mrs" || a.user_name === coupleNames;
    const isBHost = b.user_name === "Mr & Mrs" || b.user_name === coupleNames;
    if (isAHost && !isBHost) return -1;
    if (!isAHost && isBHost) return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div className={`bg-white rounded-2xl shadow-md border overflow-hidden relative ${post.is_pinned ? 'border-yellow-300' : theme.border} transition-colors duration-500`}>
      <div className={`p-3 flex items-center justify-between ${isHostPost ? theme.iconBg : theme.bgLight} transition-colors duration-500`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${isHostPost ? `${theme.main} text-white` : `${theme.iconBg} ${theme.text}`} transition-colors duration-500`}>
            {isHostPost ? '👑' : post.user_name.charAt(0).toUpperCase()}
          </div>
          <span className={`text-sm ${isHostPost ? `font-extrabold ${theme.text} tracking-wide` : 'font-bold text-gray-700'} transition-colors duration-500`}>
            {post.user_name}
          </span>
          {post.is_pinned && <span className="text-[10px] bg-yellow-100 text-yellow-600 font-bold px-2 py-0.5 rounded-full ml-1 uppercase">Pinned 📌</span>}
        </div>
        {/* 🟢 Guest can delete their own post */}
        {isMyPost && (
          <button onClick={() => onDeletePost(post.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white/50 rounded-full transition-colors" title="Delete Post">🗑️</button>
        )}
      </div>
      
      <div className="relative w-full group select-none" onDoubleClick={handleDoubleTap}>
        <div onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none' }}>
          {post.urls.map((url: string, index: number) => (
           <div key={index} className="w-full h-[400px] sm:h-[500px] flex-shrink-0 snap-center relative">
            <SmoothImage src={url} alt="Wedding" className="w-full h-full pointer-events-none" />
          </div>
          ))}
        </div>
        {showHeart && <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"><div className="text-rose-500 text-[8rem] drop-shadow-2xl animate-insta-heart leading-none">♥</div></div>}
        {post.urls.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {post.urls.map((_: string, i: number) => <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex ? `w-5 ${theme.main}` : "w-2 bg-white bg-opacity-80"}`} />)}
          </div>
        )}
      </div>
      
      {/* 🟢 Caption Section */}
      {post.caption && (
        <div className="px-4 pt-3 pb-1 text-sm text-gray-800 leading-relaxed">
          <span className="font-bold mr-2">{post.user_name}</span>
          <span>{post.caption}</span>
        </div>
      )}

      <div className={`px-4 pb-4 flex flex-col gap-3 ${post.caption ? 'pt-1' : 'pt-4'}`}>
        <div className="flex items-center gap-6">
          <button onClick={handleLike} className={`flex items-center gap-1.5 text-gray-500 hover:text-rose-500 transition-colors`}>
            <span className={`text-3xl leading-none transition-transform ${hasLikedLocally ? 'scale-110 text-rose-500' : 'hover:scale-110 text-gray-400'}`}>{hasLikedLocally ? '♥' : '♡'}</span>
            <span className="font-bold">{likesCount}</span>
          </button>
          <button onClick={() => setIsCommentOpen(true)} className={`flex items-center gap-1.5 text-gray-500 hover:${theme.text} transition-colors`}>
            <span className="text-2xl">💬</span><span className="font-bold text-sm">{(post.comments || []).length} Comments</span>
          </button>
        </div>
        {post.liked_by_host && <div className="text-xs text-gray-600 font-medium flex items-center gap-1">Liked by <span className={`font-bold ${theme.text} transition-colors duration-500`}>👩‍❤️‍👨 Mr & Mrs</span></div>}
      </div>

      {isCommentOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh] animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4"><h3 className="font-bold text-gray-800 text-base">Comments</h3><button onClick={() => setIsCommentOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none">×</button></div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 mb-4" style={{ scrollbarWidth: 'thin' }}>
              {sortedComments.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No comments yet.</p>}
              {sortedComments.map((c: any) => {
                const isHostComment = c.user_name === "Mr & Mrs" || c.user_name === coupleNames;
                const isMyComment = c.user_name === currentUserName;
                
                return (
                  <div key={c.id} className={`p-3 rounded-2xl border flex items-start justify-between gap-2.5 ${isHostComment ? `${theme.bgLight} ${theme.border}` : 'bg-gray-50 border-gray-100'} transition-colors duration-500`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${isHostComment ? `${theme.main} text-white` : `${theme.iconBg} ${theme.text}`} transition-colors duration-500`}>{isHostComment ? '👑' : c.user_name.charAt(0).toUpperCase()}</div>
                      <div>
                        <span className={`text-xs block mb-0.5 ${isHostComment ? `font-extrabold ${theme.text} text-sm` : 'font-bold text-gray-800'} transition-colors duration-500`}>{c.user_name}</span>
                        <p className="text-gray-700 text-sm">{c.text}</p>
                      </div>
                    </div>
                    {/* 🟢 Guest can delete their own comment */}
                    {isMyComment && (
                      <button onClick={() => onDeleteComment(c.id)} className="text-gray-400 hover:text-red-500 p-1 text-sm transition-colors" title="Delete Comment">🗑️</button>
                    )}
                  </div>
                );
              })}
            </div>
            <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2 border-t border-gray-100">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className={`flex-1 border ${theme.border} rounded-xl px-4 py-2.5 text-sm focus:outline-none ${theme.outline} ${theme.bgLight} bg-opacity-50 text-gray-800 transition-colors duration-500`} />
              <button type="submit" className={`${theme.main} text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-colors duration-500`}>Post</button>
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
  const params = useParams();
  const router = useRouter();
  const weddingSlug = params.wedding as string;

  const [weddingInfo, setWeddingInfo] = useState<any>(null);
  const [isValidWedding, setIsValidWedding] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [activeTheme, setActiveTheme] = useState<any>(THEMES.pink);

  const [activeTab, setActiveTab] = useState("feed");
  const [viewType, setViewType] = useState("feed"); 
  const [posts, setPosts] = useState<any[]>([]);
  const [greetings, setGreetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  
  const [guestName, setGuestName] = useState("");
  const [tempName, setTempName] = useState("");
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [uploadCaption, setUploadCaption] = useState(""); // 🟢 Caption State

  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  const [isSlideshowFinished, setIsSlideshowFinished] = useState(false);
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

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isUploadBlocked, setIsUploadBlocked] = useState(false);
  const [isGuestbookBlocked, setIsGuestbookBlocked] = useState(false);
  const [allowDownloads, setAllowDownloads] = useState(true); // 🟢 Download Control State
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (!weddingSlug) return;
    
    // 1. Initial Fetch
    const fetchInitialData = async () => {
      const { data, error } = await supabase.from('weddings').select('*').eq('slug', weddingSlug).single();
      if (error || !data) { setIsValidWedding(false); setIsLoading(false); return; }
      
      setWeddingInfo(data);
      setActiveTheme(THEMES[data.theme_color] || THEMES.pink);
      setIsUploadBlocked(data.uploads_blocked);
      setIsGuestbookBlocked(data.guestbook_blocked);
      setAllowDownloads(data.allow_downloads !== false); // Default true
      setIsValidWedding(true);

      if (data.music_url) { audioRef.current = new Audio(data.music_url); audioRef.current.loop = true; }
      
      const savedName = localStorage.getItem(`wedding_guest_name_${weddingSlug}`);
      if (savedName) { setGuestName(savedName); setHasEntered(true); } 
      else { setShowSplash(true); }
    };
    fetchInitialData();

    // 2. Realtime Listener
    const realtimeSub = supabase
      .channel('theme-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'weddings' }, (payload) => {
        if (payload.new.slug === weddingSlug) {
          setActiveTheme(THEMES[payload.new.theme_color] || THEMES.pink);
          setIsUploadBlocked(payload.new.uploads_blocked);
          setIsGuestbookBlocked(payload.new.guestbook_blocked);
          setAllowDownloads(payload.new.allow_downloads !== false);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(realtimeSub); };
  }, [weddingSlug]);

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) { setGuestName(tempName); localStorage.setItem(`wedding_guest_name_${weddingSlug}`, tempName); setHasEntered(true); } 
    else { showToast("Please enter your name.", "error"); }
  };

  const saveNameChange = () => {
    if (tempName.trim()) { setGuestName(tempName); localStorage.setItem(`wedding_guest_name_${weddingSlug}`, tempName); setIsEditNameOpen(false); showToast("Name updated successfully! ✨", "success"); } 
    else { showToast("Please enter your name.", "error"); }
  };

  const fetchData = async (isSilent = false) => {
    if (!isValidWedding || !hasEntered) return;
    if (!isSilent) setIsLoading(true);
    
    const { data: postsData } = await supabase.from('posts').select('*, comments(*)').eq('wedding_slug', weddingSlug).order('created_at', { ascending: false });
    const { data: greetingsData } = await supabase.from('greetings').select('*').eq('wedding_slug', weddingSlug).order('created_at', { ascending: false });
    
    if (postsData) setPosts(postsData.sort((a, b) => { if (a.is_pinned && !b.is_pinned) return -1; if (!a.is_pinned && b.is_pinned) return 1; return 0; }));
    if (greetingsData) setGreetings(greetingsData.sort((a, b) => { if (a.is_pinned && !b.is_pinned) return -1; if (!a.is_pinned && b.is_pinned) return 1; return 0; }));
    if (!isSilent) setIsLoading(false);
  };
  
  // --- Network Connection Monitor ---
  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    const handleConnectionChange = () => {
      if (connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g')) {
        setIsSlowConnection(true);
      } else {
        setIsSlowConnection(false);
      }
    };

    if (connection) {
      handleConnectionChange();
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) connection.removeEventListener('change', handleConnectionChange);
    };
  }, []);

  useEffect(() => {
    if (isValidWedding && hasEntered) {
      fetchData();
      const interval = setInterval(() => fetchData(true), 5000);
      return () => clearInterval(interval);
    }
  }, [isValidWedding, hasEntered]);

  const slideshowUrls = posts.flatMap(p => p.selected_photos || []);

  useEffect(() => {
    if (!isProjectorOpen || slideshowUrls.length === 0 || !isSlideshowPlaying || isSlideshowFinished) return;
    const timer = setInterval(() => { setCurrentSlide((prev) => { if (prev + 1 >= slideshowUrls.length) { setIsSlideshowFinished(true); return prev; } return prev + 1; }); }, 4500);
    return () => clearInterval(timer);
  }, [isProjectorOpen, isSlideshowPlaying, isSlideshowFinished, slideshowUrls.length]);

  const handlePhotoUpload = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;
    if (!guestName.trim()) { setIsEditNameOpen(true); return; }
    
    const invalidFiles = files.filter(file => !file.type.match(/^image\/(jpeg|png|jpg|webp)$/));
    if (invalidFiles.length > 0) {
      showToast("Please select images (JPG/PNG) only!", "error");
      return; 
    }

    setUploading(true); setUploadProgressPercent(0); setIsUploadOpen(false);

    try {
      const uploadedUrls = [];
      const totalSteps = files.length * 2; 
      let completedSteps = 0;

      for (let i = 0; i < files.length; i++) {
        setUploadProgressText(`Compressing Image ${i+1}/${files.length}...`);
        const compressedFile = await imageCompression(files[i], { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.8 });
        completedSteps++; setUploadProgressPercent(Math.round((completedSteps / totalSteps) * 100));

        setUploadProgressText(`Uploading Image ${i+1}/${files.length}...`);
        const ext = compressedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('wedding-photos').upload(fileName, compressedFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('wedding-photos').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
        completedSteps++; setUploadProgressPercent(Math.round((completedSteps / totalSteps) * 100));
      }

      await supabase.from('posts').insert([{ wedding_slug: weddingSlug, user_name: guestName, urls: uploadedUrls, likes: 0, caption: uploadCaption }]);
      setUploading(false); setUploadCaption(""); fetchData(true); showToast("Photos uploaded successfully! 📸", "success");
    } catch (error) { showToast("Upload failed. Please try again.", "error"); setUploading(false); }
  };

  // 🟢 Delete Post Handler
  const handleDeletePost = (postId: string) => {
    setConfirmDialog({
      message: "Are you sure you want to delete your post?",
      onConfirm: async () => {
        await supabase.from('posts').delete().eq('id', postId);
        setPosts(prev => prev.filter(p => p.id !== postId));
        showToast("Post deleted successfully.", "success");
        setConfirmDialog(null);
      }
    });
  };

  // 🟢 Delete Comment Handler
  const handleDeleteComment = (commentId: string) => {
    setConfirmDialog({
      message: "Are you sure you want to delete your comment?",
      onConfirm: async () => {
        await supabase.from('comments').delete().eq('id', commentId);
        fetchData(true);
        showToast("Comment deleted successfully.", "success");
        setConfirmDialog(null);
      }
    });
  };

  const startVoiceRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => setVoiceBlob(new Blob(audioChunksRef.current, { type: 'audio/mp3' }));
      mediaRecorder.start(); setIsRecordingVoice(true); setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) { showToast("Microphone access denied! 🎙️", "error"); }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); }
    clearInterval(timerRef.current); setIsRecordingVoice(false);
  };

  const handleSendGreeting = async (type: string) => {
    if (!guestName.trim()) { setIsEditNameOpen(true); return; }
    if (type === 'text' && !greetingText.trim()) return;
    if (type === 'voice' && !voiceBlob) return;

    setUploading(true); setUploadProgressPercent(50); setUploadProgressText("Sending greeting...");

    try {
      let contentUrl = "";
      if (type === 'voice' && voiceBlob) {
        const fileName = `voice_${Date.now()}.mp3`;
        const { error } = await supabase.storage.from('wedding-photos').upload(fileName, voiceBlob);
        if (error) throw error;
        contentUrl = supabase.storage.from('wedding-photos').getPublicUrl(fileName).data.publicUrl;
      }
      await supabase.from('greetings').insert([{ wedding_slug: weddingSlug, user_name: guestName, type: type, content: type === 'text' ? greetingText : contentUrl }]);
      setUploadProgressPercent(100); setGreetingText(""); setVoiceBlob(null);
      setTimeout(() => { setUploading(false); fetchData(true); showToast("Greeting added successfully! 💌", "success"); }, 500);
    } catch (e) { showToast("Failed to send.", "error"); setUploading(false); }
  };

  if (isValidWedding === false) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans"><div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm"><div className="text-6xl mb-4">💔</div><h2 className="text-xl font-bold text-gray-800 mb-2">Wedding Not Found</h2><p className="text-gray-500 text-sm">Please ensure you have the correct wedding link.</p></div></div>;
  if (isLoading || !weddingInfo) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans"><p className="text-gray-500 font-bold animate-pulse">Loading Magic...</p></div>;

  // Show Splash & Welcome Screen
  if (!hasEntered) {
    if (showSplash) return <GuestSplashScreen onFinish={() => setShowSplash(false)} coupleNames={weddingInfo.couple_names} weddingDate={weddingInfo.wedding_date} theme={activeTheme} />;
    return (
      <div className={`min-h-screen ${activeTheme.bgLight} flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden transition-colors duration-500`}>
        <div className={`bg-white p-8 rounded-3xl shadow-2xl border ${activeTheme.border} w-full max-w-sm z-10 animate-fade-in-up text-center transition-colors duration-500`}>
          <div className={`w-20 h-20 ${activeTheme.iconBg} ${activeTheme.text} rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner transition-colors duration-500`}>💒</div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-1 font-serif italic">{weddingInfo.couple_names}</h1>
          <p className="text-sm text-gray-500 font-bold tracking-widest mb-8">{weddingInfo.wedding_date}</p>
          <p className="text-gray-600 mb-4 text-sm font-medium">Welcome to our special day! Please enter your name to join the gallery.</p>
          <form onSubmit={handleEnter} className="flex flex-col gap-4">
            <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Enter Your Name" className={`w-full border-2 ${activeTheme.border} rounded-xl px-4 py-3 text-center font-bold focus:outline-none ${activeTheme.outline} text-gray-800 ${activeTheme.bgLight} bg-opacity-50 transition-colors duration-500`} />
            <button type="submit" className={`w-full ${activeTheme.main} text-white font-bold py-3.5 rounded-xl shadow-lg hover:opacity-90 transition transform hover:scale-[1.02] duration-500`}>Enter Gallery</button>
          </form>
        </div>
        <div className="mt-8 z-10 text-center"><p className="text-xs text-gray-400 font-bold">Powered by</p><p className={`text-sm ${activeTheme.text} font-extrabold tracking-widest transition-colors duration-500`}>MX TECH</p></div>
      </div>
    );
  }

  // Main Gallery Render
  return (
    <div className={`min-h-screen ${activeTheme.bgLight} font-sans pb-28 relative transition-colors duration-500`}>
      <style dangerouslySetInnerHTML={{__html: `@keyframes instaHeart { 0% { transform: scale(0); opacity: 0; } 15% { transform: scale(1.2); opacity: 1; } 30% { transform: scale(1); opacity: 1; } 70% { transform: scale(1); opacity: 1; } 100% { transform: scale(0); opacity: 0; } } .animate-insta-heart { animation: instaHeart 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; } @keyframes kenBurns1 { 0% { transform: scale(1); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: scale(1.15) translate(-2%, -2%); opacity: 0; } } @keyframes kenBurns2 { 0% { transform: scale(1.15) translate(2%, 2%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: scale(1) translate(0, 0); opacity: 0; } } @keyframes kenBurns3 { 0% { transform: scale(1) translate(-2%, 2%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: scale(1.15) translate(2%, -2%); opacity: 0; } } @keyframes kenBurns4 { 0% { transform: scale(1.15) translate(0, -2%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: scale(1) translate(0, 2%); opacity: 0; } } .animate-kb-0 { animation: kenBurns1 4.5s ease-in-out forwards; } .animate-kb-1 { animation: kenBurns2 4.5s ease-in-out forwards; } .animate-kb-2 { animation: kenBurns3 4.5s ease-in-out forwards; } .animate-kb-3 { animation: kenBurns4 4.5s ease-in-out forwards; }`}} />
      
      {/* Network Warning Banner */}
      {(isOffline || isSlowConnection) && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[300] px-4 py-1.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 animate-pulse ${isOffline ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
          <span className="text-sm">{isOffline ? '❌' : '⚠️'}</span>
          <span className="tracking-wide">{isOffline ? 'No Internet Connection' : 'Poor Connection'}</span>
        </div>
      )}

      <div className={`bg-white px-4 py-3 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-20 flex items-center justify-between border-b-4 ${activeTheme.borderMain} transition-colors duration-500`}>
        <div className="flex items-center gap-2 cursor-pointer z-10" onClick={() => { setTempName(guestName); setIsEditNameOpen(true); }}><div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${activeTheme.iconBg} ${activeTheme.text} border ${activeTheme.border} transition-colors duration-500`} title="Change Name">{guestName ? guestName.charAt(0).toUpperCase() : '👤'}</div></div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center pointer-events-none flex flex-col items-center w-3/5"><h2 className="text-gray-800 font-extrabold text-xl leading-tight mt-1 truncate w-full">{weddingInfo.couple_names}</h2></div>
        <button onClick={() => setIsInfoOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition shadow-inner z-10 text-lg border border-gray-200" title="Info">ℹ️</button>
      </div>

      <div className="flex justify-center mb-4 px-4">
        <div className={`bg-white rounded-full flex w-full max-w-sm shadow-sm border ${activeTheme.border} p-1 transition-colors duration-500`}>
          <button onClick={() => setActiveTab("feed")} className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors duration-500 ${activeTab === "feed" ? `${activeTheme.main} text-white shadow` : `text-gray-500 hover:${activeTheme.bgLight}`}`}>📸 Photos</button>
          <button onClick={() => setActiveTab("guestbook")} className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors duration-500 ${activeTab === "guestbook" ? `${activeTheme.main} text-white shadow` : `text-gray-500 hover:${activeTheme.bgLight}`}`}>📖 Guestbook</button>
        </div>
      </div>

      <div className="px-2 max-w-lg mx-auto">
        {activeTab === "feed" ? (
          <div>
            <div className="flex justify-between items-center mb-3 px-2">
              <h3 className="font-bold text-gray-700 text-sm">Gallery</h3>
              <div className="flex gap-2 items-center">
                {slideshowUrls.length > 0 && viewType === 'grid' && (
                  <button onClick={() => { setIsProjectorOpen(true); setCurrentSlide(0); setIsSlideshowFinished(false); setIsSlideshowPlaying(false); }} className={`bg-gray-800 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1 transition-transform transform hover:scale-105 animate-pulse`}>🎬 Favorites ({slideshowUrls.length})</button>
                )}
                <div className={`flex gap-1 bg-white p-1 rounded-lg border ${activeTheme.border} shadow-sm transition-colors duration-500`}>
                  <button onClick={() => setViewType("grid")} className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${viewType === 'grid' ? `${activeTheme.iconBg} ${activeTheme.text} font-bold` : 'text-gray-400'}`}>⊞ Grid</button>
                  <button onClick={() => setViewType("feed")} className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${viewType === 'feed' ? `${activeTheme.iconBg} ${activeTheme.text} font-bold` : 'text-gray-400'}`}>☰ Feed</button>
                </div>
              </div>
            </div>

            {viewType === "grid" ? (
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden shadow-sm">
                {posts.flatMap(post => post.urls).map((url: string, index: number) => (
                  <div key={index} className="relative group overflow-hidden aspect-square cursor-pointer" onClick={() => setFullscreenImage(url)}>
                    <SmoothImage src={url} alt="Wedding" className="w-full h-full group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* 🟢 Passing the Delete functions to Feed Posts */}
                {posts.map((post) => <GuestFeedPost key={post.id} post={post} currentUserName={guestName} onRefresh={() => fetchData(true)} weddingSlug={weddingSlug} coupleNames={weddingInfo.couple_names} theme={activeTheme} onDeletePost={handleDeletePost} onDeleteComment={handleDeleteComment} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6 px-1">
            {!isGuestbookBlocked ? (
              <div className={`bg-white p-4 rounded-3xl shadow-sm border ${activeTheme.border} flex flex-col gap-3 transition-colors duration-500`}>
                <h3 className="font-bold text-gray-800 text-sm">Share Your Wishes ✍️</h3>
                <textarea value={greetingText} onChange={(e) => setGreetingText(e.target.value)} maxLength={500} placeholder="Write a beautiful wish for the couple (Max 500 chars)..." className={`border ${activeTheme.border} rounded-xl px-4 py-2 text-sm outline-none ${activeTheme.outline} ${activeTheme.bgLight} bg-opacity-30 text-gray-800 h-20 resize-none transition-colors duration-500`} />
                <button onClick={() => handleSendGreeting('text')} className={`${activeTheme.main} text-white py-2.5 rounded-xl font-bold text-sm shadow hover:opacity-90 transition-colors duration-500`}>Post Wish</button>
                <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                  <span className="text-xs text-gray-500 font-medium">Leave a voice message:</span>
                  {!isRecordingVoice ? (
                    <button onClick={startVoiceRecording} className="bg-gray-100 text-gray-700 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:bg-gray-200 transition">🎙️ Start Recording</button>
                  ) : (
                    <div className="flex items-center justify-between bg-red-50 p-2 rounded-xl border border-red-200"><span className="text-xs text-red-600 font-bold animate-pulse">Recording... 00:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}</span><button onClick={stopVoiceRecording} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold">Stop & Send</button></div>
                  )}
                  {voiceBlob && !isRecordingVoice && (
                    <div className="flex items-center justify-between bg-green-50 p-2 rounded-xl border border-green-200 text-xs text-green-700 font-bold"><span>✅ Voice note ready!</span><button onClick={() => handleSendGreeting('voice')} className="bg-green-600 text-white px-3 py-1 rounded-lg">Send</button></div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 text-center flex flex-col items-center gap-2"><span className="text-3xl">🔒</span><p className="text-gray-600 font-bold text-sm">The guestbook is currently closed for new entries.</p></div>
            )}
            <div className="flex flex-col gap-3">
              {greetings.map((greeting) => {
                const isHostMsg = greeting.user_name === "Mr & Mrs" || greeting.user_name === weddingInfo.couple_names;
                return (
                  <div key={greeting.id} className={`bg-white p-4 rounded-2xl shadow-sm border ${greeting.is_pinned ? 'border-yellow-300 bg-yellow-50/20' : (isHostMsg ? `${activeTheme.border} ${activeTheme.bgLight} bg-opacity-30` : 'border-gray-100')} relative transition-colors duration-500`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isHostMsg ? `${activeTheme.main} text-white` : `${activeTheme.iconBg} ${activeTheme.text}`} transition-colors duration-500`}>{isHostMsg ? '👑' : greeting.user_name.charAt(0).toUpperCase()}</div>
                      <div><span className={`text-sm block ${isHostMsg ? `font-extrabold ${activeTheme.text}` : 'font-bold text-gray-800'} transition-colors duration-500`}>{greeting.user_name} {greeting.is_pinned && <span className="text-[10px] bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full ml-1 uppercase">Pinned</span>}</span></div>
                    </div>
                    {greeting.type === "text" && <p className={`text-gray-600 text-sm leading-relaxed ${activeTheme.bgLight} bg-opacity-50 p-3 rounded-xl italic transition-colors duration-500`}>"{greeting.content}"</p>}
                    {greeting.type === "voice" && <audio controls src={greeting.content} className={`w-full h-10 outline-none rounded-full ${activeTheme.bgLight} transition-colors duration-500`} />}
                    {greeting.liked_by_host && <div className="mt-3 text-xs text-gray-600 font-medium flex items-center gap-1 relative z-10">Liked by <span className={`font-bold ${activeTheme.text} transition-colors duration-500`}>👩‍❤️‍👨 Mr & Mrs</span></div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!isUploadBlocked && <button onClick={() => setIsUploadOpen(true)} className={`fixed bottom-6 right-6 ${activeTheme.main} text-white w-14 h-14 rounded-full shadow-lg text-3xl flex items-center justify-center hover:opacity-90 z-40 transition-transform hover:scale-105 duration-500`}>＋</button>}

      {isInfoOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-fade-in-up relative text-center border-t-4 ${activeTheme.borderMain} transition-colors duration-500`}>
            <button onClick={() => setIsInfoOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-3xl font-bold leading-none">×</button>
            <div className={`w-16 h-16 ${activeTheme.iconBg} ${activeTheme.text} rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner border ${activeTheme.border} transition-colors duration-500`}>ℹ️</div>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed font-medium px-2">Would you like a beautiful Digital Gallery like this for your own wedding? Contact us for bookings and technical support.</p>
            <div className={`${activeTheme.bgLight} ${activeTheme.text} py-3 rounded-2xl font-bold text-sm border ${activeTheme.border} shadow-sm flex flex-col gap-1 transition-colors duration-500`}><span>Powered by MX Tech</span><span className="text-lg">📞 0785508792</span></div>
          </div>
        </div>
      )}

      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-fade-in-up">
            <div className="flex justify-between items-center"><h3 className="font-bold text-gray-800 text-lg">Add Photos 📸</h3><button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">×</button></div>
            
            {/* 🟢 Caption Input Input Field */}
            <input type="text" value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} placeholder="Write a caption (optional)..." className={`w-full border-2 ${activeTheme.border} rounded-xl px-4 py-3 mb-1 text-sm font-medium focus:outline-none ${activeTheme.outline} text-gray-800 ${activeTheme.bgLight} bg-opacity-50 transition-colors duration-500`} />

            <div className="grid grid-cols-2 gap-3 mt-1">
              <label className={`${activeTheme.bgLight} ${activeTheme.text} font-bold py-5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:opacity-80 transition cursor-pointer border ${activeTheme.border} duration-500`}><span className="text-3xl">📷</span><span className="text-sm">Camera</span><input type="file" accept="image/jpeg, image/png, image/jpg" capture="environment" onChange={handlePhotoUpload} className="hidden" /></label>
              <label className={`bg-gray-50 text-gray-600 font-bold py-5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition cursor-pointer border border-gray-200`}><span className="text-3xl">🖼️</span><span className="text-sm">Gallery</span><input type="file" accept="image/jpeg, image/png, image/jpg" multiple onChange={handlePhotoUpload} className="hidden" /></label>
            </div>
            <p className="text-xs text-center text-gray-400 mt-1">Photos will be compressed automatically.</p>
          </div>
        </div>
      )}

      {isEditNameOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-fade-in-up flex flex-col gap-4">
            <h3 className="font-bold text-gray-800 text-center text-lg">{guestName ? "Update Your Name" : "Please Enter Your Name"}</h3>
            <div className="flex justify-center mb-2"><div className={`w-16 h-16 rounded-full ${activeTheme.iconBg} ${activeTheme.text} flex items-center justify-center text-3xl font-bold shadow-inner transition-colors duration-500`}>{tempName ? tempName.charAt(0).toUpperCase() : '👤'}</div></div>
            <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Your Name..." className={`border-2 ${activeTheme.border} rounded-xl px-4 py-3 text-center font-bold text-gray-800 focus:outline-none ${activeTheme.outline} ${activeTheme.bgLight} bg-opacity-50 transition-colors duration-500`} />
            <button onClick={saveNameChange} className={`${activeTheme.main} text-white font-bold py-3 rounded-xl shadow-md hover:opacity-90 transition-colors duration-500`}>Save Name</button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 animate-fade-in-up">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke={activeTheme.stroke} strokeWidth="8" /><circle cx="50" cy="50" r="45" fill="none" stroke={activeTheme.fill} strokeWidth="8" strokeLinecap="round" strokeDasharray="283" strokeDashoffset={283 - (283 * uploadProgressPercent) / 100} className="transition-all duration-300 ease-out" /></svg>
              <span className={`text-2xl font-extrabold ${activeTheme.text} transition-colors duration-500`}>{uploadProgressPercent}%</span>
            </div>
            <div className="text-center"><h3 className="font-bold text-gray-800 text-lg mb-1">{uploadProgressText}</h3><p className="text-xs text-gray-500">Please don't close the app.</p></div>
          </div>
        </div>
      )}

      {fullscreenImage && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-2 backdrop-blur-md">
          <button className="absolute top-6 right-6 text-white text-3xl font-bold bg-white/20 w-12 h-12 rounded-full flex items-center justify-center z-50 hover:bg-red-500 transition" onClick={() => setFullscreenImage(null)}>×</button>
          <img src={fullscreenImage} alt="Fullscreen" className="max-w-full max-h-[80vh] object-contain rounded-lg mb-10" />
          
          {/* 🟢 Guest Downloads Control */}
          {allowDownloads && (
            <div className="absolute bottom-8 flex items-center justify-center bg-white/10 px-8 py-4 rounded-full backdrop-blur-md border border-white/20">
              <button onClick={async () => {
                try {
                  const res = await fetch(fullscreenImage);
                  const blob = await res.blob();
                  const a = document.createElement('a');
                  a.href = window.URL.createObjectURL(blob);
                  a.download = `Wedding_Photo_${Date.now()}.jpg`;
                  a.click();
                  showToast("Downloaded successfully!", "success");
                } catch (e) {
                  showToast("Download failed.", "error");
                }
              }} className="text-3xl text-white hover:text-blue-400 transition-transform hover:scale-110 flex flex-col items-center gap-1">
                <span>⬇️</span><span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Save Photo</span>
              </button>
            </div>
          )}
        </div>
      )}

      {isProjectorOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center backdrop-blur-2xl">
          <button onClick={() => { setIsProjectorOpen(false); setIsSlideshowPlaying(false); setIsSlideshowFinished(false); if (audioRef.current) { audioRef.current.pause(); setIsPlayingMusic(false); } }} className="absolute top-6 right-6 text-white bg-white/20 hover:bg-red-600 rounded-full w-12 h-12 flex items-center justify-center text-2xl z-50 transition">×</button>
          {!isSlideshowPlaying && !isSlideshowFinished ? (
            <div className="text-center flex flex-col items-center gap-6 animate-fade-in-up z-50 p-6">
              <h2 className="text-4xl font-serif italic text-white drop-shadow-lg">Cinematic Memory</h2>
              <p className="text-white/60 text-sm max-w-xs">Relive the best moments of our special day</p>
              <button onClick={() => { setIsSlideshowPlaying(true); if (audioRef.current) { audioRef.current.play().catch(() => showToast("Please allow audio playback in your browser.", "error")); setIsPlayingMusic(true); } }} className={`mt-4 ${activeTheme.main} hover:opacity-90 text-white px-8 py-4 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-3 transition-transform transform hover:scale-105 duration-500`}>▶ Tap to Start</button>
            </div>
          ) : isSlideshowFinished ? (
            <div className="text-center flex flex-col items-center justify-center animate-fade-in-up z-50 p-6">
              <h2 className="text-4xl md:text-5xl font-serif italic text-white drop-shadow-lg mb-4">Thank You!</h2>
              <p className="text-white/80 text-lg md:text-xl max-w-md leading-relaxed mb-8">Thank you for being a part of our special day and making these memories unforgettable.</p>
              <button onClick={() => { setCurrentSlide(0); setIsSlideshowFinished(false); setIsSlideshowPlaying(true); if (audioRef.current && !isPlayingMusic) { audioRef.current.play(); setIsPlayingMusic(true); } }} className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-transform transform hover:scale-105 border border-white/30">🔄 Play Again</button>
            </div>
          ) : (
            <>
              <button onClick={() => { if (!audioRef.current) return; if (isPlayingMusic) { audioRef.current.pause(); setIsPlayingMusic(false); } else { audioRef.current.play(); setIsPlayingMusic(true); } }} className="absolute top-6 left-6 bg-white/10 text-white/70 px-4 py-2 rounded-full font-bold text-xs z-50 hover:bg-white/20 transition flex items-center gap-2">{isPlayingMusic ? "🎵 Pause Music" : "🔇 Play Music"}</button>
              {slideshowUrls.length > 0 && <div className="absolute inset-0 overflow-hidden bg-black flex items-center justify-center"><img key={currentSlide} src={slideshowUrls[currentSlide]} alt="Memory" className={`w-full h-full object-contain opacity-0 animate-kb-${currentSlide % 4}`} /></div>}
            </>
          )}
        </div>
      )}

      {/* 🟢 Confirmation Modal for Deleting Posts/Comments */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-fade-in-up flex flex-col gap-4 border-t-4 border-red-500">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-2 shadow-inner">⚠️</div>
            <h3 className="font-bold text-gray-800 text-center text-lg">{confirmDialog.message}</h3>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl shadow-sm hover:bg-gray-200 transition">Cancel</button>
              <button onClick={confirmDialog.onConfirm} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl shadow-sm hover:bg-red-600 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[200] px-6 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-3 animate-fade-in-up transition-all ${toast.type === 'success' ? 'bg-green-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}><span className="text-xl leading-none">{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span><span className="tracking-wide">{toast.message}</span></div>}
    </div>
  );
}