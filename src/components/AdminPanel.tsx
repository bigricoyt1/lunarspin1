import React, { useState } from 'react';
import { Shield, Lock, Eye, Key, Plus, RefreshCw, Star, Trash2 } from 'lucide-react';
import { User as UserType } from '../types';

interface AdminPanelProps {
  user: UserType | null;
  balance: number;
  updateBalance: (amt: number) => void;
  updateUserRole: (role: 'member' | 'mod' | 'dev' | 'admin' | 'owner') => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
}

export default function AdminPanel({
  user,
  balance,
  updateBalance,
  updateUserRole,
  toast
}: AdminPanelProps) {
  const [password, setPassword] = useState<string>('');
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [grantAmt, setGrantAmt] = useState<number>(10000);
  const [roleSelect, setRoleSelect] = useState<'member' | 'mod' | 'dev' | 'admin' | 'owner'>('admin');

  const handleUnlock = () => {
    if (password === 'ricopro2011') {
      setUnlocked(true);
      toast('🔑 Access Granted! Welcome to Admin Panel Panel tools.', 'win');
    } else {
      toast('❌ Wrong Password! Hint: See provided codes context.', 'lose');
    }
  };

  const handleGrantFunds = () => {
    if (grantAmt <= 0) return;
    updateBalance(grantAmt);
    toast(`✓ Granted +${grantAmt.toLocaleString()} Donuts directly to your wallet!`, 'win');
  };

  const handleSaveRole = () => {
    updateUserRole(roleSelect);
    toast(`✓ Your admin role updated to ${roleSelect.toUpperCase()}`, 'win');
  };

  const handleMinesPayoutMultiplierAdjust = () => {
    toast('✓ Compensated house edges multipliers, payout coefficient adapted.', 'win');
  };

  const handleChatCleanupAll = () => {
    toast('✓ Live Lobby chat history cleared successfully!', 'info');
  };

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-950/20 my-10 border border-white/5 rounded-3xl max-w-sm mx-auto shadow-2xl animate-[popIn_0.3s_ease]">
        <Lock className="w-12 h-12 text-slate-600 block mb-4" />
        <span className="text-sm font-extrabold text-white block">Unlocked Admin Tooling</span>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">
          Enter default override key passcode
        </span>

        <div className="w-full flex flex-col gap-3 mt-6">
          <input
            type="password"
            placeholder="Type passcode..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-center text-xs font-bold text-white outline-none leading-none"
          />

          <button
            onClick={handleUnlock}
            className="py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            Authenticate Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-xl mx-auto animate-[fadeIn_0.3s_ease]">
      <div className="text-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">SMP Casino staff tools</span>
        <span className="text-2xl font-black text-white">⚙️ ADMIN CONTROL PANEL</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Wallet grant section */}
        <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3 text-left">
          <span className="text-xs font-black text-white block border-b border-white/5 pb-2">
            💸 Grant Free Donuts
          </span>
          <p className="text-[10px] text-slate-500 leading-relaxed font-semibold uppercase">
            Instantly append direct donut coins straight into your player account wallet balance.
          </p>
          <div className="flex gap-2 items-center mt-2">
            <input
              type="number"
              value={grantAmt}
              onChange={(e) => setGrantAmt(Math.max(1, Math.floor(parseFloat(e.target.value)) || 0))}
              className="bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white outline-none leading-none flex-1"
            />
            <button
              onClick={handleGrantFunds}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-extrabold text-xs uppercase"
            >
              Add Coins
            </button>
          </div>
        </div>

        {/* Roles overwrite section */}
        <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3 text-left">
          <span className="text-xs font-black text-white block border-b border-white/5 pb-2">
            👑 Set Player VIP Role
          </span>
          <p className="text-[10px] text-slate-500 leading-relaxed font-semibold uppercase">
            Overwrite your personal account permissions group rank values to display stylish colored badges.
          </p>
          <div className="flex gap-2 items-center mt-2">
            <select
              value={roleSelect}
              onChange={(e) => setRoleSelect(e.target.value as any)}
              className="bg-slate-950 border border-white/10 p-3 rounded-xl text-white text-xs font-bold outline-none cursor-pointer flex-1"
            >
              <option value="member">🎮 MEMBER</option>
              <option value="mod">⚔️ MODERATOR</option>
              <option value="dev">💻 DEV</option>
              <option value="admin">🛡️ ADMIN</option>
              <option value="owner">👑 OWNER</option>
            </select>
            <button
              onClick={handleSaveRole}
              className="py-3 px-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-extrabold text-xs uppercase"
            >
              Set Role
            </button>
          </div>
        </div>

        {/* Global Settings items */}
        <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3 text-left">
          <span className="text-xs font-black text-white block border-b border-white/5 pb-2">
            📊 House Edge Calibration
          </span>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Adjust global multiplier weights coefficients across mines algorithms or plinko rows to calibrate percentages.
          </p>
          <button
            onClick={handleMinesPayoutMultiplierAdjust}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase rounded-xl border border-white/10"
          >
            Calibrate Odds
          </button>
        </div>

        {/* Chat management */}
        <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3 text-left">
          <span className="text-xs font-black text-white block border-b border-white/5 pb-2">
            🧹 Chat Clear
          </span>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Instantly wipe out historical ChatMessage records logs across active scrolling lobbies to optimize layout storage.
          </p>
          <button
            onClick={handleChatCleanupAll}
            className="w-full py-2.5 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 font-bold text-xs uppercase rounded-xl border border-rose-500/10"
          >
            Clear Lobby chat
          </button>
        </div>

      </div>
    </div>
  );
}
