import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User as UserType } from '../../types';
import BetControl from './BetControl';

interface OddEvenProps {
  user: UserType | null;
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
}

export default function OddEven({
  user,
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound,
}: OddEvenProps) {
  const [bet, setBet] = useState<number>(100);
  const [choice, setChoice] = useState<'odd' | 'even' | null>(null);
  const [rolling, setRolling] = useState<boolean>(false);
  const [resultNum, setResultNum] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ win: boolean; num: number; amount: number } | null>(null);

  const handleRoll = async () => {
    if (!choice) {
      toast('Select Odd or Even first!', 'info');
      return;
    }
    if (bet <= 0 || isNaN(bet)) {
       toast('❌ Bet amount must be greater than 0!', 'info');
       return;
    }
    if (bet > balance || balance <= 0) {
      toast('❌ Insufficient balance!', 'info');
      return;
    }

    setRolling(true);
    setLastResult(null);
    updateBalance(-bet);

    // Simulate rolling
    setTimeout(() => {
      const num = Math.floor(Math.random() * 100) + 1;
      const isOdd = num % 2 !== 0;
      const win = (choice === 'odd' && isOdd) || (choice === 'even' && !isOdd);
      const reward = win ? bet * 2 : 0;

      setResultNum(num);
      setRolling(false);

      if (win) {
        updateBalance(reward);
        playSound(true);
        toast(`🏆 You WON $${bet}!`, 'win');
        setLastResult({ win: true, num, amount: bet });
      } else {
        playSound(false);
        toast(`💸 You LOST $${bet}`, 'lose');
        setLastResult({ win: false, num, amount: bet });
      }

      addXP(Math.max(1, Math.floor(bet / 10)));
      logLiveBet('OddEven', bet, win ? 'win' : 'loss', win ? 2 : 0);
    }, 1000);
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950/40 relative">
        <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500 tracking-wider">ODD OR EVEN</div>
        
        <div className="my-8 text-6xl font-black text-white">
          {rolling ? '...' : resultNum || '?'}
        </div>

        <div className="flex gap-4 w-full max-w-xs mb-8">
          <button
            onClick={() => !rolling && setChoice('odd')}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${choice === 'odd' ? 'bg-indigo-500/10 border-indigo-400 text-indigo-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}
          >
            Odd
          </button>
          <button
            onClick={() => !rolling && setChoice('even')}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${choice === 'even' ? 'bg-fuchsia-500/10 border-fuchsia-400 text-fuchsia-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}
          >
            Even
          </button>
        </div>
        
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
              Number was <span className="font-bold">{lastResult.num} ({lastResult.num % 2 === 0 ? 'Even' : 'Odd'})</span>. {lastResult.win ? `+$${lastResult.amount * 2}` : `-$${lastResult.amount}`}.
            </div>
          </motion.div>
        )}
      </div>
      <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5">
        <BetControl bet={bet} setBet={setBet} balance={balance} disabled={rolling} />
        <button
          onClick={handleRoll}
          disabled={rolling || !choice}
          className="w-full mt-auto py-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 disabled:opacity-30 text-white font-extrabold rounded-xl shadow-lg transition-all text-sm uppercase"
        >
          {rolling ? 'Rolling...' : 'Roll'}
        </button>
      </div>
    </div>
  );
}
