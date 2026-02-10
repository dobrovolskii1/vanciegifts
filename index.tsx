import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Конфигурация ---
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Инициализируем клиент только если есть данные, чтобы избежать крэша
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

  // Проверка конфигурации при запуске
  const [configError, setConfigError] = useState(!supabase);

  const fetchNews = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error && data) setNews(data);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      fetchNews();
      const interval = setInterval(fetchNews, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 3000);
  };

  const handleManualRewrite = async () => {
    if (!testText) return showToast("Введите текст");
    setIsAiLoading(true);
    try {
      // Использование API_KEY согласно правилам Gemini SDK
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Сделай рерайт новости в стиле популярного блога: ${testText}`
      });
      setTestText(response.text || '');
      showToast("✅ Рерайт готов");
    } catch (e) {
      console.error("AI Error:", e);
      showToast("❌ Ошибка ИИ");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (configError) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 text-center">
        <div className="bg-[#0f0f11] border border-red-500/30 p-8 rounded-[2rem] max-w-sm shadow-2xl">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-black mb-2 uppercase">Ошибка Конфигурации</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Supabase URL или Key не найдены. Убедитесь, что вы добавили <b>SUPABASE_URL</b> и <b>SUPABASE_KEY</b> в настройки переменных окружения (Environment Variables).
          </p>
          <div className="text-[10px] text-gray-600 font-mono break-all bg-black/50 p-3 rounded-xl">
            Check Railway Dashboard -> Variables
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 px-6 py-3 rounded-full shadow-2xl animate-bounce text-sm font-bold">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="p-6 bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">AGENT PRO</h1>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Live Monitoring</p>
          </div>
        </div>
        <button onClick={fetchNews} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <svg className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto pb-32">
        {activeTab === 'FEED' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {news.map((item) => (
              <div key={item.id} className="bg-[#0f0f11] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-blue-600/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">@{item.source}</span>
                  <span className="text-gray-600 text-[10px] font-bold">{new Date(item.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-[15px] leading-relaxed text-gray-200 mb-6 font-medium whitespace-pre-wrap">{item.content}</p>
                <button 
                  onClick={() => { navigator.clipboard.writeText(item.content); showToast("Текст скопирован"); }}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl text-xs font-bold transition-all active:scale-[0.98]"
                >
                  Скопировать для поста
                </button>
              </div>
            ))}
            {news.length === 0 && !loading && (
              <div className="text-center py-20 opacity-20">
                <p className="italic">Пока нет новостей...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'LAB' && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="bg-[#0f0f11] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
              <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                <span className="text-blue-500">✦</span> AI Лаборатория
              </h2>
              <textarea 
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Вставьте исходный текст для рерайта..."
                className="w-full h-48 bg-black/50 border border-white/10 rounded-3xl p-6 text-sm outline-none focus:border-blue-500/50 transition-all resize-none mb-6 text-white"
              />
              <button 
                onClick={handleManualRewrite}
                disabled={isAiLoading}
                className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 ${isAiLoading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-500'}`}
              >
                {isAiLoading ? 'Магия ИИ в процессе...' : 'Запустить рерайт'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="space-y-4 animate-in slide-in-from-right-5 duration-300">
            <div className="bg-[#0f0f11] rounded-3xl p-6 border border-white/5">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Настройки воркера</h3>
              <div className="space-y-2">
                {['@giftnews', '@gift_newstg', '@digest', '@UaOnlii'].map(c => (
                  <div key={c} className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5">
                    <span className="text-sm font-bold text-gray-300">{c}</span>
                    <span className="text-[10px] text-green-500 font-black">ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-center text-gray-600 px-6">
              Изменение списка доноров через Mini App будет доступно в следующем обновлении. Сейчас список управляется через main.py.
            </p>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xs bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex gap-1 shadow-2xl z-[100]">
        {[
          { id: 'FEED', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z' },
          { id: 'LAB', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { id: 'SETTINGS', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveTab(btn.id as any)}
            className={`flex-1 py-4 rounded-[2rem] flex justify-center transition-all ${activeTab === btn.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={btn.icon} /></svg>
          </button>
        ))}
      </nav>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);