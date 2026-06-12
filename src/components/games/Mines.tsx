import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins, Sparkles, Gem, ShieldAlert } from 'lucide-react';
import { formatMoney } from '../../data';

interface MinesProps {
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
}

export default function Mines({
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound
}: MinesProps) {
  const [bet, setBet] = useState<number>(100);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [active, setActive] = useState<boolean>(false);
  const [board, setBoard] = useState<('gem' | 'bomb')[][]>([]);
  const [revealed, setRevealed] = useState<boolean[][]>(
    Array(5).fill(null).map(() => Array(5).fill(false))
  );
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [lastResult, setLastResult] = useState<{ win: boolean; amount: number; multiplier: number } | null>(null);

  // Math compound hypergeometric formula
  const getMultiplier = (rev: number) => {
    if (rev === 0) return 1.00;
    let m = 1;
    for (let i = 0; i < rev; i++) {
      m *= (25 - minesCount - i) / (25 - i);
    }
    return parseFloat(Math.max(1.01, (1 / m) * 0.97).toFixed(2));
  };

  const handleStartGame = () => {
    if (active) return;
    if (bet > balance || balance <= 0) {
      toast('Not enough donuts!', 'lose');
      return;
    }

    setLastResult(null);
    updateBalance(-bet);
    addXP(Math.max(1, Math.floor(bet / 10)));

    // Generate random layout of bombs and gems
    const size = 25;
    const bombIndices = new Set<number>();
    while (bombIndices.size < minesCount) {
      bombIndices.add(Math.floor(Math.random() * size));
    }

    const tempBoard: ('gem' | 'bomb')[][] = [];
    for (let r = 0; r < 5; r++) {
      const row: ('gem' | 'bomb')[] = [];
      for (let c = 0; c < 5; c++) {
        const index = r * 5 + c;
        row.push(bombIndices.has(index) ? 'bomb' : 'gem');
      }
      tempBoard.push(row);
    }

    setBoard(tempBoard);
    setRevealed(Array(5).fill(null).map(() => Array(5).fill(false)));
    setRevealedCount(0);
    setActive(true);
    toast('💣 Mines started! Tap squares to reveal gems.', 'info');
  };

  const handleTileClick = (r: number, c: number) => {
    if (!active || revealed[r][c]) return;

    const newRevealed = revealed.map((row, rIdx) => 
      row.map((col, cIdx) => (rIdx === r && cIdx === c ? true : col))
    );
    setRevealed(newRevealed);

    const isBomb = board[r][c] === 'bomb';

    if (isBomb) {
      // BOOM
      setActive(false);
      // Reveal all items
      setRevealed(Array(5).fill(null).map(() => Array(5).fill(true)));
      playSound(false);
      toast('💥 BOOM! You hit a mine!', 'lose');
      logLiveBet('Mines', bet, 'loss', 0);
      setLastResult({ win: false, amount: bet, multiplier: 0 });
    } else {
      const nextCount = revealedCount + 1;
      setRevealedCount(nextCount);
      playSound(true);

      // Check if all gems are revealed, then force cashout
      const totalGems = 25 - minesCount;
      if (nextCount === totalGems) {
        handleCashoutWithCount(nextCount, newRevealed);
      }
    }
  };

  const handleCashoutWithCount = (count: number, currentRevealed: boolean[][]) => {
    if (!active) return;
    setActive(false);
    
    // Reveal all remaining cells
    setRevealed(Array(5).fill(null).map(() => Array(5).fill(true)));

    const mult = getMultiplier(count);
    const winAmt = Math.floor(bet * mult);
    updateBalance(winAmt);
    toast(`🏁 Checked out with ${mult}x! +${winAmt - bet} donuts`, 'win');
    logLiveBet('Mines', winAmt - bet, 'win', mult);
    setLastResult({ win: true, amount: winAmt - bet, multiplier: mult });
  };

  const handleCashout = () => {
    handleCashoutWithCount(revealedCount, revealed);
  };

  const currentMult = getMultiplier(revealedCount);
  const nextMult = getMultiplier(revealedCount + 1);
  const liveProfit = revealedCount > 0 ? Math.floor(bet * currentMult) - bet : 0;

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* 5x5 Grid Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950/40 relative">
        <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500 tracking-wider h-14">
          MINES ORIGINALS
        </div>

        {/* Board grid */}
        <div className="grid grid-cols-5 gap-3 w-full max-w-sm aspect-square my-4 p-2 bg-slate-950 border border-white/5 rounded-2xl relative shadow-2xl">
          {Array(5).fill(null).map((_, r) => 
            Array(5).fill(null).map((_, c) => {
              const item = board[r]?.[c];
              const isRevealed = revealed[r][c];

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleTileClick(r, c)}
                  disabled={!active || isRevealed}
                  className={`relative rounded-xl border aspect-square flex items-center justify-center font-bold text-xl select-none transition-all duration-200
                    ${isRevealed 
                      ? item === 'bomb'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 scale-95 shadow-lg shadow-rose-500/10'
                        : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 scale-95 shadow-lg shadow-emerald-500/15'
                      : active 
                        ? 'bg-slate-900 border-white/5 hover:border-purple-400/40 hover:bg-slate-800/80 hover:-translate-y-0.5 cursor-pointer'
                        : 'bg-slate-900 border-white/5 opacity-55'
                    }`}
                >
                  {isRevealed ? (
                    item === 'gem' ? '💎' : '💣'
                  ) : active ? (
                    <span className="text-[10px] text-slate-600 font-extrabold uppercase font-mono bg-slate-950 px-1 border border-white/5 rounded">?</span>
                  ) : null}

                  {/* Visual flare for gems revealed on active turns */}
                  {isRevealed && item === 'gem' && active && (
                    <motion.div
                      animate={{ scale: [0.8, 1.4, 1], opacity: [0.2, 0.4, 0] }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 bg-emerald-400 rounded-xl"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Immediate results banner */}
        {lastResult && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-4 rounded-xl border w-full max-w-sm text-center ${
              lastResult.win 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="text-xs font-black uppercase tracking-wider">
              {lastResult.win ? '🏆 CASHOUT SUCCESS!' : '💥 GAME SQUASHED'}
            </div>
            <div className="text-xs mt-1">
              {lastResult.win 
                ? `Cleared with ${lastResult.multiplier}x multiplier, making +${lastResult.amount} donuts!` 
                : `Blew up on a mine. You lost your -${lastResult.amount} donuts bet`}
            </div>
          </motion.div>
        )}
      </div>

      {/* Control Panel */}
      <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5">
        
        {/* Conditional button states: Start vs Cashout */}
        {active ? (
          <button
            onClick={handleCashout}
            disabled={revealedCount === 0}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm uppercase tracking-wider"
          >
            CASH OUT ({currentMult}x)
          </button>
        ) : (
          <button
            onClick={handleStartGame}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all text-sm uppercase tracking-wider"
          >
            START GAME 💣
          </button>
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Bet Amount
          </label>
          <div className="flex bg-slate-900 border border-white/5 rounded-xl p-3 items-center">
            <Coins className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(Math.max(1, Math.min(balance, Math.floor(parseFloat(e.target.value)) || 0)))}
              disabled={active}
              className="bg-transparent border-none text-white font-extrabold text-sm outline-none w-full"
            />
          </div>
        </div>

        {/* Quick multipliers */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => !active && setBet(Math.max(1, Math.round(bet / 2)))}
            className="p-2 text-xs font-black bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            1/2
          </button>
          <button
            onClick={() => !active && setBet(Math.min(balance, bet * 2))}
            className="p-2 text-xs font-black bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            2x
          </button>
          <button
            onClick={() => !active && setBet(Math.max(1, Math.min(balance, Math.floor(balance / 2))))}
            className="p-2 text-xs font-black bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            50%
          </button>
          <button
            onClick={() => !active && setBet(balance)}
            className="p-2 text-xs font-black bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            MAX
          </button>
        </div>

        {/* Mines count select slider or preset blocks */}
        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Amount of Mines
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 10, 24].map((count) => (
              <button
                key={count}
                onClick={() => !active && setMinesCount(count)}
                className={`py-2 text-xs font-extrabold border rounded-lg transition-all
                  ${minesCount === count 
                    ? 'bg-purple-500/15 border-purple-500 text-purple-300 font-extrabold shadow-sm' 
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                  }`}
                disabled={active}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time stats display */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 flex flex-col gap-2 mt-auto text-xs">
          <div className="flex justify-between font-bold text-slate-500">
            <span>Multiplier</span>
            <span className="text-purple-400 font-extrabold">{currentMult}x</span>
          </div>
          <div className="flex justify-between font-bold text-slate-500">
            <span>Next compound size</span>
            <span className="text-slate-400 font-bold">{nextMult}x</span>
          </div>
          <div className="flex justify-between font-bold text-slate-500">
            <span>Live profit gain</span>
            <span className={revealedCount > 0 ? 'text-emerald-400 font-extrabold' : 'text-slate-500'}>
              +{formatMoney(liveProfit)} 🍩
            </span>
          </div>
          <div className="flex justify-between font-bold text-slate-500">
            <span>Gems revealed</span>
            <span className="text-white font-extrabold">{revealedCount}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
