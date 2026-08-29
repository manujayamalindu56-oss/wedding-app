"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function MasterPanel() {
  // --- States ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminUser, setAdminUser] = useState<any>(null);

  const [activeView, setActiveView] = useState("menu"); // 'menu', 'new', 'view'
  const [weddings, setWeddings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    slug: "", couple_names: "", wedding_date: "", host_password: "", 
    theme_color: "pink", music_url: "", auto_delete_days: 30, contact_number: ""
  });

  // Pin Security States
  const [pinModal, setPinModal] = useState<{isOpen: boolean, action: any, title: string} | null>(null);
  const [pinInput, setPinInput] = useState("");

  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const showToast = (msg: string, type: 'success'|'error' = 'success') => { setToast({message: msg, type}); setTimeout(() => setToast(null), 3000); };

  // --- Login Logic ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase.from('admin_users').select('*').eq('username', username).eq('password', password).single();
    if (data) {
      setAdminUser(data);
      setIsAuthenticated(true);
      showToast("Access Granted");
    } else {
      showToast("Invalid Credentials", "error");
    }
    setIsLoading(false);
  };

  // --- Fetch Weddings ---
  const fetchWeddings = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('weddings').select('*').order('created_at', { ascending: false });
    if (data) setWeddings(data);
    setIsLoading(false);
  };

  useEffect(() => { if (activeView === 'view') fetchWeddings(); }, [activeView]);

  // --- PIN Security Execution ---
  const executeWithPin = (title: string, action: () => void) => {
    setPinInput("");
    setPinModal({ isOpen: true, action, title });
  };

  const verifyPinAndExecute = () => {
    if (pinInput === adminUser.pin) {
      pinModal?.action();
      setPinModal(null);
    } else {
      showToast("Invalid PIN!", "error");
      setPinInput("");
    }
  };

  // --- Add New Wedding ---
  const handleSaveWedding = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from('weddings').insert([{
        slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
        couple_names: formData.couple_names,
        wedding_date: formData.wedding_date,
        host_password: formData.host_password,
        theme_color: formData.theme_color,
        music_url: formData.music_url,
        auto_delete_days: formData.auto_delete_days,
        contact_number: formData.contact_number
      }]);
      if (error) throw error;
      showToast("Wedding Created Successfully!");
      setFormData({ slug: "", couple_names: "", wedding_date: "", host_password: "", theme_color: "pink", music_url: "", auto_delete_days: 30, contact_number: "" });
      setActiveView("menu");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Storage & Data Clean (Nuke Button) ---
  const handleStorageClean = async (slug: string) => {
    try {
      setIsLoading(true);
      showToast("Scanning files to delete...");

      // 1. Get all photos for this wedding
      const { data: posts } = await supabase.from('posts').select('urls').eq('wedding_slug', slug);
      let pathsToRemove: string[] = [];
      
      if (posts && posts.length > 0) {
        posts.forEach(p => {
          p.urls.forEach((url: string) => {
            const parts = url.split('/');
            pathsToRemove.push(parts[parts.length - 1]); // Get filename
          });
        });

        // 2. Delete from Storage Bucket
        if (pathsToRemove.length > 0) {
          await supabase.storage.from('wedding-photos').remove(pathsToRemove);
        }
      }

      // 3. Delete from Database
      await supabase.from('posts').delete().eq('wedding_slug', slug);
      await supabase.from('greetings').delete().eq('wedding_slug', slug);
      await supabase.from('comments').delete().eq('wedding_slug', slug); // Just in case cascade fails

      showToast("Storage & Data Cleaned Successfully!");
      fetchWeddings(); // Refresh table
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Delete Entire Wedding ---
  const handleDeleteWedding = async (slug: string) => {
    try {
      setIsLoading(true);
      await handleStorageClean(slug); // Clean files first
      await supabase.from('weddings').delete().eq('slug', slug); // Delete from weddings table
      showToast("Wedding Completely Deleted!");
      fetchWeddings();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Calculate Remain Days ---
  const getRemainDays = (dateStr: string, autoDeleteDays: number) => {
    if (!dateStr) return "N/A";
    const wDate = new Date(dateStr);
    const expireDate = new Date(wDate.getTime() + autoDeleteDays * 24 * 60 * 60 * 1000);
    const today = new Date();
    const diffTime = expireDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <span className="text-red-500 font-bold">Expired</span>;
    if (diffDays <= 5) return <span className="text-yellow-500 font-bold">{diffDays} Days</span>;
    return <span className="text-emerald-500">{diffDays} Days</span>;
  };

  // ================= RENDER =================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex items-center justify-center p-6 font-mono selection:bg-gray-800">
        <div className="bg-[#111] p-8 rounded-xl border border-[#333] w-full max-w-sm shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-900 border border-gray-700 rounded-full mx-auto flex items-center justify-center text-2xl mb-4">👨‍💻</div>
            <h1 className="text-xl font-bold tracking-widest uppercase text-white">MX Tech</h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Backoffice Portal</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest mb-2 block">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500 text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest mb-2 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-500 text-white tracking-widest" />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-white text-black font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-gray-200 transition mt-2 text-sm disabled:opacity-50">
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </div>
        {toast && <div className={`fixed top-8 px-6 py-3 rounded-md text-sm font-bold border ${toast.type === 'success' ? 'bg-emerald-950 border-emerald-900 text-emerald-500' : 'bg-red-950 border-red-900 text-red-500'}`}>{toast.message}</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-mono p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8 border-b border-[#222] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#111] border border-[#333] rounded-full flex items-center justify-center text-xl cursor-pointer hover:bg-[#222] transition" onClick={() => setActiveView('menu')}>👨‍💻</div>
          <div>
            <h1 className="text-lg font-bold text-white uppercase tracking-widest">Backoffice</h1>
            <p className="text-xs text-gray-500 uppercase">Logged in as {adminUser.username}</p>
          </div>
        </div>
        <button onClick={() => {setIsAuthenticated(false); setAdminUser(null);}} className="text-xs uppercase tracking-widest text-red-500 hover:bg-red-950 px-4 py-2 rounded border border-red-900 transition">Logout</button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* --- MENU VIEW --- */}
        {activeView === 'menu' && (
          <div className="flex flex-col md:flex-row gap-6 max-w-2xl mx-auto mt-20">
            <button onClick={() => setActiveView('new')} className="flex-1 bg-[#111] hover:bg-[#1a1a1a] border border-[#333] p-10 rounded-xl flex flex-col items-center gap-4 transition group">
              <span className="text-4xl group-hover:scale-110 transition-transform">📝</span>
              <span className="uppercase tracking-widest font-bold text-white">New Wedding</span>
            </button>
            <button onClick={() => setActiveView('view')} className="flex-1 bg-[#111] hover:bg-[#1a1a1a] border border-[#333] p-10 rounded-xl flex flex-col items-center gap-4 transition group">
              <span className="text-4xl group-hover:scale-110 transition-transform">📊</span>
              <span className="uppercase tracking-widest font-bold text-white">View Weddings</span>
            </button>
          </div>
        )}

        {/* --- NEW WEDDING VIEW --- */}
        {activeView === 'new' && (
          <div className="max-w-2xl mx-auto bg-[#111] border border-[#333] rounded-xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold uppercase tracking-widest text-white">Add New Wedding</h2>
              <button onClick={() => setActiveView('menu')} className="text-xs text-gray-500 hover:text-white uppercase">Cancel</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2"><label className="block text-xs uppercase text-gray-500 mb-2">Slug (URL Path)</label><input type="text" value={formData.slug} onChange={e=>setFormData({...formData, slug: e.target.value})} placeholder="e.g. kasun-nethmi" className="w-full bg-black border border-[#333] rounded p-3 text-sm focus:border-white outline-none" /></div>
              <div><label className="block text-xs uppercase text-gray-500 mb-2">Couple Name</label><input type="text" value={formData.couple_names} onChange={e=>setFormData({...formData, couple_names: e.target.value})} placeholder="Kasun & Nethmi" className="w-full bg-black border border-[#333] rounded p-3 text-sm focus:border-white outline-none" /></div>
              <div><label className="block text-xs uppercase text-gray-500 mb-2">Wedding Date</label><input type="date" value={formData.wedding_date} onChange={e=>setFormData({...formData, wedding_date: e.target.value})} className="w-full bg-black border border-[#333] rounded p-3 text-sm focus:border-white outline-none" /></div>
              <div><label className="block text-xs uppercase text-gray-500 mb-2">Host Password</label><input type="text" value={formData.host_password} onChange={e=>setFormData({...formData, host_password: e.target.value})} placeholder="Random/Secure PW" className="w-full bg-black border border-[#333] rounded p-3 text-sm focus:border-white outline-none" /></div>
              <div><label className="block text-xs uppercase text-gray-500 mb-2">Theme Color</label>
                <select value={formData.theme_color} onChange={e=>setFormData({...formData, theme_color: e.target.value})} className="w-full bg-black border border-[#333] rounded p-3 text-sm focus:border-white outline-none">
                  <option value="pink">Pink</option><option value="gold">Gold</option><option value="emerald">Emerald</option><option value="blue">Blue</option><option value="purple">Purple</option><option value="black">Black</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2"><label className="block text-xs uppercase text-gray-500 mb-2">Background Music URL</label><input type="text" value={formData.music_url} onChange={e=>setFormData({...formData, music_url: e.target.value})} placeholder="https://..." className="w-full bg-black border border-[#333] rounded p-3 text-sm focus:border-white outline-none" /></div>
              <div><label className="block text-xs uppercase text-gray-500 mb-2">Auto Delete (Days)</label><input type="number" value={formData.auto_delete_days} onChange={e=>setFormData({...formData, auto_delete_days: Number(e.target.value)})} className="w-full bg-black border border-[#333] rounded p-3 text-sm focus:border-white outline-none" /></div>
              <div><label className="block text-xs uppercase text-gray-500 mb-2">Contact Number</label><input type="text" value={formData.contact_number} onChange={e=>setFormData({...formData, contact_number: e.target.value})} placeholder="07XXXXXXXX" className="w-full bg-black border border-[#333] rounded p-3 text-sm focus:border-white outline-none" /></div>
            </div>
            <button onClick={() => executeWithPin("Confirm Creating New Wedding", handleSaveWedding)} className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 rounded hover:bg-gray-200 transition mt-8 text-sm">Save Wedding</button>
          </div>
        )}

        {/* --- VIEW WEDDINGS (TABLE) --- */}
        {activeView === 'view' && (
          <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#333]">
              <h2 className="text-lg font-bold uppercase tracking-widest text-white">Database Records</h2>
              <button onClick={() => setActiveView('menu')} className="text-xs text-gray-500 hover:text-white uppercase border border-[#333] px-3 py-1 rounded">Back</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0a0a0a] text-xs uppercase text-gray-500 tracking-widest">
                    <th className="p-4 border-b border-[#333]">No</th>
                    <th className="p-4 border-b border-[#333]">Slug / URL</th>
                    <th className="p-4 border-b border-[#333]">Couple Name</th>
                    <th className="p-4 border-b border-[#333]">Contact</th>
                    <th className="p-4 border-b border-[#333]">Host PW</th>
                    <th className="p-4 border-b border-[#333]">Wed Date</th>
                    <th className="p-4 border-b border-[#333]">Remain Days</th>
                    <th className="p-4 border-b border-[#333] text-right">Storage Clean</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoading ? <tr><td colSpan={7} className="text-center p-8 text-gray-500">Loading DB...</td></tr> : 
                   weddings.length === 0 ? <tr><td colSpan={7} className="text-center p-8 text-gray-500">No records found.</td></tr> :
                   weddings.map((w, index) => (
                    <tr key={w.slug} className="hover:bg-[#1a1a1a] border-b border-[#222]">
                      <td className="p-4 text-gray-500">{index + 1}</td>
                      <td className="p-4 font-bold text-white">{w.slug}</td>
                      <td className="p-4">{w.couple_names}</td>
                      <td className="p-4 text-gray-400">{w.contact_number || '-'}</td>
                      <td className="p-4 text-yellow-500 font-mono tracking-wider font-bold">{w.host_password}</td>
                      <td className="p-4">{w.wedding_date}</td>
                      <td className="p-4">{getRemainDays(w.wedding_date, w.auto_delete_days)}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => executeWithPin(`Clean ALL photos & data for ${w.slug}?`, () => handleStorageClean(w.slug))} className="text-xs bg-[#2a1111] text-red-500 border border-red-900/50 hover:bg-red-950 px-3 py-1 rounded uppercase flex items-center gap-1 transition">
                          <span>⚠️</span> Clear
                        </button>
                        <button onClick={() => executeWithPin(`Delete entire wedding ${w.slug}?`, () => handleDeleteWedding(w.slug))} className="text-xs bg-[#111] text-gray-500 border border-[#333] hover:bg-red-950 hover:text-red-500 hover:border-red-900 px-3 py-1 rounded uppercase transition" title="Delete Wedding">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- PIN CONFIRMATION MODAL --- */}
      {pinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#333] p-8 rounded-xl max-w-sm w-full shadow-2xl text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">{pinModal.title}</h3>
            <p className="text-xs text-gray-500 mb-6 uppercase">Enter Security PIN to confirm</p>
            <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="****" className="w-full bg-black border border-[#333] rounded-lg p-4 text-center text-2xl tracking-[1em] text-white focus:outline-none focus:border-red-500 mb-6" autoFocus />
            <div className="flex gap-4">
              <button onClick={() => setPinModal(null)} className="flex-1 border border-[#333] text-gray-400 py-3 rounded hover:bg-[#222] transition text-xs uppercase tracking-widest">Cancel</button>
              <button onClick={verifyPinAndExecute} className="flex-1 bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 transition text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.4)]">Execute</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`fixed bottom-8 right-8 px-6 py-3 rounded-md text-sm font-bold border z-50 ${toast.type === 'success' ? 'bg-emerald-950 border-emerald-900 text-emerald-500' : 'bg-red-950 border-red-900 text-red-500'}`}>{toast.message}</div>}
    </div>
  );
}