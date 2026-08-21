"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { AppConfig } from "@/lib/config";

// Image Compressor Helper
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
// Post Item Component (Handles Slider Dots, Likes, and Comments)
// -------------------------------------------------------------
const PostItem = ({ post, onFullscreen, currentUserName, onRefresh }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUserName) return;
    await supabase.from('comments').insert([{ post_id: post.id, user_name: currentUserName, text: commentText }]);
    setCommentText("");
    onRefresh();
  };

  const handleLike = async () => {
    // Basic like increment logic (Assuming likes_count exists, or just UI for now)
    await supabase.from('posts').update({ likes_count: (post.likes_count || 0) + 1 }).eq('id', post.id);
    onRefresh();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
      {/* Post Header */}
      <div className="p-3 bg-pink-50 flex items-center gap-2">
        <div className="w-8 h-8 bg-pink-200 text-pink-700 rounded-full flex items-center justify-center font-bold text-sm">
          {post.user_name.charAt(0).toUpperCase()}
        </div>
        <span className="font-bold text-gray-700">{post.user_name}</span>
      </div>

      {/* Image Slider with Dots */}
      <div className="relative">
        <div className="w-full h-[400px] bg-gray-100 relative">
          <img 
            src={post.urls[currentIndex]} 
            alt="Wedding" 
            className="w-full h-full object-cover cursor-pointer" 
            onClick={() => onFullscreen(post.urls[currentIndex])} 
          />
          
          {post.urls.length > 1 && (
            <>
              {/* Left/Right Arrows */}
              <button onClick={() => setCurrentIndex(prev => prev === 0 ? post.urls.length - 1 : prev - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center z-10">❮</button>
              <button onClick={() => setCurrentIndex(prev => prev === post.urls.length - 1 ? 0 : prev + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center z-10">❯</button>
            </>
          )}
        </div>
        
        {/* Dots */}
        {post.urls.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3 bg-white">
            {post.urls.map((_: any, i: number) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "w-4 bg-pink-500" : "w-1.5 bg-pink-200"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Like & Comment Buttons */}
      <div className="p-3 border-t border-gray-50 flex items-center gap-4">
        <button onClick={handleLike} className="flex items-center gap-1.5 text-gray-600 hover:text-pink-500 font-medium">
          <span className="text-xl">❤️</span> {post.likes_count || 0}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-gray-600 hover:text-pink-500 font-medium">
          <span className="text-xl">💬</span> {(post.comments?.length) || 0}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
          {post.comments && post.comments.map((c: any) => (
            <div key={c.id} className="text-sm">
              <span className="font-bold text-gray-800 mr-2">{c.user_name}</span>
              <span className="text-gray-600">{c.text}</span>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input 
              type="text" 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)} 
              placeholder="Add a comment..." 
              className="flex-1 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-sm outline-none focus:border-pink-400"
            />
            <button onClick={handleAddComment} className="text-pink-500 font-bold px-2 text-sm">Post</button>
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
  const [viewType, setViewType] = useState("feed"); // Default is Feed now
  const [posts, setPosts] = useState<any[]>([]);
  const [greetings, setGreetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Name storage
  const [userName, setUserName] = useState("");

  // Upload States & Popup
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  // Fullscreen Lightbox State
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Projector / Slideshow States & Music
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Guestbook States
  const [greetingText, setGreetingText] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Load Saved Name from Local Storage
  useEffect(() => {
    const savedName = localStorage.getItem("wedding_guest_name");
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  const handleNameChange = (name: string) => {
    setUserName(name);
    localStorage.setItem("wedding_guest_name", name);
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

  const slideshowUrls = posts.flatMap(p => p.urls || []);

  // Slideshow Timer & Music
  useEffect(() => {
    if (!isProjectorOpen || slideshowUrls.length === 0) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slideshowUrls.length), 4000);
    return () => clearInterval(timer);
  }, [isProjectorOpen, slideshowUrls.length]);

  const toggleMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(AppConfig.backgroundMusicUrl);
      audioRef.current.loop = true;
    }
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().catch(() => alert("Music playback blocked by browser. Click again."));
      setIsPlayingMusic(true);
    }
  };

  const handleCloseProjector = () => {
    setIsProjectorOpen(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    }
  };

  // Upload Photos with Compression (English Text)
  const handlePhotoUpload = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;
    
    // Require name only if not saved
    if (!userName.trim()) {
      alert("Please enter your name first!");
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

      await supabase.from('posts').insert([{ user_name: userName, urls: uploadedUrls }]);
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
      alert("Please enter your name!");
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
    <div className="min-h-screen bg-pink-50 font-sans pb-28">
      {/* Header */}
      <div className="bg-white px-4 py-3 rounded-b-3xl shadow-sm mb-4 sticky top-0 z-20 flex items-center justify-between border-b border-pink-100">
        <h1 className="font-serif font-bold text-lg text-gray-800">{AppConfig.coupleNames}</h1>
        <div className="flex gap-2">
          {slideshowUrls.length > 0 && (
            <button onClick={() => { setIsProjectorOpen(true); setCurrentSlide(0); }} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1 animate-pulse">
              🎬 Highlight Slideshow
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-4 px-4">
        <div className="bg-white rounded-full flex w-full max-w-sm shadow-sm border border-pink-100 p-1">
          <button onClick={() => setActiveTab("feed")} className={`flex-1 py-2 rounded-full text-sm font-bold transition ${activeTab === "feed" ? "bg-pink-500 text-white shadow" : "text-gray-500"}`}>📸 Photos</button>
          <button onClick={() => setActiveTab("guestbook")} className={`flex-1 py-2 rounded-full text-sm font-bold transition ${activeTab === "guestbook" ? "bg-pink-500 text-white shadow" : "text-gray-500"}`}>📖 Guestbook</button>
        </div>
      </div>

      <div className="px-3 max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-40"><p className="text-pink-500 font-bold animate-pulse">Loading...</p></div>
        ) : activeTab === "feed" ? (
          <div>
            <div className="flex justify-end mb-3">
              <div className="flex gap-1 bg-white p-1 rounded-lg border border-pink-200 shadow-sm">
                <button onClick={() => setViewType("grid")} className={`px-3 py-1 rounded text-xs ${viewType === 'grid' ? 'bg-pink-100 text-pink-600 font-bold' : 'text-gray-400'}`}>Grid</button>
                <button onClick={() => setViewType("feed")} className={`px-3 py-1 rounded text-xs ${viewType === 'feed' ? 'bg-pink-100 text-pink-600 font-bold' : 'text-gray-400'}`}>Feed</button>
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
                  <PostItem key={post.id} post={post} onFullscreen={setFullscreenImage} currentUserName={userName} onRefresh={() => fetchData(true)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Guestbook Form */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-pink-200 flex flex-col gap-3">
              <h3 className="font-bold text-gray-800 text-sm">ඔබේ සුබපැතුම එක් කරන්න ✍️</h3>
              
              {!userName && (
                <input type="text" value={userName} onChange={(e) => handleNameChange(e.target.value)} placeholder="ඔබේ නම (Your Name)..." className="border border-pink-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-500 bg-pink-50/30 text-gray-800" />
              )}
              
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

            {/* Greetings Feed */}
            <div className="flex flex-col gap-3">
              {greetings.map((g) => (
                <div key={g.id} className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 flex flex-col gap-2">
                  <span className="font-bold text-gray-800 text-xs">{g.user_name}</span>
                  {g.type === "text" && <p className="text-gray-600 text-sm italic bg-pink-50 p-3 rounded-xl">"{g.content}"</p>}
                  {g.type === "voice" && <audio controls src={g.content} className="w-full h-10 rounded-full" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Upload Button */}
      <button onClick={() => setIsUploadOpen(true)} className="fixed bottom-6 right-6 bg-pink-500 text-white w-14 h-14 rounded-full shadow-lg text-3xl flex items-center justify-center hover:bg-pink-600 z-40">＋</button>

      {/* Upload Popup Modal (Camera & Gallery Separate) */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Add Photos 📸</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">×</button>
            </div>
            
            {!userName && (
              <input type="text" value={userName} onChange={(e) => handleNameChange(e.target.value)} placeholder="Your Name..." className="border border-pink-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-500 bg-pink-50/30 text-gray-800" />
            )}

            <div className="grid grid-cols-2 gap-3 mt-2">
              {/* Camera Button */}
              <label className="bg-pink-50 text-pink-600 font-bold py-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-pink-100 transition cursor-pointer border border-pink-100">
                <span className="text-3xl">📷</span>
                <span className="text-sm">Camera</span>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
              </label>

              {/* Gallery Button */}
              <label className="bg-purple-50 text-purple-600 font-bold py-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-purple-100 transition cursor-pointer border border-purple-100">
                <span className="text-3xl">🖼️</span>
                <span className="text-sm">Gallery</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">Photos will be compressed automatically for fast uploading.</p>
          </div>
        </div>
      )}

      {/* Uploading Loading Popup (English Text) */}
      {uploading && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-bold text-sm tracking-wide">{uploadProgressText}</p>
        </div>
      )}

      {/* Fullscreen Image Lightbox */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-2" onClick={() => setFullscreenImage(null)}>
          <button className="absolute top-4 right-4 text-white text-3xl font-bold bg-white/20 w-10 h-10 rounded-full flex items-center justify-center">×</button>
          <img src={fullscreenImage} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      {/* Projector / Slideshow with Music Button */}
      {isProjectorOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
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