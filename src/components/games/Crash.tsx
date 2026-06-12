import React, { useState, useEffect, useRef } from 'react';
import { getGameResult } from '../../utils';
import { motion } from 'motion/react';
import { Rocket, ShieldAlert } from 'lucide-react';
import { formatMoney } from '../../data';
import { User as UserType } from '../../types';
import BetControl from './BetControl';

import tntImg from '../../assets/images/tnt_block_1781074158589.png';

interface CrashProps {
  user: UserType | null;
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
  antiCheatEnabled?: boolean;
}

export default function Crash({
  user,
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound,
  antiCheatEnabled
}: CrashProps) {
  const [bet, setBet] = useState<number>(100);
  const [running, setRunning] = useState<boolean>(false);
  const [cashedOut, setCashedOut] = useState<boolean>(false);
  const [currentMult, setCurrentMult] = useState<number>(1.00);
  const [history, setHistory] = useState<number[]>([1.34, 4.52, 1.12, 12.35, 1.05, 2.10]);
  const [statusMessage, setStatusMessage] = useState<string>('Input bet & Launch rocket');
  const [lastResult, setLastResult] = useState<{ win: boolean; amount: number; multiplier: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const runningRef = useRef<boolean>(false);
  const multRef = useRef<number>(1.00);
  const targetRef = useRef<number>(1.00);
  const betRef = useRef<number>(100);
  const cashedRef = useRef<boolean>(false);

  // Logic to generate crash threshold
  const generateCrashThreshold = () => {
    // Rig logic: potentially force result
    const storedDiff = localStorage.getItem('casino_win_difficulty') || 'fair';
    const isRiggedWin = getGameResult(50, user?.rigRate); // Base 50% for rig evaluation
    
    if (user?.rigRate !== null && user?.rigRate !== undefined) {
      if (user.rigRate > 80) return 3.00 + Math.random() * 20.00;
      if (user.rigRate < 20) return 1.00 + Math.random() * 0.15;
    }

    if (storedDiff === 'god') return 10.00 + Math.random() * 90.00;
    if (storedDiff === 'rigged') return 1.00 + Math.random() * 0.10;

    const r = Math.random();
    if (r < 0.25) return 1.00 + Math.random() * 0.50; // Instacrash / low crash
    if (r < 0.60) return 1.30 + Math.random() * 1.50; // Moderate flight
    if (r < 0.85) return 2.80 + Math.random() * 4.00; // Awesome flight
    if (r < 0.96) return 6.00 + Math.random() * 12.00; // Legendary flight
    return 18.00 + Math.random() * 50.00; // Moon ticket!
  };

  const drawGraph = (ctx: CanvasRenderingContext2D, width: number, height: number, points: number[]) => {
    ctx.clearRect(0, 0, width, height);

    if (points.length < 2) return;

    const maxVal = Math.max(...points, 2.5);
    const pad = 15;
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    const getX = (index: number) => (index / (points.length - 1)) * (width - pad * 2) + pad;
    const getY = (val: number) => height - pad - ((val - 1) / (maxVal - 1)) * (height - pad * 2);

    // Gradient fill under curve
    ctx.fillStyle = runningRef.current
      ? 'rgba(168, 85, 247, 0.05)'
      : cashedRef.current ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)';
      
    ctx.beginPath();
    ctx.moveTo(getX(0), height);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i]));
    }
    ctx.lineTo(getX(points.length - 1), height);
    ctx.closePath();
    ctx.fill();

    // Main curve trace
    ctx.strokeStyle = runningRef.current
      ? '#a855f7'
      : cashedRef.current ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = runningRef.current
      ? 'rgba(168, 85, 247, 0.4)'
      : cashedRef.current ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(points[0]));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i]));
    }
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw little rocket at the tip of the curve
    const lx = getX(points.length - 1);
    const ly = getY(points[points.length - 1]);
    ctx.fillStyle = runningRef.current ? '#c084fc' : cashedRef.current ? '#4ade80' : '#f87171';
    ctx.beginPath();
    ctx.arc(lx, ly, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleLaunch = () => {
    if (running) return;
    if (bet <= 0 || isNaN(bet)) {
      toast('❌ Bet amount must be greater than 0!', 'info');
      return;
    }
    if (bet > balance || balance <= 0) {
      toast('❌ You got no money left!', 'info');
      return;
    }

    // Set states
    updateBalance(-bet);
    setRunning(true);
    setCashedOut(false);
    setCurrentMult(1.00);
    setLastResult(null);
    setStatusMessage('TNT Fuse is lit! Cash out before detonation!');

    runningRef.current = true;
    multRef.current = 1.00;
    targetRef.current = generateCrashThreshold();
    betRef.current = bet;
    cashedRef.current = false;

    addXP(Math.max(1, Math.floor(bet / 10)));

    const pts: number[] = [1.00];
    let lastTime = performance.now();

    const loop = (time: number) => {
      if (!runningRef.current) return;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Curve acceleration logic
      const scaleSpeed = 0.05 + multRef.current * 0.06;
      multRef.current += dt * scaleSpeed;
      
      setCurrentMult(multRef.current);
      pts.push(multRef.current);
      if (pts.length > 200) pts.shift();

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) drawGraph(ctx, canvas.width, canvas.height, pts);
      }

      // Check if crashed
      if (multRef.current >= targetRef.current) {
        // CRASH EVENT
        setRunning(false);
        runningRef.current = false;
        setStatusMessage(`Crashed at ${multRef.current.toFixed(2)}x!`);
        
        // Add to history list
        setHistory(prev => [parseFloat(multRef.current.toFixed(2)), ...prev.slice(0, 5)]);

        if (!cashedRef.current) {
          playSound(false);
          toast(`💥 Rocket Crashed at ${multRef.current.toFixed(2)}x!`, 'lose');
          logLiveBet('Crash', betRef.current, 'loss', 0);
          setLastResult({ win: false, amount: betRef.current, multiplier: multRef.current });
        }
      } else {
        animationRef.current = requestAnimationFrame(loop);
      }
    };

    animationRef.current = requestAnimationFrame(loop);
  };

  const handleCashout = () => {
    if (!running || cashedOut) return;

    // Apply win calculations
    cashedRef.current = true;
    setCashedOut(true);
    setRunning(false);
    runningRef.current = false;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const wonAmount = Math.floor(betRef.current * multRef.current);
    updateBalance(wonAmount);
    playSound(true);
    toast(`🏆 Cashed out at ${multRef.current.toFixed(2)}x! +${wonAmount - betRef.current} money`, 'win');
    logLiveBet('Crash', wonAmount - betRef.current, 'win', multRef.current);
    setLastResult({ win: true, amount: wonAmount - betRef.current, multiplier: multRef.current });
    setStatusMessage('Cashed out successfully!');

    // Redraw graph state as win
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Keep existing path, redraw as green
        drawGraph(ctx, canvas.width, canvas.height, [multRef.current]);
      }
    }
  };

  useEffect(() => {
    // Initial graph drawing state
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawGraph(ctx, canvas.width, canvas.height, [1.00, 1.05, 1.15, 1.30]);
      }
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Graph Area */}
      <div className="flex-1 flex flex-col p-6 bg-slate-950/40 relative">
        <div className="text-xs font-semibold text-slate-500 tracking-wider">
          CRASH TNT FUSE LAUNCH
        </div>

        {/* Live Multiplier Display */}
        <div className="text-center my-6">
          <div className={`text-6xl font-black tracking-tight select-none transition-all duration-75
            ${running 
              ? 'text-purple-400 scale-105' 
              : cashedOut ? 'text-emerald-400 font-extrabold' : 'text-rose-500'
            }`}
          >
            {currentMult.toFixed(2)}x
          </div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-2">
            Multipliers Flying
          </div>
        </div>

        {/* Graph Canvas */}
        <div className="bg-slate-950/80 border border-white/5 rounded-xl overflow-hidden p-2 flex justify-center mb-6 relative">
          <canvas ref={canvasRef} width={450} height={180} className="w-full h-auto aspect-[5/2]" />
          {running && (
            <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="opacity-10"
              >
                <img src={tntImg} className="w-32 h-32 object-contain" alt="TNT" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Multipliers History */}
        <div className="mb-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            History log
          </div>
          <div className="flex gap-2 overflow-x-auto py-1">
            {history.map((h, i) => (
              <span
                key={i}
                className={`px-3 py-1 font-extrabold text-[10px] rounded-lg border flex-shrink-0
                  ${h >= 10.00 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' 
                    : h >= 2.00 ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-slate-900 border-white/5 text-slate-400'
                  }`}
              >
                {h.toFixed(2)}x
              </span>
            ))}
          </div>
        </div>

        {/* Status result log */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border text-center ${
              lastResult.win 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="text-xs font-black uppercase tracking-widest">
              {lastResult.win ? '🏆 CASHED OUT SUCCESS!' : '💥 CRASH LOSS'}
            </div>
            <div className="text-xs mt-1">
              {lastResult.win 
                ? `You kept +${lastResult.amount} money at ${lastResult.multiplier.toFixed(2)}x` 
                : `Rocket crashed at ${lastResult.multiplier.toFixed(2)}x. -${lastResult.amount} money.`}
            </div>
          </motion.div>
        )}
      </div>

      {/* Control Panel */}
      <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5">
        <button
          onClick={handleCashout}
          disabled={!running || cashedOut}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm uppercase tracking-wider"
        >
          CASH OUT
        </button>

        <BetControl 
          bet={bet} 
          setBet={setBet} 
          balance={balance} 
          disabled={running} 
        />

        {/* Live profits status block */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 flex flex-col gap-2 mt-2 text-xs">
          <div className="flex justify-between font-bold text-slate-500">
            <span>Potential return</span>
            <span className="text-white font-black">
              {running ? formatMoney(Math.floor(bet * currentMult)) : '—'} 🍩
            </span>
          </div>
          <div className="flex justify-between font-bold text-slate-500">
            <span>Live profit gain</span>
            <span className={running ? 'text-emerald-400 font-black' : 'text-slate-500'}>
              {running ? `+${formatMoney(Math.max(0, Math.floor(bet * currentMult) - bet))}` : '—'} 🍩
            </span>
          </div>
        </div>

        <button
          onClick={handleLaunch}
          disabled={running}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all text-sm uppercase tracking-wider"
        >
          {running ? 'ROCKET FLYING 🚀' : 'LAUNCH ROCKET 🚀'}
        </button>
      </div>
    </div>
  );
}
