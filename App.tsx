
import React, { useState, useEffect, useCallback } from 'react';
import { BotStatus, SourceChannel } from './types';
import { StyleSection } from './components/StyleSection';
import { SourceList } from './components/SourceList';
import { StatusBadge } from './components/StatusBadge';

const App: React.FC = () => {
  const [myStyleChannel, setMyStyleChannel] = useState<string>('');
  const [sources, setSources] = useState<SourceChannel[]>([]);
  const [status, setStatus] = useState<BotStatus>(BotStatus.STOPPED);
  const [isSaving, setIsSaving] = useState(false);

  // Initial load simulation
  useEffect(() => {
    // In a real app, we would fetch this from our backend/local storage
    const savedStyle = localStorage.getItem('myStyleChannel');
    const savedSources = localStorage.getItem('sourceChannels');
    
    if (savedStyle) setMyStyleChannel(savedStyle);
    if (savedSources) setSources(JSON.parse(savedSources));
    
    // Simulate checking bot status
    setStatus(BotStatus.RUNNING);
  }, []);

  const handleSaveStyle = (url: string) => {
    setMyStyleChannel(url);
    localStorage.setItem('myStyleChannel', url);
    showFeedback();
  };

  const addSource = (url: string) => {
    if (!url) return;
    const newSource: SourceChannel = {
      id: Math.random().toString(36).substr(2, 9),
      url: url,
      name: url.replace('https://t.me/', '@').split('/').pop()
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

  const showFeedback = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  };

  return (
    <div className="min-h-screen p-4 bg-black text-white max-w-md mx-auto flex flex-col gap-6 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center py-2 sticky top-0 bg-black z-10 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Контент-Менеджер</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">Telegram Mini App</p>
        </div>
        <StatusBadge status={status} />
      </header>

      {/* Main Content */}
      <main className="flex flex-col gap-6">
        
        {/* Block: My Style */}
        <StyleSection 
          currentUrl={myStyleChannel} 
          onSave={handleSaveStyle} 
        />

        {/* Block: Sources */}
        <SourceList 
          sources={sources} 
          onAdd={addSource} 
          onRemove={removeSource} 
        />

      </main>

      {/* Floating Control Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent">
        <button 
          onClick={toggleBot}
          className={`w-full max-w-md mx-auto py-4 rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg ${
            status === BotStatus.RUNNING 
            ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
            : 'bg-[#2481cc] text-white'
          }`}
        >
          {status === BotStatus.RUNNING ? 'Остановить мониторинг' : 'Запустить мониторинг'}
        </button>
      </div>

      {/* Toast feedback */}
      {isSaving && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-xl animate-bounce">
          Настройки сохранены
        </div>
      )}
    </div>
  );
};

export default App;
