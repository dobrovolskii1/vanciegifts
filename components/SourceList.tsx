
import React, { useState } from 'react';
import { SourceChannel } from '../types';

interface SourceListProps {
  sources: SourceChannel[];
  onAdd: (url: string) => void;
  onRemove: (id: string) => void;
}

export const SourceList: React.FC<SourceListProps> = ({ sources, onAdd, onRemove }) => {
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

      {/* Add Form */}
      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          placeholder="Ссылка на канал" 
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="flex-1 bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#2481cc] transition-colors text-sm"
        />
        <button 
          onClick={handleAdd}
          className="bg-[#2481cc] text-white p-3 rounded-xl hover:opacity-90 active:scale-90 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {sources.length === 0 ? (
          <div className="py-8 text-center text-gray-500 italic text-sm">
            Список источников пуст. Добавьте первый канал выше.
          </div>
        ) : (
          sources.map((source) => (
            <div 
              key={source.id} 
              className="flex items-center justify-between bg-[#2c2c2e] p-3 pl-4 rounded-xl border border-white/5 group hover:border-white/10 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{source.name || 'Channel'}</span>
                <span className="text-[10px] text-gray-500 truncate max-w-[180px]">{source.url}</span>
              </div>
              <button 
                onClick={() => onRemove(source.id)}
                className="text-gray-500 hover:text-red-400 p-2 transition-colors"
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
