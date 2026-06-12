import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveBet } from '../types';
import { formatMoney } from '../data';

interface LiveBetsFeedProps {
  liveBets: LiveBet[];
}

export default function LiveBetsFeed({ liveBets }: LiveBetsFeedProps) {
  // Filter out any bots and only show live bets from the real player
  const combined = liveBets.slice(0, 10);

  return (
    <div className="h-10 bg-slate-950 border-t border-white/5 flex items-center px-4 overflow-hidden relative flex-shrink-0 z-30 select-none">
      <div className="flex items-center gap-1.5 flex-shrink-0 mr-3 pr-3 border-r border-white/10 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider relative">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        Live Bets
      </div>

      {/* Horizontal scrolling strip wrapper */}
      <div className="flex gap-3 overflow-x-auto h-full items-center pl-1 no-scrollbar flex-1">
        <AnimatePresence>
          {combined.length === 0 ? (
            <span className="text-[10px] text-slate-500 italic">No recent bets. Start playing to see your live bets!</span>
          ) : (
            combined.map((b) => {
              const isWin = b.result === 'win';
              return (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={b.id}
                  className="flex items-center gap-2 py-1 px-3 bg-slate-900 border border-white/5 rounded-lg flex-shrink-0 text-[10px]"
                >
                  <span className="font-extrabold text-slate-300 capitalize">{b.username}</span>
                  <span className="text-slate-500">{b.game}</span>
                  <span className={`font-black ${isWin ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {isWin ? '+' : '-'}{formatMoney(b.amount)} 🍩
                  </span>
                  {isWin && (
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded leading-none">
                      {b.mult}x
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
