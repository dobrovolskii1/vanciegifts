
import React, { useState } from 'react';

interface StyleSectionProps {
  currentUrl: string;
  onSave: (url: string) => void;
}

export const StyleSection: React.FC<StyleSectionProps> = ({ currentUrl, onSave }) => {
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
        Укажите ссылку на ваш канал. ИИ будет анализировать посты из него как эталон для рерайта.
      </p>

      <div className="space-y-3">
        <input 
          type="text" 
          placeholder="https://t.me/your_channel" 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#2481cc] transition-colors text-sm"
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
