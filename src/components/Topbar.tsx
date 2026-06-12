import React from 'react';
import { Coins, User, CreditCard, Shield, Lock, Award, Sparkles, Check, CheckSquare, Menu } from 'lucide-react';
import { User as UserType } from '../types';
import { formatMoney } from '../data';
import { getLevel, getLevelProgress } from '../lib/leveling';

interface TopbarProps {
  user: UserType | null;
  onOpenWallet: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  onOpenShop: () => void;
  logoUrl: string;
  onlineCount?: number;
  onToggleMobileMenu?: () => void;
}

export default function Topbar({
  user,
  onOpenWallet,
  onOpenProfile,
  onOpenAdmin,
  onOpenLogin,
  onOpenShop,
  logoUrl,
  onlineCount = 1,
  onToggleMobileMenu
}: TopbarProps) {
  
  // Calculate Level progress metrics
  const currentLevel = user ? getLevel(user.xp) : 1;
  const levelProgress = user ? getLevelProgress(user.xp) : 0;

  return (
    <header className="h-[60px] bg-slate-950/90 border-b border-white/5 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-40 backdrop-blur-xl relative">
      
      {/* Brand logo label for small views, else description */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        {/* Live Indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/15 py-1 px-3 rounded-full text-[10px] font-black uppercase text-emerald-400 mr-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          LIVE
        </div>

        {logoUrl && (
          <img 
            src={logoUrl} 
            alt="LunarSpin Logo" 
            referrerPolicy="no-referrer"
            className="h-8 w-auto object-contain select-none filter drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
          />
        )}
        <div className="hidden sm:flex items-center gap-2 bg-purple-500/10 border border-purple-500/15 py-1 px-3 rounded-full text-[10px] font-black uppercase text-purple-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          {onlineCount.toLocaleString()} Online
        </div>

      </div>

      {/* Top Center Donut Store CTA Button */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
        <button
          onClick={onOpenShop}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-purple-600/30 to-indigo-600/20 hover:from-amber-500/30 hover:via-purple-600/40 hover:to-indigo-600/35 border border-amber-500/30 hover:border-amber-400 py-1.5 px-4 rounded-full text-[11px] font-black text-amber-300 uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.03] select-none font-mono"
        >
          <span className="animate-[bounce_2s_infinite]">🍩</span>
          DONUT IRL SHOP
          <span className="inline-flex bg-amber-400 text-slate-950 px-1 py-0.5 rounded text-[8px] font-black tracking-normal leading-none items-center shadow-sm">
            0.03$ / 1M
          </span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* User Balance Chips */}
        <div 
          onClick={onOpenWallet}
          className="flex items-center gap-2 bg-slate-900 border border-white/5 hover:border-purple-500/50 py-2 px-4 rounded-xl cursor-pointer select-none transition-all shadow hover:-translate-y-0.5"
        >
          <span className="text-xl animate-bounce">🌙</span>
          <span className="text-sm font-black text-white leading-none">
            {user ? formatMoney(user.balance).replace('$', '') : '0'}
          </span>
          <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest pl-1 border-l border-white/10 h-3 flex items-center leading-none">
            Money
          </span>
        </div>

        {/* User account state card */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* Level progression bar widget */}
            <div className="hidden sm:flex flex-col text-right font-mono">
              <span className="text-[9px] text-[#55FF55] font-extrabold uppercase tracking-widest">
                Level {currentLevel}
              </span>
              <div className="w-24 h-2 bg-slate-900 border border-white/10 rounded-sm mt-1 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-[#55FF55] to-[#3BFF3B] shadow-[0_0_10px_rgba(85,255,85,0.3)] transition-all duration-600"
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
