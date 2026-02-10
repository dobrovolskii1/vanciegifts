import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

const App = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [news, setNews] = useState([]);
  const [styleUrl, setStyleUrl] = useState('t.me/my_best_channel');
  const [donors, setDonors] = useState(['@techcrunch', '@durov']);
  const [newDonor, setNewDonor] = useState('');
  const [labText, setLabText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const config = (window as any).process?.env || {};
  const supabase = config.SUPABASE_URL ? createClient(config.SUPABASE_URL, config.SUPABASE_KEY) : null;

  useEffect(() => {
    if (!supabase) return;
    const fetchNews = async () => {
      const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false }).limit(10);
      if (data) setNews(data);
    };
    fetchNews();
    const interval = setInterval(fetchNews, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRewrite = async () => {
    if (!labText || !config.API_KEY) return;
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: config.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Перепиши этот текст в стиле канала ${styleUrl}. Сделай его идеальным для публикации:\n\n${labText}`,
      });
      setLabText(response.text || '');
    } catch (e) {
      alert("Ошибка ИИ");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative pb-24">
      {/* Header */}
      <header className="p-5 tg-blur sticky top-0 z-50 border-b border-white/5 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">
            Content <span className="text-[#2481cc]">Agent</span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest tracking-tighter">System Live</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4">
        {activeTab === 'feed' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {news.map(item => (
              <div key={item.id} className="card p-5 space-y-4">
                <div className="flex justify-between items-center opacity-40 text-[10px] font-black uppercase tracking-widest">
                  <span>{item.source}</span>
                  <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-[15px] leading-relaxed font-medium text-gray-200">{item.content}</p>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(item.content)} className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Копия</button>
                  <button className="flex-1 py-3 btn-primary rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">В Канал</button>
                </div>
              </div>
            ))}
            {news.length === 0 && <div className="py-20 text-center opacity-20 font-black text-xs uppercase tracking-widest">Ожидание новостей...</div>}
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="card p-6 space-y-5 animate-in slide-in-from-bottom-5 duration-300">
             <h3 className="text-[10px] font-black text-[#2481cc] uppercase tracking-widest">ИИ Лаборатория</h3>
             <textarea 
               className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-medium outline-none focus:border-[#2481cc]/50 transition-all resize-none"
               placeholder="Вставь текст для рерайта..."
               value={labText}
               onChange={e => setLabText(e.target.value)}
             />
             <button 
               onClick={handleManualRewrite}
               disabled={isProcessing}
               className="w-full py-4 btn-primary rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 active:scale-95 transition-all"
             >
               {isProcessing ? 'Нейросеть пишет...' : 'Сделать рерайт'}
             </button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <section className="card p-6 space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Мой Стиль (Эталон)</h3>
              <input 
                className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2481cc]/50 transition-all"
                value={styleUrl}
                onChange={e => setStyleUrl(e.target.value)}
              />
            </section>

            <section className="card p-6 space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Источники (Доноры)</h3>
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold outline-none focus:border-[#2481cc]/50 transition-all"
                  placeholder="@канал"
                  value={newDonor}
                  onChange={e => setNewDonor(e.target.value)}
                />
                <button onClick={() => { if(newDonor) { setDonors([...donors, newDonor]); setNewDonor(''); } }} className="bg-[#2481cc] px-5 rounded-xl font-bold">+</button>
              </div>
              <div className="space-y-2">
                {donors.map(d => (
                  <div key={d} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-gray-400">{d}</span>
                    <button onClick={() => setDonors(donors.filter(x => x !== d))} className="text-red-500/50 hover:text-red-500 text-[9px] font-black uppercase transition-colors">Удалить</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-4 right-4 tg-blur p-2 rounded-[32px] border border-white/10 flex gap-1 shadow-2xl z-50">
        {[
          { id: 'feed', label: 'Лента', icon: '⚡' },
          { id: 'lab', label: 'Лаб', icon: '🧪' },
          { id: 'settings', label: 'Опции', icon: '⚙️' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3.5 rounded-2xl flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'bg-[#2481cc] shadow-lg' : 'opacity-40 hover:opacity-100'}`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);