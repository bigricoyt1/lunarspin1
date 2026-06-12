import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins } from 'lucide-react';
import { formatMoney } from '../../data';

interface TowersProps {
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
}

const T_DIFFS = [
  { cols: 4, safe: 3, mult: 1.30, label: '🟢 Easy' },
  { cols: 3, safe: 2, mult: 1.45, label: '🟡 Normal' },
  { cols: 2, safe: 1, mult: 1.90, label: '🔴 Hard' }
];

export default function Towers({
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound
}: TowersProps) {
  const [bet, setBet] = useState<number>(100);
  const [active, setActive] = useState<boolean>(false);
  const [diffIdx, setDiffIdx] = useState<number>(0);
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [grid, setGrid] = useState<number[][]>([]); // 8 floors. Each floor has binary 0 (safe) or 1 (bomb)
  const [lastResult, setLastResult] = useState<{ win: boolean; amount: number; multiplier: number } | null>(null);

  const currentDiff = T_DIFFS[diffIdx];

  const handleStart = () => {
    if (active) return;
    if (bet > balance || balance <= 0) {
      toast('Not enough donuts!', 'lose');
      return;
    }

    setLastResult(null);
    updateBalance(-bet);
    addXP(Math.max(1, Math.floor(bet / 10)));

    // Generate 8 floors grid
    const tempGrid: number[][] = [];
    for (let r = 0; r < 8; r++) {
      const row: number[] = Array(currentDiff.cols).fill(0); // 0 = safe, 1 = bomb
      const bombIndices = new Set<number>();
      const totalBombs = currentDiff.cols - currentDiff.safe;

      while (bombIndices.size < totalBombs) {
        bombIndices.add(Math.floor(Math.random() * currentDiff.cols));
      }

      for (const i of bombIndices) {
        row[i] = 1;
      }
      tempGrid.push(row);
    }

    setGrid(tempGrid);
    setCurrentRow(0);
    setActive(true);
    toast('🗼 Towers started! Pick a slot on the bottom row.', 'info');
  };

  const handlePick = (col: number) => {
    if (!active) return;

    const isMine = grid[currentRow][col] === 1;

    if (isMine) {
      // Hit bomb
      setActive(false);
      playSound(false);
      toast('💥 BOOM! Hit a mine on floor ' + (currentRow + 1), 'lose');
      logLiveBet('Towers', bet, 'loss', 0);
      setLastResult({ win: false, amount: bet, multiplier: 0 });
    } else {
      playSound(true);
      const nextRow = currentRow + 1;
      setCurrentRow(nextRow);

      if (nextRow >= 8) {
        // Reached apex! Auto cashout
        handleCashoutWithRow(nextRow);
      }
    }
  };

  const handleCashoutWithRow = (row: number) => {
    if (!active || row === 0) return;
    setActive(false);

    const mult = parseFloat(Math.pow(currentDiff.mult, row).toFixed(2));
    const winAmt = Math.floor(bet * mult);
    updateBalance(winAmt);

    toast(`🏆 Tower apex! Cashed out +${winAmt - bet} donuts at ${mult}x`, 'win');
    logLiveBet('Towers', winAmt - bet, 'win', mult);
    setLastResult({ win: true, amount: winAmt - bet, multiplier: mult });
  };

  const handleCashout = () => {
    handleCashoutWithRow(currentRow);
  };

  const liveMult = parseFloat(Math.pow(currentDiff.mult, currentRow).toFixed(2));
  const liveProfit = currentRow > 0 ? Math.floor(bet * liveMult) - bet : 0;

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Visual Towers Area */}
      <div className="flex-1 flex flex-col p-6 bg-slate-950/40 justify-center items-center relative overflow-y-auto">
        <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500 tracking-wider h-14">
          TOWERS CLIMB RISK
        </div>

        {/* The tower ladder grid */}
        <div className="flex flex-col-reverse gap-1.5 w-full max-w-xs my-4 p-3 bg-slate-950 border border-white/5 rounded-2xl relative shadow-2xl">
          {grid.map((row, r) => {
            const isCurrent = r === currentRow;
            const isCompleted = r < currentRow;
            
            return (
              <div
                key={r}
                className="grid gap-2 pr-1"
                style={{ gridTemplateColumns: `repeat(${currentDiff.cols}, 1fr)` }}
              >
                {row.map((val, c) => {
                  return (
                    <button
                      key={c}
                      onClick={() => handlePick(c)}
                      disabled={!active || !isCurrent}
                      className={`h-9 rounded-lg border flex items-center justify-center font-bold text-sm transition-all duration-150 relative select-none
                        ${isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400 font-extrabold text-[10px]'
                          : isCurrent && active
                            ? 'bg-slate-900 border-purple-500 hover:border-purple-400 hover:bg-slate-800 cursor-pointer text-[10px] text-slate-500'
                            : !active && isCurrent && val === 1
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                              : !active && isCurrent && val === 0
                                ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400'
                                : 'bg-slate-900/30 border-white/5 opacity-25'
                        }`}
                    >
                      {isCompleted ? (
                        '💎'
                      ) : isCurrent && active ? (
                        '?'
                      ) : !active && isCurrent ? (
                        val === 1 ? '💣' : '💎'
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {grid.length === 0 && (
            <div className="text-center text-slate-600 text-xs py-14">
              Click Start to generate Tower floors
            </div>
          )}
        </div>

        {/* Results banner */}
        {lastResult && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-3 rounded-xl border w-full max-w-xs text-center ${
              lastResult.win 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="text-xs font-black uppercase tracking-wider">
              {lastResult.win ? '🏆 TOWER CLIMBED!' : '💸 MINE DETONATED'}
            </div>
            <div className="text-xs mt-1">
              {lastResult.win 
                ? `Cleared floors making +${lastResult.amount} donuts at ${lastResult.multiplier}x!` 
                : `Blew up. Lost your -${lastResult.amount} donuts bet`}
            </div>
          </motion.div>
        )}
      </div>

      {/* Control panel and bet options sidebar */}
      <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5 overflow-y-auto">
        {active ? (
          <button
            onClick={handleCashout}
            disabled={currentRow === 0}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm uppercase tracking-wider"
          >
            CASH OUT ({liveMult}x)
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all text-sm uppercase tracking-wider"
          >
            START CLIMB 🗼
          </button>
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Wager donut
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

        {/* Quick multipliers limits */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => !active && setBet(Math.max(1, Math.round(bet / 2)))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            1/2
          </button>
          <button
            onClick={() => !active && setBet(Math.min(balance, bet * 2))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            2x
          </button>
          <button
            onClick={() => !active && setBet(Math.max(1, Math.min(balance, Math.floor(balance / 2))))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            50%
          </button>
          <button
            onClick={() => !active && setBet(balance)}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            MAX
          </button>
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Climb Risk Difficulty
          </label>
          <div className="flex flex-col gap-2">
            {T_DIFFS.map((d, i) => (
              <button
                key={i}
                onClick={() => !active && setDiffIdx(i)}
                className={`py-3 text-xs font-extrabold border-2 rounded-xl transition-all text-left px-4 flex justify-between items-center
                  ${diffIdx === i 
                    ? 'border-purple-500 bg-purple-500/10 text-white' 
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                  }`}
                disabled={active}
              >
                <span>{d.label}</span>
                <span className="text-[10px] text-slate-500">{d.mult}x / Floor</span>
              </button>
            ))}
          </div>
        </div>

        {/* Real-time stats display */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 flex flex-col gap-2 mt-auto text-xs">
          <div className="flex justify-between font-bold text-slate-500">
            <span>Floor climbed</span>
            <span className="text-purple-400 font-extrabold">{currentRow} / 8</span>
          </div>
          <div className="flex justify-between font-bold text-slate-500">
            <span>Live multiplier</span>
            <span className="text-white font-extrabold">{liveMult}x</span>
          </div>
          <div className="flex justify-between font-bold text-slate-500">
            <span>Live profit gain</span>
            <span className={currentRow > 0 ? 'text-emerald-400 font-extrabold' : 'text-slate-500'}>
              +{formatMoney(liveProfit)} 🍩
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
