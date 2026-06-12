import React from 'react';
import { Coins, User, CreditCard, Shield, Lock, Award, Sparkles, Check, CheckSquare } from 'lucide-react';
import { User as UserType } from '../types';
import { formatMoney } from '../data';

interface TopbarProps {
  user: UserType | null;
  onOpenWallet: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  logoUrl: string;
}

export default function Topbar({
  user,
  onOpenWallet,
  onOpenProfile,
  onOpenAdmin,
  onOpenLogin,
  logoUrl
}: TopbarProps) {
  
  // Calculate Level progress metrics
  const getLevel = (x: number) => {
    let lv = 1;
    while (Math.floor(50 * Math.pow(lv, 1.9)) <= x) lv++;
    return lv;
  };

  const getXPForLevel = (lv: number) => {
    return Math.floor(50 * Math.pow(lv, 1.9));
  };

  const currentLevel = user ? getLevel(user.xp) : 1;
  const nextLevelXP = getXPForLevel(currentLevel);
  const prevLevelXP = currentLevel > 1 ? getXPForLevel(currentLevel - 1) : 0;
  
  const levelProgress = user 
    ? Math.min(100, Math.round(((user.xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100)) || 0
    : 0;

  return (
    <header className="h-[60px] bg-slate-950/90 border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 z-40 backdrop-blur-xl relative">
      
      {/* Brand logo label for small views, else description */}
      <div className="flex items-center gap-4">
        {/* Left header tag */}
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/15 py-1 px-3 rounded-full text-[10px] font-black uppercase text-purple-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Live Connected
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* User Balance Chips */}
        <div 
          onClick={onOpenWallet}
          className="flex items-center gap-2 bg-slate-900 border border-white/5 hover:border-purple-600/30 py-2 px-4 rounded-xl cursor-pointer select-none transition-all shadow hover:-translate-y-0.5"
        >
          <span className="text-xl">🍩</span>
          <span className="text-sm font-black text-white leading-none">
            {user ? formatMoney(user.balance) : '0'}
          </span>
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest pl-1 border-l border-white/10 h-3 flex items-center leading-none">
            Donuts
          </span>
        </div>

        {/* User account state card */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* Level progression bar widget */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">
                XP Level {currentLevel}
              </span>
              <div className="w-24 h-1.5 bg-slate-900 border border-white/5 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-600"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>

            {/* Profile trigger chip */}
            <div
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 bg-slate-900 border border-white/5 hover:border-purple-600/30 p-1.5 pr-4 rounded-xl cursor-pointer select-none transition-all hover:-translate-y-0.5"
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="avatar" 
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg object-cover" 
                />
              ) : (
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs select-none"
                  style={{ backgroundColor: user.color }}
                >
                  {user.emoji}
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-white leading-tight capitalize truncate max-w-[80px]">
                  {user.username}
                </span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                  View Profile
                </span>
              </div>
            </div>

            {/* Admin Tool shortcut button if staff roles apply */}
            {['admin', 'owner', 'dev'].includes(user.role) && (
              <button
                onClick={onOpenAdmin}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-purple-500/20 text-purple-400 select-none rounded-xl cursor-pointer transition-all shadow"
                title="Admin Control"
              >
                <Shield className="w-4 h-4 text-purple-400" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="py-2.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow shadow-purple-500/10 cursor-pointer"
          >
            Sign in
          </button>
        )}
      </div>

    </header>
  );
}
