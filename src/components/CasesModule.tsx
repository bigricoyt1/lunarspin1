import React, { useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Coins, Package, Award, Sparkles, Check, CheckSquare } from 'lucide-react';
import { CASES, RARITIES, formatMoney } from '../data';
import { Case, CaseItem } from '../types';

interface CasesModuleProps {
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
}

export default function CasesModule({
  balance,
  updateBalance,
  addXP,
  toast,
  playSound
}: CasesModuleProps) {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [opening, setOpening] = useState<boolean>(false);
  const [rolledItems, setRolledItems] = useState<CaseItem[]>([]);
  const [winningItem, setWinningItem] = useState<CaseItem | null>(null);
  const [stage, setStage] = useState<'idle' | 'spinning' | 'reveal'>('idle');

  const reelControls = useAnimation();

  const handleOpenCase = async (c: Case) => {
    if (opening) return;
    if (balance < c.price) {
      toast(`Not enough donuts! This case costs ${formatMoney(c.price)} 🍩`, 'lose');
      return;
    }

    setOpening(true);
    setStage('spinning');
    setWinningItem(null);
    updateBalance(-c.price);
    addXP(Math.max(1, Math.floor(c.price / 10)));

    // Choose rolling items. We populate 50 slots to make sliding track long
    const itemPool = [...c.items];
    const trackItems: CaseItem[] = [];
    
    // Fill up track with random items
    for (let i = 0; i < 48; i++) {
      trackItems.push(itemPool[Math.floor(Math.random() * itemPool.length)]);
    }

    // Determine target winning item index near the end (index 41)
    const winIndex = 41;
    
    // Hypergeometric / proportional pick for the winner
    let totalP = 0;
    c.items.forEach(it => totalP += it.percent);
    let r = Math.random() * totalP;
    let accumulated = 0;
    let pickedWinner = c.items[c.items.length - 1];

    for (const it of c.items) {
      accumulated += it.percent;
      if (r <= accumulated) {
        pickedWinner = it;
        break;
      }
    }

    trackItems[winIndex] = pickedWinner;
    setRolledItems(trackItems);

    // Slide track: item card base size is 140px
    const itemWidth = 140;
    const finalOffset = winIndex * itemWidth - 180; // Centers the target card inside row frame container

    await reelControls.set({ x: 0 });
    await reelControls.start({
      x: -finalOffset,
      transition: { duration: 4.2, ease: [0.15, 0.7, 0.25, 1] }
    });

    // Reveal winner
    setWinningItem(pickedWinner);
    setStage('reveal');
    updateBalance(pickedWinner.value);
    playSound(true);
    toast(`📦 Pulled ${pickedWinner.name} (${formatMoney(pickedWinner.value)} 🍩)!`, 'win');
  };

  const handleCollect = () => {
    setOpening(false);
    setSelectedCase(null);
    setWinningItem(null);
    setStage('idle');
  };

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease] relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {CASES.map((c) => {
          const minVal = Math.min(...c.items.map(it => it.value));
          const maxVal = Math.max(...c.items.map(it => it.value));
          
          return (
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              onClick={() => setSelectedCase(c)}
              key={c.id}
              className="bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-purple-600/30 rounded-2xl p-5 cursor-pointer flex flex-col gap-4 relative overflow-hidden transition-all shadow-xl group"
            >
              {/* Box container glow styling */}
              <div
                className="absolute inset-0 bg-radial-gradient from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundImage: `radial-gradient(circle at 50% 25%, ${c.color}25 0, transparent 65%)` }}
              />

              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-white group-hover:text-purple-300 transition-colors">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                    {c.desc}
                  </span>
                </div>
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-3xl select-none group-hover:scale-105 transition-transform">
                  {c.id === 'donut' ? '🍩' : c.id === 'gold' ? '🪙' : c.id === 'emerald' ? '🍀' : c.id === 'lunar' ? '🌙' : '💎'}
                </div>
              </div>

              {/* Price Tag badge */}
              <div className="mt-2 flex items-baseline gap-1.5 z-10">
                <span className="text-2xl font-black text-white">{formatMoney(c.price)}</span>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Donuts</span>
              </div>

              {/* Range label list at base */}
              <div className="border-t border-white/5 pt-3 mt-auto flex justify-between items-center text-xs font-semibold text-slate-500 z-10">
                <span>Contents value:</span>
                <span className="text-slate-300 font-extrabold">{formatMoney(minVal)} - {formatMoney(maxVal)} 🍩</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Case Opener Sliding Modal Frame Overlay */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl p-6 relative flex flex-col gap-6 shadow-2xl">
            
            <button
              onClick={() => !opening && setSelectedCase(null)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center text-slate-400 transition-all font-bold"
              disabled={opening}
            >
              ✕
            </button>

            <div className="text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Opening Case</span>
              <span className="text-2xl font-black text-white">{selectedCase.name}</span>
            </div>

            {/* Slider track box body */}
            {stage === 'spinning' && (
              <div className="bg-slate-950 border border-white/5 rounded-2xl h-44 overflow-hidden relative shadow-inner p-2 my-2">
                {/* Visual cursor line */}
                <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-[3px] bg-purple-500 z-20 shadow-[0_0_12px_#a855f7]">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-purple-500" />
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-purple-500" />
                </div>

                {/* Left/Right masks */}
                <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

                <div className="flex h-full items-center relative">
                  <motion.div
                    animate={reelControls}
                    className="flex gap-4 absolute pl-[50%]"
                  >
                    {rolledItems.map((it, idx) => {
                      const col = RARITIES[it.rarity]?.color || '#a855f7';
                      return (
                        <div
                          key={idx}
                          className="w-[124px] h-[124px] rounded-2xl bg-slate-900 border-2 border-white/5 p-3 flex flex-col justify-center items-center gap-2 flex-shrink-0 select-none shadow"
                          style={{ borderColor: idx === 41 ? col : 'rgba(255,255,255,0.05)' }}
                        >
                          <span className="text-xl">📦</span>
                          <span className="text-[10px] font-bold text-center leading-tight truncate w-full text-slate-300">
                            {it.name}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-wide" style={{ color: col }}>
                            {it.rarity}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            )}

            {/* Pulled reveal output */}
            {stage === 'reveal' && winningItem && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 text-center my-6"
              >
                <div className="h-20 w-20 bg-white/5 border-2 rounded-2xl flex items-center justify-center text-4xl select-none" style={{ borderColor: RARITIES[winningItem.rarity]?.color }}>
                  📦
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block" style={{ color: RARITIES[winningItem.rarity]?.color }}>
                    {winningItem.rarity} PULL
                  </span>
                  <span className="text-3xl font-black text-white line-clamp-1 block mt-1">{winningItem.name}</span>
                  <span className="text-2xl font-black text-emerald-400 block mt-2">+{formatMoney(winningItem.value)} 🍩</span>
                </div>

                <button
                  onClick={handleCollect}
                  className="py-3 px-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all text-xs uppercase tracking-wider"
                >
                  Collect Loot
                </button>
              </motion.div>
            )}

            {/* Waiting/Idle state */}
            {stage === 'idle' && (
              <div className="text-center py-10 flex flex-col items-center gap-6">
                <Package className="w-20 h-20 text-slate-700 animate-bounce" />
                <button
                  onClick={() => handleOpenCase(selectedCase)}
                  className="py-4 px-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-extrabold rounded-2xl shadow-xl text-sm uppercase tracking-wider"
                >
                  Open Case ({formatMoney(selectedCase.price)} 🍩)
                </button>

                {/* Grid list of potential contents */}
                <div className="w-full text-left">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">
                    Potential contents
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {selectedCase.items.map((it) => {
                      const col = RARITIES[it.rarity]?.color || '#fff';
                      return (
                        <div key={it.id} className="flex justify-between items-center p-2 bg-slate-950/60 border border-white/5 rounded-xl text-xs">
                          <span className="font-bold text-slate-300 truncate w-2/3">{it.name}</span>
                          <span className="font-black" style={{ color: col }}>{formatMoney(it.value)} 🍩</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
