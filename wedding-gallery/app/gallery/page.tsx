"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase"; 
import { AppConfig } from "@/lib/config"; // Config එක සම්බන්ධ කිරීම

function FeedPost({ post, onUpdate, currentUserName }: { post: any, onUpdate: () => void, currentUserName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const handleScroll = (e: any) => { setActiveIndex(Math.round(e.target.scrollLeft / e.target.clientWidth)); };

  const handleLike = async () => {
    if (isLiking || isLiked) return;
    setIsLiking(true);
    const newLikes = (post.likes || 0) + 1;
    await supabase.from('posts').update({ likes: newLikes }).eq('id', post.id);
    setIsLiked(true);
    onUpdate(); 
    setIsLiking(false);
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() === "") return;
    await supabase.from('comments').insert([{ post_id: post.id, user_name: currentUserName, text: newComment }]);
    setNewComment("");
    onUpdate(); 
  };

  // Config එකෙන් Host ගේ නම පරීක්ෂා කිරීම
  const isHostPost = post.user_name === AppConfig.hostName;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-pink-100 overflow-hidden">
      <div className={`p-3 flex items-center gap-2 ${isHostPost ? 'bg-pink-100' : 'bg-pink-50'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${isHostPost ? 'bg-pink-500 text-white' : 'bg-pink-200 text-pink-600'}`}>
          {isHostPost ? '👑' : post.user_name.charAt(0).toUpperCase()}
        </div>
        <span className={`text-sm ${isHostPost ? 'font-extrabold text-pink-600 tracking-wide' : 'font-bold text-gray-700'}`}>
          {post.user_name}
        </span>
      </div>
      
      <div className="relative w-full group cursor-pointer" onDoubleClick={handleDoubleTap}>
        <div onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none' }}>
          {post.urls.map((url: string, index: number) => (
            <img key={index} src={url} alt="Wedding" className="w-full h-auto max-h-[500px] object-cover flex-shrink-0 snap-center" />
          ))}
        </div>
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="text-white text-8xl drop-shadow-2xl animate-bounce">❤️</div>
          </div>
        )}
        {post.urls.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {post.urls.map((_: string, i: number) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex ? "w-5 bg-pink-500" : "w-2 bg-white bg-opacity-80"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-6">
          <button onClick={handleLike} disabled={isLiking || isLiked} className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
            <span className={`text-2xl transition-transform ${isLiked || post.liked_by_host ? 'scale-110 text-red-500' : ''}`}>
              {isLiked || post.liked_by_host ? "❤️" : "🤍"}
            </span>
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
              <h3 className="font-bold text-gray-800 text-base">Comments ({(post.comments || []).length})</h3>
              <button onClick={() => setIsCommentOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 mb-4" style={{ scrollbarWidth: 'thin' }}>
              {(post.comments || []).length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">තවම කමෙන්ට්ස් කිසිවක් නැත. පළමුවැන්නා වන්න!</p>
              ) : (
                post.comments.map((c: any) => {
                  const isHostComment = c.user_name === AppConfig.hostName;
                  return (
                    <div key={c.id} className={`p-3 rounded-2xl border flex items-start gap-2.5 ${isHostComment ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-100'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${isHostComment ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'}`}>
                        {isHostComment ? '👑' : c.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className={`text-xs block mb-0.5 ${isHostComment ? 'font-extrabold text-pink-600 text-sm' : 'font-bold text-gray-800'}`}>{c.user_name}</span>
                        <p className="text-gray-600 text-sm">{c.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-gray-100">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="ඔබේ අදහස දක්වන්න..." className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 text-gray-800" />
              <button type="submit" className="bg-pink-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-pink-600 transition shadow-sm">යවන්න</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState("album");
  const [viewType, setViewType] = useState("feed");
  const [userName, setUserName] = useState("Guest"); 
  const [posts, setPosts] = useState<any[]>([]);
  const [greetings, setGreetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false); 
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [newTextGreeting, setNewTextGreeting] = useState("");
  const [slideshowUrls, setSlideshowUrls] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    const { data: postsData } = await supabase.from('posts').select('*, comments(*)').order('created_at', { ascending: false });
    const { data: greetingsData } = await supabase.from('greetings').select('*').order('created_at', { ascending: false });

    if (postsData) {
      setPosts(postsData);
      setSlideshowUrls(postsData.flatMap(p => p.selected_photos || []));
    }
    if (greetingsData) setGreetings(greetingsData);
    if (!isSilent) setIsLoading(false);
  };

  useEffect(() => {
    const savedName = localStorage.getItem("guestName");
    if (savedName) setUserName(savedName);
    fetchData();

    const interval = setInterval(() => fetchData(true), 5000);
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') fetchData(true); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (slideshowUrls.length === 0 || viewType !== "grid") return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slideshowUrls.length), 3500);
    return () => clearInterval(timer);
  }, [slideshowUrls.length, viewType]);

  const uploadMedia = async (files: File[], bucketType: 'image' | 'video' | 'voice') => {
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const ext = bucketType === 'voice' ? 'webm' : file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('wedding-photos').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('wedding-photos').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      if (bucketType === 'image') {
        await supabase.from('posts').insert([{ user_name: userName, urls: uploadedUrls }]);
        setIsUploadOpen(false);
      } else {
        for (const url of uploadedUrls) {
          await supabase.from('greetings').insert([{ user_name: userName, type: bucketType, content: url }]);
        }
      }
      fetchData(true);
    } catch (error) {
      alert("උඩුගත කිරීම අසාර්ථකයි.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e: any, type: 'image' | 'video') => {
    const files = Array.from(e.target.files) as File[];
    if (files.length > 0) uploadMedia(files, type);
  };

  const toggleVoiceRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await uploadMedia([new File([audioBlob], "voice.webm")], 'voice');
          stream.getTracks().forEach(track => track.stop()); 
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (error) {
        alert("කරුණාකර මයික්‍රෆෝනය භාවිතා කිරීමට අවසර ලබා දෙන්න.");
      }
    }
  };

  const submitTextGreeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTextGreeting.trim() === "") return;
    setUploading(true);
    await supabase.from('greetings').insert([{ user_name: userName, type: 'text', content: newTextGreeting }]);
    setNewTextGreeting("");
    setIsTextModalOpen(false);
    setUploading(false);
    fetchData(true);
  };

  const handleSaveName = () => {
    if (tempName.trim() === "") return;
    setUserName(tempName.trim());
    localStorage.setItem("guestName", tempName.trim());
    setIsEditNameOpen(false);
  };

  const allPhotos = posts.flatMap(post => post.urls);

  return (
    <div className="min-h-screen bg-pink-50 font-sans pb-24 relative">
      <div className="bg-white px-4 py-3 rounded-b-3xl shadow-sm mb-6 sticky top-0 z-20 flex items-center justify-between border-b border-pink-100">
        <button onClick={() => { setTempName(userName); setIsEditNameOpen(true); }} className="flex items-center gap-2 hover:bg-pink-50 p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-pink-100" title="නම වෙනස් කරන්න">
          <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-sm shadow-inner">{userName.charAt(0).toUpperCase()}</div>
          <span className="font-bold text-sm text-gray-700 max-w-[80px] truncate">{userName}</span>
        </button>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center pointer-events-none flex flex-col items-center">
          <h2 className="text-gray-800 font-extrabold text-base leading-tight mt-1">Thank You!</h2>
          <p className="text-pink-500 text-[10px] font-serif uppercase tracking-widest font-bold">{AppConfig.coupleNames}</p>
        </div>
        <div className="w-[80px]"></div>
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
          <div className="flex justify-center items-center h-40"><p className="text-pink-500 font-bold animate-pulse">Loading...</p></div>
        ) : activeTab === "album" ? (
          <div className="w-full animate-fade-in-up">
            <div className="flex justify-between items-center mb-3 px-2">
              <h3 className="font-bold text-gray-700 text-sm">Photos ({allPhotos.length})</h3>
              <div className="flex gap-2 bg-white p-1 rounded-lg border border-pink-200 shadow-sm">
                <button onClick={() => setViewType("grid")} className={`px-3 py-1 rounded text-sm transition-all ${viewType === 'grid' ? 'bg-pink-100 text-pink-600 font-bold' : 'text-gray-400'}`}>Grid 🔲</button>
                <button onClick={() => setViewType("feed")} className={`px-3 py-1 rounded text-sm transition-all ${viewType === 'feed' ? 'bg-pink-100 text-pink-600 font-bold' : 'text-gray-400'}`}>Feed 📱</button>
              </div>
            </div>
            {viewType === "grid" ? (
              <div className="animate-fade-in-up">
                {slideshowUrls.length > 0 && (
                  <div className="mb-4 relative w-full h-56 rounded-2xl overflow-hidden shadow-md border-2 border-pink-100 bg-black">
                    <div className="absolute top-2 left-3 z-20 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">✨ Highlights</div>
                    {slideshowUrls.map((url, idx) => (
                      <img key={idx} src={url} alt="Slideshow" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`} />
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden shadow-sm">
                  {allPhotos.map((url, index) => <img key={index} src={url} alt="Wedding" className="aspect-square object-cover w-full h-full hover:opacity-90 transition-opacity cursor-pointer"/>)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {posts.map((post) => <FeedPost key={post.id} post={post} onUpdate={() => fetchData(true)} currentUserName={userName} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full animate-fade-in-up">
            <div className="grid grid-cols-3 gap-3 mb-6 px-1">
              <button onClick={() => setIsTextModalOpen(true)} className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-sm border border-pink-100 hover:bg-pink-50 transition transform hover:scale-105"><span className="text-3xl mb-1">📝</span><span className="text-xs font-bold text-gray-700 text-center">Leave a msg</span></button>
              <label className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-sm border border-pink-100 hover:bg-blue-50 transition transform hover:scale-105 cursor-pointer"><span className="text-3xl mb-1">🎥</span><span className="text-xs font-bold text-gray-700 text-center">Record Video</span><input type="file" accept="video/*" capture="environment" onChange={(e) => handleFileUpload(e, 'video')} className="hidden" /></label>
              <button onClick={toggleVoiceRecord} className={`flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm border transition transform hover:scale-105 ${isRecording ? 'bg-red-100 border-red-300 animate-pulse' : 'bg-white border-pink-100 hover:bg-purple-50'}`}><span className="text-3xl mb-1">{isRecording ? '⏹️' : '🎤'}</span><span className={`text-xs font-bold text-center ${isRecording ? 'text-red-600' : 'text-gray-700'}`}>{isRecording ? 'Send Voice' : 'Voice Record'}</span></button>
            </div>
            <h3 className="font-bold text-gray-700 text-sm mb-3 px-2">සුබපැතුම් ({greetings.length})</h3>
            {greetings.length === 0 && <p className="text-center text-gray-400 my-10">සුබපැතුම් කිසිවක් නොමැත.</p>}
            <div className="flex flex-col gap-4">
              {greetings.map((greeting) => {
                const isHostMsg = greeting.user_name === AppConfig.hostName;
                return (
                  <div key={greeting.id} className={`bg-white p-4 rounded-2xl shadow-sm border ${isHostMsg ? 'border-pink-300' : 'border-pink-100'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isHostMsg ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'}`}>
                        {isHostMsg ? '👑' : greeting.user_name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`font-bold text-sm ${isHostMsg ? 'text-pink-600' : 'text-gray-800'}`}>{greeting.user_name}</span>
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

      {isEditNameOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all animate-fade-in-up">
            <h3 className="font-bold text-gray-800 text-lg mb-4">ඔබගේ නම වෙනස් කරන්න</h3>
            <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="නව නම ඇතුලත් කරන්න..." className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 text-gray-800 mb-6" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsEditNameOpen(false)} className="px-4 py-2 text-gray-500 font-bold text-sm hover:text-gray-700 transition">අවලංගු කරන්න</button>
              <button onClick={handleSaveName} className="bg-pink-500 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-pink-600 shadow-sm transition">සුරකින්න</button>
            </div>
          </div>
        </div>
      )}

      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-opacity">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all animate-fade-in-up">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-gray-800 text-lg">ඡායාරූපයක් එක් කරන්න</h3><button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-red-500 text-3xl leading-none font-bold">×</button></div>
            <div className="flex flex-col gap-4">
              <label className="bg-pink-50 border-2 border-pink-200 text-pink-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-pink-100 transition-colors cursor-pointer"><span className="text-3xl">📷</span> කැමරාවෙන් ගන්න<input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileUpload(e, 'image')} className="hidden" /></label>
              <label className="bg-blue-50 border-2 border-blue-200 text-blue-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-100 transition-colors cursor-pointer"><span className="text-3xl">🖼️</span> ෆෝන් එකෙන් තෝරන්න<input type="file" accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'image')} className="hidden" /></label>
            </div>
          </div>
        </div>
      )}

      {isTextModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-opacity">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all animate-fade-in-up">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800 text-lg">සුබපැතුමක් ලියන්න</h3><button onClick={() => setIsTextModalOpen(false)} className="text-gray-400 hover:text-red-500 text-3xl leading-none font-bold">×</button></div>
            <form onSubmit={submitTextGreeting} className="flex flex-col gap-3">
              <textarea value={newTextGreeting} onChange={(e) => setNewTextGreeting(e.target.value)} placeholder="ඔබේ අදහස දක්වන්න..." className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 text-gray-800 min-h-[100px]" />
              <button type="submit" className="bg-pink-500 text-white py-3 rounded-xl font-bold hover:bg-pink-600 transition shadow-sm w-full">පණිවිඩය යවන්න</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}