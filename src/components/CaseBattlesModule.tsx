import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Coins, ShieldAlert, Swords, Users, Play, Trophy } from 'lucide-react';
import { CASES, MOCK_BOTS, RARITIES, formatMoney } from '../data';
import { Case, CaseItem, CaseBattle } from '../types';

interface CaseBattlesModuleProps {
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
  username: string;
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#fbbf24', '#f43f5e', '#a855f7'];

export default function CaseBattlesModule({
  balance,
  updateBalance,
  addXP,
  toast,
  playSound,
  username
}: CaseBattlesModuleProps) {
  const [battles, setBattles] = useState<CaseBattle[]>([]);
  const [completed, setCompleted] = useState<CaseBattle[]>([]);
  
  const [selectedCaseId, setSelectedCaseId] = useState<string>(CASES[0].id);
  const [selectedSlots, setSelectedSlots] = useState<number>(2);
  const [selectedMode, setSelectedMode] = useState<'classic' | 'jackpot' | 'crazy'>('classic');

  const [activeScreenBattle, setActiveScreenBattle] = useState<CaseBattle | null>(null);

  // Periodic polling disables simulated active background bots
  useEffect(() => {
    // Generate some initial mock completed battles
    const mockCompleted: CaseBattle[] = Array(3).fill(null).map((_, idx) => {
      const c = CASES[idx % CASES.length];
      const bot1 = MOCK_BOTS[idx % MOCK_BOTS.length];
      const bot2 = MOCK_BOTS[(idx + 1) % MOCK_BOTS.length];
      return {
        id: `b_past_${idx}`,
        caseId: c.id,
        slots: 2,
        mode: 'classic',
        host: bot1.username,
        hostId: 'bot1',
        players: [
          { id: '1', username: bot1.username, color: COLORS[0], avatar: null, items: [{ name: c.items[0].name, rarity: c.items[0].rarity, value: c.items[0].value }], total: c.items[0].value, opened: true },
          { id: '2', username: bot2.username, color: COLORS[1], avatar: null, items: [{ name: c.items[1].name, rarity: c.items[1].rarity, value: c.items[1].value }], total: c.items[1].value, opened: true }
        ],
        open: false,
        ended: Date.now() - 3000 * (idx + 1),
        created: Date.now() - 30000
      };
    });
    setCompleted(mockCompleted);

    // No background interval spawning bots or joining automatically
  }, []);

  const triggerRolloutSim = (cId: string, currentPlayers: any[]) => {
    const c = CASES.find(x => x.id === cId) || CASES[0];
    return currentPlayers.map(p => {
      // Roll 3 distinct items
      const itemsDealt = [];
      let total = 0;
      for (let i = 0; i < 3; i++) {
        const item = rollHypergeometric(c);
        itemsDealt.push({ name: item.name, rarity: item.rarity, value: item.value });
        total += item.value;
      }
      return { ...p, items: itemsDealt, total, opened: true };
    });
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

  const handleCreateBattle = () => {
    const c = CASES.find(x => x.id === selectedCaseId)!;
    if (balance < c.price) {
      toast(`Need ${formatMoney(c.price)} 🍩 to host this battle!`, 'lose');
      return;
    }

    updateBalance(-c.price);
    addXP(Math.max(1, Math.floor(c.price / 10)));

    const newBattle: CaseBattle = {
      id: `b_user_${Date.now()}`,
      caseId: selectedCaseId,
      slots: selectedSlots,
      mode: selectedMode,
      host: username,
      hostId: 'user',
      players: [
        { id: 'user', username, color: COLORS[0], avatar: null, items: [], total: 0, opened: false }
      ],
      open: true,
      created: Date.now()
    };

    setBattles(prev => [newBattle, ...prev]);
    toast('⚔️ Case battle hosted! Waiting for other players or bots to join.', 'info');
  };

  const handleJoinBattle = (bId: string) => {
    const b = battles.find(x => x.id === bId);
    if (!b || !b.open) return;

    const c = CASES.find(x => x.id === b.caseId)!;
    if (balance < c.price) {
      toast(`Need ${formatMoney(c.price)} 🍩 to join!`, 'lose');
      return;
    }

    // Spend supplementary donuts entry price
    updateBalance(-c.price);
    addXP(Math.max(1, Math.floor(c.price / 10)));

    const updatedPlayers = [
      ...b.players,
      { id: 'user', username, color: COLORS[b.players.length], avatar: null, items: [], total: 0, opened: false }
    ];

    const rosterComplete = updatedPlayers.length === b.slots;

    if (rosterComplete) {
      // Execute live roll
      const rolledMap = triggerRolloutSim(b.caseId, updatedPlayers);
      
      // Calculate winner
      const potSize = b.slots * c.price;
      const winners = [...rolledMap].sort((x, y) => y.total - x.total);
      const champion = winners[0];

      if (champion.id === 'user') {
        // Winner gets the pot payout!
        updateBalance(potSize);
        playSound(true);
        toast(`🏆 CASE BATTLE WINNER! You took the entire ${potSize} donuts pot!`, 'win');
      } else {
        playSound(false);
        toast(`💸 ${champion.username} won the Battle Pot of ${potSize} donuts`, 'lose');
      }

      const activeFinishedBattle = { ...b, players: rolledMap, open: false, ended: Date.now() };
      setActiveScreenBattle(activeFinishedBattle);
      setCompleted(prev => [activeFinishedBattle, ...prev]);
      setBattles(prev => prev.filter(x => x.id !== bId));
    } else {
      setBattles(prev => prev.map(x => x.id === bId ? { ...x, players: updatedPlayers } : x));
      toast('⚔️ Successfully joined. Waiting for final slots to be filled.', 'win');
    }
  };

  const handleFillSlots = (bId: string) => {
    const b = battles.find(x => x.id === bId);
    if (!b || !b.open) return;

    const c = CASES.find(x => x.id === b.caseId)!;

    // Fill remaining slots with nice offline member personas
    const shuffledMembers = [...MOCK_BOTS].sort(() => Math.random() - 0.5);
    const updatedPlayers = [...b.players];
    while (updatedPlayers.length < b.slots) {
      const nextBot = shuffledMembers[updatedPlayers.length % shuffledMembers.length];
      if (!updatedPlayers.some(p => p.username === nextBot.username)) {
        updatedPlayers.push({
          id: `offline_${Date.now()}_${updatedPlayers.length}`,
          username: nextBot.username,
          color: COLORS[updatedPlayers.length],
          avatar: null,
          items: [],
          total: 0,
          opened: false
        });
      }
    }

    // Roll items
    const rolledMap = triggerRolloutSim(b.caseId, updatedPlayers);
    
    // Calculate winner
    const potSize = b.slots * c.price;
    const winners = [...rolledMap].sort((x, y) => y.total - x.total);
    const champion = winners[0];

    if (champion.id === 'user') {
      updateBalance(potSize);
      playSound(true);
      toast(`🏆 CASE BATTLE WINNER! You took the entire ${formatMoney(potSize)} donuts pot!`, 'win');
    } else {
      playSound(false);
      toast(`💸 ${champion.username} won the Battle Pot of ${formatMoney(potSize)} donuts`, 'lose');
    }

    const activeFinishedBattle = { ...b, players: rolledMap, open: false, ended: Date.now() };
    setActiveScreenBattle(activeFinishedBattle);
    setCompleted(prev => [activeFinishedBattle, ...prev]);
    setBattles(prev => prev.filter(x => x.id !== bId));
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      
      {/* Create Battle Form */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
        <span className="text-md font-extrabold text-white block mb-4 flex items-center gap-2">
          <Swords className="w-5 h-5 text-purple-400" /> Host Custom Case Battle
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          {/* Select Case */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase mb-2">Select Case</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none cursor-pointer"
            >
              {CASES.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({formatMoney(c.price)} 🍩)</option>
              ))}
            </select>
          </div>

          {/* Select slots */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase mb-2">Player Slots</span>
            <select
              value={selectedSlots}
              onChange={(e) => setSelectedSlots(parseInt(e.target.value))}
              className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none cursor-pointer"
            >
              <option value="2">2 Players</option>
              <option value="3">3 Players</option>
              <option value="4">4 Players</option>
            </select>
          </div>

          {/* Select mode */}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase mb-2">Payout Mode</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as 'classic' | 'jackpot' | 'crazy')}
              className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none cursor-pointer"
            >
              <option value="classic">🏆 Classic (Winner takes all)</option>
              <option value="jackpot">🎰 Jackpot (Weighted chances)</option>
              <option value="crazy">🎲 Crazy (Multiplier madness)</option>
            </select>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateBattle}
            className="py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow shadow-purple-500/25 transition-all h-[42px]"
          >
            Create Battle
          </button>
        </div>
      </div>

      {/* Roster of Active / Completed Battles */}
      <div className="flex flex-col gap-4">
        {/* Active list */}
        <div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">
            🔴 Active Room Battles ({battles.filter(x => x.open).length})
          </span>
          <div className="flex flex-col gap-3">
            {battles.map((b) => {
              const c = CASES.find(x => x.id === b.caseId)!;
              const hasJoined = b.players.some(p => p.username === username);

              return (
                <div key={b.id} className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-xl">
                      ⚔️
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-white block">{c.name} Battle</span>
                      <span className="text-[10px] text-slate-500 font-semibold block capitalize mt-0.5">
                        {b.mode} · {b.players.length}/{b.slots} Slots taken
                      </span>
                    </div>
                  </div>

                  {/* Joined users roster list of small pills */}
                  <div className="flex flex-wrap gap-1.5 self-center">
                    {b.players.map((p, idx) => (
                      <span
                        key={idx}
                        className="py-1 px-3 bg-purple-500/10 border border-purple-500/25 rounded-lg text-[9px] font-black uppercase text-purple-300"
                        style={{ color: p.color, borderColor: `${p.color}40`, backgroundColor: `${p.color}10` }}
                      >
                        {p.username}
                      </span>
                    ))}
                    {Array(b.slots - b.players.length).fill(null).map((_, i) => (
                      <span key={i} className="py-1 px-3 bg-slate-950 border border-dotted border-white/5 rounded-lg text-[9px] font-bold text-slate-600 block">
                        Open Slot
                      </span>
                    ))}
                  </div>

                  {b.hostId === 'user' && b.open ? (
                    <button
                      onClick={() => handleFillSlots(b.id)}
                      className="py-2.5 px-6 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/10 cursor-pointer"
                    >
                      Fill Slots & Start
                    </button>
                  ) : (
                    <button
                      disabled={hasJoined || !b.open}
                      onClick={() => handleJoinBattle(b.id)}
                      className="py-2.5 px-6 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl border border-white/10"
                    >
                      {hasJoined ? 'Joined Roster' : `Join (${formatMoney(c.price)} 🍩)`}
                    </button>
                  )}
                </div>
              );
            })}
            {battles.length === 0 && (
              <div className="text-center text-slate-600 font-bold p-8 text-xs border-2 border-dashed border-white/5 rounded-xl">
                No active battles. Host one above to draw in bot players!
              </div>
            )}
          </div>
        </div>

        {/* Recent finished logged list */}
        <div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
            ✅ Recent Completed Battles ({completed.length})
          </span>
          <div className="flex flex-col gap-2">
            {completed.map((b) => {
              const c = CASES.find(x => x.id === b.caseId)!;
              const champion = [...b.players].sort((x, y) => y.total - x.total)[0];

              return (
                <div key={b.id} className="bg-slate-900/25 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-4 select-none">
                  <div className="flex items-center gap-3">
                    <span className="text-md">📦</span>
                    <span className="text-xs font-semibold text-slate-400">
                      {c.name} Battle won by{' '}
                      <span className="font-extrabold text-white" style={{ color: champion.color }}>
                        {champion.username}
                      </span>{' '}
                      ({champion.total} pts)
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveScreenBattle(b)}
                    className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[9px] rounded-lg border border-white/5 uppercase"
                  >
                    👁️ View Cards
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card viewing Modal Overlay */}
      {activeScreenBattle && (
        <div className="fixed inset-0 bg-slate-950/95 z-[60] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl p-6 relative flex flex-col gap-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <button
              onClick={() => setActiveScreenBattle(null)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center text-slate-400 transition-all font-bold"
            >
              ✕
            </button>

            <div className="text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Battle logs</span>
              <span className="text-xl font-black text-white">Cards distribution results</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeScreenBattle.players.map((p, idx) => {
                const isChampion = p.total === Math.max(...activeScreenBattle.players.map(x => x.total));
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden
                      ${isChampion ? 'bg-amber-400/5 border-amber-400/30' : 'bg-slate-950 border-white/5'}`}
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="font-black text-xs uppercase" style={{ color: p.color }}>
                        {isChampion ? '🏆 CHAMPION' : '⚔️ RUNNER UP'}
                      </span>
                      <span className="text-sm font-extrabold text-white">{p.username}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {p.items?.map((it, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 truncate w-32">{it.name}</span>
                          <span className="font-extrabold text-slate-300">{formatMoney(it.value)} 🍩</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/5 pt-2 mt-auto flex justify-between font-bold text-xs text-slate-400">
                      <span>Total Value:</span>
                      <span className={isChampion ? 'text-amber-400 font-extrabold' : 'text-white'}>
                        {formatMoney(p.total)} 🍩
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveScreenBattle(null)}
              className="w-full py-3 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-extrabold rounded-xl transition-all text-xs uppercase tracking-wider"
            >
              Dismiss View
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
