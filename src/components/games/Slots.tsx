import React, { useState, useEffect, useRef } from 'react';
import { User as UserType } from '../../types';
import { fmtMoney, parseBet } from '../../utils';
import BetControl from './BetControl';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Star, Sparkles, Coins, Play, RefreshCw, Trophy, Award } from 'lucide-react';
import slotsMachineImg from '../../assets/images/slots_machine_minecraft_1781215524012.jpg';

interface SlotsProps {
  user: UserType | null;
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
}

interface SymbolConfig {
  id: string;
  emoji: string;
  name: string;
  color: string;
  payout3: number; // multiplier for 3 in a line
  payout2: number; // multiplier for 2 in a line
  isWild: boolean;
  isScatter: boolean;
}

const SYMBOLS: SymbolConfig[] = [
  { id: 'diamond', emoji: '💎', name: 'Diamond', color: '#60a5fa', payout3: 20, payout2: 4, isWild: false, isScatter: false },
  { id: 'crown', emoji: '👑', name: 'Crown', color: '#fbbf24', payout3: 10, payout2: 2.5, isWild: false, isScatter: false },
  { id: 'emerald', emoji: '🍀', name: 'Lucky Clover', color: '#34d399', payout3: 6, payout2: 1.5, isWild: false, isScatter: false },
  { id: 'cherry', emoji: '🍒', name: 'Cherry', color: '#f87171', payout3: 4, payout2: 1.0, isWild: false, isScatter: false },
  { id: 'lemon', emoji: '🍋', name: 'Lemon', color: '#facc15', payout3: 2.5, payout2: 0.5, isWild: false, isScatter: false },
  { id: 'wild', emoji: '⭐', name: 'WILD Star', color: '#a855f7', payout3: 15, payout2: 3, isWild: true, isScatter: false },
  { id: 'scatter', emoji: '💰', name: 'Gold Coin', color: '#fbbf24', payout3: 5, payout2: 1, isWild: false, isScatter: true }
];

// Payline indexes in 3x3 grid (Rows: 0, 1, 2)
// Grid:
// [0, 1, 2] -> Top Row
// [3, 4, 5] -> Center Row
// [6, 7, 8] -> Bottom Row
const PAYLINES = [
  { id: 1, name: 'Center line', spots: [3, 4, 5], color: '#a855f7' },
  { id: 2, name: 'Top line', spots: [0, 1, 2], color: '#3b82f6' },
  { id: 3, name: 'Bottom line', spots: [6, 7, 8], color: '#10b981' },
  { id: 4, name: 'V diagonal', spots: [0, 4, 8], color: '#f43f5e' },
  { id: 5, name: 'Inverted V', spots: [6, 4, 2], color: '#f59e0b' }
];

export default function Slots({
  user,
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound
}: SlotsProps) {
  const [bet, setBet] = useState<number>(100);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  
  // 3x3 reel elements
  const [reels, setReels] = useState<SymbolConfig[]>([
    SYMBOLS[0], SYMBOLS[1], SYMBOLS[2],
    SYMBOLS[3], SYMBOLS[4], SYMBOLS[5],
    SYMBOLS[1], SYMBOLS[2], SYMBOLS[3]
  ]);

  // Spin columns indicators (animating state)
  const [colSpinning, setColSpinning] = useState<boolean[]>([false, false, false]);

  // Winning details
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [showPayoutTable, setShowPayoutTable] = useState<boolean>(false);

  // Free spins features
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [totalFreeSpinsWin, setTotalFreeSpinsWin] = useState<number>(0);

  const autoSpinRef = useRef<boolean>(autoSpin);
  const freeSpinsLeftRef = useRef<number>(freeSpinsLeft);

  // Sync refs for async setintervals
  useEffect(() => {
    autoSpinRef.current = autoSpin;
  }, [autoSpin]);

  useEffect(() => {
    freeSpinsLeftRef.current = freeSpinsLeft;
  }, [freeSpinsLeft]);

  // Trigger auto spin if permitted
  useEffect(() => {
    let timer: any;
    if (autoSpin && !spinning) {
      timer = setTimeout(() => {
        handleSpin();
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [autoSpin, spinning]);

  const handleSpin = () => {
    if (spinning) return;

    const isFreeSpin = freeSpinsLeftRef.current > 0;
    const currentBet = isFreeSpin ? 0 : bet;

    if (!isFreeSpin) {
      if (bet <= 0 || isNaN(bet)) {
        toast('❌ Bet amount must be greater than 0!', 'info');
        setAutoSpin(false);
        return;
      }
      if (bet > balance || balance <= 0) {
        toast('❌ You have insufficient balance!', 'info');
        setAutoSpin(false);
        return;
      }
    }

    setSpinning(true);
    setWinningLines([]);
    setLastWinAmount(0);

    if (!isFreeSpin) {
      updateBalance(-currentBet);
      addXP(Math.max(1, Math.floor(bet / 10)));
    } else {
      setFreeSpinsLeft(prev => prev - 1);
    }

    // Set spinning columns
    setColSpinning([true, true, true]);

    // Animate individual columns slowing down
    let ticks = 0;
    const spinInterval = setInterval(() => {
      ticks++;

      setReels(prev => {
        // Roll random indicators
        return prev.map((sym, index) => {
          const colIndex = index % 3;
          if (colSpinning[colIndex] || tickActive(ticks, colIndex)) {
            return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          }
          return sym;
        });
      });

      // Stop column 0
      if (ticks === 12) {
        setColSpinning(prev => [false, prev[1], prev[2]]);
      }
      // Stop column 1
      if (ticks === 18) {
        setColSpinning(prev => [false, false, prev[2]]);
      }
      // Stop column 2
      if (ticks === 24) {
        clearInterval(spinInterval);
        setColSpinning([false, false, false]);
        calculateOutcome(currentBet, isFreeSpin);
      }
    }, 80);
  };

  const tickActive = (currentTick: number, colIndex: number): boolean => {
    if (colIndex === 0) return currentTick < 12;
    if (colIndex === 1) return currentTick < 18;
    return currentTick < 24;
  };

  const calculateOutcome = (spinBet: number, isFreeMultiplier: boolean) => {
    // Generate final random grid
    const targetDiff = localStorage.getItem('casino_win_difficulty') || 'fair';
    const isRigged = targetDiff !== 'fair' || user?.rigRate != null;

    let finalReels = [...reels];
    const randomizedGrid = () => {
      return Array.from({ length: 9 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    };

    if (isRigged) {
      // High-performance rigged spins
      let chance = 40;
      if (targetDiff === 'god') chance = 95;
      else if (targetDiff === 'lucky') chance = 60;
      else if (targetDiff === 'rigged') chance = 10;

      const rollsWin = Math.random() * 100 < chance;
      if (rollsWin) {
        // Force a payout line
        const payLineToWin = PAYLINES[Math.floor(Math.random() * PAYLINES.length)];
        const luckySymbol = SYMBOLS[Math.floor(Math.random() * (SYMBOLS.length - 1))]; // avoid wild-only
        finalReels = randomizedGrid();
        payLineToWin.spots.forEach(spot => {
          finalReels[spot] = luckySymbol;
        });
      } else {
        // Force low value or scatter failures
        finalReels = randomizedGrid();
      }
    } else {
      finalReels = randomizedGrid();
    }

    setReels(finalReels);

    // Calculate payouts
    let totalMultiplier = 0;
    const winsHits: number[] = [];

    PAYLINES.forEach(line => {
      const symbolsOnLine = line.spots.map(spotIndex => finalReels[spotIndex]);
      
      // Check for Wild substituting (anything except scatter)
      const nonWildSymbols = symbolsOnLine.filter(s => !s.isWild && !s.isScatter);
      const scattersCount = symbolsOnLine.filter(s => s.isScatter).length;
      
      let matchSymbol: SymbolConfig | null = null;
      let isWin = false;
      let count = 0;

      if (scattersCount === 3) {
        // 3 scatters on line
        matchSymbol = SYMBOLS.find(s => s.isScatter)!;
        isWin = true;
        count = 3;
      } else if (nonWildSymbols.length === 0) {
        // All Wilds on line!
        matchSymbol = SYMBOLS.find(s => s.isWild)!;
        isWin = true;
        count = 3;
      } else if (nonWildSymbols.length === 1) {
        // Two Wilds + 1 normal symbol = 3 of that normal symbol
        matchSymbol = nonWildSymbols[0];
        isWin = true;
        count = 3;
      } else if (nonWildSymbols.length === 2 && nonWildSymbols[0].id === nonWildSymbols[1].id) {
        // One Wild + 2 matched normal = 3 matching
        matchSymbol = nonWildSymbols[0];
        isWin = true;
        count = 3;
      } else if (nonWildSymbols.length === 2 && nonWildSymbols[0].id !== nonWildSymbols[1].id) {
        // One Wild + 2 different normal symbols = 2 matching with first normal, or no win. Let's make it 2 matched first normal
        matchSymbol = nonWildSymbols[0];
        isWin = true;
        count = 2;
      } else if (nonWildSymbols.length === 3) {
        // Core horizontal or diagonal matches without wild
        if (nonWildSymbols[0].id === nonWildSymbols[1].id && nonWildSymbols[1].id === nonWildSymbols[2].id) {
          matchSymbol = nonWildSymbols[0];
          isWin = true;
          count = 3;
        } else if (nonWildSymbols[0].id === nonWildSymbols[1].id) {
          matchSymbol = nonWildSymbols[0];
          isWin = true;
          count = 2;
        } else if (nonWildSymbols[1].id === nonWildSymbols[2].id) {
          matchSymbol = nonWildSymbols[1];
          isWin = true;
          count = 2;
        }
      }

      if (isWin && matchSymbol) {
        const multVal = count === 3 ? matchSymbol.payout3 : matchSymbol.payout2;
        totalMultiplier += multVal;
        winsHits.push(line.id);
      }
    });

    // Check for scatter triggers anywhere on board (gives free spins!)
    const totalScattersOnGrid = finalReels.filter(s => s.isScatter).length;
    let earnedFreeSpins = 0;
    if (totalScattersOnGrid >= 3) {
      earnedFreeSpins = 10;
      toast('🎁 MEGA BONUS! 3 Scatters unlocked 10 FREE SPINS! All payouts x3! 💰', 'win');
      playSound(true);
    }

    // Apply Free Spin 3x multiplier
    let finalMult = totalMultiplier;
    if (isFreeMultiplier) {
      finalMult = totalMultiplier * 3;
    }

    const calculatedWin = Math.floor((isFreeMultiplier ? bet : spinBet) * finalMult);

    // Apply updates
    setWinningLines(winsHits);
    setLastWinAmount(calculatedWin);

    if (calculatedWin > 0) {
      updateBalance(calculatedWin);
      playSound(true);
      if (isFreeMultiplier) {
        setTotalFreeSpinsWin(prev => prev + calculatedWin);
      }
    } else {
      if (winsHits.length === 0 && !earnedFreeSpins) {
        playSound(false);
      }
    }

    // Unlocking Free Spins State
    if (earnedFreeSpins > 0) {
      setFreeSpinsLeft(prev => prev + earnedFreeSpins);
    }

    const wonGame = calculatedWin > 0 || earnedFreeSpins > 0;
    const betLogged = isFreeMultiplier ? bet : spinBet;

    logLiveBet(
      isFreeMultiplier ? 'Slots (FreeSpin)' : 'Slots',
      betLogged,
      wonGame ? 'win' : 'loss',
      finalMult
    );

    // Stop spin state
    setSpinning(false);
  };

  const getPaylineColor = (spotIndex: number): string => {
    if (winningLines.length === 0) return '';
    // Find matching win lines that cross this spot index
    const activeLines = PAYLINES.filter(line => winningLines.includes(line.id));
    const matching = activeLines.find(l => l.spots.includes(spotIndex));
    return matching ? matching.color : '';
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[500px] text-white">
      {/* Visual Slotmachine Canvas Felt */}
      <div className="flex-1 flex flex-col p-6 bg-slate-950/60 justify-center items-center relative overflow-hidden">
        
        {/* Frame Glowing Border */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 opacity-60" />

        {/* Dynamic header display */}
        <div className="flex justify-between w-full max-w-lg mb-4 z-10 px-2">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
              LUNARSPIN LOBBY SLOTS
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-black bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
                HIGH ROLLER REELS
              </span>
            </div>
          </div>

          {/* Free spins banner indicator */}
          {freeSpinsLeft > 0 && (
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl px-4 py-1 flex items-center gap-2 animate-bounce">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                🎁 {freeSpinsLeft} Free Spins Available! (x3 MULTIPLIER)
              </span>
            </div>
          )}

          {/* Toggle Paytable info */}
          <button
            onClick={() => setShowPayoutTable(!showPayoutTable)}
            className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 cursor-pointer transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Paytable
          </button>
        </div>
        
        {/* Minecraft Slot Machine Display Art */}
        <img src={slotsMachineImg} alt="Minecraft Slots Machine" className="w-full max-w-lg rounded-2xl mb-4 opacity-80" />

        {/* Visual Reels matrix enclosure */}
        <div className="relative bg-slate-900 border-4 border-slate-700/80 rounded-3xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(139,92,246,0.15)] flex flex-col gap-4 select-none">
          
          {/* Neon side bars */}
          <div className="absolute left-1 top-1/4 bottom-1/4 w-1 bg-purple-500 rounded-full shadow-[0_0_10px_#8b5cf6]" />
          <div className="absolute right-1 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]" />

          {/* Row Labels (horizontal paylines indicator) */}
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
              const symbol = reels[index];
              const highlightColor = getPaylineColor(index);
              const isColSpin = colSpinning[index % 3];

              return (
                <div
                  key={index}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 border-2
                    ${isColSpin 
                      ? 'bg-slate-950/90 border-purple-500/40 animate-pulse' 
                      : highlightColor 
                        ? 'bg-purple-950/30 scale-105 shadow-lg border-2' 
                        : 'bg-slate-950 border-white/5'
                    }`}
                  style={{
                    borderColor: highlightColor || 'rgba(255,255,255,0.05)',
                    boxShadow: highlightColor ? `0 0 15px ${highlightColor}40` : ''
                  }}
                >
                  <motion.div
                    key={symbol.id + '_' + index}
                    initial={{ y: isColSpin ? -20 : 0, opacity: isColSpin ? 0.3 : 1 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-4xl md:text-5xl leading-none">{symbol.emoji}</span>
                    <span 
                      className="text-[9px] font-black uppercase mt-1 tracking-wider"
                      style={{ color: symbol.color }}
                    >
                      {symbol.name}
                    </span>
                  </motion.div>

                  {/* Little Payline Match Flag badge */}
                  {highlightColor && (
                    <span 
                      className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: highlightColor }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Big Win Banner or Spin text status */}
          <div className="bg-slate-950/80 border border-white/5 p-4 rounded-2xl flex items-center justify-center min-h-[64px]">
            {spinning ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Spinning Cosmic Reels...
                </span>
              </div>
            ) : lastWinAmount > 0 ? (
              <div className="flex flex-col items-center animate-bounce">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-base font-black text-amber-400 uppercase tracking-wider animate-pulse">
                    {lastWinAmount >= bet * 5 ? '🔥 MEGA WIN MULTIPLIER! 🔥' : '💎 WINNING SPIN! 💎'}
                  </span>
                </div>
                <span className="text-xl font-black text-emerald-400 mt-0.5">
                  +{fmtMoney(lastWinAmount)} Dollars
                </span>
              </div>
            ) : freeSpinsLeft > 0 ? (
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-300 animate-pulse" />
                <span className="text-sm font-extrabold text-amber-300 uppercase tracking-wider">
                  BONUS ACTIVE: {freeSpinsLeft} FREE SPINS LEFT!
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider text-center leading-relaxed">
                Choose your bet amount & click SPIN to trigger payouts across 5 paylines!
              </div>
            )}
          </div>
        </div>

        {/* Free Spins Accumulator summary block */}
        {totalFreeSpinsWin > 0 && (
          <div className="mt-4 bg-amber-950/20 border border-amber-500/20 px-6 py-2 rounded-2xl flex items-center gap-3">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
              Total Bonus Free Spins Won today:
            </span>
            <span className="text-sm font-black text-emerald-400">
              {fmtMoney(totalFreeSpinsWin)}
            </span>
          </div>
        )}
      </div>

      {/* Control console panel (Left / Desktop Rail) */}
      <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-white/5 p-6 flex flex-col justify-between">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-purple-400" />
            <h3 className="text-md font-black text-white uppercase tracking-wider">
              SLOTS CONSOLE
            </h3>
          </div>

          <BetControl
            bet={bet}
            setBet={setBet}
            balance={balance}
            disabled={spinning || freeSpinsLeft > 0}
            label={freeSpinsLeft > 0 ? "Free Spin active" : "Console Bet Sizing"}
          />

          {/* Paytable drawer layout inside column */}
          <AnimatePresence>
            {showPayoutTable && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 overflow-hidden text-left"
              >
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  SYMBOL ODDS & PAYLINES:
                </span>
                <div className="flex flex-col gap-1.5 text-xs">
                  {SYMBOLS.map(sym => (
                    <div key={sym.id} className="flex justify-between items-center bg-slate-900/40 p-1 px-2 rounded-lg">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">{sym.emoji}</span>
                        <span className="font-bold text-[10px] text-slate-300">{sym.name}</span>
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 font-semibold">
                        {sym.isWild ? 'Wild Substitute' : sym.isScatter ? 'Scatter (FS)' : `3x: ${sym.payout3}x | 2x: ${sym.payout2}x`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-[8px] text-slate-500 font-medium leading-relaxed border-t border-white/5 pt-2 mt-1">
                  🎯 Paylines cross all 3 horizontally + both diagonals. Scatter (💰) earns 10 FREE SPINS at 3x rewards!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Buttons console execution */}
        <div className="flex flex-col gap-3 mt-6">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Auto roll
            </span>
            <button
              onClick={() => {
                setAutoSpin(!autoSpin);
                toast(autoSpin ? '🛑 Auto spin disabled' : '🔄 Auto spin enabled', 'info');
              }}
              className={`py-1 px-3 rounded-lg text-[9px] uppercase font-black tracking-widest flex items-center gap-1 transition-all cursor-pointer ${
                autoSpin 
                  ? 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-md' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${autoSpin ? 'animate-spin' : ''}`} />
              {autoSpin ? 'On' : 'Off'}
            </button>
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning}
            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg
              ${spinning 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                : freeSpinsLeft > 0
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 animate-pulse font-extrabold shadow-amber-500/20'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/20'
              }`}
          >
            {spinning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                ROLLING...
              </>
            ) : freeSpinsLeft > 0 ? (
              <>
                <Award className="w-4 h-4" />
                SPIN FREE ({freeSpinsLeft})
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-purple-300" />
                SPIN REELS
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
