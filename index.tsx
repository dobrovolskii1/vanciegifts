
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface GeneratedPost {
  id: string;
  rewrittenText: string;
  timestamp: number;
  sourceName: string;
  isNew: boolean;
}

const App = () => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'SETTINGS' | 'AI_TEST'>('FEED');
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [donors, setDonors] = useState<string[]>(['@giftnews', '@gift_newstg']);
  const [styleRef, setStyleRef] = useState('@my_channel_style');
  const [newDonor, setNewDonor] = useState('');
  const [testText, setTestText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toast, setToast] = useState("");

  // Инициализация ИИ внутри компонента для безопасности
  const ai = useMemo(() => {
    try {
      return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    } catch (e) {
      console.error("AI Init failed", e);
      return null;
    }
  }, []);

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
    setTimeout(() => setToast(""), 2000);
  };

  const addDonor = () => {
    const clean = newDonor.trim();
    if (!clean.startsWith('@')) {
      showToast("Начни с @");
      return;
    }
    if (donors.includes(clean)) {
      showToast("Уже в списке");
      return;
    }
    setDonors([...donors, clean]);
    setNewDonor('');
    showToast("Добавлено");
  };

  const removeDonor = (tag: string) => {
    setDonors(donors.filter(d => d !== tag));
    showToast("Удалено");
  };

  const copyConfig = () => {
    const val = `DONOR_CHANNELS="${donors.join(',')}"\nREFERENCE_CHANNEL="${styleRef}"`;
    navigator.clipboard.writeText(val);
    showToast("Конфиг скопирован");
  };

  const handleTestRewrite = async () => {
    if (!testText.trim() || !ai) return;
    setIsAiLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Представь, что ты изучил посты канала ${styleRef} за последний месяц. Сделай рерайт этой новости в его уникальном стиле: ${testText}`,
      });

      const newPost: GeneratedPost = {
        id: Date.now().toString(),
        rewrittenText: response.text || "Ошибка",
        timestamp: Date.now(),
        sourceName: "TEST_LAB",
        isNew: true
      };

      setPosts([newPost, ...posts]);
      setActiveTab('FEED');
      showToast("Рерайт готов!");
    } catch (e) {
      showToast("Ошибка API");
    } finally {
      setIsAiLoading(false);
      setTestText("");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#2481cc]/40 pb-32 flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-[100] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#2481cc] to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <div>
            <h1 className="font-black text-lg leading-tight tracking-tight uppercase">AI Agent</h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Style Engine v2.5</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-green-500 uppercase tracking-tighter">Railway Online</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 max-w-md mx-auto w-full space-y-6">
        {activeTab === 'FEED' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">История рерайтов</h2>
              <button onClick={() => setPosts([])} className="text-[9px] text-red-500/50 uppercase font-black">Очистить</button>
            </div>
            {posts.length === 0 ? (
              <div className="py-24 text-center opacity-30 italic text-sm">Здесь будут появляться посты от ваших доноров...</div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-[#0d0d0e] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 flex justify-between text-[10px] font-bold">
                    <span className="text-[#2481cc]">{post.sourceName}</span>
                    <span className="text-gray-600">{new Date(post.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="p-6">
                    <p className="text-sm leading-relaxed text-gray-200">{post.rewrittenText}</p>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(post.rewrittenText); showToast("Скопировано!"); }}
                      className="w-full mt-6 bg-white text-black py-4 rounded-2xl font-black text-[12px] uppercase active:scale-95 transition-all"
                    >
                      Копировать текст
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            {/* Style Reference */}
            <section className="bg-[#0d0d0e] p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
              <h3 className="text-[11px] font-black text-[#2481cc] uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                Эталонный стиль (Ваш канал)
              </h3>
              <input 
                value={styleRef}
                onChange={(e) => setStyleRef(e.target.value)}
                placeholder="@username"
                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-[#2481cc]/50 outline-none"
              />
              <p className="text-[9px] text-gray-500 mt-3 font-medium px-1 leading-normal uppercase">
                Бот будет анализировать контент этого канала за последние 30 дней для понимания вашего слога.
              </p>
            </section>

            {/* Donor Manager */}
            <section className="bg-[#0d0d0e] p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[11px] font-black text-[#2481cc] uppercase tracking-widest">Источники (Доноры)</h3>
                <button onClick={copyConfig} className="text-[8px] border border-white/10 px-2 py-1 rounded-lg text-gray-400 hover:text-white uppercase font-black">Copy for Railway</button>
              </div>
              <div className="flex gap-2 mb-6">
                <input 
                  value={newDonor}
                  onChange={(e) => setNewDonor(e.target.value)}
                  placeholder="@канал_донор"
                  className="flex-1 bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[#2481cc]/50"
                />
                <button onClick={addDonor} className="bg-white text-black w-12 rounded-2xl flex items-center justify-center active:scale-90 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {donors.map(d => (
                  <div key={d} className="flex justify-between items-center p-4 bg-black/50 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                    <span className="text-sm font-bold text-gray-300">{d}</span>
                    <button onClick={() => removeDonor(d)} className="text-red-500/40 hover:text-red-500 p-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'AI_TEST' && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-[#0d0d0e] p-8 rounded-[3rem] border border-white/5 text-center">
              <h2 className="text-2xl font-black italic tracking-tighter mb-2">AI LABORATORY</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-8">Тест стиля {styleRef}</p>
              
              <textarea 
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Вставьте новость для теста..."
                className="w-full h-48 bg-black border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-[#2481cc] resize-none mb-6 shadow-inner"
              />
              
              <button 
                onClick={handleTestRewrite}
                disabled={isAiLoading || !testText.trim()}
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 transition-all ${isAiLoading ? 'bg-gray-800 text-gray-500' : 'bg-[#2481cc] text-white shadow-2xl shadow-blue-500/20 active:scale-95'}`}
              >
                {isAiLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : "Запустить рерайт"}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Nav */}
      <nav className="fixed bottom-6 left-6 right-6 z-[200]">
        <div className="max-w-xs mx-auto bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 flex items-center shadow-2xl">
          <button onClick={() => setActiveTab('FEED')} className={`flex-1 py-4 rounded-[2rem] flex justify-center transition-all ${activeTab === 'FEED' ? 'bg-white text-black' : 'text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /></svg>
          </button>
          <button onClick={() => setActiveTab('AI_TEST')} className={`flex-1 py-4 rounded-[2rem] flex justify-center transition-all ${activeTab === 'AI_TEST' ? 'bg-[#2481cc] text-white' : 'text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </button>
          <button onClick={() => setActiveTab('SETTINGS')} className={`flex-1 py-4 rounded-[2rem] flex justify-center transition-all ${activeTab === 'SETTINGS' ? 'bg-white text-black' : 'text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </button>
        </div>
      </nav>

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#2481cc] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest z-[300] animate-in zoom-in duration-300">
          {toast}
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
