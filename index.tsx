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
  const [donors, setDonors] = useState(['@giftnews', '@gift_newstg', '@digest', '@UaOnlii']);

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
          setWorkerActive(new Date().getTime() - lastPostDate < 3600000); 
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
        contents: `Перепиши новость в стиле моего канала. Сделай текст коротким, добавь 2-3 эмодзи, убери лишние ссылки: ${testText}`,
      });
      // Использование свойства .text согласно правилам SDK
      setTestText(response.text || '');
      setToast("✨ Готово!");
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      setToast("❌ Ошибка ИИ");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-xl font-black mb-2">DB NOT CONNECTED</h1>
        <p className="text-gray-500 text-sm">Добавьте SUPABASE_URL и SUPABASE_KEY в переменные Railway.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32 selection:bg-blue-500/30">
      {/* Header */}
      <header className="p-6 bg-black/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none uppercase">Agent Pro</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${workerActive ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{workerActive ? 'Worker Live' : 'Worker Sleep'}</span>
            </div>
          </div>
        </div>
        <button onClick={fetchNews} className={`p-2.5 bg-white/5 rounded-xl active:scale-90 transition-all ${loading ? 'opacity-50' : ''}`}>
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {activeTab === 'FEED' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {news.map((item) => (
              <div key={item.id} className="bg-[#0f0f11] border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">@{item.source}</span>
                  <span className="text-[10px] text-gray-600 font-bold">{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-[15px] leading-relaxed text-gray-200 mb-6 whitespace-pre-wrap font-medium">{item.content}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => { navigator.clipboard.writeText(item.content); setToast("Текст в буфере!"); setTimeout(() => setToast(''), 2000); }}
                    className="bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
                  >
                    Копировать
                  </button>
                  <button 
                    onClick={() => { setTestText(item.content); setActiveTab('LAB'); }}
                    className="bg-blue-600/10 text-blue-400 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
                  >
                    Редактировать
                  </button>
                </div>
              </div>
            ))}
            {news.length === 0 && !loading && (
              <div className="py-20 text-center space-y-4 opacity-40">
                <div className="text-4xl">📥</div>
                <p className="text-sm font-bold uppercase tracking-widest">Лента пуста. Ждем посты...</p>
                <div className="text-[10px] max-w-xs mx-auto text-gray-500">
                  Убедитесь, что main.py запущен на Railway и вы подписаны на каналы.
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'LAB' && (
          <div className="animate-in zoom-in-95 duration-300">
            <div className="bg-[#0f0f11] rounded-[2.5rem] p-8 border border-white/5">
              <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                <span className="text-blue-500">✦</span> AI Лаборатория
              </h3>
              <textarea 
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Вставьте исходный текст для обработки..."
                className="w-full h-64 bg-black/50 border border-white/10 rounded-3xl p-6 text-sm outline-none focus:border-blue-600/50 transition-all text-white resize-none font-medium"
              />
              <button 
                onClick={handleManualRewrite}
                disabled={isAiLoading}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
              >
                {isAiLoading ? 'Магия в процессе...' : 'Сделать рерайт'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="space-y-4 animate-in slide-in-from-right-5 duration-300">
            <div className="bg-[#0f0f11] rounded-[2rem] p-6 border border-white/5">
              <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Источники (Доноры)</h3>
              <div className="space-y-2">
                {donors.map(c => (
                  <div key={c} className="flex justify-between items-center p-4 bg-black/30 rounded-2xl border border-white/5">
                    <span className="text-sm text-gray-300 font-bold">{c}</span>
                    <button className="text-red-500/50 hover:text-red-500 p-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
                <button className="w-full mt-2 py-3 border border-dashed border-white/10 rounded-2xl text-[10px] font-bold uppercase text-gray-500 hover:border-blue-500/50 hover:text-blue-500 transition-all">
                  + Добавить канал
                </button>
              </div>
            </div>
            <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-[2rem]">
               <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-2 text-center">Статус системы</h3>
               <p className="text-[11px] text-blue-400/70 text-center leading-relaxed font-medium">
                 Воркер анализирует посты. При обнаружении новой новости она автоматически обрабатывается через Gemini 3 Flash и сохраняется в базу.
               </p>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 flex gap-1 shadow-2xl z-[100]">
        {[
          { id: 'FEED', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z' },
          { id: 'LAB', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { id: 'SETTINGS', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveTab(btn.id as any)}
            className={`flex-1 py-4 rounded-[2rem] flex justify-center transition-all duration-300 ${activeTab === btn.id ? 'bg-blue-600 text-white shadow-xl' : 'text-gray-600 hover:text-white'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={btn.icon} /></svg>
          </button>
        ))}
      </nav>

      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-blue-600 px-8 py-3 rounded-full text-xs font-black shadow-2xl animate-bounce tracking-widest uppercase">
          {toast}
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
