import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins } from 'lucide-react';

interface DiceProps {
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
}

export default function Dice({
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound
}: DiceProps) {
  const [bet, setBet] = useState<number>(100);
  const [target, setTarget] = useState<number>(50);
  const [rolling, setRolling] = useState<boolean>(false);
  const [drawnRoll, setDrawnRoll] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ win: boolean; drawnNum: number; target: number; mode: 'under' | 'over' } | null>(null);

  const handleRoll = (mode: 'under' | 'over') => {
    if (bet > balance || balance <= 0) {
      toast('Not enough donuts!', 'lose');
      return;
    }

    setRolling(true);
    setLastResult(null);
    updateBalance(-bet);
    addXP(Math.max(1, Math.floor(bet / 10)));

    let spins = 0;
    const interval = setInterval(() => {
      setDrawnRoll(Math.floor(Math.random() * 101));
      spins++;

      if (spins > 10) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 101);
        setDrawnRoll(finalRoll);
        setRolling(false);

        // Win criteria
        const win = mode === 'under' ? finalRoll < target : finalRoll > target;
        const winChance = mode === 'under' ? target : 100 - target;
        const multiplier = parseFloat((100 / winChance).toFixed(2));
        const reward = win ? Math.floor(bet * multiplier) : 0;

        if (win) {
          updateBalance(reward);
          playSound(true);
          toast(`🏆 Dice hit! Select ${mode.toUpperCase()} ${target}: +${reward - bet} donuts`, 'win');
          setLastResult({ win: true, drawnNum: finalRoll, target, mode });
        } else {
          playSound(false);
          toast(`💸 Dice missed: -${bet} donuts`, 'lose');
          setLastResult({ win: false, drawnNum: finalRoll, target, mode });
        }

        logLiveBet('Dice', bet, win ? 'win' : 'loss', win ? multiplier : 0);
      }
    }, 85);
  };

  const getChance = (mode: 'under' | 'over') => (mode === 'under' ? target : 100 - target);
  const getMultiplier = (mode: 'under' | 'over') => {
    const chance = getChance(mode);
    return Math.max(1.01, parseFloat((100 / chance).toFixed(2)));
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Visual Dice Felt Room */}
      <div className="flex-1 flex flex-col p-6 bg-slate-950/40 justify-center items-center relative">
        <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500 tracking-wider">
          DICE SLIDER ROLL
        </div>

        {/* Dice rolled display */}
        <div className="text-center my-6 flex flex-col items-center">
          <div className={`w-28 h-28 rounded-2xl border-4 flex items-center justify-center font-mono text-5xl font-black shadow-2xl relative select-none
            ${rolling 
              ? 'bg-purple-500/10 border-purple-400 rotate-12 scale-105 shadow-purple-500/10' 
              : lastResult 
                ? lastResult.win 
                  ? 'bg-emerald-500/15 border-emerald-400 text-emerald-400 shadow-emerald-500/15'
                  : 'bg-rose-500/15 border-rose-500 text-rose-500 shadow-rose-500/10'
                : 'bg-slate-900 border-white/10 text-slate-300'
            }`}
          >
            {drawnRoll !== null ? drawnRoll : '🎲'}
            <div className="absolute top-2 right-2 text-[10px] opacity-25">0-100</div>
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-3">
            Rolled Outcome
          </div>
        </div>

        {/* Target Slide Gauge */}
        <div className="bg-slate-950 border border-white/5 rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
            <span>Target slider</span>
            <span className="text-purple-400 text-sm font-extrabold">{target}</span>
          </div>

          <input
            type="range"
            min={5}
            max={95}
            value={target}
            onChange={(e) => setTarget(parseInt(e.target.value))}
            disabled={rolling}
            className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[10px] font-black text-slate-600">
            <span>5</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>95</span>
          </div>
        </div>

        {/* Result banner overlay */}
        {lastResult && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-4 rounded-xl border w-full max-w-sm text-center mt-4 ${
              lastResult.win 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="text-xs font-black uppercase tracking-wider">
              {lastResult.win ? '🏆 DICE PROFIT HIT!' : '💸 DICE MISS'}
            </div>
            <div className="text-xs mt-1">
              Rolled <span className="font-bold underline">{lastResult.drawnNum}</span> which was{' '}
              {lastResult.mode === 'under' ? 'under' : 'over'} target {lastResult.target}. You met win targets!
            </div>
          </motion.div>
        )}
      </div>

      {/* Control panel and bet options sidebar */}
      <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5 overflow-y-auto">
        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Wager roll
          </label>
          <div className="flex bg-slate-900 border border-white/5 rounded-xl p-3 items-center">
            <Coins className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(Math.max(1, Math.min(balance, Math.floor(parseFloat(e.target.value)) || 0)))}
              disabled={rolling}
              className="bg-transparent border-none text-white font-extrabold text-sm outline-none w-full"
            />
          </div>
        </div>

        {/* Quick multipliers limits */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => !rolling && setBet(Math.max(1, Math.round(bet / 2)))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            1/2
          </button>
          <button
            onClick={() => !rolling && setBet(Math.min(balance, bet * 2))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            2x
          </button>
          <button
            onClick={() => !rolling && setBet(Math.max(1, Math.min(balance, Math.floor(balance / 2))))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            50%
          </button>
          <button
            onClick={() => !rolling && setBet(balance)}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            MAX
          </button>
        </div>

        {/* Action roll triggers */}
        <div className="flex flex-col gap-2 mt-auto">
          <button
            onClick={() => handleRoll('under')}
            disabled={rolling}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all text-xs uppercase tracking-wider"
          >
            ROLL UNDER {target} ({getMultiplier('under')}x)
          </button>
          <button
            onClick={() => handleRoll('over')}
            disabled={rolling}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-rose-500/25 transition-all text-xs uppercase tracking-wider"
          >
            ROLL OVER {target} ({getMultiplier('over')}x)
          </button>
        </div>
      </div>
    </div>
  );
}
