"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { AppConfig } from "@/lib/config";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// --- Image Compressor Helper ---
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
// Admin Splash Screen Component
// -------------------------------------------------------------
const AdminSplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [walk, setWalk] = useState(false);
  const [showNames, setShowNames] = useState(false);

  useEffect(() => {
    const walkTimer = setTimeout(() => setWalk(true), 100);
    const nameTimer = setTimeout(() => setShowNames(true), 1600);
    const redirectTimer = setTimeout(() => onFinish(), 5000);
    return () => { clearTimeout(walkTimer); clearTimeout(nameTimer); clearTimeout(redirectTimer); };
  }, []);

  const nameParts = AppConfig.coupleNames.split("&");
  const name1 = nameParts[0]?.trim() || "Saman";
  const name2 = nameParts[1]?.trim() || "Lilly";

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
          {AppConfig.weddingDate}
        </p>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Admin Greeting Component
// -------------------------------------------------------------
function AdminGreetingItem({ greeting, onDelete, onUpdate, onPin }: any) {
  const [showHeart, setShowHeart] = useState(false);
  const isHostMsg = greeting.user_name === AppConfig.hostName;

  const handleDoubleTap = async (e: any) => {
    e.preventDefault();
    const currentlyLiked = greeting.liked_by_host || false;
    const newLikes = currentlyLiked ? Math.max(0, (greeting.likes || 1) - 1) : (greeting.likes || 0) + 1;
    await supabase.from('greetings').update({ likes: newLikes, liked_by_host: !currentlyLiked }).eq('id', greeting.id);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    onUpdate();
  };

  return (
    <div className={`bg-white p-4 rounded-2xl shadow-sm border overflow-hidden relative select-none cursor-pointer ${greeting.is_pinned ? 'border-yellow-300 bg-yellow-50/20' : (isHostMsg ? 'border-pink-300' : 'border-pink-100')}`} onDoubleClick={handleDoubleTap}>
      <div className="absolute top-3 right-3 flex gap-2 z-20">
        <button onClick={(e) => { e.stopPropagation(); onPin(greeting.id, greeting.is_pinned || false); }} className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-all transform hover:scale-110 ${greeting.is_pinned ? 'bg-yellow-400 text-white border-yellow-500' : 'bg-gray-50 text-gray-400 hover:bg-yellow-50'}`} title="Pin">📌</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(greeting.id); }} className="bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-all transform hover:scale-110" title="Delete">🗑️</button>
      </div>

      <div className="flex items-center gap-2 mb-3 pr-20 relative z-10">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isHostMsg ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'}`}>
          {isHostMsg ? '👑' : greeting.user_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className={`text-sm block ${isHostMsg ? 'font-extrabold text-pink-600' : 'font-bold text-gray-800'}`}>
            {greeting.user_name} {greeting.is_pinned && <span className="text-[10px] bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full ml-1 uppercase">Pinned</span>}
          </span>
        </div>
      </div>

      <div className="relative z-10">
        {greeting.type === "text" && <p className="text-gray-600 text-sm leading-relaxed bg-pink-50/50 p-3 rounded-xl italic pointer-events-none">"{greeting.content}"</p>}
        {greeting.type === "voice" && (
          <div onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
            <audio controls src={greeting.content} className="w-full h-10 outline-none rounded-full bg-purple-50" />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes instaHeart { 0% { transform: scale(0); opacity: 0; } 15% { transform: scale(1.2); opacity: 1; } 30% { transform: scale(1); opacity: 1; } 70% { transform: scale(1); opacity: 1; } 100% { transform: scale(0); opacity: 0; } }
        .animate-insta-heart { animation: instaHeart 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}} />

      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-rose-500 text-[6rem] drop-shadow-2xl animate-insta-heart leading-none">♥</div>
        </div>
      )}

      {greeting.liked_by_host && (
        <div className="mt-3 text-xs text-gray-600 font-medium flex items-center gap-1 relative z-10">
          Liked by <span className="font-bold text-pink-600">👩‍❤️‍👨 {AppConfig.hostName}</span>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Admin Feed Post Component
// -------------------------------------------------------------
function AdminFeedPost({ 
  post, onDeletePhoto, onDeleteFullPost, onDeleteComment, onAddComment, onUpdate, onPinPost
}: { 
  post: any, 
  onDeletePhoto: (postId: string, photoIndex: number, currentUrls: string[]) => void, 
  onDeleteFullPost: (postId: string) => void,
  onDeleteComment: (commentId: string) => void,
  onAddComment: (postId: string, text: string) => void,
  onUpdate: () => void,
  onPinPost: (postId: string, currentPinStatus: boolean) => void
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showHeart, setShowHeart] = useState(false);

  const handleScroll = (e: any) => { setActiveIndex(Math.round(e.target.scrollLeft / e.target.clientWidth)); };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() === "") return;
    onAddComment(post.id, newComment);
    setNewComment("");
  };

  const handleHostLike = async () => {
    const currentlyLiked = post.liked_by_host || false;
    const newLikes = currentlyLiked ? Math.max(0, (post.likes || 1) - 1) : (post.likes || 0) + 1;
    await supabase.from('posts').update({ likes: newLikes, liked_by_host: !currentlyLiked }).eq('id', post.id);
    onUpdate();
  };

  const handleDoubleTap = () => {
    if (!post.liked_by_host) handleHostLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const isHostPost = post.user_name === AppConfig.hostName;

  return (
    <div className={`bg-white rounded-2xl shadow-md border overflow-hidden relative ${post.is_pinned ? 'border-yellow-300' : 'border-pink-100'}`}>
      <div className={`p-3 flex items-center justify-between ${isHostPost ? 'bg-pink-100' : 'bg-pink-50'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${isHostPost ? 'bg-pink-500 text-white' : 'bg-pink-200 text-pink-600'}`}>
            {isHostPost ? '👑' : post.user_name.charAt(0).toUpperCase()}
          </div>
          <span className={`text-sm ${isHostPost ? 'font-extrabold text-pink-600 tracking-wide' : 'font-bold text-gray-700'}`}>
            {post.user_name}
          </span>
          {post.is_pinned && <span className="text-xs bg-yellow-100 text-yellow-600 font-bold px-2 py-0.5 rounded-full">Pinned 📌</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onPinPost(post.id, post.is_pinned || false)} className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-all transform hover:scale-110 ${post.is_pinned ? 'bg-yellow-400 text-white border-yellow-500' : 'bg-white text-gray-400 hover:bg-yellow-50'}`} title={post.is_pinned ? "Unpin Post" : "Pin Post"}>📌</button>
          <button onClick={() => onDeleteFullPost(post.id)} className="bg-white text-gray-400 hover:bg-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-all transform hover:scale-110" title="Delete Entire Post">🗑️</button>
        </div>
      </div>

      <div className="relative w-full group cursor-pointer select-none" onDoubleClick={handleDoubleTap}>
        <div onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none' }}>
          {post.urls.map((url: string, index: number) => (
            <div key={index} className="w-full h-auto max-h-[500px] flex-shrink-0 snap-center relative">
              <img src={url} alt="Wedding" className="w-full h-full object-cover max-h-[500px] pointer-events-none" />
              <button onClick={(e) => { e.stopPropagation(); onDeletePhoto(post.id, index, post.urls); }} className="absolute top-3 right-3 bg-white/90 text-gray-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-gray-200 transition-all flex items-center gap-1 backdrop-blur-sm z-40">🗑️ Remove</button>
            </div>
          ))}
        </div>

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

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-6">
          <button onClick={handleHostLike} className="flex items-center gap-1 text-gray-500 hover:text-rose-500 transition-colors">
            <span className={`text-3xl leading-none transition-transform ${post.liked_by_host ? 'scale-110 text-rose-500' : 'hover:scale-110 text-gray-400'}`}>{post.liked_by_host ? "♥" : "♡"}</span>
            <span className="font-bold">{post.likes || 0}</span>
          </button>
          <button onClick={() => setIsCommentOpen(true)} className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
            <span className="text-2xl">💬</span><span className="font-bold text-sm">{(post.comments || []).length} Comments</span>
          </button>
        </div>
        {post.liked_by_host && (
          <div className="text-xs text-gray-600 font-medium flex items-center gap-1">
            Liked by <span className="font-bold text-pink-600">👩‍❤️‍👨 {AppConfig.hostName}</span>
          </div>
        )}
      </div>

      {isCommentOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh] animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-gray-800 text-base">Host Comment Manager</h3>
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
                    <button onClick={() => onDeleteComment(c.id)} className="text-gray-400 hover:text-red-500 p-1 text-sm transition-colors">🗑️</button>
                  </div>
                );
              })}
            </div>
            <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2 border-t border-gray-100">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={`Reply as ${AppConfig.hostName}...`} className="flex-1 border border-pink-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 bg-pink-50/50 text-gray-800" />
              <button type="submit" className="bg-pink-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-pink-600 transition shadow-sm">Reply</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Main Admin Page
// -------------------------------------------------------------
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  const [activeTab, setActiveTab] = useState("album");
  const [viewType, setViewType] = useState("feed");
  const [posts, setPosts] = useState<any[]>([]);
  const [greetings, setGreetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newGreetingComment, setNewGreetingComment] = useState("");
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Upload States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  // Grid Fullscreen & Download Menus
  const [fullscreenData, setFullscreenData] = useState<{url: string, post: any, idx: number} | null>(null);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem("isAdminAuth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setShowSplash(true); 
    }
    setIsAuthChecking(false);
  }, []);

  const fetchData = async (isSilent = false) => {
    if (!isAuthenticated) return;
    if (!isSilent) setIsLoading(true);
    const { data: postsData } = await supabase.from('posts').select('*, comments(*)').order('created_at', { ascending: false });
    const { data: greetingsData } = await supabase.from('greetings').select('*').order('created_at', { ascending: false });

    if (postsData) {
      const sortedPosts = postsData.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0;
      });
      setPosts(sortedPosts);
    }
    if (greetingsData) {
      const sortedGreetings = greetingsData.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0;
      });
      setGreetings(sortedGreetings);
    }
    if (!isSilent) setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && !showSplash) {
      fetchData();
      const interval = setInterval(() => fetchData(true), 5000);
      const handleVisibilityChange = () => { if (document.visibilityState === 'visible') fetchData(true); };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => { clearInterval(interval); document.removeEventListener("visibilitychange", handleVisibilityChange); };
    }
  }, [isAuthenticated, showSplash]);

  const slideshowUrls = posts.flatMap(p => p.selected_photos || []);

  useEffect(() => {
    if (!isProjectorOpen || slideshowUrls.length === 0) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slideshowUrls.length), 4000);
    return () => clearInterval(timer);
  }, [isProjectorOpen, slideshowUrls.length]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === AppConfig.adminPassword) {
      setIsAuthenticated(true);
      setShowSplash(true); 
      localStorage.setItem("isAdminAuth", "true"); 
    } else {
      alert("මුරපදය වැරදියි! කරුණාකර නැවත උත්සාහ කරන්න.");
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowSplash(false);
    localStorage.removeItem("isAdminAuth");
    setPosts([]);
    setGreetings([]);
  };

  const toggleSlideshow = async (postId: string, url: string, currentSelected: string[]) => {
    let newSelected = [];
    if (currentSelected.includes(url)) {
      newSelected = currentSelected.filter(u => u !== url);
    } else {
      newSelected = [...currentSelected, url];
    }
    setPosts(posts.map(p => p.id === postId ? { ...p, selected_photos: newSelected } : p));
    await supabase.from('posts').update({ selected_photos: newSelected }).eq('id', postId);

    if (fullscreenData && fullscreenData.post.id === postId) {
      setFullscreenData({ ...fullscreenData, post: { ...fullscreenData.post, selected_photos: newSelected }});
    }
  };

  const handleHostUpload = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;

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

      await supabase.from('posts').insert([{ user_name: AppConfig.hostName, urls: uploadedUrls }]);
      setIsUploadOpen(false);
      fetchData(true);
      alert("Photos uploaded successfully!");
    } catch (error) {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (postId: string, photoIndex: number, currentUrls: string[]) => {
    if (window.confirm("මෙම නිශ්චිත ඡායාරූපය පමණක් මකා දැමීමට අවශ්‍යද?")) {
      const updatedUrls = currentUrls.filter((_, idx) => idx !== photoIndex);
      if (updatedUrls.length === 0) {
        await supabase.from('posts').delete().eq('id', postId);
      } else {
        await supabase.from('posts').update({ urls: updatedUrls }).eq('id', postId);
      }
      fetchData(true);
    }
  };

  const handleDeleteFullPost = async (postId: string) => {
    if (window.confirm("මෙම සම්පූර්ණ Post එකම මකා දැමීමට අවශ්‍ය බව විශ්වාසද?")) {
      await supabase.from('posts').delete().eq('id', postId);
      fetchData(true);
    }
  };

  const handlePinPost = async (postId: string, currentPinStatus: boolean) => {
    try {
      await supabase.from('posts').update({ is_pinned: !currentPinStatus }).eq('id', postId);
      fetchData(true);
    } catch (error) {
      alert("Pin කිරීම අසාර්ථකයි.");
    }
  };

  const handlePinGreeting = async (id: string, currentPinStatus: boolean) => {
    try {
      await supabase.from('greetings').update({ is_pinned: !currentPinStatus }).eq('id', id);
      fetchData(true);
    } catch (error) {
      alert("Pin කිරීම අසාර්ථකයි.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm("මෙම කමෙන්ට් එක මකා දැමීමට අවශ්‍යද?")) {
      await supabase.from('comments').delete().eq('id', commentId);
      fetchData(true);
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    await supabase.from('comments').insert([{ post_id: postId, user_name: AppConfig.hostName, text: text, is_admin: true }]);
    fetchData(true);
  };

  const handleDeleteGreeting = async (id: string) => {
    if (window.confirm("මෙම සුබපැතුම මකා දැමීමට අවශ්‍යද?")) {
      await supabase.from('greetings').delete().eq('id', id);
      fetchData(true);
    }
  };

  const handleAddHostGreeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGreetingComment.trim() === "") return;
    await supabase.from('greetings').insert([{ user_name: AppConfig.hostName, type: "text", content: newGreetingComment }]);
    setNewGreetingComment("");
    fetchData(true);
  };

  const downloadMultipleImages = async (type: 'all' | 'fav') => {
    setIsDownloadMenuOpen(false);
    const urlsToDownload = type === 'all' 
      ? posts.flatMap(p => p.urls) 
      : posts.flatMap(p => p.selected_photos || []);

    if (urlsToDownload.length === 0) {
      alert("බාගත කිරීමට ඡායාරූප නොමැත!");
      return;
    }

    setUploading(true);
    setUploadProgressText("Zipping Photos...");

    try {
      const zip = new JSZip();
      
      for (let i = 0; i < urlsToDownload.length; i++) {
        const response = await fetch(urlsToDownload[i]);
        const blob = await response.blob();
        zip.file(`Wedding_Photo_${i + 1}.jpg`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Wedding_Photos_${type === 'all' ? 'All' : 'Favorites'}.zip`);
      setUploading(false);
      alert("සාර්ථකව බාගත කරන ලදී!");

    } catch (err) {
      console.error("Download error:", err);
      setUploading(false);
      alert("බාගත කිරීම අසාර්ථකයි.");
    }
  };

  if (isAuthChecking) return <div className="min-h-screen bg-pink-50"></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-pink-100 w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">👑</div>
            <h2 className="text-xl font-bold text-gray-800">Admin Login</h2>
            <p className="text-xs text-gray-500 mt-1">කරුණාකර මුරපදය ඇතුළත් කරන්න</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Password..." className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center tracking-widest focus:outline-none focus:border-pink-500 text-gray-800" />
            <button type="submit" className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl shadow-md hover:bg-pink-600 transition">ඇතුල් වන්න</button>
          </form>
        </div>
      </div>
    );
  }

  if (showSplash) {
    return <AdminSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-pink-50 font-sans pb-24 relative">
      {/* Header Updated with Smaller Name and Emoji Only Tag */}
      <div className="bg-white px-3 py-3 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-20 flex items-center justify-between border-b-4 border-pink-500">
        <div className="flex items-center bg-pink-50 px-2 py-1.5 rounded-full border border-pink-100 shadow-inner z-10" title="Host View">
          <span className="text-lg leading-none">👩‍❤️‍👨</span>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 text-center pointer-events-none flex flex-col items-center w-[60%]">
          <h2 className="text-gray-800 font-extrabold text-lg leading-tight mt-1 truncate w-full">{AppConfig.coupleNames}</h2>
        </div>

        <button onClick={handleLogout} className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition border px-2 py-1 rounded-lg z-10 bg-white">Logout</button>
      </div>

      <div className="flex justify-center mb-4 px-4">
        <div className="bg-white rounded-full flex w-full max-w-sm shadow-sm border border-pink-100 p-1">
          <button onClick={() => setActiveTab("album")} className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === "album" ? "bg-pink-500 text-white shadow-md" : "text-gray-500 hover:bg-pink-50"}`}>🖼️ Album</button>
          <button onClick={() => setActiveTab("guestbook")} className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === "guestbook" ? "bg-pink-500 text-white shadow-md" : "text-gray-500 hover:bg-pink-50"}`}>📖 Guestbook</button>
        </div>
      </div>

      <div className="px-2 max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-40"><p className="text-pink-500 font-bold animate-pulse">Loading Admin Data...</p></div>
        ) : activeTab === "album" ? (
          <div className="w-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-3 px-2">
              <h3 className="font-bold text-gray-700 text-sm">Photos Control</h3>
              <div className="flex gap-2 items-center">

                {viewType === 'grid' && (
                  <div className="relative">
                    <button onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition border border-blue-200">
                      📥 Download
                    </button>
                    {isDownloadMenuOpen && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-30 py-2 flex flex-col">
                        <button onClick={() => downloadMultipleImages('all')} className="text-xs text-left px-4 py-2 font-bold text-gray-700 hover:bg-pink-50">⬇️ All Pics</button>
                        <button onClick={() => downloadMultipleImages('fav')} className="text-xs text-left px-4 py-2 font-bold text-gray-700 hover:bg-pink-50">♥ Fav Pics Only</button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-1 bg-white p-1 rounded-lg border border-pink-200 shadow-sm">
                  <button onClick={() => setViewType("grid")} className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${viewType === 'grid' ? 'bg-pink-100 text-pink-600 font-bold' : 'text-gray-400'}`}>⊞ Grid</button>
                  <button onClick={() => setViewType("feed")} className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${viewType === 'feed' ? 'bg-pink-100 text-pink-600 font-bold' : 'text-gray-400'}`}>☰ Feed</button>
                </div>
              </div>
            </div>

            {viewType === "grid" && slideshowUrls.length > 0 && (
              <div className="mb-3 px-2 flex justify-end">
                <button onClick={() => { setIsProjectorOpen(true); setCurrentSlide(0); }} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-transform transform hover:scale-105 animate-pulse">
                  🎬 Play Favorites ({slideshowUrls.length})
                </button>
              </div>
            )}

            {viewType === "grid" ? (
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden shadow-sm relative">
                {posts.flatMap(post => post.urls.map((url: string, idx: number) => ({ post, url, idx }))).map((item, index) => {
                  const isSelected = (item.post.selected_photos || []).includes(item.url);
                  return (
                    <div key={index} className="relative group overflow-hidden rounded-lg cursor-pointer bg-gray-100" onClick={() => setFullscreenData({ url: item.url, post: item.post, idx: item.idx })}>
                      <img src={item.url} alt="Wedding" className={`aspect-square object-cover w-full h-full transition-all ${isSelected ? 'opacity-90' : 'hover:opacity-80'}`} />
                      {isSelected && <div className="absolute top-1 left-1 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md"><span className="text-rose-500 leading-none mt-0.5">♥</span></div>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {posts.map((post) => <AdminFeedPost key={post.id} post={post} onDeletePhoto={handleDeletePhoto} onDeleteFullPost={handleDeleteFullPost} onDeleteComment={handleDeleteComment} onAddComment={handleAddComment} onUpdate={() => fetchData(true)} onPinPost={handlePinPost} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full animate-fade-in-up">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-200 mb-6">
              <h4 className="font-bold text-gray-700 text-xs mb-2">Post as {AppConfig.hostName}</h4>
              <form onSubmit={handleAddHostGreeting} className="flex gap-2">
                <input type="text" value={newGreetingComment} onChange={(e) => setNewGreetingComment(e.target.value)} placeholder="ස්තුති පණිවිඩයක් ලියන්න..." className="flex-1 border border-pink-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-500 bg-pink-50/40 text-gray-800" />
                <button type="submit" className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-600 transition shadow-sm">Post</button>
              </form>
            </div>

            <h3 className="font-bold text-gray-700 text-sm mb-3 px-2">Guestbook Control ({greetings.length})</h3>
            <div className="flex flex-col gap-4">
              {greetings.map((greeting) => (
                <AdminGreetingItem key={greeting.id} greeting={greeting} onDelete={handleDeleteGreeting} onUpdate={() => fetchData(true)} onPin={handlePinGreeting} />
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => setIsUploadOpen(true)} className="fixed bottom-6 right-6 bg-pink-500 text-white w-14 h-14 rounded-full shadow-lg text-3xl flex items-center justify-center hover:bg-pink-600 z-40">+</button>

      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Post as {AppConfig.hostName}</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label className="bg-pink-50 text-pink-600 font-bold py-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-pink-100 transition cursor-pointer border border-pink-100">
                <span className="text-3xl">📷</span>
                <span className="text-sm">Camera</span>
                <input type="file" accept="image/jpeg, image/png, image/jpg" capture="environment" onChange={handleHostUpload} className="hidden" />
              </label>
              <label className="bg-purple-50 text-purple-600 font-bold py-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-purple-100 transition cursor-pointer border border-purple-100">
                <span className="text-3xl">🖼️</span>
                <span className="text-sm">Gallery</span>
                <input type="file" accept="image/jpeg, image/png, image/jpg" multiple onChange={handleHostUpload} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">Photos will be compressed automatically.</p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-bold text-sm tracking-wide">{uploadProgressText}</p>
        </div>
      )}

      {fullscreenData && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-2 backdrop-blur-xl">
          <button className="absolute top-6 right-6 text-white text-3xl font-bold bg-white/20 w-12 h-12 rounded-full flex items-center justify-center z-50 hover:bg-red-500 transition" onClick={() => setFullscreenData(null)}>×</button>

          <img src={fullscreenData.url} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-lg mb-20" />

          <div className="absolute bottom-6 flex items-center justify-center gap-8 bg-white/10 px-8 py-4 rounded-full backdrop-blur-md border border-white/20">
            <button onClick={() => toggleSlideshow(fullscreenData.post.id, fullscreenData.url, fullscreenData.post.selected_photos || [])} className="text-4xl transition-transform hover:scale-110 flex flex-col items-center gap-1">
              {(() => {
                const currentPost = posts.find(p => p.id === fullscreenData.post.id);
                const isFav = currentPost?.selected_photos?.includes(fullscreenData.url);
                return isFav ? <span className="text-rose-500 leading-none mt-1">♥</span> : <span className="text-white leading-none mt-1">♡</span>;
              })()}
              <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Fav</span>
            </button>

            <button onClick={async () => {
              try {
                const res = await fetch(fullscreenData.url);
                const blob = await res.blob();
                const a = document.createElement('a');
                a.href = window.URL.createObjectURL(blob);
                a.download = `Wedding_Photo_${Date.now()}.jpg`;
                a.click();
              } catch (e) { alert("බාගත කිරීම අසාර්ථකයි."); }
            }} className="text-3xl text-white hover:text-blue-400 transition-transform hover:scale-110 flex flex-col items-center gap-1">
              <span>⬇️</span>
              <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Save</span>
            </button>

            <button onClick={() => {
              handleDeletePhoto(fullscreenData.post.id, fullscreenData.idx, fullscreenData.post.urls);
              setFullscreenData(null);
            }} className="text-3xl text-white hover:text-red-500 transition-transform hover:scale-110 flex flex-col items-center gap-1">
              <span>🗑️</span>
              <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Del</span>
            </button>
          </div>
        </div>
      )}

      {/* Projector / Slideshow with Music */}
      {isProjectorOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center backdrop-blur-xl">
          <button onClick={() => setIsProjectorOpen(false)} className="absolute top-6 right-6 text-white bg-white/20 hover:bg-red-600 rounded-full w-12 h-12 flex items-center justify-center text-2xl transition z-50 backdrop-blur-md">×</button>
          {slideshowUrls.length === 0 ? (
            <p className="text-white text-xl">Slideshow සඳහා ඡායාරූප තෝරා නොමැත.</p>
          ) : (
            <>{slideshowUrls.map((url, idx) => <img key={idx} src={url} alt="Projector Slide" className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`} />)}</>
          )}
        </div>
      )}
    </div>
  );
}