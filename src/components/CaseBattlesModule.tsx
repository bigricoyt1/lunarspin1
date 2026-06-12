import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Coins, ShieldAlert, Swords, Users, Play, Trophy, Crown, RefreshCw, Volume2, ArrowRight, ShieldCheck, Star, Plus } from 'lucide-react';
import { RARITIES, formatMoney } from '../data';
import { Case, CaseItem, CaseBattle } from '../types';

const emeraldImg = 'https://minecraft.wiki/images/Emerald_JE3_BE3.png';
const diamondImg = 'https://minecraft.wiki/images/Diamond_JE3_BE3.png';
const diamondSwordImg = 'https://minecraft.wiki/images/Diamond_Sword_JE3_BE3.png';
const netheriteSwordImg = 'https://minecraft.wiki/images/Netherite_Sword_JE1_BE1.png';
const godAppleImg = 'https://minecraft.wiki/images/Enchanted_Golden_Apple_JE2_BE2.png';
const totemImg = 'https://minecraft.wiki/images/Totem_of_Undying_JE2_BE2.png';

import { 
  db, auth,
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  updateDoc, 
  doc,
  getDocs,
  where
} from '../lib/firebase';

interface CaseBattlesModuleProps {
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
  username: string;
  communityCases: Case[];
  officialCases: Case[];
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#fbbf24', '#f43f5e', '#a855f7'];

export default function CaseBattlesModule({
  balance,
  updateBalance,
  addXP,
  toast,
  playSound,
  username,
  communityCases,
  officialCases
}: CaseBattlesModuleProps) {
  const [battles, setBattles] = useState<CaseBattle[]>([]);
  const [completed, setCompleted] = useState<CaseBattle[]>([]);
  const [offlineMode, setOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem('lunarspin_firestore_quota_exceeded') === 'true';
  });

  useEffect(() => {
    const handleExceeded = () => setOfflineMode(true);
    const handleCleared = () => setOfflineMode(false);
    window.addEventListener('quota-exceeded', handleExceeded);
    window.addEventListener('quota-cleared', handleCleared);
    return () => {
      window.removeEventListener('quota-exceeded', handleExceeded);
      window.removeEventListener('quota-cleared', handleCleared);
    };
  }, []);

  useEffect(() => {
    // Listen for Sync updates from App.tsx SSE
    const handleSyncUpdate = (e: any) => {
      if (e.detail?.type === 'update' || e.detail?.type === 'init') {
        const s = e.detail.state;
        if (s.battles) {
          setBattles(s.battles.filter((b: any) => b.open));
          setCompleted(s.battles.filter((b: any) => !b.open));
        }
      }
    };
    window.addEventListener('sync-state-update', handleSyncUpdate);

    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/sync/state');
        const data = await res.json();
        if (data.battles) {
          setBattles(data.battles.filter((b: any) => b.open));
          setCompleted(data.battles.filter((b: any) => !b.open));
        }
      } catch (err) {}
    };
    fetchInitialData();

    return () => window.removeEventListener('sync-state-update', handleSyncUpdate);
  }, []);

  const allCasesList = [...officialCases, ...communityCases];

  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [roundsCount, setRoundsCount] = useState<number>(1);
  
  useEffect(() => {
    if (selectedCaseIds.length === 0 && officialCases.length > 0) {
      setSelectedCaseIds([officialCases[0].id]);
    }
  }, [officialCases, selectedCaseIds]);

  const [selectedSlots, setSelectedSlots] = useState<number>(2);
  const [selectedTeamMode, setSelectedTeamMode] = useState<'none' | '1v1' | '2v2' | '3v3' | '1v1v1v1' | '1v1v1v1v1v1'>('none');
  const [selectedMode, setSelectedMode] = useState<'classic' | 'jackpot' | 'shared' | 'crazy'>('classic');

  const [activeScreenBattle, setActiveScreenBattle] = useState<CaseBattle | null>(null);
  
  // Interactive Live Roller simulation states inside the active battle viewer
  const [battleRollStage, setBattleRollStage] = useState<'preview' | 'animation' | 'completed'>('preview');
  const [laneRollItems, setLaneRollItems] = useState<Record<string, CaseItem[]>>({});
  const [laneWinnerIndex, setLaneWinnerIndex] = useState<number>(15); // Landing position
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const laneControls = useAnimation();

  // Mechanical tick audio synthesis
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // quiet fail
    }
  };

  const getCaseEmoji = (id: string) => {
    switch (id) {
      case 'money': return '💵';
      case 'netherite': return '🌋';
      case 'spawner': return '👾';
      case 'rank': return '👑';
      case 'key': return '🔑';
      case 'token': return '🎟️';
      default: return '📦';
    }
  };

  const rollHypergeometric = (c: Case): CaseItem => {
    let totals = 0;
    c.items.forEach(it => totals += it.percent);
    let r = Math.random() * totals;
    let acc = 0;
    for (const it of c.items) {
      acc += it.percent;
      if (r <= acc) return it;
    }
    return c.items[c.items.length - 1];
  };

  const handleCreateBattle = async () => {
    const primaryCase = allCasesList.find(x => x.id === (selectedCaseIds[0] || '')) || officialCases[0];
    if (!primaryCase) {
      toast('No case selected or cases still loading!', 'info');
      return;
    }
    
    // Total price = price of all cases selected (if supporting different cases per round)
    // For simplicity, we use the same case for all rounds as picked by roundsCount
    const battleCaseIds = Array(roundsCount).fill(selectedCaseIds[0] || officialCases[0].id);
    const totalPrice = primaryCase.price * roundsCount;

    if (balance < totalPrice) {
      toast(`Refused! You need ${formatMoney(totalPrice)} to host this battle.`, 'info');
      return;
    }

    updateBalance(-totalPrice);
    addXP(Math.max(1, Math.floor(totalPrice / 10)));

    try {
      const bId = `battle_${Date.now()}`;
      await fetch('/api/sync/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_battle',
          payload: {
            battle: {
              id: bId,
              caseIds: battleCaseIds,
              slots: selectedSlots,
              teamMode: selectedTeamMode,
              mode: selectedMode,
              host: username,
              hostId: 'user',
              players: [
                { id: 'user', username, color: COLORS[0], avatar: null, items: [], total: 0, opened: false }
              ],
              open: true,
              created: Date.now()
            }
          }
        })
      });
      toast(`⚔️ Case battle room (${roundsCount} rounds) opened!`, 'info');
    } catch (e) {
      toast('Failed to create battle room.', 'lose');
    }
  };

  const handleJoinBattle = async (bId: string) => {
    const b = battles.find(x => x.id === bId);
    if (!b || !b.open) return;

    const firstCaseId = b.caseIds[0];
    const c = allCasesList.find(x => x.id === firstCaseId) || officialCases[0];
    if (!c) {
      toast('Case info missing!', 'lose');
      return;
    }
    
    const totalPrice = c.price * (b.caseIds.length || 1);
    if (balance < totalPrice) {
      toast(`Refused! You need ${formatMoney(totalPrice)} to join.`, 'info');
      return;
    }

    updateBalance(-totalPrice);
    addXP(Math.max(1, Math.floor(totalPrice / 10)));

    const updatedPlayers = [
      ...b.players,
      { id: 'user' + Date.now(), username, color: COLORS[b.players.length], avatar: null, items: [], total: 0, opened: false }
    ];

    const rosterComplete = updatedPlayers.length === b.slots;

    try {
      if (rosterComplete) {
        await executeSynchronousBattleSpin({ ...b, players: updatedPlayers }, updatedPlayers);
      } else {
        await fetch('/api/sync/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join_battle',
            payload: {
              battleId: bId,
              players: updatedPlayers
            }
          })
        });
        toast('⚔️ Successfully joined slot. Waiting for remaining slots to fill.', 'info');
      }
    } catch (e) {
      toast('Failed to join battle.', 'lose');
    }
  };

  const executeSynchronousBattleSpin = async (b: CaseBattle, fullPlayers: any[]) => {
    const caseIds = b.caseIds || [];
    if (caseIds.length === 0) return;
    
    // Results for all rounds
    const roundsWinners: Record<string, CaseItem[]> = {}; // player id -> array of winning items per round
    fullPlayers.forEach(p => roundsWinners[p.id] = []);

    caseIds.forEach(cId => {
      const c = allCasesList.find(x => x.id === cId) || officialCases[0];
      fullPlayers.forEach(p => {
        roundsWinners[p.id].push(rollHypergeometric(c));
      });
    });

    const battleSnapshot: CaseBattle = {
      ...b,
      players: fullPlayers.map(p => {
        const pItems = roundsWinners[p.id];
        const pTotal = pItems.reduce((acc, it) => acc + it.value, 0);
        return {
          ...p,
          items: pItems,
          total: pTotal,
          opened: false
        };
      }),
      open: false,
      ended: Date.now()
    };

    try {
      await fetch('/api/sync/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_battle',
          payload: {
            battleId: b.id,
            battleData: battleSnapshot
          }
        })
      });
    } catch (e) {}

    setActiveScreenBattle(battleSnapshot);

    // Initial preview setup for UI
    const firstCase = allCasesList.find(x => x.id === caseIds[0]) || officialCases[0];
    const lanesMap: Record<string, CaseItem[]> = {};
    fullPlayers.forEach(p => {
      const track: CaseItem[] = [];
      const itemPool = [...firstCase.items];
      for (let i = 0; i < 30; i++) track.push(itemPool[Math.floor(Math.random() * itemPool.length)]);
      track[15] = roundsWinners[p.id][0]; // Show first round in animation
      lanesMap[p.id] = track;
    });

    setLaneRollItems(lanesMap);
    setLaneWinnerIndex(15);
    setBattleRollStage('preview');

    // Write completion to Firestore
    try {
      await updateDoc(doc(db, 'battles', b.id), {
        ...battleSnapshot,
        ended: serverTimestamp(),
        open: false
      });
    } catch (e) {}

    // Calculation for payout
    const totalEntryFee = caseIds.reduce((sum, id) => {
      const c = allCasesList.find(x => x.id === id);
      return sum + (c?.price || 0);
    }, 0);
    const potSize = b.slots * totalEntryFee;

    // Animation wait
    setTimeout(async () => {
      setBattleRollStage('animation');
      
      const cardHeight = 102; // 90px + 12px gap
      const finalOffset = 15 * cardHeight - 80; // centered offset vertically

      let tickProgress = 0;
      const soundInterval = setInterval(() => {
        tickProgress++;
        if (tickProgress < 15) {
          playTickSound();
        } else {
          clearInterval(soundInterval);
        }
      }, 145);

      await laneControls.set({ y: 0 });
      await laneControls.start({
        y: -finalOffset,
        transition: { duration: 3.2, ease: [0.15, 0.75, 0.2, 1] }
      });

      clearInterval(soundInterval);
      setBattleRollStage('completed');

      // Final payout distributions
      // Determine winners based on mode and teamMode
      let winnerIds: string[] = [];
      const players = [...battleSnapshot.players];

      if (b.mode === 'shared') {
        // Shared: everyone splits the pot
        winnerIds = players.map(p => p.id);
      } else if (b.teamMode === '2v2' && players.length === 4) {
        // Team mode 2v2: T1 (P0, P1) vs T2 (P2, P3)
        const t1Total = players[0].total + players[1].total;
        const t2Total = players[2].total + players[3].total;
        if (b.mode === 'crazy') {
          winnerIds = t1Total < t2Total ? [players[0].id, players[1].id] : [players[2].id, players[3].id];
        } else {
          winnerIds = t1Total > t2Total ? [players[0].id, players[1].id] : [players[2].id, players[3].id];
        }
      } else if (b.teamMode === '3v3' && players.length === 6) {
        // Team mode 3v3: T1 (P0,P1,P2) vs T2 (P3,P4,P5)
        const t1Total = players[0].total + players[1].total + players[2].total;
        const t2Total = players[3].total + players[4].total + players[5].total;
        if (b.mode === 'crazy') {
          winnerIds = t1Total < t2Total ? [players[0].id, players[1].id, players[2].id] : [players[3].id, players[4].id, players[5].id];
        } else {
          winnerIds = t1Total > t2Total ? [players[0].id, players[1].id, players[2].id] : [players[3].id, players[4].id, players[5].id];
        }
      } else {
        // Default: 1 Winner (Top or Bottom)
        const sorted = [...players].sort((x, y) => {
          if (b.mode === 'crazy') return x.total - y.total;
          return y.total - x.total;
        });
        winnerIds = [sorted[0].id];
      }

      const userIsWinner = winnerIds.includes(battleSnapshot.players.find(p => p.username === username)?.id || '');
      const sharePayout = potSize / winnerIds.length;

      if (userIsWinner) {
        updateBalance(sharePayout);
        playSound(true);
        toast(`🏆 CASE BATTLE WINNER! You claimed your share of the entry pool: +${formatMoney(sharePayout).replace('$', '🍩 ')}!`, 'win');
      } else {
        playSound(false);
        toast(`💸 Battle ended. Prize pool distributed to winners.`, 'lose');
      }

      setCompleted(prev => [{ ...battleSnapshot, open: false, ended: Date.now() }, ...prev]);
    }, 500);
  };

  const renderMinecraftBlock = (item: CaseItem, caseId: string) => {
    const col = RARITIES[item.rarity]?.color || '#a855f7';
    const name = item.name.toLowerCase();

    let icon = emeraldImg;
    if (name.includes('sword')) {
      icon = (item.rarity === 'Legendary' || item.rarity === 'Mythic' || name.includes('netherite')) ? netheriteSwordImg : diamondSwordImg;
    } else if (name.includes('apple')) {
      icon = godAppleImg;
    } else if (name.includes('totem')) {
      icon = totemImg;
    } else if (name.includes('diamond')) {
      icon = diamondImg;
    } else if (name.includes('emerald')) {
      icon = emeraldImg;
    } else {
      if (item.rarity === 'Legendary' || item.rarity === 'Mythic') icon = godAppleImg;
      else if (item.rarity === 'Epic' || item.rarity === 'Rare') icon = diamondSwordImg;
      else if (item.rarity === 'Uncommon') icon = diamondImg;
      else icon = emeraldImg;
    }

    return (
      <div className="w-10 h-10 flex items-center justify-center relative group">
        <div className="absolute inset-0 opacity-10 blur-md rounded-full" style={{ backgroundColor: col }} />
        <img 
          src={icon} 
          className="w-8 h-8 object-contain transition-transform group-hover:scale-110" 
          alt={item.name}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-1 text-left animate-[fadeIn_0.3s_ease]">
      
      {/* Header & Stats Banner */}
      <div className="p-8 bg-zinc-950 border border-white/5 rounded-[32px] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col text-left relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
               <Swords className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">BATTLES</h2>
          </div>
          <p className="text-sm text-slate-400 font-medium max-w-md leading-relaxed font-sans">
            High stakes PVP case opening showdowns. Compete against others and win the entire prize pool!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 relative z-10">
           <div className="flex flex-col items-end gap-1">
             <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] leading-none">ACTIVE VALUE</span>
             <span className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">
               🌙 {formatMoney(battles.reduce((acc, b) => {
                  const c = allCasesList.find(x => x.id === b.caseId);
                  return acc + ((c?.price || 0) * b.slots);
               }, 0)).replace('$', '')}
             </span>
           </div>

           <div className="flex items-center gap-3">
             <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                  soundEnabled ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-900 border-white/5 text-slate-500'
                }`}
             >
                <Volume2 className="w-5 h-5" />
             </button>
             <button
               onClick={() => setShowCreateModal(true)}
               className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 cursor-pointer"
             >
               <div className="flex items-center gap-2">
                 <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                 <span>Create Battle</span>
               </div>
             </button>
           </div>
        </div>
      </div>

      {/* Main Lobby Area */}
      <div className="flex flex-col gap-10 mt-4">
        {/* Active rooms Matchmaker */}
        <div>
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live Battles</span>
              </div>
              <span className="text-xl font-black text-white uppercase tracking-tight">Active Rooms ({battles.filter(x => x.open).length})</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {battles.map((b) => {
              const firstCaseId = b.caseIds?.[0] || '';
              const c = allCasesList.find(x => x.id === firstCaseId) || officialCases[0];
              const hasJoined = b.players.some(p => p.username === username);
              if (!c) return null;

              return (
                <div 
                  key={b.id} 
                  className="bg-zinc-950/70 border border-white/5 hover:border-indigo-500/30 p-6 rounded-[28px] flex flex-col gap-6 transition-all group relative overflow-hidden backdrop-blur-md"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
                  
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center text-4xl shadow-2xl relative transition-transform group-hover:scale-105 group-hover:-rotate-3">
                         <div className="absolute inset-0 bg-indigo-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        {getCaseEmoji(firstCaseId)}
                      </div>
                      <div className="text-left">
                        <span className="text-lg font-black text-white block uppercase tracking-tighter leading-none mb-1.5">{c.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${b.mode === 'classic' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {b.mode === 'classic' ? 'Classic' : 'Crazy'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-widest">{b.players.length}/{b.slots} Players · {b.caseIds?.length || 1}R</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-0.5">Prize</span>
                       <span className="text-lg font-black text-emerald-400 font-mono tracking-tighter leading-none">🌙 {formatMoney(c.price * b.slots * (b.caseIds?.length || 1)).replace('$', '')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {Array(b.slots).fill(null).map((_, i) => {
                      const p = b.players[i];
                      return (
                        <div key={i} className="flex flex-col items-center gap-2 p-3 bg-black/30 rounded-2xl border border-white/5 relative overflow-hidden group/slot transition-all hover:bg-black/40">
                          {p ? (
                            <>
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg relative z-10 ring-2 ring-white/5" style={{ backgroundColor: p.color }}>
                                {p.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[9px] font-black text-white/50 truncate w-full text-center tracking-tight relative z-10 px-1">@{p.username}</span>
                              <div className="absolute inset-0 opacity-0 group-hover/slot:opacity-20 transition-opacity" style={{ backgroundColor: p.color }} />
                            </>
                          ) : (
                            <>
                              <div className="w-9 h-9 rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center relative z-10 animate-pulse">
                                <Users className="w-4 h-4 text-slate-800" />
                              </div>
                              <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest relative z-10">...</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 mt-auto relative z-10">
                    {b.open && b.host === username && b.players.length < b.slots && (
                      <button
                        onClick={() => {
                          toast('Bots have been disabled on the site.', 'info');
                        }}
                        className="flex-1 py-4 bg-zinc-900 border border-white/5 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
                      >
                         🤖 Bots Disabled
                      </button>
                    )}
                    
                    {hasJoined ? (
                      <button
                         onClick={() => {
                           setActiveScreenBattle(b);
                           setBattleRollStage('preview');
                         }}
                         className="flex-[2] py-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-black text-xs uppercase tracking-widest rounded-2xl text-center border border-indigo-500/20 transition-all shadow-inner cursor-pointer"
                      >
                        View Battle GUI
                      </button>
                    ) : b.open ? (
                      <button
                        onClick={() => handleJoinBattle(b.id)}
                        className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 border-b-4 border-indigo-700 cursor-pointer"
                      >
                        Join Room
                      </button>
                    ) : (
                      <button
                         onClick={() => {
                           setActiveScreenBattle(b);
                           setBattleRollStage('completed');
                         }}
                         className="flex-[2] py-4 bg-zinc-900 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl text-center border border-white/5 cursor-pointer"
                      >
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {battles.length === 0 && (
              <div className="col-span-full py-20 bg-zinc-950/50 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-4 text-center">
                 <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5">
                   <Users className="w-8 h-8 text-slate-700" />
                 </div>
                 <div className="flex flex-col gap-1">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">No Active Battles</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Be the first to create a showdown arena</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Historic Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6 px-1 border-b border-white/5 pb-4">
            <span className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Recent Glory
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map((b) => {
              const firstCaseId = b.caseIds?.[0] || '';
              const c = allCasesList.find(x => x.id === firstCaseId) || officialCases[0];
              if (!c) return null;
              const champion = [...b.players].sort((x, y) => {
                if (b.mode === 'crazy') return x.total - y.total;
                return y.total - x.total;
              })[0];

              return (
                <div 
                  key={b.id} 
                  className="bg-zinc-900/40 border border-white/5 px-6 py-5 rounded-3xl flex items-center justify-between gap-4 grayscale group hover:grayscale-0 transition-all opacity-60 hover:opacity-100 hover:bg-zinc-900/60"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-3xl border border-white/5 shadow-2xl transition-transform group-hover:scale-110">
                      {getCaseEmoji(firstCaseId)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white uppercase tracking-tight">{c.name} Battle</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">
                        {b.mode === 'classic' ? 'Classic' : 'Crazy'} · {b.slots}P · {b.caseIds?.length || 1}R
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                       <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Champion</span>
                       <div className="flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] text-white shadow-sm" style={{ backgroundColor: champion?.color || '#a855f7' }}>
                            {champion?.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-black text-white truncate max-w-[80px]">{champion?.username}</span>
                          <span className="text-xs font-black text-emerald-400 ml-1 font-mono tracking-tighter">🌙 {formatMoney(champion?.total || 0).replace('$', '')}</span>
                       </div>
                    </div>

                    <button 
                      onClick={() => {
                          setActiveScreenBattle(b);
                          setBattleRollStage('completed');
                      }}
                      className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-zinc-900 transition-all border border-white/5 active:scale-95 cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Battle Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-white/10 rounded-[32px] w-full max-w-lg p-8 relative flex flex-col gap-6 shadow-2xl animate-[popIn_0.3s_ease]">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
               ✕
            </button>

            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Create Battle</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Setup your PVP arena</p>
            </div>

            <div className="flex flex-col gap-5 mt-2">
               <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Choose Case</label>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {allCasesList.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCaseIds([c.id])}
                        className={`p-3 rounded-xl border-2 transition-all text-left flex flex-col gap-1 
                          ${selectedCaseIds[0] === c.id 
                            ? 'border-indigo-500 bg-indigo-500/10' 
                            : 'bg-zinc-900 border-white/5 hover:border-white/10'}`}
                      >
                        <span className="text-[10px] font-bold text-white truncate">{c.name}</span>
                        <span className="text-[9px] font-black text-indigo-400">🌙 {formatMoney(c.price).replace('$', '')}</span>
                      </button>
                    ))}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Slots / Teams</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '1v1', slots: 2, team: 'none' },
                        { label: '1v1v1', slots: 3, team: 'none' },
                        { label: '1v1v1v1', slots: 4, team: 'none' },
                        { label: '2v2', slots: 4, team: '2v2' },
                        { label: '1x6', slots: 6, team: 'none' },
                        { label: '3v3', slots: 6, team: '3v3' }
                      ].map(cfg => (
                        <button
                          key={cfg.label}
                          onClick={() => {
                            setSelectedSlots(cfg.slots);
                            setSelectedTeamMode(cfg.team as any);
                          }}
                          className={`py-2 rounded-xl border-2 font-black text-[10px] transition-all
                            ${selectedSlots === cfg.slots && selectedTeamMode === cfg.team
                              ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                              : 'bg-zinc-900 border-white/5 text-slate-400 hover:bg-zinc-800'}`}
                        >
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Game Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['classic', 'crazy', 'jackpot', 'shared'].map(m => (
                        <button
                          key={m}
                          onClick={() => setSelectedMode(m as any)}
                          className={`py-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all
                            ${selectedMode === m 
                              ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                              : 'bg-zinc-900 border-white/5 text-slate-400 hover:bg-zinc-800'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
               </div>
            </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Rounds (Cases)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 5, 10, 20, 30].map(r => (
                      <button
                        key={r}
                        onClick={() => setRoundsCount(r)}
                        className={`py-2 rounded-xl border-2 font-black text-[10px] transition-all
                          ${roundsCount === r 
                            ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                            : 'bg-zinc-900 border-white/5 text-slate-400 hover:bg-zinc-800'}`}
                      >
                        {r} Rounds
                      </button>
                    ))}
                  </div>
                </div>

               <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex justify-between items-center mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Entry Fee</span>
                    <span className="text-lg font-black text-white font-mono tracking-tighter">🌙 {formatMoney((allCasesList.find(x => x.id === (selectedCaseIds[0] || ''))?.price || 0) * roundsCount).replace('$', '')}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleCreateBattle();
                      setShowCreateModal(false);
                    }}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
                  >
                    Confirm & Host
                  </button>
               </div>
            </div>
          </div>
      )}

      {/* COMPREHENSIVE MULTI-LANE ROLL ARENA MODAL */}
      {activeScreenBattle && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-3xl overflow-y-auto">
          <div className="bg-zinc-950 border-2 border-white/10 rounded-[36px] w-full max-w-4xl p-8 relative flex flex-col gap-6 shadow-2xl my-4 text-left">
            
            <button
              onClick={() => setActiveScreenBattle(null)}
              className="absolute top-6 right-6 bg-zinc-900 border border-white/10 hover:bg-zinc-800 hover:text-white rounded-xl w-10 h-10 flex items-center justify-center text-slate-400 transition-all font-bold text-xs"
              disabled={battleRollStage === 'animation'}
            >
              ✕
            </button>

            <div className="text-center">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono">LunarSpin Live Battle Arena</span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">Battle Arena: Minecraft Case Battle</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium font-mono leading-none">
                BATTLE ID: {activeScreenBattle.id} · CRATE: {allCasesList.find(x => x.id === (activeScreenBattle.caseIds?.[0] || ''))?.name} · ROUNDS: {activeScreenBattle.caseIds?.length}
              </p>
            </div>

            {/* PREVIEW / WAITING STAGE */}
            {battleRollStage === 'preview' && (
              <div className="flex flex-col gap-8 py-10 items-center justify-center animate-[fadeIn_0.5s_ease]">
                <div className="flex -space-x-4">
                  {activeScreenBattle.players.map((p, i) => (
                    <div 
                      key={p.id} 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white border-2 border-zinc-950 shadow-2xl relative"
                      style={{ backgroundColor: p.color, zIndex: 10 - i }}
                    >
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {Array.from({ length: activeScreenBattle.slots - activeScreenBattle.players.length }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-16 h-16 rounded-2xl bg-zinc-900 border-2 border-white/5 border-dashed flex items-center justify-center text-slate-800"
                    >
                      ?
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 text-center max-w-sm">
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">
                    {activeScreenBattle.players.length}/{activeScreenBattle.slots} Players Ready
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    Waiting for the duel to commence. Once all slots are filled, the synchronized unboxing sequence will trigger automatically.
                  </p>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-xs">
                  {activeScreenBattle.players.length < activeScreenBattle.slots && activeScreenBattle.host === username && (
                    <button
                      onClick={() => {
                        toast('Bots have been disabled.', 'info');
                      }}
                      className="w-full py-4 bg-zinc-900 border border-white/5 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      🤖 Bots Disabled
                    </button>
                  )}
                  {activeScreenBattle.players.length < activeScreenBattle.slots && activeScreenBattle.host !== username && (
                    <div className="py-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Waiting for host or players...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Parallel sliding lanes viewport for live battles */}
            {battleRollStage === 'animation' && (
              <div className="flex flex-col gap-6">
                <div className={`grid gap-4 ${
                  activeScreenBattle.slots === 2 ? 'grid-cols-1 md:grid-cols-2' :
                  activeScreenBattle.slots === 4 ? 'grid-cols-2 lg:grid-cols-4' :
                  activeScreenBattle.slots === 6 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'
                }`}>
                  {activeScreenBattle.players.map((p, idx) => (
                    <div key={p.id} className="bg-zinc-900/60 p-4 rounded-[28px] border border-white/5 flex flex-col gap-4 overflow-hidden relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white" style={{ backgroundColor: p.color }}>
                             {p.username.charAt(0).toUpperCase()}
                           </div>
                           <span className="text-xs font-black text-white uppercase truncate">{p.username}</span>
                        </div>
                        {activeScreenBattle.teamMode !== 'none' && (
                          <span className="text-[10px] font-black text-slate-500 uppercase">
                            Team {idx < activeScreenBattle.slots / 2 ? 'A' : 'B'}
                          </span>
                        )}
                      </div>

                      {/* Sliding window vertically styled */}
                      <div className="bg-black/40 border border-white/5 rounded-2xl h-48 overflow-hidden relative group">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-purple-500 z-20 shadow-[0_0_15px_#a855f7]" />
                        
                        <div className="h-full flex items-center justify-center relative">
                          <motion.div
                            animate={laneControls}
                            className="flex flex-col gap-3 absolute top-0"
                            style={{ x: 0 }}
                          >
                            {(laneRollItems[p.id] || []).map((it, idx) => {
                              const col = RARITIES[it.rarity]?.color || '#a855f7';
                              return (
                                <div
                                  key={idx}
                                  className="w-[120px] h-[90px] rounded-xl bg-zinc-900/80 border border-white/5 p-3 flex flex-col justify-center items-center flex-shrink-0 select-none gap-1 transition-all"
                                  style={{ borderColor: idx === 15 ? col : 'transparent' }}
                                >
                                  {renderMinecraftBlock(it, activeScreenBattle.caseIds?.[0] || '')}
                                  <span className="truncate w-full text-center font-black text-white text-[9px] uppercase mt-1">{it.name}</span>
                                </div>
                              );
                            })}
                          </motion.div>
                        </div>
                      </div>

                      {/* Value predictor */}
                      <div className="bg-black/60 rounded-xl p-3 border border-white/5 text-center">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Battle Total</span>
                         <span className="text-sm font-black text-white font-mono">🌙 {formatMoney(p.total).replace('$', '')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results distribution summary panel */}
            {battleRollStage === 'completed' && (
              <div className={`grid gap-4 items-stretch font-sans ${
                activeScreenBattle.slots === 2 ? 'grid-cols-1 md:grid-cols-2' :
                activeScreenBattle.slots === 4 ? 'grid-cols-2 lg:grid-cols-4' :
                activeScreenBattle.slots === 6 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
              }`}>
                {activeScreenBattle.players.map((p, idx) => {
                  const entryPrice = allCasesList.find(x => x.id === (activeScreenBattle.caseIds?.[0] || ''))?.price || 0;
                  const potTotal = activeScreenBattle.slots * entryPrice * (activeScreenBattle.caseIds?.length || 1);
                  
                  // Simple winner check for UI display
                  let isChampion = false;
                  if (activeScreenBattle.mode === 'shared') {
                    isChampion = true;
                  } else if (activeScreenBattle.teamMode === '2v2') {
                    const t1Total = activeScreenBattle.players[0].total + activeScreenBattle.players[1].total;
                    const t2Total = activeScreenBattle.players[2].total + activeScreenBattle.players[3].total;
                    const winnerTeam = t1Total > t2Total ? 'A' : 'B';
                    isChampion = (idx < 2 && winnerTeam === 'A') || (idx >= 2 && winnerTeam === 'B');
                  } else if (activeScreenBattle.teamMode === '3v3') {
                    const t1Total = activeScreenBattle.players[0].total + activeScreenBattle.players[1].total + activeScreenBattle.players[2].total;
                    const t2Total = activeScreenBattle.players[3].total + activeScreenBattle.players[4].total + activeScreenBattle.players[5].total;
                    const winnerTeam = t1Total > t2Total ? 'A' : 'B';
                    isChampion = (idx < 3 && winnerTeam === 'A') || (idx >= 3 && winnerTeam === 'B');
                  } else {
                    const maxTotal = Math.max(...activeScreenBattle.players.map(x => x.total));
                    const minTotal = Math.min(...activeScreenBattle.players.map(x => x.total));
                    isChampion = activeScreenBattle.mode === 'crazy' ? p.total === minTotal : p.total === maxTotal;
                  }
                  
                  return (
                    <div
                      key={idx}
                      className={`p-6 rounded-3xl border flex flex-col gap-4 relative overflow-hidden transition-all
                        ${isChampion ? 'bg-purple-950/10 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.06)]' : 'bg-zinc-900/40 border-white/5'}`}
                    >
                      {/* Champion Crown or Shared tag */}
                      {isChampion && (
                        <div className="absolute top-3 right-3 flex items-center justify-center bg-purple-500 text-white rounded-xl px-2 h-8 rotate-6 border border-purple-300 shadow-md">
                           <span className="text-[10px] font-black uppercase">{activeScreenBattle.mode === 'shared' ? 'Shared' : 'Win'}</span>
                           <Crown className="w-3 h-3 ml-1" />
                        </div>
                      )}

                      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs text-white" style={{ backgroundColor: p.color }}>
                          {p.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-black text-white">{p.username}</span>
                          <span className="text-[9px] text-slate-500 tracking-wider font-extrabold uppercase font-mono mt-0.5">Player Seed Rank</span>
                        </div>
                      </div>

                      {/* Unboxed items list */}
                      <div className="flex flex-col gap-2 pr-1 max-h-40 overflow-y-auto custom-scrollbar">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Unboxed Items ({p.items?.length}):</span>
                        {p.items?.map((it, i) => (
                          <div key={i} className="flex justify-between items-center bg-zinc-950/90 p-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                            <div className="flex items-center gap-2">
                              {renderMinecraftBlock(it, activeScreenBattle.caseIds?.[0] || '')}
                              <span className="text-[10px] font-bold text-white max-w-[120px] truncate leading-none block">{it.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 font-mono">🌙{formatMoney(it.value).replace('$', '')}</span>
                          </div>
                        ))}
                      </div>

                      {/* Cumulative stats */}
                      <div className="border-t border-white/5 pt-3 mt-auto flex justify-between items-baseline font-mono">
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Aggregate Value:</span>
                        <span className={`text-lg font-black ${isChampion ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'text-slate-300'}`}>
                          🌙 {formatMoney(p.total).replace('$', '')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setActiveScreenBattle(null)}
              className="w-full py-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-widest cursor-pointer mt-2 leading-none"
              disabled={battleRollStage === 'animation'}
            >
              Dismiss View Summary
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
