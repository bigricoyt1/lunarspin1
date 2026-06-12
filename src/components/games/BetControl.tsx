import React, { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { parseBet } from '../../utils';
import { formatMoney } from '../../data';

interface BetControlProps {
  bet: number;
  setBet: (val: number) => void;
  balance: number;
  disabled?: boolean;
  label?: string;
}

export default function BetControl({ bet, setBet, balance, disabled, label = "Bet Amount" }: BetControlProps) {
  const [displayValue, setDisplayValue] = useState(String(bet));

  useEffect(() => {
    // Sync the display if the actual bet changes externally (like 1/2, 2X)
    if (parseBet(displayValue) !== bet) {
      if (bet >= 1000) {
        setDisplayValue(formatMoney(bet).replace('$', ''));
      } else {
        setDisplayValue(String(bet));
      }
    }
  }, [bet]);

  const handleInputChange = (val: string) => {
    setDisplayValue(val);
    const parsed = parseBet(val);
    if (!isNaN(parsed) && parsed >= 0) {
      setBet(Math.min(balance, parsed));
    }
  };

  const handleBlur = () => {
    // Keep user's exact shorthand if what they typed resolves correctly
    // or format it fully if it's a raw long number
    if (parseBet(displayValue) === bet) {
      if (!isNaN(Number(displayValue)) && bet >= 1000) {
        setDisplayValue(formatMoney(bet).replace('$', ''));
      }
    } else {
      if (bet >= 1000) {
        setDisplayValue(formatMoney(bet).replace('$', ''));
      } else {
        setDisplayValue(String(bet));
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black text-slate-500 tracking-wider uppercase px-1">
        {label}
      </label>
      <div className="flex bg-zinc-900 border border-white/5 rounded-xl p-3 items-center group focus-within:border-purple-500/50 transition-all">
        <Coins className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          className="bg-transparent border-none text-white font-extrabold text-sm outline-none w-full placeholder:text-slate-700"
          placeholder="0"
        />
        <div className="flex gap-1.5 ml-2">
          <button
            onClick={() => !disabled && setBet(Math.max(1, Math.floor(bet / 2)))}
            className="px-2 py-1 text-[9px] font-black bg-zinc-950 hover:bg-zinc-800 border border-white/5 rounded-md text-slate-400 transition-all active:scale-95 flex-shrink-0"
          >
            1/2
          </button>
          <button
            onClick={() => !disabled && setBet(Math.min(balance, bet * 2))}
            className="px-2 py-1 text-[9px] font-black bg-zinc-950 hover:bg-zinc-800 border border-white/5 rounded-md text-slate-400 transition-all active:scale-95 flex-shrink-0"
          >
            2X
          </button>
          <button
            onClick={() => !disabled && setBet(balance)}
            className="px-2 py-1 text-[9px] font-black bg-zinc-950 hover:bg-zinc-800 border border-white/5 rounded-md text-slate-400 transition-all active:scale-95 flex-shrink-0"
          >
            MAX
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] text-slate-600 font-bold uppercase transition-all">
          {bet > balance ? 'Insufficient Balance' : `Value: ${formatMoney(bet)}`}
        </span>
      </div>
    </div>
  );
}
