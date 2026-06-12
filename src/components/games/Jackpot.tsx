import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Coins, User, Users } from 'lucide-react';
import { MOCK_BOTS, formatMoney } from '../../data';

interface JackpotProps {
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
  username: string;
}

interface JackpotPlayer {
  username: string;
  amount: number;
  color: string;
  isUser: boolean;
}

const JP_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#415a77'
];

export default function Jackpot({
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound,
  username
}: JackpotProps) {
  const [bet, setBet] = useState<number>(100);
  const [joined, setJoined] = useState<boolean>(false);
  const [active, setActive] = useState<boolean>(false);
  const [players, setPlayers] = useState<JackpotPlayer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [outcome, setOutcome] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animControls = useAnimation();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalPot = players.reduce((s, p) => s + p.amount, 0);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = width / 2 - 10;

    ctx.clearRect(0, 0, width, height);

    if (players.length === 0) {
      // Empty wheel placeholder
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px Manrope, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Place bet to build round', cx, cy);
      return;
    }

    let currentAngle = (wheelAngle * Math.PI) / 180;

    players.forEach((p, i) => {
      const slice = (p.amount / totalPot) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, currentAngle, currentAngle + slice);
      ctx.closePath();

      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw username labels inside large slices
      if (slice > 0.15) {
        ctx.save();
        ctx.translate(cx, cy);
        const midAngle = currentAngle + slice / 2;
        ctx.rotate(midAngle);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Manrope, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.username.substring(0, 7), radius - 15, 0);
        ctx.restore();
      }

      currentAngle += slice;
    });

    // Inner circle core
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px Manrope, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎰', cx, cy);
  };

  useEffect(() => {
    drawWheel();
  }, [players, wheelAngle]);

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(10); // 10s countdown

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          triggerJackpotSpin();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleJoin = () => {
    if (joined || active) return;
    if (bet > balance || balance <= 0) {
      toast('Not enough donuts!', 'lose');
      return;
    }

    setOutcome(null);
    setJoined(true);
    updateBalance(-bet);
    addXP(Math.max(1, Math.floor(bet / 10)));

    // Create current player entry
    const userPlayer: JackpotPlayer = {
      username,
      amount: bet,
      color: '#a855f7', // Nice purple
      isUser: true
    };

    // Spawn 0 active bot entries into pool (No bots allowed)
    const extraPlayersCount = 0;
    const botEntries: JackpotPlayer[] = [];

    const fullRoster = [userPlayer, ...botEntries];
    setPlayers(fullRoster);
    startCountdown();
    toast('✓ Joined Jackpot pool! Spin countdown timer active.', 'win');
  };

  const triggerJackpotSpin = () => {
    setActive(true);
    let speed = 25;
    let deceleration = 0.98;
    let angle = 0;

    // Pick winning ticket slice
    const totalPotSize = players.reduce((s, p) => s + p.amount, 0);
    const winningFactor = Math.random() * totalPotSize;
    let cumulative = 0;
    let winnerIndex = 0;

    for (let i = 0; i < players.length; i++) {
      cumulative += players[i].amount;
      if (winningFactor <= cumulative) {
        winnerIndex = i;
        break;
      }
    }

    const winner = players[winnerIndex];

    const spinInterval = setInterval(() => {
      angle += speed;
      setWheelAngle(angle);
      speed *= deceleration;

      if (speed < 0.15) {
        clearInterval(spinInterval);
        setActive(false);
        setJoined(false);

        // Deduce winner
        setOutcome(`${winner.username} won the pot!`);
        
        if (winner.isUser) {
          updateBalance(totalPotSize);
          playSound(true);
          toast(`🏆 JACKPOT WINNER! You took the entire ${totalPotSize} donuts pot!`, 'win');
          logLiveBet('Jackpot', totalPotSize - bet, 'win', parseFloat((totalPotSize / bet).toFixed(2)));
        } else {
          playSound(false);
          toast(`💸 ${winner.username} won the pot of ${totalPotSize} donuts`, 'lose');
          logLiveBet('Jackpot', bet, 'loss', 0);
        }
      }
    }, 24);
  };

  const handleBetChange = (val: string) => {
    const num = Math.floor(parseFloat(val)) || 0;
    setBet(Math.max(1, Math.min(balance, num)));
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Visual Arena */}
      <div className="flex-1 flex flex-col p-6 bg-slate-950/40 relative justify-center items-center">
        <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500 tracking-wider">
          POT JACKPOT ROOM
        </div>

        {/* Pointer indicator */}
        <div className="relative my-4 flex flex-col items-center">
          <div className="w-[0px] h-[0px] border-l-[14px] border-r-[14px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-400 z-10 mb-[-12px] filter drop-shadow" />
          <canvas ref={canvasRef} width={260} height={260} className="w-[260px] h-[260px] rounded-full shadow-2xl" />
        </div>

        {/* Timers countdown alert */}
        {timeLeft !== null && (
          <div className="py-2 px-6 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-center font-black animate-pulse my-4 text-xs tracking-wider">
            🚨 ROUND STARTS IN {timeLeft}s...
          </div>
        )}

        {/* Final outcomes banner */}
        {outcome && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-4 rounded-xl border text-center font-bold text-sm w-full max-w-sm ${
              outcome.includes(username) 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            🎰 {outcome.toUpperCase()}
          </motion.div>
        )}
      </div>

      {/* Control panel sidebar */}
      <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5 overflow-y-auto">
        <button
          onClick={handleJoin}
          disabled={joined || active}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all text-sm uppercase tracking-wider animate-[pulse_2.5s_infinite]"
        >
          {joined ? 'WAITING FOR SPIN...' : '🎰 JOIN JACKPOT'}
        </button>

        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Wager deposit
          </label>
          <div className="flex bg-slate-900 border border-white/5 rounded-xl p-3 items-center">
            <Coins className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
            <input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(e.target.value)}
              disabled={joined || active}
              className="bg-transparent border-none text-white font-extrabold text-sm outline-none w-full"
            />
          </div>
        </div>

        {/* Quick multipliers limits */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => !joined && setBet(Math.max(1, Math.round(bet / 2)))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            1/2
          </button>
          <button
            onClick={() => !joined && setBet(Math.min(balance, bet * 2))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            2x
          </button>
          <button
            onClick={() => !joined && setBet(Math.max(1, Math.min(balance, Math.floor(balance / 2))))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            50%
          </button>
          <button
            onClick={() => !joined && setBet(balance)}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            MAX
          </button>
        </div>

        {/* Roster list of active players in round */}
        {players.length > 0 && (
          <div>
            <label className="text-[10px] font-black text-slate-500 tracking-wider uppercase block mb-2">
              Roster Ratios ({players.length})
            </label>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {players.map((p, i) => {
                const pct = ((p.amount / totalPot) * 100).toFixed(1);
                return (
                  <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-900/60 border border-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className={`font-bold ${p.isUser ? 'text-purple-300 font-extrabold' : 'text-slate-300'}`}>
                        {p.username}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px]">{pct}% ({formatMoney(p.amount)} 🍩)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
