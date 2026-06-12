import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Coins } from 'lucide-react';

interface CoinflipProps {
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
}

export default function Coinflip({
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound
}: CoinflipProps) {
  const [bet, setBet] = useState<number>(100);
  const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
  const [flipping, setFlipping] = useState<boolean>(false);
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads');
  const [lastResult, setLastResult] = useState<{ win: boolean; coinSide: 'heads' | 'tails'; amount: number } | null>(null);

  const handleBetChange = (val: string) => {
    const num = Math.floor(parseFloat(val)) || 0;
    setBet(Math.max(1, Math.min(balance, num)));
  };

  const handleFlip = () => {
    if (!choice) {
      toast('Select Heads or Tails first!', 'info');
      return;
    }
    if (bet > balance || balance <= 0) {
      toast('Not enough donuts!', 'lose');
      return;
    }

    setFlipping(true);
    setLastResult(null);
    updateBalance(-bet);

    // Simulate flipping coin
    let counter = 0;
    const interval = setInterval(() => {
      setCoinSide(Math.random() < 0.5 ? 'heads' : 'tails');
      counter++;
      if (counter > 10) {
        clearInterval(interval);
        const finalSide = Math.random() < 0.5 ? 'heads' : 'tails';
        const win = finalSide === choice;
        const reward = win ? bet * 2 : 0;

        setCoinSide(finalSide);
        setFlipping(false);

        if (win) {
          updateBalance(reward);
          playSound(true);
          toast(`🏆 You WON ${bet} donuts!`, 'win');
          setLastResult({ win: true, coinSide: finalSide, amount: bet });
        } else {
          playSound(false);
          toast(`💸 You LOST ${bet} donuts`, 'lose');
          setLastResult({ win: false, coinSide: finalSide, amount: bet });
        }

        // Add XP
        addXP(Math.max(1, Math.floor(bet / 10)));
        logLiveBet('Coinflip', bet, win ? 'win' : 'loss', win ? 2 : 0);
      }
    }, 100);
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Play Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950/40 relative">
        <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500 tracking-wider">
          COINFLIP ORIGINALS
        </div>

        {/* The Coin */}
        <div className="relative my-8">
          <motion.div
            className={`w-36 h-36 rounded-full border-4 flex items-center justify-center text-6xl shadow-2xl relative select-none
              ${coinSide === 'heads' 
                ? 'bg-gradient-to-br from-amber-400/20 to-yellow-600/5 border-amber-400/60 shadow-amber-400/10' 
                : 'bg-gradient-to-br from-purple-400/20 to-indigo-600/5 border-purple-400/60 shadow-purple-400/10'
              }`}
            animate={flipping ? { rotateY: 360 * 3, scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {coinSide === 'heads' ? '☀️' : '🌙'}
            <div className="absolute inset-2 border-2 border-dashed border-white/5 rounded-full" />
          </motion.div>
        </div>

        {/* Coinflip Choices */}
        <div className="flex gap-4 w-full max-w-xs mb-8">
          <button
            onClick={() => !flipping && setChoice('heads')}
            className={`flex-1 flex flex-col items-center p-4 rounded-xl border-2 transition-all 
              ${choice === 'heads' 
                ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-400/5 text-amber-300' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            disabled={flipping}
          >
            <span className="text-3xl">☀️</span>
            <span className="text-xs font-bold mt-2 uppercase tracking-wide">Heads</span>
          </button>
          
          <button
            onClick={() => !flipping && setChoice('tails')}
            className={`flex-1 flex flex-col items-center p-4 rounded-xl border-2 transition-all 
              ${choice === 'tails' 
                ? 'bg-purple-500/10 border-purple-400 shadow-lg shadow-purple-400/5 text-purple-300' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            disabled={flipping}
          >
            <span className="text-3xl">🌙</span>
            <span className="text-xs font-bold mt-2 uppercase tracking-wide">Tails</span>
          </button>
        </div>

        {/* Immediate win/loss output in central area */}
        {lastResult && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-4 rounded-xl border w-full max-w-xs text-center ${
              lastResult.win 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="text-sm font-black uppercase tracking-wider">
              {lastResult.win ? '🏆 YOU WON!' : '💸 YOU LOST'}
            </div>
            <div className="text-xs mt-1">
              Coin landed on <span className="font-bold">{lastResult.coinSide === 'heads' ? '☀️ Heads' : '🌙 Tails'}</span>. {lastResult.win ? `+${lastResult.amount * 2}` : `-${lastResult.amount}`} donuts.
            </div>
          </motion.div>
        )}
      </div>

      {/* Control Panel Sidebar */}
      <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5">
        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Bet Amount
          </label>
          <div className="flex bg-slate-900 border border-white/5 rounded-xl p-3 items-center">
            <Coins className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
            <input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(e.target.value)}
              disabled={flipping}
              className="bg-transparent border-none text-white font-extrabold text-sm outline-none w-full"
            />
          </div>
        </div>

        {/* Quick multipliers */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => !flipping && setBet(Math.max(1, Math.floor(bet / 2)))}
            className="p-2 text-xs font-black bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            1/2
          </button>
          <button
            onClick={() => !flipping && setBet(Math.min(balance, bet * 2))}
            className="p-2 text-xs font-black bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            2x
          </button>
          <button
            onClick={() => !flipping && setBet(Math.max(1, Math.min(balance, Math.floor(balance / 2))))}
            className="p-2 text-xs font-black bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            50%
          </button>
          <button
            onClick={() => !flipping && setBet(balance)}
            className="p-2 text-xs font-black bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            MAX
          </button>
        </div>

        {/* Static multipliers block for premium look */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 text-center">
            <div className="text-md font-extrabold text-purple-400">2.00x</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Multiplier</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 text-center">
            <div className="text-md font-extrabold text-purple-400">50%</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Win Chance</div>
          </div>
        </div>

        {/* Flip Button */}
        <button
          onClick={handleFlip}
          disabled={flipping || !choice}
          className="w-full mt-auto py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all text-sm uppercase tracking-wider"
        >
          {flipping ? 'Coin Spinning...' : 'Flip Coin 🪙'}
        </button>
      </div>
    </div>
  );
}
