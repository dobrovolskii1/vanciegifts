
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// --- Types & Constants ---
enum BotStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR'
}

enum AppTab {
  FEED = 'FEED',
  SETTINGS = 'SETTINGS'
}

interface SourceChannel {
  id: string;
  url: string;
  name: string;
}

interface GeneratedPost {
  id: string;
  rewrittenText: string;
  originalUrl: string;
  timestamp: number;
  sourceName: string;
  isNew: boolean;
}

// --- Components ---

const StatusBadge: React.FC<{ status: BotStatus }> = ({ status }) => {
  const config = {
    [BotStatus.RUNNING]: {
      label: 'Активен',
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      pulse: true
    },
    [BotStatus.STOPPED]: {
      label: 'Остановлен',
      color: 'text-gray-400',
      bg: 'bg-gray-400/10',
      pulse: false
    },
    [BotStatus.ERROR]: {
      label: 'Ошибка',
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      pulse: false
    }
  };

  const { label, color, bg, pulse } = config[status] || config[BotStatus.STOPPED];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${bg} border border-white/5`}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      )}
      {!pulse && <div className={`h-2 w-2 rounded-full ${color.replace('text-', 'bg-')}`}></div>}
      <span className={`text-[11px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
    </div>
  );
};

const StyleSection: React.FC<{ currentUrl: string; onSave: (url: string) => void }> = ({ currentUrl, onSave }) => {
  const [value, setValue] = useState(currentUrl);

  return (
    <section className="bg-[#1c1c1d] rounded-2xl p-5 border border-white/5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Мой стиль</h2>
      </div>
      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
        Укажите ссылку на ваш канал. ИИ будет анализировать посты из него как эталон стиля.
      </p>
      <div className="space-y-3">
        <input 
          type="text" 
          placeholder="https://t.me/your_channel" 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#2481cc] transition-colors text-sm text-white"
        />
        <button 
          onClick={() => onSave(value)}
          className="w-full bg-[#2481cc]/10 text-[#2481cc] font-medium py-3 rounded-xl hover:bg-[#2481cc]/20 transition-all active:scale-[0.98]"
        >
          Обновить эталон
        </button>
      </div>
    </section>
  );
};

const SourceList: React.FC<{ sources: SourceChannel[]; onAdd: (url: string) => void; onRemove: (id: string) => void }> = ({ sources, onAdd, onRemove }) => {
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = () => {
    if (newUrl.trim()) {
      onAdd(newUrl.trim());
      setNewUrl('');
    }
  };

  return (
    <section className="bg-[#1c1c1d] rounded-2xl p-5 border border-white/5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Источники (Доноры)</h2>
      </div>
      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          placeholder="Ссылка на канал (например, @giftnews)" 
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="flex-1 bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#2481cc] transition-colors text-sm text-white"
        />
        <button 
          onClick={handleAdd}
          className="bg-[#2481cc] text-white p-3 rounded-xl hover:opacity-90 active:scale-90 transition-all flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {sources.length === 0 ? (
          <div className="py-8 text-center text-gray-500 italic text-sm">
            Список источников пуст. Добавьте каналы через @.
          </div>
        ) : (
          sources.map((source) => (
            <div key={source.id} className="flex items-center justify-between bg-[#2c2c2e] p-3 pl-4 rounded-xl border border-white/5 group">
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{source.name || 'Channel'}</span>
                <span className="text-[10px] text-gray-500 truncate">{source.url}</span>
              </div>
              <button 
                onClick={() => onRemove(source.id)}
                className="text-gray-500 hover:text-red-400 p-2 transition-colors flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

const FeedSection: React.FC<{ 
  posts: GeneratedPost[]; 
  onMarkRead: (id: string) => void;
  onCopy: (text: string) => void;
}> = ({ posts, onMarkRead, onCopy }) => {
  return (
    <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-10">
          <div className="w-16 h-16 bg-[#1c1c1d] rounded-full flex items-center justify-center mb-4 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Здесь пока пусто</h3>
          <p className="text-sm text-gray-500">
            Бот мониторит {DONOR_CHANNELS.length} каналов в реальном времени. Ожидайте новых публикаций.
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <div 
            key={post.id} 
            className={`bg-[#1c1c1d] rounded-2xl border border-white/5 overflow-hidden transition-all ${post.isNew ? 'ring-2 ring-[#2481cc]/50 shadow-[0_0_15px_rgba(36,129,204,0.1)]' : ''}`}
            onClick={() => onMarkRead(post.id)}
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2481cc]">Готовый пост</span>
                {post.isNew && <span className="w-2 h-2 bg-[#2481cc] rounded-full animate-pulse"></span>}
              </div>
              <span className="text-[10px] text-gray-500">{new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            <div className="p-5">
              <p className="text-sm leading-relaxed whitespace-pre-wrap select-text mb-6">
                {post.rewrittenText}
              </p>
              
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onCopy(post.rewrittenText); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Копировать
                </button>
                <a 
                  href={post.originalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 bg-[#2481cc]/10 text-[#2481cc] px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Оригинал
                </a>
              </div>
            </div>
            
            <div className="px-5 py-3 bg-[#161617] text-[10px] text-gray-500 border-t border-white/5">
              Источник: <span className="text-gray-400">{post.sourceName}</span>
            </div>
          </div>
        ))
      )}
    </section>
  );
};

// --- Mock Data ---
const DONOR_CHANNELS = ['@giftnews', '@gift_newstg', '@digest', '@UaOnlii'];

// --- Main App ---

const App = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FEED);
  const [myStyleChannel, setMyStyleChannel] = useState('');
  const [sources, setSources] = useState<SourceChannel[]>([]);
  const [status, setStatus] = useState(BotStatus.STOPPED);
  const [isSaving, setIsSaving] = useState(false);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);

  useEffect(() => {
    const savedStyle = localStorage.getItem('myStyleChannel') || '';
    const savedSourcesStr = localStorage.getItem('sourceChannels');
    const savedSources = savedSourcesStr ? JSON.parse(savedSourcesStr) : DONOR_CHANNELS.map(url => ({
        id: Math.random().toString(),
        url: url,
        name: url
    }));
    
    setMyStyleChannel(savedStyle);
    setSources(savedSources);
    setStatus(BotStatus.RUNNING);

    // Initial dummy post
    const initialPosts: GeneratedPost[] = [
      {
        id: '1',
        rewrittenText: "⚡️ Новый прорыв в области нейросетей!\n\nДрузья, только что стало известно, что Google анонсировали Gemini 3.0. Это не просто обновление, а настоящий прыжок в будущее. Модель теперь понимает контекст на уровне человека и способна генерировать видео в 4К за секунды.\n\nБудем тестировать, оставайтесь на связи! 🚀",
        originalUrl: "https://t.me/durov",
        timestamp: Date.now() - 1000 * 60 * 30,
        sourceName: "@tech_news_global",
        isNew: true
      }
    ];
    setPosts(initialPosts);
  }, []);

  const handleSaveStyle = (url: string) => {
    setMyStyleChannel(url);
    localStorage.setItem('myStyleChannel', url);
    showFeedback("Настройки сохранены");
  };

  const addSource = (url: string) => {
    const formattedUrl = url.startsWith('@') ? url : (url.includes('/') ? `@${url.split('/').pop()}` : `@${url}`);
    const newSource: SourceChannel = {
      id: Date.now().toString(),
      url: formattedUrl,
      name: formattedUrl
    };
    const updated = [...sources, newSource];
    setSources(updated);
    localStorage.setItem('sourceChannels', JSON.stringify(updated));
  };

  const removeSource = (id: string) => {
    const updated = sources.filter(s => s.id !== id);
    setSources(updated);
    localStorage.setItem('sourceChannels', JSON.stringify(updated));
  };

  const toggleBot = () => {
    setStatus(prev => prev === BotStatus.RUNNING ? BotStatus.STOPPED : BotStatus.RUNNING);
  };

  const markPostRead = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, isNew: false } : p));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showFeedback("Скопировано в буфер");
  };

  const [toastMsg, setToastMsg] = useState("");
  const showFeedback = (msg: string) => {
    setToastMsg(msg);
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setToastMsg("");
    }, 2000);
  };

  const unreadCount = posts.filter(p => p.isNew).length;

  return (
    <div className="min-h-screen p-4 bg-black text-white max-w-md mx-auto flex flex-col gap-6 pb-28">
      {/* Header */}
      <header className="flex justify-between items-center py-2 sticky top-0 bg-black z-40 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Контент-Менеджер</h1>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">
            {activeTab === AppTab.FEED ? 'Мониторинг Railway' : 'Настройки'}
          </p>
        </div>
        <StatusBadge status={status} />
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === AppTab.FEED ? (
          <FeedSection 
            posts={posts} 
            onMarkRead={markPostRead} 
            onCopy={copyToClipboard} 
          />
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <StyleSection currentUrl={myStyleChannel} onSave={handleSaveStyle} />
            <SourceList sources={sources} onAdd={addSource} onRemove={removeSource} />
            
            <div className="bg-[#1c1c1d] rounded-2xl p-5 border border-white/5">
               <h3 className="text-sm font-bold mb-2">Статус сервера Railway</h3>
               <p className="text-xs text-gray-500 mb-4">Бот работает через Telethon. Все изменения в источниках вступят в силу после перезапуска скрипта main.py на сервере.</p>
               <button 
                onClick={toggleBot}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.96] border ${
                  status === BotStatus.RUNNING 
                  ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                  : 'bg-green-500/10 text-green-500 border-green-500/20'
                }`}
              >
                {status === BotStatus.RUNNING ? 'Остановить скрипт' : 'Перезапустить скрипт'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Tab Bar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 tg-gradient-bg z-50 px-6 pb-6 pt-2">
        <div className="max-w-md mx-auto bg-[#1c1c1d]/90 backdrop-blur-lg rounded-2xl border border-white/10 flex items-center p-1.5 shadow-2xl">
          <button 
            onClick={() => setActiveTab(AppTab.FEED)}
            className={`relative flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${activeTab === AppTab.FEED ? 'bg-[#2c2c2e] text-white' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] mt-1 font-bold uppercase tracking-tight">Лента</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-1/3 w-2 h-2 bg-[#2481cc] rounded-full border border-[#1c1c1d]"></span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab(AppTab.SETTINGS)}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${activeTab === AppTab.SETTINGS ? 'bg-[#2c2c2e] text-white' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] mt-1 font-bold uppercase tracking-tight">Настройки</span>
          </button>
        </div>
      </nav>

      {/* Toast feedback */}
      {isSaving && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#2481cc] text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
