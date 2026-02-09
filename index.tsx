
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface GeneratedPost {
  id: string;
  rewrittenText: string;
  originalUrl: string;
  timestamp: number;
  sourceName: string;
  isNew: boolean;
}

const App = () => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'SETTINGS' | 'AI_TEST'>('FEED');
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [donors, setDonors] = useState<string[]>(['@giftnews', '@gift_newstg', '@digest']);
  const [styleRef, setStyleRef] = useState('@my_channel_style');
  const [newDonor, setNewDonor] = useState('');
  const [testText, setTestText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toast, setToast] = useState("");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    const savedPosts = localStorage.getItem('agent_posts');
    const savedDonors = localStorage.getItem('agent_donors');
    const savedStyle = localStorage.getItem('agent_style');
    
    if (savedPosts) setPosts(JSON.parse(savedPosts));
    if (savedDonors) setDonors(JSON.parse(savedDonors));
    if (savedStyle) setStyleRef(savedStyle);
  }, []);

  useEffect(() => {
    localStorage.setItem('agent_posts', JSON.stringify(posts));
    localStorage.setItem('agent_donors', JSON.stringify(donors));
    localStorage.setItem('agent_style', styleRef);
  }, [posts, donors, styleRef]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const addDonor = () => {
    const clean = newDonor.trim();
    if (!clean.startsWith('@')) {
      showToast("Начинайте с @");
      return;
    }
    if (donors.includes(clean)) {
      showToast("Уже в списке");
      return;
    }
    setDonors([...donors, clean]);
    setNewDonor('');
    showToast("Источник добавлен");
  };

  const removeDonor = (tag: string) => {
    setDonors(donors.filter(d => d !== tag));
    showToast("Источник удален");
  };

  const copyEnvVar = () => {
    const val = donors.join(',');
    navigator.clipboard.writeText(val);
    showToast("Скопировано для Railway");
  };

  const handleTestRewrite = async () => {
    if (!testText.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Ты анализировал посты канала ${styleRef} за последний месяц. Перепиши этот текст точно в таком стиле: ${testText}`,
      });

      const newPost: GeneratedPost = {
        id: Date.now().toString(),
        rewrittenText: response.text || "Ошибка ИИ",
        originalUrl: "#",
        timestamp: Date.now(),
        sourceName: "LAB_TEST",
        isNew: true
      };

      setPosts([newPost, ...posts]);
      setActiveTab('FEED');
      showToast("Стиль применен!");
    } catch (e) {
      showToast("Ошибка ИИ. Проверьте API_KEY");
    } finally {
      setIsAiLoading(false);
      setTestText("");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#2481cc]/30 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/5 p-6 flex justify-between items-center shadow-2xl shadow-[#2481cc]/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#2481cc] to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="font-black tracking-tighter text-xl leading-none">AI EDITOR</h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">v2.1 Monthly Analysis</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase text-green-500 tracking-wider">Railway Live</span>
          </div>
        </div>
      </header>

      <main className="p-5 max-w-md mx-auto space-y-8">
        {activeTab === 'FEED' && (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">Ваша лента</h2>
              <button onClick={() => setPosts([])} className="text-[10px] font-bold text-red-500/60 uppercase hover:text-red-400 transition-colors">Очистить всё</button>
            </div>
            
            {posts.length === 0 ? (
              <div className="py-40 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-gray-700">
                   <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /></svg>
                </div>
                <p className="text-gray-500 text-sm font-medium italic px-10 leading-relaxed">Пока пусто. Агент перебирает каналы за последний месяц...</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className={`bg-[#0d0d0e] border border-white/5 rounded-[2.5rem] overflow-hidden transition-all hover:border-white/10 ${post.isNew ? 'ring-1 ring-[#2481cc]/40' : ''}`}>
                  <div className="px-6 py-4 bg-white/[0.03] border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-[#2481cc] uppercase tracking-widest">{post.sourceName}</span>
                    <span className="text-[10px] text-gray-600 font-mono">{new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="p-8">
                    <p className="text-[16px] leading-relaxed text-gray-200 whitespace-pre-wrap">{post.rewrittenText}</p>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(post.rewrittenText); showToast("Текст скопирован"); }}
                      className="w-full mt-8 bg-white text-black py-4.5 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      КОПИРОВАТЬ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-400">
            {/* Style Profile */}
            <div className="bg-[#0d0d0e] p-7 rounded-[3rem] border border-white/5">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">Мой эталон</h3>
                  <p className="text-[10px] text-purple-500 font-black uppercase">Deep Monthly Audit</p>
                </div>
              </div>
              <input 
                value={styleRef}
                onChange={(e) => setStyleRef(e.target.value)}
                placeholder="@my_best_channel"
                className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm font-bold text-[#2481cc] outline-none focus:border-[#2481cc]/50 transition-all shadow-inner"
              />
              <div className="mt-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                <p className="text-[10px] text-gray-400 leading-relaxed font-bold tracking-tight uppercase">
                  ⚡️ Агент анализирует контент за последние <span className="text-purple-400">30 дней</span>, чтобы выявить ваш уникальный темпоритм и слог.
                </p>
              </div>
            </div>

            {/* Sources Management */}
            <div className="bg-[#0d0d0e] p-7 rounded-[3rem] border border-white/5">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  Источники
                </h3>
                <button onClick={copyEnvVar} className="text-[9px] font-black text-[#2481cc] border border-[#2481cc]/30 px-3 py-1.5 rounded-xl uppercase hover:bg-[#2481cc]/10 transition-all">Copy Env</button>
              </div>
              
              <div className="flex gap-2 mb-8">
                <input 
                  value={newDonor}
                  onChange={(e) => setNewDonor(e.target.value)}
                  placeholder="@donor_channel"
                  className="flex-1 bg-black border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-[#2481cc]/50 shadow-inner"
                />
                <button 
                  onClick={addDonor}
                  className="bg-white text-black w-16 rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-xl"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {donors.map(donor => (
                  <div key={donor} className="flex justify-between items-center p-5 bg-black rounded-3xl border border-white/5 group hover:border-[#2481cc]/20 transition-all">
                    <span className="text-sm font-black text-gray-300 group-hover:text-white">{donor}</span>
                    <button onClick={() => removeDonor(donor)} className="text-gray-700 hover:text-red-500 transition-colors p-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'AI_TEST' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#0d0d0e] p-8 rounded-[3.5rem] border border-white/5">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black mb-1 italic tracking-tighter">LABORATORY</h2>
                <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.4em]">Style: {styleRef}</p>
              </div>
              
              <textarea 
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Вставьте новость для глубокого рерайта..."
                className="w-full h-56 bg-black border border-white/10 rounded-3xl p-6 text-sm outline-none focus:border-[#2481cc] transition-all resize-none mb-6 shadow-inner font-medium leading-relaxed"
              />
              
              <button 
                onClick={handleTestRewrite}
                disabled={isAiLoading || !testText.trim()}
                className={`w-full py-6 rounded-[2rem] font-black text-sm uppercase flex items-center justify-center gap-4 transition-all ${isAiLoading ? 'bg-gray-800 text-gray-600' : 'bg-[#2481cc] text-white active:scale-[0.97] shadow-2xl shadow-[#2481cc]/30'}`}
              >
                {isAiLoading ? (
                  <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Протестировать стиль
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modern Fixed Nav */}
      <nav className="fixed bottom-8 left-8 right-8 z-[100]">
        <div className="max-w-xs mx-auto bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-2 flex items-center shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
          <button onClick={() => setActiveTab('FEED')} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] transition-all duration-300 ${activeTab === 'FEED' ? 'bg-white text-black shadow-xl' : 'text-gray-600 hover:text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /></svg>
          </button>
          <button onClick={() => setActiveTab('AI_TEST')} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] transition-all duration-300 ${activeTab === 'AI_TEST' ? 'bg-[#2481cc] text-white shadow-xl shadow-[#2481cc]/30' : 'text-gray-600 hover:text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </button>
          <button onClick={() => setActiveTab('SETTINGS')} className={`flex-1 flex flex-col items-center py-4 rounded-[2.5rem] transition-all duration-300 ${activeTab === 'SETTINGS' ? 'bg-white text-black shadow-xl' : 'text-gray-600 hover:text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </nav>

      {/* Floating Toast */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#2481cc] text-white px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_10px_40px_rgba(36,129,204,0.4)] z-[200] animate-in fade-in zoom-in duration-300">
          {toast}
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
