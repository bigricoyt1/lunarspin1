import React from 'react';
import { 
  Home, Swords, Trophy, Gift, CreditCard, MessageSquare, Compass, 
  Coins, Play, Package, Shield, Star, Award, Sparkles, Flame, CheckCircle, HelpCircle
} from 'lucide-react';
import { MC_ICONS } from '../data';

// Import game thumbnails for active build bundling
import coinFlipThumb from '../assets/images/mine_coinflip_thumb_1781191906480.jpg';
import crashThumb from '../assets/images/mine_crash_thumb_1781191925076.jpg';
import minesThumb from '../assets/images/mine_mines_thumb_1781191936856.jpg';
import rouletteThumb from '../assets/images/mine_roulette_thumb_1781191951757.jpg';
import plinkoThumb from '../assets/images/mine_plinko_thumb_1781191969697.jpg';
import blackjackThumb from '../assets/images/mine_blackjack_thumb_1781192018235.jpg';
import diceThumb from '../assets/images/mine_dice_thumb_1781192037357.jpg';
import towersThumb from '../assets/images/mine_towers_thumb_1781192055257.jpg';
import jackpotThumb from '../assets/images/mine_jackpot_thumb_1781191984580.jpg';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  discordInvite: string;
  onOpenWallet: () => void;
  logoUrl: string;
  userRole?: 'member' | 'helper' | 'mod' | 'dev' | 'admin' | 'owner';
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  discordInvite,
  onOpenWallet,
  logoUrl,
  userRole = 'member'
}: SidebarProps) {
  
  const isAdmin = userRole === 'admin' || userRole === 'owner';
  const isStaff = userRole === 'helper' || userRole === 'mod' || userRole === 'dev' || isAdmin;

  const menuItems = [
    { id: 'home', label: 'Home Feed', icon: <Home className="w-4 h-4" /> },
    { id: 'coinflip', label: 'Coinflip', icon: <img src={coinFlipThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Coinflip" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'crash', label: 'Crash', icon: <img src={crashThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Crash" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'mines', label: 'Mines', icon: <img src={minesThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Mines" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'roulette', label: 'Roulette', icon: <img src={rouletteThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Roulette" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'plinko', label: 'Plinko', icon: <img src={plinkoThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Plinko" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'blackjack', label: 'Blackjack', icon: <img src={blackjackThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Blackjack" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'dice', label: 'Dice Roll', icon: <img src={diceThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Dice" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'towers', label: 'Towers', icon: <img src={towersThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Towers" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'jackpot', label: 'Jackpot', icon: <img src={jackpotThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Jackpot" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'cases', label: 'Loot Cases', icon: <Package className="w-4 h-4" />, isBadge: 'NEW' },
    { id: 'casebattle', label: 'Case Battles', icon: <Swords className="w-4 h-4" />, isBadge: 'NEW' },
    { id: 'leaderboard', label: 'Leaderboards', icon: <Trophy className="w-4 h-4" /> },
    { id: 'rewards', label: 'VIP rewards', icon: <Gift className="w-4 h-4" /> },
    { id: 'donutshop', label: 'Donut Store', icon: <Sparkles className="w-4 h-4 text-amber-400" />, isBadge: 'IRL' },
    { id: 'helper', label: 'Helper Panel', icon: <Shield className="w-4 h-4 text-blue-400" />, hidden: !isStaff },
    { id: 'admin', label: 'Admin Panel', icon: <Shield className="w-4 h-4 text-rose-500" />, hidden: !isAdmin }
  ].filter(item => !item.hidden);

  return (
    <aside className="w-56 bg-slate-950/80 border-r border-white/5 flex flex-col h-full flex-shrink-0 relative overflow-y-auto">
      {/* Brand logo container */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="LunarSpin Logo" 
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-xl object-contain border border-purple-500/30 shadow-purple-500/20 shadow animate-pulse" 
          />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-lg shadow-purple-500/20 shadow animate-pulse">
            🌙
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-extrabold text-[15px] tracking-tight bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent uppercase font-mono">
            LunarSpin
          </span>
          <span className="text-[8px] text-purple-400 font-bold uppercase tracking-widest mt-0.5 font-mono">
            Minecraft Casino
          </span>
        </div>
      </div>

      <nav className="p-2 flex flex-col gap-1">
        <span className="text-[9px] text-slate-600 font-extrabold uppercase tracking-widest px-3 py-2 font-mono">
          Category Directory
        </span>
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              onClick={() => {
                setCurrentTab(item.id);
              }}
              key={item.id}
              className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-left text-xs font-semibold select-none transition-all cursor-pointer relative group
                ${isActive 
                  ? 'bg-purple-600/15 border border-purple-500/30 text-white font-extrabold shadow shadow-purple-500/5' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
            >
              {/* Highlight active left border line */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-purple-500 rounded-full" />
              )}
              
              <div className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-purple-400' : 'text-slate-400'}`}>
                {item.icon}
              </div>

              <span>{item.label}</span>

              {item.isBadge && (
                <span className="ml-auto bg-purple-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
                  {item.isBadge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Community Discord sector at the base */}
      <div className="mt-auto border-t border-white/5 p-4 flex flex-col gap-2">
        <a
          href={discordInvite}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 bg-[#5865F2] hover:bg-[#4752c4] rounded-lg text-white font-extrabold text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-2 shadow"
        >
          <span>💬</span> Join Discord
        </a>
        <div className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">
          SMP Online Core v2.0
        </div>
      </div>
    </aside>
  );
}
