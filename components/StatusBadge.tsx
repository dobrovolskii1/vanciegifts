
import React from 'react';
import { BotStatus } from '../types';

interface StatusBadgeProps {
  status: BotStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
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

  const { label, color, bg, pulse } = config[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${bg} border border-white/5`}>
      {pulse && <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>}
      {!pulse && <div className={`h-2 w-2 rounded-full ${color.replace('text-', 'bg-')}`}></div>}
      <span className={`text-[11px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
    </div>
  );
};
