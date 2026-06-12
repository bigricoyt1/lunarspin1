import React, { useState } from 'react';
import { Trophy, Compass, Star, Coins } from 'lucide-react';
import { formatMoney } from '../data';
import { User as UserType } from '../types';
import { getLevel } from '../lib/leveling';

interface LeaderboardModuleProps {
  user: UserType | null;
  balance: number;
  allUsers: UserType[];
}

export default function LeaderboardModule({ user, balance, allUsers }: LeaderboardModuleProps) {
  const [tab, setTab] = useState<'today' | 'alltime' | 'level'>('today');

  // Compile full table roster
  const dataset = allUsers.map((p) => {
    const isMe = user && p.id === user.id;
    const balVal = p.balance || 0;
    const xpVal = p.xp || 0;
    return {
      ...p,
      balVal,
      xpVal,
      level: getLevel(p.xp || 0),
      isMe
    };
  });

  // Apply sorting filters
  if (tab === 'level') {
    dataset.sort((a, b) => b.xpVal - a.xpVal);
  } else {
    dataset.sort((a, b) => b.balVal - a.balVal);
  }

  return (
    <div className="flex flex-col gap-4 p-4 animate-[fadeIn_0.3s_ease]">
      
      {/* Header controls select tabs */}
      <div className="flex border-b border-white/5 pr-1 flex-shrink-0">
        {([
          { id: 'today', label: '🏆 Today\'s Highrollers' },
          { id: 'alltime', label: '⭐ All-time Balances' },
          { id: 'level', label: '📈 Highest XP Levels' }
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 pr-6 text-xs font-extrabold transition-all border-b-2 cursor-pointer
              ${tab === t.id ? 'border-purple-500 text-purple-400 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Roster table view list */}
      <div className="flex flex-col gap-2">
        {dataset.length === 0 ? (
          <div className="text-center p-12 bg-slate-900/30 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3">
            <span className="text-3xl">🌙</span>
            <h4 className="text-sm font-black text-white uppercase font-mono mt-1">Leaderboards Empty</h4>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              No entries found. Sign In / Register inside the main lobby using the Topbar buttons to rank on the live server highroller charts!
            </p>
          </div>
        ) : (
          dataset.map((p, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
            
            return (
              <div
                key={p.username}
                className={`flex items-center gap-4 p-3 rounded-2xl border transition-all
                  ${p.isMe 
                    ? 'bg-purple-500/10 border-purple-500/35 shadow-lg shadow-purple-500/5' 
                    : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                  }`}
              >
              {/* Medal or Index rank */}
              <div className="w-8 text-center text-xs font-black text-slate-500">
                {medal ? <span className="text-xl leading-none">{medal}</span> : `#${index + 1}`}
              </div>

              {/* Character Avatar */}
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg select-none flex-shrink-0"
                style={{ backgroundColor: p.color }}
              >
                {p.emoji}
              </div>

              {/* Profile indicators */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-sm font-extrabold truncate max-w-[120px] ${p.isMe ? 'text-purple-300 font-black' : 'text-white'}`}>
                    {p.username}
                  </span>
                  {p.role !== 'member' && (
                    <span className="text-[8px] bg-slate-800 text-slate-400 border border-white/5 px-1.5 py-0.5 rounded uppercase font-bold">
                      {p.role}
                    </span>
                  )}
                  {p.isMe && (
                    <span className="text-[8px] bg-purple-500 text-white px-2 py-0.5 rounded font-black uppercase">
                      YOU
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  {p.isOnline ? <span className="text-emerald-400 font-bold">Online</span> : 'Offline Member'} · Level {p.level} Progress
                </span>
              </div>

              {/* Value display (Money vs XP) */}
              <div className="text-right">
                {tab === 'level' ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-purple-400 font-mono">
                      {(p.xpVal || 0).toLocaleString()} XP
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">
                      Level {p.level}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-amber-400 font-mono">
                      {formatMoney(p.balVal)}
                    </span>
                    <span className="text-sm">🌙</span>
                  </div>
                )}
              </div>

            </div>
          );
        }))}
      </div>

    </div>
  );
}
