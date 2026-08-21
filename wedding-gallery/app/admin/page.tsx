"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { AppConfig } from "@/lib/config";

function AdminFeedPost({ 
  post, onDeletePhoto, onDeleteFullPost, onDeleteComment, onAddComment, onUpdate
}: { 
  post: any, 
  onDeletePhoto: (postId: string, photoIndex: number, currentUrls: string[]) => void, 
  onDeleteFullPost: (postId: string) => void,
  onDeleteComment: (commentId: string) => void,
  onAddComment: (postId: string, text: string) => void,
  onUpdate: () => void
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
        <button onClick={() => onDeleteFullPost(post.id)} className="bg-white text-gray-400 hover:bg-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-all transform hover:scale-110" title="Delete Entire Post">🗑️</button>
      </div>
      
      <div className="relative w-full group cursor-pointer" onDoubleClick={handleDoubleTap}>
        <div onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none' }}>
          {post.urls.map((url: string, index: number) => (
            <div key={index} className="w-full h-auto max-h-[500px] flex-shrink-0 snap-center relative">
              <img src={url} alt="Wedding" className="w-full h-full object-cover max-h-[500px]" />
              <button onClick={(e) => { e.stopPropagation(); onDeletePhoto(post.id, index, post.urls); }} className="absolute top-3 right-3 bg-white/90 text-gray-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-gray-200 transition-all flex items-center gap-1 backdrop-blur-sm">🗑️ Remove</button>
            </div>
          ))}
        </div>
        {showHeart && <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"><div className="text-white text-8xl drop-shadow-2xl animate-bounce">❤️</div></div>}
        {post.urls.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {post.urls.map((_: string, i: number) => <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex ? "w-5 bg-pink-500" : "w-2 bg-white bg-opacity-80"}`} />)}
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-6">
          <button onClick={handleHostLike} className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
            <span className={`text-2xl transition-transform ${post.liked_by_host ? 'scale-110 text-red-500' : ''}`}>{post.liked_by_host ? "❤️" : "🤍"}</span>
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

export default function AdminPage() {
  // --- Auth States ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // --- App States ---
  const [activeTab, setActiveTab] = useState("album");
  const [viewType, setViewType] = useState("feed");
  const [posts, setPosts] = useState<any[]>([]);
  const [greetings, setGreetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newGreetingComment, setNewGreetingComment] = useState("");
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 1. Component එක Load වෙද්දී Password එක මතකද කියලා බලනවා
  useEffect(() => {
    const authStatus = localStorage.getItem("isAdminAuth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    setIsAuthChecking(false);
  }, []);

  const fetchData = async (isSilent = false) => {
    if (!isAuthenticated) return; // Auth වෙලා නැත්නම් Fetch කරන්නේ නෑ
    if (!isSilent) setIsLoading(true);
    const { data: postsData } = await supabase.from('posts').select('*, comments(*)').order('created_at', { ascending: false });
    const { data: greetingsData } = await supabase.from('greetings').select('*').order('created_at', { ascending: false });

    if (postsData) setPosts(postsData);
    if (greetingsData) setGreetings(greetingsData);
    if (!isSilent) setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(() => fetchData(true), 5000);
      const handleVisibilityChange = () => { if (document.visibilityState === 'visible') fetchData(true); };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => { clearInterval(interval); document.removeEventListener("visibilitychange", handleVisibilityChange); };
    }
  }, [isAuthenticated]);

  const slideshowUrls = posts.flatMap(p => p.selected_photos || []);

  useEffect(() => {
    if (!isProjectorOpen || slideshowUrls.length === 0) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slideshowUrls.length), 4000);
    return () => clearInterval(timer);
  }, [isProjectorOpen, slideshowUrls.length]);

  // --- Login Function ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === AppConfig.adminPassword) {
      setIsAuthenticated(true);
      localStorage.setItem("isAdminAuth", "true"); // Password එක Save කරගන්නවා
    } else {
      alert("මුරපදය වැරදියි! කරුණාකර නැවත උත්සාහ කරන්න.");
      setPasswordInput("");
    }
  };

  // --- Logout Function ---
  const handleLogout = () => {
    setIsAuthenticated(false);
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
  };

  const handleHostUpload = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('wedding-photos').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('wedding-photos').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      await supabase.from('posts').insert([{ user_name: AppConfig.hostName, urls: uploadedUrls }]);
      setIsUploadOpen(false);
      fetchData(true);
    } catch (error) {
      alert("උඩුගත කිරීම අසාර්ථකයි.");
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

  // 2. Load වෙනකන් සුදු තිරයක් පෙන්වීම (Flicker එක නැති කිරීමට)
  if (isAuthChecking) {
    return <div className="min-h-screen bg-pink-50"></div>;
  }

  // 3. Login වී නැත්නම්, Login Form එක පෙන්වීම
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
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center tracking-widest focus:outline-none focus:border-pink-500 text-gray-800"
            />
            <button type="submit" className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl shadow-md hover:bg-pink-600 transition">
              ඇතුල් වන්න
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Login වී ඇත්නම් ප්‍රධාන Admin පිටුව පෙන්වීම
  return (
    <div className="min-h-screen bg-pink-50 font-sans pb-24 relative">
      <div className="bg-white px-4 py-3 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-20 flex items-center justify-between border-b-4 border-pink-500">
        <div className="flex items-center gap-2 bg-pink-100 text-pink-600 px-3 py-1.5 rounded-full shadow-inner font-bold text-sm">👑 Host View</div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center pointer-events-none flex flex-col items-center">
          <h2 className="text-gray-800 font-extrabold text-xl leading-tight mt-1">{AppConfig.coupleNames}</h2>
        </div>
        <button onClick={handleLogout} className="text-xs font-bold text-gray-400 hover:text-red-500 transition border px-2 py-1 rounded-lg">Logout</button>
      </div>

      <div className="flex justify-center mb-4 px-4">
        <div className="bg-white rounded-full flex w-full max-w-sm shadow-sm border border-pink-100 p-1">
          <button onClick={() => setActiveTab("album")} className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === "album" ? "bg-pink-500 text-white shadow-md" : "text-gray-500 hover:bg-pink-50"}`}>🖼️ Album</button>
          <button onClick={() => setActiveTab("guestbook")} className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === "guestbook" ? "bg-pink-500 text-white shadow-md" : "text-gray-500 hover:bg-pink-50"}`}>📖 Guestbook</button>
        </div>
      </div>

      <div className="px-2 max-w-lg mx-auto">
        {uploading && <div className="flex justify-center mb-4"><p className="bg-white px-4 py-2 rounded-full text-pink-500 font-bold shadow-md animate-pulse text-sm">උඩුගත වෙමින් පවතී... ⏳</p></div>}
        {isLoading ? (
          <div className="flex justify-center items-center h-40"><p className="text-pink-500 font-bold animate-pulse">Loading Admin Data...</p></div>
        ) : activeTab === "album" ? (
          <div className="w-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-3 px-2">
              <h3 className="font-bold text-gray-700 text-sm">Photos Control</h3>
              <div className="flex gap-2 items-center">
                {slideshowUrls.length > 0 && viewType === 'grid' && (
                  <button onClick={() => { setIsProjectorOpen(true); setCurrentSlide(0); }} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1 transition-transform transform hover:scale-105 animate-pulse">🎬 Play ({slideshowUrls.length})</button>
                )}
                <div className="flex gap-1 bg-white p-1 rounded-lg border border-pink-200 shadow-sm">
                  <button onClick={() => setViewType("grid")} className={`px-2 py-1 rounded text-xs transition-all ${viewType === 'grid' ? 'bg-pink-100 text-pink-600 font-bold' : 'text-gray-400'}`}>Grid</button>
                  <button onClick={() => setViewType("feed")} className={`px-2 py-1 rounded text-xs transition-all ${viewType === 'feed' ? 'bg-pink-100 text-pink-600 font-bold' : 'text-gray-400'}`}>Feed</button>
                </div>
              </div>
            </div>

            {viewType === "grid" ? (
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden shadow-sm">
                {posts.flatMap(post => post.urls.map((url: string, idx: number) => ({ post, url, idx }))).map((item, index) => {
                  const isSelected = (item.post.selected_photos || []).includes(item.url);
                  return (
                    <div key={index} className="relative group overflow-hidden rounded-lg">
                      <img src={item.url} alt="Wedding" className={`aspect-square object-cover w-full h-full transition-all ${isSelected ? 'ring-4 ring-yellow-400 opacity-90' : ''}`} />
                      <button onClick={() => toggleSlideshow(item.post.id, item.url, item.post.selected_photos || [])} className={`absolute top-1 left-1 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-md transition-all border ${isSelected ? 'bg-yellow-400 text-white border-yellow-500 scale-110' : 'bg-white/80 text-gray-400 border-gray-200 hover:bg-yellow-50'}`}>{isSelected ? "⭐" : "☆"}</button>
                      <button onClick={() => handleDeletePhoto(item.post.id, item.idx, item.post.urls)} className="absolute top-1 right-1 bg-white/90 text-gray-500 hover:bg-red-600 hover:text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md border border-gray-200 transition-colors">🗑️</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {posts.map((post) => <AdminFeedPost key={post.id} post={post} onDeletePhoto={handleDeletePhoto} onDeleteFullPost={handleDeleteFullPost} onDeleteComment={handleDeleteComment} onAddComment={handleAddComment} onUpdate={() => fetchData(true)} />)}
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
              {greetings.map((greeting) => {
                const isHostMsg = greeting.user_name === AppConfig.hostName;
                return (
                  <div key={greeting.id} className={`bg-white p-4 rounded-2xl shadow-sm border ${isHostMsg ? 'border-pink-300' : 'border-pink-100'} relative`}>
                    <button onClick={() => handleDeleteGreeting(greeting.id)} className="absolute top-3 right-3 bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-all">🗑️</button>
                    <div className="flex items-center gap-2 mb-3 pr-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isHostMsg ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'}`}>
                        {isHostMsg ? '👑' : greeting.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div><span className={`text-sm block ${isHostMsg ? 'font-extrabold text-pink-600' : 'font-bold text-gray-800'}`}>{greeting.user_name}</span></div>
                    </div>
                    {greeting.type === "text" && <p className="text-gray-600 text-sm leading-relaxed bg-pink-50 p-3 rounded-xl italic">"{greeting.content}"</p>}
                    {greeting.type === "voice" && <audio controls src={greeting.content} className="w-full h-10 outline-none rounded-full bg-purple-50" />}
                    {greeting.type === "video" && <video controls src={greeting.content} className="w-full rounded-xl max-h-64 bg-black object-contain" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button onClick={() => setIsUploadOpen(true)} className="fixed bottom-6 right-6 bg-pink-500 text-white w-14 h-14 rounded-full shadow-lg text-3xl flex items-center justify-center hover:bg-pink-600 z-40">+</button>

      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-opacity">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Post as {AppConfig.hostName} 👑</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-red-500 text-3xl leading-none font-bold">×</button>
            </div>
            <div className="flex flex-col gap-4">
              <label className="bg-blue-50 border-2 border-blue-200 text-blue-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-100 transition-colors cursor-pointer">
                <span className="text-3xl">🖼️</span> ෆෝන් එකෙන් තෝරන්න
                <input type="file" accept="image/*" multiple onChange={handleHostUpload} className="hidden" />
              </label>
            </div>
            <p className="text-center text-gray-400 text-xs mt-6">ඔබ එකතු කරන ඡායාරූප {AppConfig.hostName} නමින් පෙන්වනු ඇත.</p>
          </div>
        </div>
      )}

      {isProjectorOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center backdrop-blur-3xl animate-fade-in-up">
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