import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (window as any).process?.env?.SUPABASE_URL || '';
const SUPABASE_KEY = (window as any).process?.env?.SUPABASE_KEY || '';
const API_KEY = (window as any).process?.env?.API_KEY || '';

const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const App = () => {
  const [tab, setTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [labText, setLabText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Settings State
  const [myStyle, setMyStyle] = useState('@my_channel');
  const [donors, setDonors] = useState(['@tech_news', '@ai_daily']);
  const [newDonor, setNewDonor] = useState('');

  useEffect(() => {
    if (!supabase) return;
    const load = async () => {
      const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      if (data) setPosts(data);
    };
    load();
    const sub = setInterval(load, 5000);
    return () => clearInterval(sub);
  }, []);

  const addDonor = () => {
    if (newDonor.trim()) {
      const formatted = newDonor.trim().startsWith('@') ? newDonor.trim() : `@${newDonor.trim()}`;
      setDonors([...donors, formatted]);
      setNewDonor('');
    }
  };

  const runLab = async () => {
    if (!labText || !API_KEY) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Перепиши этот текст в стиле канала ${myStyle}. Сохрани пользу, сделай текст хлестким и добавь 1-2 эмодзи. Текст:\n${labText}`,
      });
      setLabText(response.text || '');
    } catch (e) {
      alert('Ошибка ИИ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="p-5 glass sticky top-0 z-10 flex justify-between items-center border-b border-white/5">
        <div>
          <h1 className="text-lg font-black tracking-tight italic">CONTENT <span className="text-blue-500 underline">AGENT</span></h1>
          <div className="flex items-center gap-1.5 mt-0.5 opacity-50">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Active Monitoring</span>
          </div>
        </div>
        <div className="w-10 h-10 bg-blue-500/10 rounded-full border border-blue-500/20 flex items-center justify-center">
            <span className="text-blue-500 text-xs font-bold">AI</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-28">
        {tab === 'feed' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {posts.map(p => (
              <div key={p.id} className="card p-5 space-y-4">
                <div className="flex justify-between items-center opacity-40 text-[10px] font-black uppercase tracking-tighter">
                  <span>From: {p.source}</span>
                  <span>{new Date(p.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-[15px] leading-relaxed font-medium text-gray-200">{p.content}</p>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(p.content)} className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Копировать</button>
                  <button className="flex-1 py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">В Канал</button>
                </div>
              </div>
            ))}
            {posts.length === 0 && <div className="text-center py-20 opacity-20 text-xs font-bold uppercase">Пока нет новостей</div>}
          </div>
        )}

        {tab === 'lab' && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="card p-5">
              <h3 className="text-[10px] font-black uppercase text-blue-500 mb-4 tracking-widest">AI Playground</h3>
              <textarea 
                className="w-full h-64 bg-black/30 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-blue-500/50 resize-none"
                placeholder="Вставь сюда сырую новость..."
                value={labText}
                onChange={e => setLabText(e.target.value)}
              />
              <button 
                onClick={runLab}
                disabled={loading}
                className="w-full mt-4 py-4 bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/30 active:scale-95 disabled:opacity-50 transition-all"
              >
                {loading ? 'Обработка...' : 'Сделать рерайт'}
              </button>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <section className="card p-6">
              <h3 className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-widest">Ваш стиль (Эталон)</h3>
              <input 
                className="w-full bg-black/30 border border-white/5 rounded-xl p-4 text-sm font-bold outline-none focus:border-blue-500/50"
                value={myStyle}
                onChange={e => setMyStyle(e.target.value)}
              />
            </section>

            <section className="card p-6">
              <h3 className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-widest">Источники (Доноры)</h3>
              <div className="flex gap-2 mb-4">
                <input 
                  className="flex-1 bg-black/30 border border-white/5 rounded-xl p-4 text-sm font-bold outline-none focus:border-blue-500/50"
                  placeholder="@channel"
                  value={newDonor}
                  onChange={e => setNewDonor(e.target.value)}
                />
                <button onClick={addDonor} className="bg-blue-600 px-6 rounded-xl font-black text-lg active:scale-90 transition-all">+</button>
              </div>
              <div className="space-y-2">
                {donors.map(d => (
                  <div key={d} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-xs font-bold">{d}</span>
                    <button onClick={() => setDonors(donors.filter(x => x !== d))} className="text-red-500/40 hover:text-red-500 text-[10px] font-black uppercase">Удалить</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-4 right-4 glass p-2 rounded-[32px] flex border border-white/10 shadow-2xl z-20">
        {[
          { id: 'feed', label: 'Лента', icon: '⚡' },
          { id: 'lab', label: 'Лаб', icon: '🧪' },
          { id: 'settings', label: 'Опции', icon: '⚙️' }
        ].map(i => (
          <button 
            key={i.id}
            onClick={() => setTab(i.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all rounded-2xl ${tab === i.id ? 'bg-blue-600 shadow-xl' : 'opacity-40'}`}
          >
            <span className="text-lg">{i.icon}</span>
            <span className="text-[10px] font-black uppercase">{i.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);