
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface GeneratedPost {
  id: string;
  rewrittenText: string;
  timestamp: number;
  sourceName: string;
}

const App = () => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'SETTINGS' | 'AI_TEST'>('FEED');
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [donors, setDonors] = useState<string[]>(['@giftnews', '@gift_newstg']);
  const [styleRef, setStyleRef] = useState('@my_channel_style');
  const [newDonor, setNewDonor] = useState('');
  const [testText, setTestText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const savedPosts = localStorage.getItem('agent_posts');
    const savedDonors = localStorage.getItem('agent_donors');
    const savedStyle = localStorage.getItem('agent_style');
    
    if (savedPosts) setPosts(JSON.parse(savedPosts));
    if (savedDonors) setDonors(JSON.parse(savedDonors));
    if (savedStyle) setStyleRef(savedStyle);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const saveSettings = () => {
    setIsSaving(true);
    localStorage.setItem('agent_donors', JSON.stringify(donors));
    localStorage.setItem('agent_style', styleRef);
    
    setTimeout(() => {
      setIsSaving(false);
      showToast("✅ Настройки сохранены и применены");
    }, 800);
  };

  const addDonor = () => {
    const clean = newDonor.trim();
    if (!clean.startsWith('@')) {
      showToast("❌ Название должно начинаться с @");
      return;
    }
    if (donors.includes(clean)) {
      showToast("⚠️ Уже в списке");
      return;
    }
    const updated = [...donors, clean];
    setDonors(updated);
    localStorage.setItem('agent_donors', JSON.stringify(updated));
    setNewDonor('');
    showToast("➕ Источник добавлен");
  };

  const removeDonor = (tag: string) => {
    const updated = donors.filter(d => d !== tag);
    setDonors(updated);
    localStorage.setItem('agent_donors', JSON.stringify(updated));
    showToast("🗑 Удалено");
  };

  const handleTestRewrite = async () => {
    if (!testText.trim()) {
      showToast("⌨️ Введите текст для рерайта");
      return;
    }
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      showToast("🚫 Критическая ошибка: API_KEY не найден");
      return;
    }

    setIsAiLoading(true);
    try {
      // Инициализация ИИ прямо перед вызовом для надежности
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Представь, что ты ведешь Telegram-канал ${styleRef}. Сделай качественный рерайт этой новости, сохраняя свой уникальный стиль: ${testText}`,
      });
      
      const text = response.text;
      if (!text) throw new Error("Модель вернула пустой результат");

      const newPost: GeneratedPost = {
        id: Date.now().toString(),
        rewrittenText: text,
        timestamp: Date.now(),
        sourceName: "ЛАБОРАТОРИЯ"
      };

      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      localStorage.setItem('agent_posts', JSON.stringify(updatedPosts));
      
      setActiveTab('FEED');
      showToast("🚀 Рерайт готов! См. ленту");
    } catch (e: any) {
      console.error("AI Lab Error:", e);
      showToast(`❌ Ошибка: ${e.message || "Не удалось связаться с ИИ"}`);
    } finally {
      setIsAiLoading(false);
      setTestText("");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32 flex flex-col font-sans">
      <header className="p-6 border-b border-white/5 bg-black/90 backdrop-blur-2xl sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#2481cc] to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight leading-none">REWRITER PRO</h1>
            <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Online</span>
        </div>
      </header>

      <main className="p-5 max-w-md mx-auto w-full space-y-6">
        {activeTab === 'FEED' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 mb-2">Последние генерации</h2>
            {posts.length === 0 ? (
              <div className="py-32 text-center opacity-40">
                <p className="text-sm italic">Лента пока пуста...</p>
                <p className="text-[10px] uppercase mt-2">Ожидаем новости из доноров</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-[#0d0d0e] border border-white/5 rounded-3xl p-6 shadow-2xl transition-all hover:border-white/10">
                  <div className="flex justify-between items-center mb-4 text-[9px] font-black uppercase tracking-widest text-blue-400">
                    <span>{post.sourceName}</span>
                    <span className="text-gray-600">{new Date(post.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-gray-200 mb-6 font-medium">{post.rewrittenText}</p>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(post.rewrittenText); showToast("📋 Текст скопирован"); }}
                    className="w-full bg-white text-black py-4 rounded-2xl font-black text-[11px] uppercase active:scale-[0.98] transition-all shadow-xl"
                  >
                    Скопировать
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <section className="bg-[#0d0d0e] p-7 rounded-[2.5rem] border border-white/5 shadow-xl">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                Мой стиль (Эталон)
              </h3>
              <div className="space-y-4">
                <input 
                  value={styleRef}
                  onChange={(e) => setStyleRef(e.target.value)}
                  placeholder="@канал_стиль"
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm font-bold text-blue-400 outline-none focus:border-blue-500 transition-all shadow-inner"
                />
                <button 
                  onClick={saveSettings}
                  disabled={isSaving}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isSaving ? 'bg-gray-800 text-gray-500' : 'bg-[#2481cc] text-white hover:bg-blue-600'}`}
                >
                  {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Применить настройки"}
                </button>
              </div>
            </section>

            <section className="bg-[#0d0d0e] p-7 rounded-[2.5rem] border border-white/5 shadow-xl">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6">Каналы-источники</h3>
              <div className="flex gap-2 mb-6">
                <input 
                  value={newDonor}
                  onChange={(e) => setNewDonor(e.target.value)}
                  placeholder="@канал_донор"
                  className="flex-1 bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 shadow-inner"
                />
                <button onClick={addDonor} className="bg-white text-black w-14 rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                {donors.map(d => (
                  <div key={d} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5 group transition-all">
                    <span className="text-sm font-bold text-gray-400 group-hover:text-white">{d}</span>
                    <button onClick={() => removeDonor(d)} className="text-red-500/20 hover:text-red-500 p-2 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'AI_TEST' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="bg-[#0d0d0e] p-8 rounded-[3.5rem] border border-white/5 text-center shadow-2xl">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.293a2 2 0 01-1.64 0l-.628-.293a6 6 0 00-3.86-.517l-2.387.477a2 2 0 00-1.022.547l-.34.34a2 2 0 00-.547 1.022l-.477 2.387a6 6 0 00.517 3.86l.293.628a2 2 0 010 1.64l-.293.628a6 6 0 00-.517 3.86l.477 2.387a2 2 0 001.022.547l.34.34a2 2 0 001.022.547l2.387-.477a6 6 0 003.86-.517l.628-.293a2 2 0 011.64 0l.628.293a6 6 0 003.86.517l2.387.477a2 2 0 001.022-.547l.34-.34a2 2 0 00.547-1.022l.477-2.387a6 6 0 00-.517-3.86l-.293-.628a2 2 0 010-1.64l.293-.628a6 6 0 00.517-3.86l-.477-2.387a2 2 0 00-1.022-.547l-.34-.34z" /></svg>
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter mb-2">AI LAB</h2>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-8 px-4">Тестирование стиля "{styleRef}"</p>
              
              <textarea 
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Вставьте текст любой новости для теста..."
                className="w-full h-48 bg-black border border-white/10 rounded-[2rem] p-6 text-sm outline-none focus:border-blue-500 resize-none mb-8 shadow-inner leading-relaxed"
              />
              
              <button 
                onClick={handleTestRewrite}
                disabled={isAiLoading}
                className={`w-full py-6 rounded-3xl font-black text-xs uppercase flex items-center justify-center gap-4 transition-all shadow-2xl ${isAiLoading ? 'bg-gray-800 text-gray-600 animate-pulse cursor-not-allowed' : 'bg-[#2481cc] text-white active:scale-[0.97] shadow-blue-500/20'}`}
              >
                {isAiLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Обработка ИИ...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Запустить рерайт
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-8 left-8 right-8 z-[200]">
        <div className="max-w-xs mx-auto bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-2 flex items-center shadow-2xl">
          <button onClick={() => setActiveTab('FEED')} className={`flex-1 py-4 rounded-[2.5rem] flex justify-center transition-all ${activeTab === 'FEED' ? 'bg-white text-black' : 'text-gray-600 hover:text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /></svg>
          </button>
          <button onClick={() => setActiveTab('AI_TEST')} className={`flex-1 py-4 rounded-[2.5rem] flex justify-center transition-all ${activeTab === 'AI_TEST' ? 'bg-[#2481cc] text-white' : 'text-gray-600 hover:text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </button>
          <button onClick={() => setActiveTab('SETTINGS')} className={`flex-1 py-4 rounded-[2.5rem] flex justify-center transition-all ${activeTab === 'SETTINGS' ? 'bg-white text-black' : 'text-gray-600 hover:text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </nav>

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#2481cc] text-white px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl z-[300] animate-in fade-in zoom-in duration-300 text-center max-w-[80vw]">
          {toast}
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
