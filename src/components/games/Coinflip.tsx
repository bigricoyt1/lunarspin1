import React, { useState } from 'react';
import { getGameResult } from '../../utils';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { User as UserType } from '../../types';
import BetControl from './BetControl';

const emeraldImg = 'https://minecraft.wiki/images/Emerald_JE3_BE3.png';
const diamondImg = 'https://minecraft.wiki/images/Diamond_JE3_BE3.png';

interface CoinflipProps {
  user: UserType | null;
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
  antiCheatEnabled?: boolean;
}

export default function Coinflip({
  user,
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound,
  antiCheatEnabled
}: CoinflipProps) {
  const [bet, setBet] = useState<number>(100);
  const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
  const [flipping, setFlipping] = useState<boolean>(false);
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads');
  const [lastResult, setLastResult] = useState<{ win: boolean; coinSide: 'heads' | 'tails'; amount: number } | null>(null);

  const handleFlip = async () => {
    if (!choice) {
      toast('Select Heads or Tails first!', 'info');
      return;
    }
    if (bet <= 0 || isNaN(bet)) {
      toast('❌ Bet amount must be greater than 0!', 'info');
      return;
    }
    if (bet > balance || balance <= 0) {
      toast('❌ You got no money left!', 'info');
      return;
    }

    setFlipping(true);
    setLastResult(null);
    updateBalance(-bet);

    // Fetch secure side if enabled
    let finalSide: 'heads' | 'tails' | null = null;
    
    if ((window as any).antiCheatEnabled) {
      try {
        const res = await fetch('/api/games/roll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game: 'coinflip' })
        });
        const data = await res.json();
        finalSide = data.side;
      } catch (e) {}
    }

    // Simulate flipping coin
    let counter = 0;
    const interval = setInterval(() => {
      setCoinSide(Math.random() < 0.5 ? 'heads' : 'tails');
      counter++;
      if (counter > 10) {
        clearInterval(interval);
        
        let win = false;
        if (!finalSide) {
          // Rig logic fallback
          const storedDiff = localStorage.getItem('casino_win_difficulty') || 'fair';
          let globalChance = 50;
          if (storedDiff === 'god') globalChance = 99;
          if (storedDiff === 'lucky') globalChance = 75;
          if (storedDiff === 'rigged') globalChance = 15;

          win = getGameResult(globalChance, user?.rigRate);
          finalSide = win ? choice : (choice === 'heads' ? 'tails' : 'heads');
        } else {
          win = finalSide === choice;
        }

        const reward = win ? bet * 2 : 0;

        setCoinSide(finalSide);
        setFlipping(false);

        if (win) {
          updateBalance(reward);
          playSound(true);
          toast(`🏆 You WON $${bet}!`, 'win');
          setLastResult({ win: true, coinSide: finalSide, amount: bet });
        } else {
          playSound(false);
          toast(`💸 You LOST $${bet}`, 'lose');
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
            {coinSide === 'heads' ? (
              <img src={emeraldImg} className="w-24 h-24 object-contain" alt="Emerald" referrerPolicy="no-referrer" />
            ) : (
              <img src={diamondImg} className="w-24 h-24 object-contain" alt="Diamond" referrerPolicy="no-referrer" />
            )}
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
            <img src={emeraldImg} className="w-12 h-12 object-contain" alt="Emerald" referrerPolicy="no-referrer" />
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
            <img src={diamondImg} className="w-12 h-12 object-contain" alt="Diamond" referrerPolicy="no-referrer" />
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
              Coin landed on <span className="font-bold">{lastResult.coinSide === 'heads' ? 'Emerald' : 'Diamond'}</span>. {lastResult.win ? `+$${lastResult.amount * 2}` : `-$${lastResult.amount}`}.
            </div>
          </motion.div>
        )}
      </div>

      {/* Control Panel Sidebar */}
      <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5">
        <BetControl 
          bet={bet} 
          setBet={setBet} 
          balance={balance} 
          disabled={flipping} 
        />

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
