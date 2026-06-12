import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins } from 'lucide-react';
import { formatMoney } from '../../data';

interface ChickenRoadProps {
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
}

const CH_DIFFS = [
  { steps: 24, mult: 1.0444, label: '🟢 Easy', max: '2.84x' },
  { steps: 22, mult: 1.1750, label: '🟡 Medium', max: '34.74x' },
  { steps: 20, mult: 1.4462, label: '🟠 Hard', max: '1605x' },
  { steps: 10, mult: 2.0889, label: '🔴 Daredevil', max: '1580x' }
];

export default function ChickenRoad({
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound
}: ChickenRoadProps) {
  const [bet, setBet] = useState<number>(100);
  const [active, setActive] = useState<boolean>(false);
  const [diffIdx, setDiffIdx] = useState<number>(0);
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [grid, setGrid] = useState<number[][]>([]); // steps x 4 columns. 1 represents Fox, 0 is safe
  const [lastResult, setLastResult] = useState<{ win: boolean; amount: number; multiplier: number } | null>(null);

  const currentDiff = CH_DIFFS[diffIdx];

  const handleStart = () => {
    if (active) return;
    if (bet > balance || balance <= 0) {
      toast('Not enough donuts!', 'lose');
      return;
    }

    setLastResult(null);
    updateBalance(-bet);
    addXP(Math.max(1, Math.floor(bet / 10)));

    // Generate steps grid (4 columns)
    const tempGrid: number[][] = [];
    for (let r = 0; r < currentDiff.steps; r++) {
      const row = Array(4).fill(0); // 0 = chicken/safe, 1 = fox/bomb
      let bombs = 1;
      if (diffIdx === 3) bombs = 2; // Daredevil has 2 foxes out of 4 slots

      const bombIndices = new Set<number>();
      while (bombIndices.size < bombs) {
        bombIndices.add(Math.floor(Math.random() * 4));
      }
      for (const i of bombIndices) {
        row[i] = 1;
      }
      tempGrid.push(row);
    }

    setGrid(tempGrid);
    setCurrentRow(0);
    setActive(true);
    toast('🐔 Chicken Road launched! Tap a safe green field.', 'info');
  };

  const handleStep = (col: number) => {
    if (!active) return;

    const isFox = grid[currentRow][col] === 1;

    if (isFox) {
      // Caught by fox
      setActive(false);
      playSound(false);
      toast('🦊 Caught by Fox! Chicken lost at step ' + (currentRow + 1), 'lose');
      logLiveBet('Chicken Road', bet, 'loss', 0);
      setLastResult({ win: false, amount: bet, multiplier: 0 });
    } else {
      playSound(true);
      const nextRow = currentRow + 1;
      setCurrentRow(nextRow);

      if (nextRow >= currentDiff.steps) {
        // Safe journey apex cashout!
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

    toast(`🏆 Chicken collected! Made +${winAmt - bet} donuts at ${mult}x!`, 'win');
    logLiveBet('Chicken Road', winAmt - bet, 'win', mult);
    setLastResult({ win: true, amount: winAmt - bet, multiplier: mult });
  };

  const handleCashout = () => {
    handleCashoutWithRow(currentRow);
  };

  const liveMult = parseFloat(Math.pow(currentDiff.mult, currentRow).toFixed(2));
  const liveProfit = currentRow > 0 ? Math.floor(bet * liveMult) - bet : 0;

  // Viewport slice logic: only draw current + 4 steps ahead to keep UI super clean
  const visibleSteps = grid.slice(currentRow, currentRow + 5);

  return (
    <div className="flex flex-col md:flex-row h-full animate-[popIn_0.3s_ease]">
      {/* Visual Road Area */}
      <div className="flex-1 flex flex-col p-6 bg-slate-950/40 justify-center items-center relative overflow-y-auto min-h-[300px]">
        <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500 tracking-wider">
          CHICKEN ROAD ESCAPE
        </div>

        {/* The stepping map */}
        <div className="flex flex-col gap-2 w-full max-w-xs my-4 p-4 bg-slate-950 border border-white/5 rounded-2xl relative shadow-2xl">
          <div className="text-[9px] text-slate-600 font-extrabold uppercase tracking-widest text-center mb-1">
            Path ahead (Step {currentRow + 1} of {currentDiff.steps})
          </div>

          {visibleSteps.map((row, relativeIdx) => {
            const absoluteRowIndex = currentRow + relativeIdx;
            const isCurrent = absoluteRowIndex === currentRow;
            
            return (
              <div key={absoluteRowIndex} className="grid grid-cols-4 gap-2">
                {row.map((val, colIdx) => {
                  return (
                    <button
                      key={colIdx}
                      onClick={() => handleStep(colIdx)}
                      disabled={!active || !isCurrent}
                      className={`h-11 rounded-xl border flex items-center justify-center text-lg transition-all duration-150 relative select-none
                        ${isCurrent && active
                          ? 'bg-slate-900 border-purple-500 hover:border-purple-400 hover:bg-slate-800 cursor-pointer text-xs text-slate-600'
                          : !active && isCurrent && val === 1
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                            : !active && isCurrent && val === 0
                              ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400'
                              : 'bg-slate-900/30 border-white/5 opacity-20'
                        }`}
                    >
                      {isCurrent && active ? (
                        '🥚'
                      ) : !active && isCurrent ? (
                        val === 1 ? '🦊' : '🐔'
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {grid.length === 0 && (
            <div className="text-center text-slate-600 text-xs py-14">
              Click Start to launch Chicken steps
            </div>
          )}
        </div>

        {/* Results output overlay */}
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
              {lastResult.win ? '🏆 FLOCK ESCAPED!' : '🦊 FOX HUNTED'}
            </div>
            <div className="text-xs mt-1">
              {lastResult.win 
                ? `Finished stepping trails making +${lastResult.amount} donuts at ${lastResult.multiplier}x!` 
                : `Busted by fox. Lost your -${lastResult.amount} donuts bet`}
            </div>
          </motion.div>
        )}
      </div>

      {/* Control panel sidebar */}
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
            START STEPS 🐔
          </button>
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Wager donut count
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

        {/* Risk Difficulty settings */}
        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Stepping Risk Difficulty
          </label>
          <div className="flex flex-col gap-1.5">
            {CH_DIFFS.map((d, i) => (
              <button
                key={i}
                onClick={() => !active && setDiffIdx(i)}
                className={`py-2 text-xs font-extrabold border-2 rounded-xl transition-all text-left px-4 flex justify-between items-center
                  ${diffIdx === i 
                    ? 'border-purple-500 bg-purple-500/10 text-white font-black' 
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                  }`}
                disabled={active}
              >
                <span>{d.label}</span>
                <span className="text-[10px] text-slate-500">{d.mult}x / Step</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live stats display */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 flex flex-col gap-2 mt-auto text-xs">
          <div className="flex justify-between font-bold text-slate-500">
            <span>Steps survived</span>
            <span className="text-purple-400 font-extrabold">{currentRow} / {currentDiff.steps}</span>
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
