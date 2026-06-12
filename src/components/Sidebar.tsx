import React from 'react';
import { 
  Home, Swords, Trophy, Gift, CreditCard, MessageSquare, Compass, 
  Coins, Play, Package, Shield, Star, Award, Sparkles, Flame, CheckCircle, HelpCircle
} from 'lucide-react';
import { MC_ICONS } from '../data';

// Import game thumbnails for active build bundling
import coinFlipThumb from '../assets/images/coin_flip_thumbnail_1780942494738.png';
import crashThumb from '../assets/images/rocket_crash_thumbnail_1780942506080.png';
import minesThumb from '../assets/images/minesweeper_thumbnail_1780942520030.png';
import rouletteThumb from '../assets/images/roulette_thumbnail_1780942530471.png';
import plinkoThumb from '../assets/images/plinko_thumbnail_1780942541651.png';
import blackjackThumb from '../assets/images/blackjack_thumbnail_1780942556108.png';
import diceThumb from '../assets/images/dice_roll_thumbnail_1780942570496.png';
import towersThumb from '../assets/images/towers_thumbnail_1780942582979.png';
import chickenThumb from '../assets/images/chicken_road_thumbnail_1780942594765.png';
import jackpotThumb from '../assets/images/jackpot_thumbnail_1780942628067.png';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openGame: (game: string) => void;
  discordInvite: string;
  onOpenWallet: () => void;
  logoUrl: string;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  openGame,
  discordInvite,
  onOpenWallet,
  logoUrl
}: SidebarProps) {
  
  const menuItems = [
    { id: 'home', label: 'Home Feed', icon: <Home className="w-4 h-4" /> },
    { id: 'coinflip', label: 'Coinflip', icon: <img src={coinFlipThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Coinflip" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'crash', label: 'Crash Flight', icon: <img src={crashThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Crash" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'mines', label: 'Mine Picker', icon: <img src={minesThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Mines" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'roulette', label: 'Sector Roulette', icon: <img src={rouletteThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Roulette" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'plinko', label: 'Plinko Drop', icon: <img src={plinkoThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Plinko" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'blackjack', label: 'Blackjack', icon: <img src={blackjackThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Blackjack" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'dice', label: 'Dice Roll', icon: <img src={diceThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Dice" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'towers', label: 'Tower Climb', icon: <img src={towersThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Towers" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'chicken', label: 'Chicken Road', icon: <img src={chickenThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Chicken" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'jackpot', label: 'Jackpot Pot', icon: <img src={jackpotThumb} className="w-4 h-4 rounded-md object-cover border border-white/10 group-hover:border-purple-500/50 transition-all duration-300" alt="Jackpot" referrerPolicy="no-referrer" />, isGame: true },
    { id: 'cases', label: 'Loot Cases', icon: <Package className="w-4 h-4" />, isBadge: 'NEW' },
    { id: 'casebattle', label: 'Case Battles', icon: <Swords className="w-4 h-4" />, isBadge: 'NEW' },
    { id: 'leaderboard', label: 'Leaderboards', icon: <Trophy className="w-4 h-4" /> },
    { id: 'rewards', label: 'VIP rewards', icon: <Gift className="w-4 h-4" /> }
  ];

  return (
    <aside className="w-56 bg-slate-950/80 border-r border-white/5 flex flex-col h-full flex-shrink-0 relative overflow-y-auto">
      {/* Brand logo container */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3">
        <img 
          src={logoUrl} 
          alt="Logo" 
          referrerPolicy="no-referrer"
          className="w-8 h-8 rounded-xl object-contain animate-pulse border border-purple-500/20 shadow-purple-500/10 shadow" 
        />
        <div className="flex flex-col">
          <span className="font-extrabold text-[15px] tracking-tight bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent uppercase">
            LunarSpin
          </span>
          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            PREMIUM CASINO
          </span>
        </div>
      </div>

      <nav className="p-2 flex flex-col gap-1">
        <span className="text-[9px] text-slate-600 font-extrabold uppercase tracking-widest px-3 py-2">
          Category Directory
        </span>
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              onClick={() => {
                if (item.isGame) {
                  openGame(item.id);
                } else {
                  setCurrentTab(item.id);
                }
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
