import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Swords, Trophy, Gift, CreditCard, MessageSquare, Compass, 
  Coins, Play, Package, Shield, Star, Award, Sparkles, Flame, CheckCircle, HelpCircle
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatPanel from './components/ChatPanel';
import LiveBetsFeed from './components/LiveBetsFeed';
import WalletModal from './components/WalletModal';
import RewardsModule from './components/RewardsModule';
import LeaderboardModule from './components/LeaderboardModule';
import AdminPanel from './components/AdminPanel';
import CasesModule from './components/CasesModule';
import CaseBattlesModule from './components/CaseBattlesModule';

import Coinflip from './components/games/Coinflip';
import Crash from './components/games/Crash';
import Mines from './components/games/Mines';
import Roulette from './components/games/Roulette';
import Plinko from './components/games/Plinko';
import Blackjack from './components/games/Blackjack';
import Dice from './components/games/Dice';
import Towers from './components/games/Towers';
import ChickenRoad from './components/games/ChickenRoad';
import Jackpot from './components/games/Jackpot';

import { User, Transaction, LiveBet } from './types';

// Import image assets for production bundler
import logoPng from './assets/images/donut_casino_logo_1780940925578.png';
import heroArt from './assets/images/casino_hero_art_1780942067822.png';
import coinFlipThumb from './assets/images/coin_flip_thumbnail_1780942494738.png';
import crashThumb from './assets/images/rocket_crash_thumbnail_1780942506080.png';
import minesThumb from './assets/images/minesweeper_thumbnail_1780942520030.png';
import rouletteThumb from './assets/images/roulette_thumbnail_1780942530471.png';
import plinkoThumb from './assets/images/plinko_thumbnail_1780942541651.png';
import blackjackThumb from './assets/images/blackjack_thumbnail_1780942556108.png';
import diceThumb from './assets/images/dice_roll_thumbnail_1780942570496.png';
import towersThumb from './assets/images/towers_thumbnail_1780942582979.png';
import chickenThumb from './assets/images/chicken_road_thumbnail_1780942594765.png';
import jackpotThumb from './assets/images/jackpot_thumbnail_1780942628067.png';

// Custom PNG logo we generated
const LOGO_PNG_URL = logoPng;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0); // Start at 0 for logged-out guests
  const [wager, setWager] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Modal triggers
  const [walletOpen, setWalletOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [loginOpen, setLoginOpen] = useState<boolean>(false);

  // Initialize empty state on startup - user must sign in via Google or Discord
  useEffect(() => {
    setTransactions([
      { id: 'tx_init_1', desc: 'Welcome to LunarSpin! Please Sign In to get started.', amt: 0, ts: Date.now() }
    ]);
  }, []);

  const handleUpdateBalance = (amt: number) => {
    setBalance(prev => {
      const next = prev + amt;
      if (user) {
        setUser({ ...user, balance: next });
      }
      return next;
    });

    // Track wager totals
    if (amt < 0) {
      setWager(prev => prev + Math.abs(amt));
    }
  };

  const handleUpdateUserRole = (role: 'member' | 'mod' | 'dev' | 'admin' | 'owner') => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const handleAddTransaction = (desc: string, amt: number) => {
    const nextTx: Transaction = {
      id: `tx_${Date.now()}`,
      desc,
      amt,
      ts: Date.now()
    };
    setTransactions(prev => [nextTx, ...prev]);
  };

  const handleLogLiveBet = (game: string, amount: number, result: 'win' | 'loss', mult: number) => {
    const nextBet: LiveBet = {
      id: `bet_user_${Date.now()}`,
      username: user ? user.username : 'GuestPlayer',
      game,
      amount,
      result,
      mult,
      ts: Date.now()
    };
    setLiveBets(prev => [nextBet, ...prev]);
    handleAddTransaction(`${game} ${result === 'win' ? 'Payout Win' : 'Loss'}`, result === 'win' ? amount * mult : -amount);
  };

  const handleAddXP = (amt: number) => {
    if (user) {
      setUser(prev => {
        if (!prev) return null;
        return { ...prev, xp: prev.xp + amt };
      });
    }
  };

  const handleLogin = (provider: 'discord' | 'google') => {
    const isDiscord = provider === 'discord';
    const startingBalance = 5000;
    const profile: User = isDiscord ? {
      id: `discord_${Math.floor(Math.random() * 900000 + 100000)}`,
      username: 'DiscordSpinner',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop',
      role: 'member',
      emoji: '🎮',
      color: '#5865F2',
      status: 'Ready to spin the lunar wheels!',
      private: false,
      xp: 450,
      balance: startingBalance
    } : {
      id: `google_${Math.floor(Math.random() * 900000 + 100000)}`,
      username: 'GoogleSpinner',
      avatar: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop',
      role: 'member',
      emoji: '⭐',
      color: '#4285F4',
      status: 'Aiming for the stars with Google!',
      private: false,
      xp: 680,
      balance: startingBalance
    };

    setUser(profile);
    setBalance(startingBalance);
    showToastNotification(`✓ Successfully authenticated via ${isDiscord ? 'Discord' : 'Google'} as ${profile.username}!`, 'win');
    
    setTransactions(prev => [
      { id: `tx_auth_${Date.now()}_1`, desc: `Linked ${isDiscord ? 'Discord' : 'Google'} Account`, amt: 0, ts: Date.now() },
      { id: `tx_auth_${Date.now()}_2`, desc: 'Starting Donuts Credit', amt: startingBalance, ts: Date.now() + 1000 },
      ...prev
    ]);
  };

  const handleLogout = () => {
    setUser(null);
    setBalance(0);
    showToastNotification('🚪 Logged out successfully. Sign in with Google or Discord to resume!', 'info');
  };

  // Modern Audio Synthesizer fallback
  const playSoundEffect = (win: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const g = ctx.createGain();
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.08, ctx.currentTime);

      if (win) {
        // High ascending ding success tone
        const o1 = ctx.createOscillator();
        o1.type = 'sine';
        o1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        o1.connect(g);
        o1.start();
        o1.stop(ctx.currentTime + 0.1);

        const o2 = ctx.createOscillator();
        o2.type = 'sine';
        o2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        o2.connect(g);
        o2.start(ctx.currentTime + 0.1);
        o2.stop(ctx.currentTime + 0.35);
      } else {
        // Low descending drop tone
        const o1 = ctx.createOscillator();
        o1.type = 'triangle';
        o1.frequency.setValueAtTime(140.00, ctx.currentTime);
        o1.connect(g);
        o1.start();
        o1.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Audio context browser autoplay blocks caught
    }
  };

  const showToastNotification = (msg: string, type: 'win' | 'lose' | 'info') => {
    // Elegant immediate fallback log
    console.log(`[Toast ${type.toUpperCase()}] ${msg}`);
  };

  return (
    <div className="h-screen w-screen bg-slate-950 font-sans text-slate-100 flex flex-col overflow-hidden select-none">
      
      {/* Top statistics and accounts bar */}
      <Topbar 
        user={user}
        logoUrl={LOGO_PNG_URL}
        onOpenWallet={() => setWalletOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAdmin={() => setCurrentTab('admin')}
        onOpenLogin={() => setLoginOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Responsive left column side Menu */}
        <Sidebar 
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          openGame={(game) => {
            setActiveGame(game);
          }}
          discordInvite="https://discord.gg/lunarspin"
          onOpenWallet={() => setWalletOpen(true)}
          logoUrl={LOGO_PNG_URL}
        />

        {/* Central scrolling directory frame grid */}
        <main className="flex-1 bg-slate-950/40 overflow-y-auto no-scrollbar relative min-w-0">
          
          {currentTab === 'home' && (
            <div className="flex flex-col h-full animate-[fadeIn_0.35s_ease-out]">
              {/* Giant glowing hero welcome */}
              <div 
                className="m-6 p-8 rounded-3xl border border-white/5 relative overflow-hidden min-h-[300px] flex items-center shadow-2xl"
                style={{ 
                  background: 'linear-gradient(145deg, rgba(8, 12, 28, 0.9), rgba(12, 10, 24, 0.95), rgba(5, 5, 12, 0.98))',
                  boxShadow: 'inset 0 0 80px rgba(124, 58, 237, 0.08), 0 20px 50px rgba(0,0,0,0.5)'
                }}
              >
                {/* Visual grid masks */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(168,85,247,0.06)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
                <div className="absolute right-12 top-6 bottom-6 w-[360px] rounded-2xl overflow-hidden border border-purple-500/15 shadow-xl hidden lg:block pointer-events-none select-none">
                  <img 
                    src={heroArt} 
                    alt="Casino Luxury Art" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center opacity-85 hover:opacity-100 transition-opacity"
                  />
                </div>

                <div className="relative z-10 flex flex-col text-left">
                  <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 py-1 px-3.5 rounded-full text-[9px] font-black uppercase tracking-widest text-purple-400 max-w-fit mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                    SMP CASINO IS ONLINE
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-black font-display text-white tracking-tight leading-none uppercase">
                    Lunar Spin <span className="text-purple-400">SMP</span>
                  </h1>
                  <p className="text-sm text-slate-500 max-w-md mt-4 leading-relaxed font-semibold">
                    Unleash the supreme gaming experience of LunarSpin SMP. Play exclusive originals, compete in active Battles, open cases, and claim daily Rain drops.
                  </p>

                  <div className="flex gap-3 items-center mt-8 flex-wrap">
                    <button
                      onClick={() => setActiveGame('coinflip')}
                      className="py-3.5 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/25 transition-all text-sm cursor-pointer"
                    >
                      🎮 Launch Games
                    </button>
                    <button
                      onClick={() => setCurrentTab('cases')}
                      className="py-3.5 px-8 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-purple-600/30 text-slate-400 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all h-[44px] cursor-pointer"
                    >
                      📦 Open Cases
                    </button>
                  </div>
                </div>
              </div>

              {/* Bento Grid layout of Games list directory */}
              <div className="px-6 pb-8 flex flex-col gap-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left">
                  Originals directory ({10} games available)
                </span>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { id: 'coinflip', title: 'Coinflip', thumbnail: coinFlipThumb, color: '#fbbf24', desc: 'Double your inputs' },
                    { id: 'crash', title: 'Rocket Crash', thumbnail: crashThumb, color: '#ef4444', desc: 'Scale cashouts' },
                    { id: 'mines', title: 'Minesweeper', thumbnail: minesThumb, color: '#10b981', desc: 'Evade foxes' },
                    { id: 'roulette', title: 'Roulette Sector', thumbnail: rouletteThumb, color: '#a855f7', desc: 'Traditional wheel' },
                    { id: 'plinko', title: 'Plinko Drop', thumbnail: plinkoThumb, color: '#3b82f6', desc: 'Binomial pins' },
                    { id: 'blackjack', title: 'Blackjack', thumbnail: blackjackThumb, color: '#a855f7', desc: 'Natural 21s' },
                    { id: 'dice', title: 'Dice roll', thumbnail: diceThumb, color: '#60a5fa', desc: 'Win chances' },
                    { id: 'towers', title: 'Towers Climb', thumbnail: towersThumb, color: '#f59e0b', desc: 'Risk multiplier' },
                    { id: 'chicken', title: 'Chicken Road', thumbnail: chickenThumb, color: '#22c55e', desc: 'Safe crossways' },
                    { id: 'jackpot', title: 'Jackpot Pot', thumbnail: jackpotThumb, color: '#f43f5e', desc: 'Multiplayer pool' }
                  ].map((g, idx) => {
                    const displayNum = String(idx + 1).padStart(2, '0');
                    return (
                      <div
                        onClick={() => setActiveGame(g.id)}
                        key={g.id}
                        className="bg-slate-900 border border-white/5 hover:border-purple-500/30 rounded-2xl cursor-pointer flex flex-col justify-between aspect-[3/4] relative overflow-hidden transition-all duration-300 group shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
                      >
                        {/* Custom background radial highlight gradient based on card colors */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
                          style={{ backgroundImage: `radial-gradient(circle at 50% 30%, ${g.color}20 0, transparent 70%)` }}
                        />

                        {/* Beautiful Cover image container */}
                        <div className="relative flex-1 overflow-hidden bg-slate-950">
                          <img 
                            src={g.thumbnail} 
                            alt={g.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                          />
                          {/* Rich linear color bleed overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                          
                          {/* High-contrast hover play dynamic trigger indicator */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-950/40 backdrop-blur-[1px]">
                            <div className="w-11 h-11 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-xl shadow-purple-600/30 transform translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>

                          <span className="absolute top-3 right-3 text-[10px] font-mono font-bold text-white/30 tracking-wider">
                            {displayNum}
                          </span>
                        </div>

                        {/* Info details panel */}
                        <div className="p-4 bg-slate-950 border-t border-white/5 flex flex-col text-left z-20 relative">
                          <span className="font-extrabold text-xs text-white group-hover:text-purple-300 transition-colors">
                            {g.title}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold block mt-1 leading-normal truncate">
                            {g.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentTab === 'cases' && (
            <CasesModule 
              balance={balance}
              updateBalance={handleUpdateBalance}
              addXP={handleAddXP}
              toast={showToastNotification}
              playSound={playSoundEffect}
            />
          )}

          {currentTab === 'casebattle' && (
            <CaseBattlesModule 
              balance={balance}
              updateBalance={handleUpdateBalance}
              addXP={handleAddXP}
              toast={showToastNotification}
              playSound={playSoundEffect}
              username={user ? user.username : 'GuestPlayer'}
            />
          )}

          {currentTab === 'leaderboard' && (
            <LeaderboardModule 
              balance={balance}
              user={user}
            />
          )}

          {currentTab === 'rewards' && (
            <RewardsModule 
              wager={wager}
            />
          )}

          {currentTab === 'admin' && (
            <AdminPanel 
              user={user}
              balance={balance}
              updateBalance={handleUpdateBalance}
              updateUserRole={handleUpdateUserRole}
              toast={showToastNotification}
            />
          )}

        </main>

        {/* Live chat feed sidebar columns */}
        <ChatPanel 
          user={user}
          onOpenLogin={() => setLoginOpen(true)}
          toast={showToastNotification}
          updateBalance={handleUpdateBalance}
          playSound={playSoundEffect}
        />

      </div>

      {/* Scrolling ticker bottom feed of active bets */}
      <LiveBetsFeed liveBets={liveBets} />

      {/* wallet modal page popups */}
      {walletOpen && (
        <WalletModal 
          user={user}
          balance={balance}
          updateBalance={handleUpdateBalance}
          transactions={transactions}
          addTransaction={handleAddTransaction}
          toast={showToastNotification}
          onOpenLogin={() => { setWalletOpen(false); setLoginOpen(true); }}
          onClose={() => setWalletOpen(false)}
        />
      )}

      {/* login/auth mockup popup dialog */}
      {loginOpen && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 relative flex flex-col gap-6 text-center select-none">
            <button
              onClick={() => setLoginOpen(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center text-slate-400 transition-all font-bold"
            >
              ✕
            </button>

            <span className="text-4xl block mt-2">🍩</span>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white">Join LunarSpin Casino</span>
              <span className="text-xs text-slate-500 mt-1 block">
                Sign in to persist your winnings, chat in live lobbies, and redeem promo codes.
              </span>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => {
                  setLoginOpen(false);
                  handleLogin('discord');
                }}
                className="w-full py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                🎮 Continue with Discord
              </button>
              <button
                onClick={() => {
                  setLoginOpen(false);
                  handleLogin('google');
                }}
                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-white transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                ⭐ Continue with Google
              </button>
            </div>
            
            <p className="text-[10px] text-slate-600 block mt-2 font-semibold lowercase">
              Authorized callback routes processed by our security filters immediately.
            </p>
          </div>
        </div>
      )}

      {/* Profile and custom drawer details */}
      {profileOpen && user && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 relative flex flex-col gap-4 text-center">
            
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center text-slate-400 transition-all font-bold"
            >
              ✕
            </button>

            <div 
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-4xl mt-3 select-none"
              style={{ backgroundColor: user.color }}
            >
              {user.emoji}
            </div>

            <div className="flex flex-col mt-2">
              <span className="text-lg font-black text-white capitalize">{user.username}</span>
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mt-1 block">
                {user.role} rank status details
              </span>
            </div>

            <div className="bg-slate-950 p-4 border border-white/5 rounded-2xl flex flex-col gap-2 text-left text-xs text-slate-400 font-semibold my-2">
              <div className="flex justify-between">
                <span>Account ID:</span>
                <span className="text-white font-mono">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span>XP Accrued:</span>
                <span className="text-white font-mono">{user.xp} XP</span>
              </div>
              <div className="flex justify-between">
                <span>Direct Balance:</span>
                <span className="text-amber-400 font-extrabold">{balance} Donuts</span>
              </div>
              <div className="flex justify-between">
                <span>Wager Limit Rank:</span>
                <span className="text-purple-400 font-extrabold">{wager} total wagered</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => { setProfileOpen(false); setWalletOpen(true); }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl block text-center cursor-pointer font-bold"
              >
                💳 Open Wallet
              </button>
              <button
                onClick={() => { setProfileOpen(false); handleLogout(); }}
                className="w-full py-3 bg-slate-800 hover:bg-rose-950 border border-white/5 hover:border-rose-500/30 text-rose-400 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl block text-center transition-all cursor-pointer font-bold"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render full active single-player casino games overlays */}
      <AnimatePresence>
        {activeGame && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-6 backdrop-blur-lg">
            <div className="bg-slate-900 border border-white/5 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative shadow-2xl flex flex-col">
              
              <button
                onClick={() => {
                  setActiveGame(null);
                  drawInitialLobbyGraphic();
                }}
                className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center text-slate-400 transition-all font-bold z-55 cursor-pointer"
              >
                ✕
              </button>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                {activeGame === 'coinflip' && (
                  <Coinflip 
                    balance={balance}
                    updateBalance={handleUpdateBalance}
                    addXP={handleAddXP}
                    logLiveBet={handleLogLiveBet}
                    toast={showToastNotification}
                    playSound={playSoundEffect}
                  />
                )}
                {activeGame === 'crash' && (
                  <Crash 
                    balance={balance}
                    updateBalance={handleUpdateBalance}
                    addXP={handleAddXP}
                    logLiveBet={handleLogLiveBet}
                    toast={showToastNotification}
                    playSound={playSoundEffect}
                  />
                )}
                {activeGame === 'mines' && (
                  <Mines 
                    balance={balance}
                    updateBalance={handleUpdateBalance}
                    addXP={handleAddXP}
                    logLiveBet={handleLogLiveBet}
                    toast={showToastNotification}
                    playSound={playSoundEffect}
                  />
                )}
                {activeGame === 'roulette' && (
                  <Roulette 
                    balance={balance}
                    updateBalance={handleUpdateBalance}
                    addXP={handleAddXP}
                    logLiveBet={handleLogLiveBet}
                    toast={showToastNotification}
                    playSound={playSoundEffect}
                  />
                )}
                {activeGame === 'plinko' && (
                  <Plinko 
                    balance={balance}
                    updateBalance={handleUpdateBalance}
                    addXP={handleAddXP}
                    logLiveBet={handleLogLiveBet}
                    toast={showToastNotification}
                    playSound={playSoundEffect}
                  />
                )}
                {activeGame === 'blackjack' && (
                  <Blackjack 
                    balance={balance}
                    updateBalance={handleUpdateBalance}
                    addXP={handleAddXP}
                    logLiveBet={handleLogLiveBet}
                    toast={showToastNotification}
                    playSound={playSoundEffect}
                  />
                )}
                {activeGame === 'dice' && (
                  <Dice 
                    balance={balance}
                    updateBalance={handleUpdateBalance}
                    addXP={handleAddXP}
                    logLiveBet={handleLogLiveBet}
                    toast={showToastNotification}
                    playSound={playSoundEffect}
                  />
                )}
                {activeGame === 'towers' && (
                  <Towers 
                    balance={balance}
                    updateBalance={handleUpdateBalance}
                    addXP={handleAddXP}
                    logLiveBet={handleLogLiveBet}
                    toast={showToastNotification}
                    playSound={playSoundEffect}
                  />
                )}
                {activeGame === 'chicken' && (
                  <ChickenRoad 
                    balance={balance}
                    updateBalance={handleUpdateBalance}
                    addXP={handleAddXP}
                    logLiveBet={handleLogLiveBet}
                    toast={showToastNotification}
                    playSound={playSoundEffect}
                  />
                )}
                {activeGame === 'jackpot' && (
                  <Jackpot 
                    balance={balance}
                    updateBalance={handleUpdateBalance}
                    addXP={handleAddXP}
                    logLiveBet={handleLogLiveBet}
                    toast={showToastNotification}
                    playSound={playSoundEffect}
                    username={user ? user.username : 'GuestPlayer'}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  // Helper trigger to draw background graphs once dismissed
  function drawInitialLobbyGraphic() {
    // optional reset graph trigger
  }
}
