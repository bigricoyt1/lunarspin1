import React, { useState, useEffect } from 'react';
import { LiveBet } from '../types';
import { formatMoney } from '../data';
import { Flame, TrendingUp } from 'lucide-react';

export default function LiveBetsFeed({ liveBets }: { liveBets: LiveBet[] }) {
  return (
    <div className="bg-slate-900 border-t border-white/5 p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold uppercase text-xs tracking-widest px-2">
        <TrendingUp className="w-4 h-4" />
        Live Bets
      </div>
      <div className="flex gap-4 animate-scroll whitespace-nowrap">
        {liveBets.slice(0, 15).map((bet) => (
          <div key={bet.id} className="bg-slate-800/50 rounded-lg px-3 py-2 border border-white/5 flex items-center gap-3">
             <span className="text-white font-bold">{bet.username}</span>
             <span className="text-slate-400">won</span>
             <span className={bet.result === 'win' ? 'text-emerald-400' : 'text-rose-400'}>{formatMoney(bet.amount)}</span>
             <span className="text-slate-500 text-xs">on {bet.game}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
