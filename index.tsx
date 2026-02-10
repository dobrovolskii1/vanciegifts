
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

interface NewsItem {
  id: string;
  source: string;
  content: string;
  created_at: string;
}

const App = () => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'LAB' | 'SETTINGS'>('FEED');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testText, setTestText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [workerActive, setWorkerActive] = useState(false);

  const fetchNews = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (!error && data) {
        setNews(data);
        if (data.length > 0) {
          const lastPostDate = new Date(data[0].created_at).getTime();
          setWorkerActive(new Date().getTime() - lastPostDate < 7200000); 
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      fetchNews();
      const interval = setInterval(fetchNews, 20000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleManualRewrite = async () => {
    if (!testText) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Сделай рерайт в моем стиле: ${testText}`,
        config: { temperature: 0.7 }
      });
      setTestText(response.text || '');
      setToast("✨ Рерайт завершен!");
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      setToast("❌ Ошибка ИИ");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!supabase) {
    return <div className="p-10 text-center text-gray-500">Настройте Supabase в переменных Railway</div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32">
      {/* Header */}
      <header className="p-6 bg-black/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none uppercase">Agent Pro</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${workerActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{workerActive ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <button onClick={fetchNews} className={`p-2 bg-white/5 rounded-lg ${loading ? 'animate-spin' : ''}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-lg mx-auto">
        {activeTab === 'FEED' && (
          <div className="space-y-4">
            {news.map((item) => (
              <div key={item.id} className="bg-[#0f0f11] border border-white/5 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter bg-blue-500/10 px-2 py-1 rounded-md">@{item.source}</span>
                  <span className="text-[10px] text-gray-600 font-bold">{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-[14px] leading-relaxed text-gray-200 mb-5 whitespace-pre-wrap">{item.content}</p>
                <button 
                  onClick={() => { navigator.clipboard.writeText(item.content); setToast("Скопировано!"); setTimeout(() => setToast(''), 2000); }}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Копировать текст
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'LAB' && (
          <div className="space-y-4">
            <div className="bg-[#0f0f11] rounded-[2rem] p-6 border border-white/5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span className="text-blue-500 text-lg">✦</span> Ручной рерайт
              </h3>
              <textarea 
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Вставьте новость для обработки..."
                className="w-full h-48 bg-black/50 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-blue-500/50 transition-all text-white resize-none"
              />
              <button 
                onClick={handleManualRewrite}
                disabled={isAiLoading}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                {isAiLoading ? 'Обработка...' : 'Создать пост'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="space-y-4">
            <div className="bg-[#0f0f11] rounded-[2rem] p-6 border border-white/5">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Мой эталонный стиль</h3>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-gray-400 italic">
                "ИИ анализирует ваши предыдущие посты для имитации тональности..."
              </div>
            </div>
            <div className="bg-[#0f0f11] rounded-[2rem] p-6 border border-white/5">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Активные доноры</h3>
              <div className="space-y-2">
                {['@giftnews', '@gift_newstg', '@digest', '@UaOnlii'].map(c => (
                  <div key={c} className="flex justify-between items-center p-3 bg-black/30 rounded-xl">
                    <span className="text-sm text-gray-300 font-bold">{c}</span>
                    <span className="text-[8px] bg-green-500/20 text-green-500 px-2 py-1 rounded uppercase font-black">Online</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex gap-1 shadow-2xl">
        {[
          { id: 'FEED', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z' },
          { id: 'LAB', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { id: 'SETTINGS', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveTab(btn.id as any)}
            className={`flex-1 py-4 rounded-[2rem] flex justify-center transition-all ${activeTab === btn.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={btn.icon} /></svg>
          </button>
        ))}
      </nav>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-blue-600 px-6 py-2 rounded-full text-xs font-bold animate-bounce shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
