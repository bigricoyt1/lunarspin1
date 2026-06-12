import React, { useState, useEffect, useRef } from 'react';
import { Coins } from 'lucide-react';

interface PlinkoProps {
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
}

const PLINKO_MULTIPLIERS = {
  low: [5.6, 1.6, 1.1, 1.0, 0.5, 1.0, 1.1, 1.6, 5.6],
  medium: [13.0, 3.0, 1.3, 0.7, 0.4, 0.7, 1.3, 3.0, 13.0],
  high: [29.0, 4.0, 1.5, 0.3, 0.2, 0.3, 1.5, 4.0, 29.0]
};

const BUCKET_COLORS = [
  '#ef4444', '#f97316', '#fbbf24', '#34d399', '#3b82f6', '#34d399', '#fbbf24', '#f97316', '#ef4444'
];

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounceCount: number;
  targetBucket: number;
  active: boolean;
}

export default function Plinko({
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound
}: PlinkoProps) {
  const [bet, setBet] = useState<number>(100);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('low');
  const [dropping, setDropping] = useState<boolean>(false);
  const [lastMult, setLastMult] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const ballsRef = useRef<Ball[]>([]);

  const rows = 8; // Number of peg rows
  
  // Peg offsets calculation
  const getPegs = (width: number, height: number) => {
    const list: { x: number; y: number }[] = [];
    const startY = 40;
    const spacingY = 32;
    const spacingX = 32;

    for (let r = 0; r < rows; r++) {
      const rowY = startY + r * spacingY;
      const ballsInRow = r + 3;
      const startX = width / 2 - ((ballsInRow - 1) * spacingX) / 2;

      for (let c = 0; c < ballsInRow; c++) {
        list.push({ x: startX + c * spacingX, y: rowY });
      }
    }
    return list;
  };

  const handleDrop = () => {
    if (bet > balance || balance <= 0) {
      toast('Not enough donuts!', 'lose');
      return;
    }

    setDropping(true);
    updateBalance(-bet);
    addXP(Math.max(1, Math.floor(bet / 10)));

    // Plinko path selection: Randomly pick ending bucket index based on binomial dispersion
    const mults = PLINKO_MULTIPLIERS[risk];
    let col = 0;
    for (let i = 0; i < mults.length - 1; i++) {
      if (Math.random() < 0.5) col++;
    }
    col = Math.max(0, Math.min(mults.length - 1, col));

    const canvas = canvasRef.current;
    if (canvas) {
      const width = canvas.width;
      
      // Inject physical ball into simulation
      const newBall: Ball = {
        x: width / 2 + (Math.random() - 0.5) * 10,
        y: 15,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        bounceCount: 0,
        targetBucket: col,
        active: true
      };

      ballsRef.current.push(newBall);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const pegs = getPegs(width, height);

    const physicsLoop = () => {
      ctx.clearRect(0, 0, width, height);

      // Gradient background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw background triangle visual guidelines
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2, 20);
      ctx.lineTo(20, height - 60);
      ctx.lineTo(width - 20, height - 60);
      ctx.closePath();
      ctx.stroke();

      // Draw pegs configuration
      ctx.fillStyle = '#94a3b8';
      for (const p of pegs) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        // subtle peg glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
      }

      // Draw buckets multipliers blocks
      const mults = PLINKO_MULTIPLIERS[risk];
      const bucketWidth = (width - 20) / mults.length;
      const bucketY = height - 40;

      for (let i = 0; i < mults.length; i++) {
        const bx = 10 + i * bucketWidth;
        const col = BUCKET_COLORS[i];

        ctx.fillStyle = `${col}15`;
        ctx.strokeStyle = `${col}40`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bx + 2, bucketY, bucketWidth - 4, 30, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.font = 'bold 10px Manrope, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${mults[i]}x`, bx + bucketWidth / 2, bucketY + 15);
      }

      // Physics update balls
      const g = 0.22; // Gravity
      const bounceCoeff = 0.45; // Friction bounce rest

      ballsRef.current = ballsRef.current.filter((ball) => {
        if (!ball.active) return false;

        // Apply forces
        ball.vy += g;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Collision against standard pegs
        for (const p of pegs) {
          const dx = ball.x - p.x;
          const dy = ball.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 10) { // Ball radius (6) + Peg radius (4)
            // Push out of peg and deflect
            const nx = dx / dist;
            const ny = dy / dist;

            ball.x = p.x + nx * 10.1;
            ball.y = p.y + ny * 10.1;

            // Reflect velocities
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx = (ball.vx - 2 * dot * nx) * bounceCoeff;
            ball.vy = (ball.vy - 2 * dot * ny) * bounceCoeff;

            // Add simple sideways deviation bias towards their pre-determined target column to keep simulation reliable
            const progress = ball.y / (height - 80);
            const targetXCoord = 10 + ball.targetBucket * bucketWidth + bucketWidth / 2;
            const deviationX = targetXCoord - ball.x;
            ball.vx += deviationX * 0.015;

            ball.bounceCount++;
          }
        }

        // Draw the ball dropping
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Check if landed in bottom multiplier buckets
        if (ball.y >= bucketY + 5) {
          ball.active = false;
          const finalCol = ball.targetBucket;
          const multiplierResult = mults[finalCol];
          const rewardAmount = Math.floor(bet * multiplierResult);

          updateBalance(rewardAmount);
          setLastMult(multiplierResult);

          const win = multiplierResult >= 1.0;
          playSound(win);
          
          if (win) {
            toast(`🏆 Plinko hit ${multiplierResult}x! +${rewardAmount - bet} donuts`, 'win');
          } else {
            toast(`💸 Plinko hit only ${multiplierResult}x: -${bet - rewardAmount} donuts`, 'lose');
          }

          logLiveBet('Plinko', rewardAmount - bet, win ? 'win' : 'loss', multiplierResult);
          return false;
        }

        return true;
      });

      if (ballsRef.current.length === 0) {
        setDropping(false);
      }

      animationIdRef.current = requestAnimationFrame(physicsLoop);
    };

    physicsLoop();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
  }, [risk, bet]);

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Canvas Arena */}
      <div className="flex-1 flex flex-col p-6 bg-slate-950/40 justify-center">
        <div className="text-xs font-semibold text-slate-500 tracking-wider h-14 uppercase">
          TRIANGULAR PLINKO Drop
        </div>

        {/* Bouncy Board */}
        <div className="bg-slate-950 border border-white/5 rounded-2xl overflow-hidden p-2 flex justify-center mb-6 shadow-2xl relative">
          <canvas ref={canvasRef} width={400} height={320} className="w-full h-auto aspect-[5/4] max-w-sm rounded" />
        </div>

        {/* Immediate payouts output display wrapper */}
        {lastMult !== null && (
          <div className="text-center font-bold text-xs p-3 bg-slate-900/60 border border-white/5 rounded-xl">
            Last Drop Multiplier Result:{' '}
            <span className={`text-md font-extrabold ${lastMult >= 1.00 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {lastMult}x
            </span>
          </div>
        )}
      </div>

      {/* Sidebar Control Panel */}
      <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5 overflow-y-auto">
        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Wager sum
          </label>
          <div className="flex bg-slate-900 border border-white/5 rounded-xl p-3 items-center">
            <Coins className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(Math.max(1, Math.min(balance, Math.floor(parseFloat(e.target.value)) || 0)))}
              disabled={dropping}
              className="bg-transparent border-none text-white font-extrabold text-sm outline-none w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => !dropping && setBet(Math.max(1, Math.round(bet / 2)))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            1/2
          </button>
          <button
            onClick={() => !dropping && setBet(Math.min(balance, bet * 2))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            2x
          </button>
          <button
            onClick={() => !dropping && setBet(Math.max(1, Math.min(balance, Math.floor(balance / 2))))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            50%
          </button>
          <button
            onClick={() => !dropping && setBet(balance)}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            MAX
          </button>
        </div>

        {/* Risk bucket selector configuration list */}
        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Drop Risk Variance
          </label>
          <div className="flex flex-col gap-2">
            {[
              { id: 'low', label: '🟢 LOW', multRange: '0.5x - 5.6x' },
              { id: 'medium', label: '🟡 MEDIUM', multRange: '0.4x - 13x' },
              { id: 'high', label: '🔴 HIGH', multRange: '0.2x - 29x' }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => !dropping && setRisk(r.id as 'low' | 'medium' | 'high')}
                className={`py-3 text-xs font-extrabold border-2 rounded-xl transition-all text-left px-4 flex justify-between items-center
                  ${risk === r.id 
                    ? 'border-purple-500 bg-purple-500/10 text-white' 
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'
                  }`}
                disabled={dropping}
              >
                <span>{r.label}</span>
                <span className="text-[10px] text-slate-500">{r.multRange}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ball launch trigger */}
        <button
          onClick={handleDrop}
          className="w-full mt-auto py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/25 transition-all text-sm uppercase tracking-wider"
        >
          {dropping ? 'Drop in simulation...' : '🎯 Drop Plinko Ball'}
        </button>
      </div>
    </div>
  );
}
