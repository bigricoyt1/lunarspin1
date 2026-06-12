import React, { useState } from 'react';
import { getGameResult } from '../../utils';
import { motion, useAnimation } from 'motion/react';
import { Eye } from 'lucide-react';
import { User as UserType } from '../../types';
import BetControl from './BetControl';
import { db, collection, addDoc, serverTimestamp } from '../../lib/firebase';

import emeraldImg from '../../assets/images/mine_emerald_1781192001325.jpg';
import godAppleImg from '../../assets/images/mine_god_apple_1781192135510.jpg';
import netheriteSwordImg from '../../assets/images/mine_netherite_sword_1781192121880.jpg';

interface RouletteProps {
  user: UserType | null;
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
  antiCheatEnabled?: boolean;
}

const WHEEL_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export default function Roulette({
  user,
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound,
  antiCheatEnabled
}: RouletteProps) {
  const [bet, setBet] = useState<number>(100);
  const [betType, setBetType] = useState<'red' | 'black' | 'green' | 'even' | 'odd' | null>(null);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [history, setHistory] = useState<{ num: number; color: 'red' | 'black' | 'green' }[]>([
    { num: 14, color: 'red' },
    { num: 32, color: 'red' },
    { num: 0, color: 'green' },
    { num: 11, color: 'black' },
    { num: 27, color: 'red' }
  ]);
  const [lastResult, setLastResult] = useState<{ win: boolean; drawnNum: number; color: 'red' | 'black' | 'green'; amount: number } | null>(null);

  const carouselControls = useAnimation();

  const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  };

  const handleSpin = async () => {
    if (!betType) {
      toast('Select Red, Black, Green, Even, or Odd first!', 'info');
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

    setSpinning(true);
    setLastResult(null);
    updateBalance(-bet);
    addXP(Math.max(1, Math.floor(bet / 10)));

    // Rig logic
    const forcedWin = (Math.random() < 0.50); // ALWAYS 50% win rate as requested in every game
    
    let landingIndex = Math.floor(Math.random() * 37);
    let iterations = 0;
    
    while (iterations < 200) {
      const num = WHEEL_SEQUENCE[landingIndex];
      const col = getNumberColor(num);
      const isEvenNum = num !== 0 && num % 2 === 0;
      const isOddNum = num !== 0 && num % 2 !== 0;

      let currentWin = false;
      if (betType === 'red' && col === 'red') currentWin = true;
      else if (betType === 'black' && col === 'black') currentWin = true;
      else if (betType === 'green' && col === 'green') currentWin = true;
      else if (betType === 'even' && isEvenNum) currentWin = true;
      else if (betType === 'odd' && isOddNum) currentWin = true;

      // Match the 50/50 target for standard bets, or the 1/14 target for green (if forcedWin is true for green it's very lucky)
      if (betType === 'green') {
        if (col === 'green') break; // Green is still hard to get unless user luck is insane
      } else {
        if (currentWin === forcedWin) break;
      }
      
      landingIndex = Math.floor(Math.random() * 37);
      iterations++;
    }

    let winningNumber = WHEEL_SEQUENCE[landingIndex];
    let winningColor = getNumberColor(winningNumber);
    const num = winningNumber;
    const isEvenNum = num !== 0 && num % 2 === 0;
    const isOddNum = num !== 0 && num % 2 !== 0;

    let win = false;
    if (betType === 'red' && winningColor === 'red') win = true;
    else if (betType === 'black' && winningColor === 'black') win = true;
    else if (betType === 'green' && winningColor === 'green') win = true;
    else if (betType === 'even' && isEvenNum) win = true;
    else if (betType === 'odd' && isOddNum) win = true;

    // Carousel calculations:
    const blockWidth = 52;
    const padding = 6;
    const loopOffset = blockWidth + padding;
    
    // Reset track first
    await carouselControls.set({ x: 0 });

    // Multiply loops to give spinning friction
    const spinLoops = 5; // More loops for better feel
    const finalIndex = spinLoops * 37 + landingIndex;
    
    // We want the item's CENTER to be at the pointer.
    // The strip starts at 50% (pointer). To bring item K to the pointer:
    // x = -(K * loopOffset + blockWidth / 2)
    const targetX = -(finalIndex * loopOffset + (blockWidth / 2));

    await carouselControls.start({
      x: targetX,
      transition: { duration: 5, ease: [0.15, 0.7, 0.25, 1] } 
    });

    let multiplier = 2;
    if (betType === 'green') multiplier = 14;

    const payout = win ? bet * multiplier : 0;
    setSpinning(false);

    if (win) {
      updateBalance(payout);
      playSound(true);
      toast(`🏆 Roulette WIN! Selected ${betType.toUpperCase()}: +${payout - bet} money`, 'win');
      setLastResult({ win: true, drawnNum: winningNumber, color: winningColor, amount: payout - bet });
    } else {
      playSound(false);
      toast(`💸 Lost roulette bet: -${bet} money`, 'lose');
      setLastResult({ win: false, drawnNum: winningNumber, color: winningColor, amount: bet });
    }

    logLiveBet('Roulette', bet, win ? 'win' : 'loss', win ? multiplier : 0);
    setHistory(prev => [{ num: winningNumber, color: winningColor }, ...prev.slice(0, 7)]);

  };

  // Build the list of blocks for sliding strip
  const extendedWheel = [];
  const totalGenerations = 6; // Repeats the wheel sequence to populate track
  for (let loop = 0; loop < totalGenerations; loop++) {
    extendedWheel.push(...WHEEL_SEQUENCE);
  }

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Visual Wheel Carousel Area */}
      <div className="flex-1 flex flex-col p-6 bg-slate-950/40 relative justify-center">
        <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500 tracking-wider">
          ROULETTE WHEEL SPINNER
        </div>

        {/* Outer Wheel Strip Box */}
        <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 my-6 shadow-2xl relative">
          
          {/* Vertical center pointer line */}
          <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-[3px] bg-white z-20 shadow-[0_0_12px_#fff]">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-white" />
          </div>

          {/* Left/Right masks for smooth aesthetic */}
          <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

          {/* Sliding wrapper viewport */}
          <div className="overflow-hidden flex items-center h-16 relative">
            <motion.div
              animate={carouselControls}
              className="flex gap-[6px] absolute h-14 items-center pl-[50%]"
            >
              {extendedWheel.map((num, i) => {
                const col = getNumberColor(num);
                return (
                  <div
                    key={i}
                    className={`w-[52px] h-[52px] rounded-xl flex items-center justify-center font-extrabold text-sm border-2 flex-shrink-0 select-none
                      ${col === 'green' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : col === 'red' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-slate-900 border-white/10 text-slate-400'
                      }`}
                  >
                    {num}
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Landing History log pills */}
        <div className="mb-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Result history list
          </div>
          <div className="flex gap-2">
            {history.map((h, i) => (
              <span
                key={i}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border flex-shrink-0 select-none
                  ${h.color === 'green' 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                    : h.color === 'red' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-slate-900 border-white/5 text-slate-400'
                  }`}
              >
                {h.num}
              </span>
            ))}
          </div>
        </div>

        {/* Result banner overlay */}
        {lastResult && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-4 rounded-xl border w-full text-center ${
              lastResult.win 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="text-xs font-black uppercase tracking-wider">
              {lastResult.win ? '🏆 ROULETTE PROFIT HIT!' : '💸 WHEEL MISS'}
            </div>
            <div className="text-xs mt-1">
              Lucky number drew <span className="font-bold underline">{lastResult.drawnNum}</span> ({lastResult.color.toUpperCase()}). {lastResult.win ? `+${lastResult.amount}` : `-${lastResult.amount}`} money.
            </div>
          </motion.div>
        )}
      </div>

      {/* Control panel and bet options sidebar */}
      <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5 overflow-y-auto">
        <BetControl 
          bet={bet} 
          setBet={setBet} 
          balance={balance} 
          disabled={spinning} 
        />

        {/* Wager categories choices */}
        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Roulette Categories
          </label>
          <div className="flex flex-col gap-2">
            {/* Split Red vs Black */}
            <div className="flex gap-2">
              <button
                onClick={() => !spinning && setBetType('red')}
                className={`flex-1 py-3 text-xs font-extrabold border-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1
                  ${betType === 'red' 
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-extrabold' 
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                  }`}
                disabled={spinning}
              >
                <img src={godAppleImg} className="w-5 h-5 object-contain" alt="Red" />
                <span>RED (2x)</span>
              </button>
              <button
                onClick={() => !spinning && setBetType('black')}
                className={`flex-1 py-3 text-xs font-extrabold border-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1
                  ${betType === 'black' 
                    ? 'border-slate-400 bg-slate-400/5 text-slate-200 font-extrabold' 
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                  }`}
                disabled={spinning}
              >
                <img src={netheriteSwordImg} className="w-5 h-5 object-contain" alt="Black" />
                <span>BLACK (2x)</span>
              </button>
            </div>
            
            {/* Green Center sector */}
            <button
              onClick={() => !spinning && setBetType('green')}
              className={`w-full py-3 text-xs font-extrabold border-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1
                ${betType === 'green' 
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-extrabold' 
                  : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                }`}
              disabled={spinning}
            >
              <img src={emeraldImg} className="w-5 h-5 object-contain" alt="Green" />
              <span>GREEN ZERO sector (14x)</span>
            </button>

            {/* Odds vs Evens sectors */}
            <div className="flex gap-2">
              <button
                onClick={() => !spinning && setBetType('even')}
                className={`flex-1 py-3 text-xs font-extrabold border-2 rounded-xl transition-all
                  ${betType === 'even' 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300' 
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                  }`}
                disabled={spinning}
              >
                🔢 EVEN (2x)
              </button>
              <button
                onClick={() => !spinning && setBetType('odd')}
                className={`flex-1 py-3 text-xs font-extrabold border-2 rounded-xl transition-all
                  ${betType === 'odd' 
                    ? 'border-purple-500 bg-purple-500/10 text-purple-300' 
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                  }`}
                disabled={spinning}
              >
                🔢 ODD (2x)
              </button>
            </div>
          </div>
        </div>

        {/* Spin trigger button */}
        <button
          onClick={handleSpin}
          disabled={spinning || !betType}
          className="w-full mt-auto py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all text-sm uppercase tracking-wider"
        >
          {spinning ? 'Wheel spinning...' : 'SPIN sector wheel'}
        </button>
      </div>
    </div>
  );
}
