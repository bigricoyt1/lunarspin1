import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Coins, Package, Award, Sparkles, Check, CheckSquare, Flame, HelpCircle, Trophy, Crown, ArrowDown, ChevronRight, Volume2, Calendar } from 'lucide-react';
import { RARITIES, formatMoney } from '../data';
import { Case, CaseItem, User } from '../types';
import { 
  db,
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from '../lib/firebase';
import { Trash2 } from 'lucide-react';

const emeraldImg = 'https://minecraft.wiki/images/Emerald_JE3_BE3.png';
const diamondImg = 'https://minecraft.wiki/images/Diamond_JE3_BE3.png';
const diamondSwordImg = 'https://minecraft.wiki/images/Diamond_Sword_JE3_BE3.png';
const netheriteSwordImg = 'https://minecraft.wiki/images/Netherite_Sword_JE1_BE1.png';
const godAppleImg = 'https://minecraft.wiki/images/Enchanted_Golden_Apple_JE2_BE2.png';
const totemImg = 'https://minecraft.wiki/images/Totem_of_Undying_JE2_BE2.png';

const MinecraftChest = ({ color = '#8B4513', className = "" }: { color?: string; className?: string }) => (
  <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
    {/* Simple Minecraft Chest SVG representation */}
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
      {/* Base */}
      <rect x="4" y="16" width="56" height="40" fill={color} stroke="black" strokeWidth="2"/>
      {/* Lid line */}
      <rect x="4" y="28" width="56" height="4" fill="black" fillOpacity="0.3"/>
      {/* Latch */}
      <rect x="28" y="24" width="8" height="12" fill="#EAB308" stroke="black" strokeWidth="1"/>
      {/* Details */}
      <rect x="8" y="20" width="4" height="4" fill="white" fillOpacity="0.1"/>
      <rect x="52" y="48" width="4" height="4" fill="black" fillOpacity="0.1"/>
    </svg>
  </div>
);

interface CasesModuleProps {
  user: User | null;
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
  communityCases: Case[];
  officialCases: Case[];
}

export default function CasesModule({
  user,
  balance,
  updateBalance,
  addXP,
  toast,
  playSound,
  communityCases,
  officialCases
}: CasesModuleProps) {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [opening, setOpening] = useState<boolean>(false);
  const [openingQuantity, setOpeningQuantity] = useState<number>(1);
  const [rolledItems, setRolledItems] = useState<CaseItem[][]>([]); // Array of arrays for multiple openings
  const [winningItems, setWinningItems] = useState<CaseItem[]>([]);
  const [stage, setStage] = useState<'idle' | 'spinning' | 'reveal'>('idle');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  const [activeTab, setActiveTab] = useState<'regular' | 'community'>('regular');

  // Custom case creator form states
  const [showCreator, setShowCreator] = useState<boolean>(false);
  const [newCaseName, setNewCaseName] = useState<string>('');
  const [newCasePrice, setNewCasePrice] = useState<number>(20000);
  const [newCaseDesc, setNewCaseDesc] = useState<string>('Custom community collection!');
  const [newCaseIcon, setNewCaseIcon] = useState<string>('📦');
  const [newCaseColor, setNewCaseColor] = useState<string>('#a855f7');

  // Item states for custom case
  const [newItems, setNewItems] = useState<{name: string, value: number, percent: number, rarity: string}[]>([
    { name: 'Emerald Gem', value: 2000, percent: 50, rarity: 'Common' },
    { name: 'Diamond Ore', value: 8000, percent: 30, rarity: 'Uncommon' },
    { name: 'Diamond Sword', value: 25050, percent: 15, rarity: 'Rare' },
    { name: 'Enchanted Golden Apple', value: 120000, percent: 5, rarity: 'Legendary' }
  ]);

  useEffect(() => {
    // No longer needed as we get communityCases prop from App.tsx
  }, []);

  const getChanceSum = () => {
    return newItems.reduce((acc, curr) => acc + curr.percent, 0);
  };

  const calculateCasePrice = () => {
    const ev = newItems.reduce((acc, curr) => acc + (curr.value * (curr.percent / 100)), 0);
    // Add a standard 5% house edge so it's a "real" casino case
    return Math.ceil(ev * 1.05);
  };

  const handleAddItemRow = () => {
    setNewItems([...newItems, { name: 'Custom Cosmetic Item', value: 5000, percent: 10, rarity: 'Common' }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setNewItems(newItems.filter((_, i) => i !== idx));
  };

  const handleEditItemField = (idx: number, field: string, val: any) => {
    const updated = [...newItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setNewItems(updated);
  };

  const handlePublishCase = async () => {
    const name = newCaseName.trim();
    if (!name) {
      toast('Please enter a case name!', 'info');
      return;
    }
    const sum = getChanceSum();
    if (Math.abs(100 - sum) > 0.0001) {
      toast(`Validation error: Total chance sum must equal exactly 100.00% (currently ${sum.toFixed(2)}%)`, 'info');
      return;
    }
    if (newItems.length === 0) {
      toast('Your custom case needs at least 1 item!', 'info');
      return;
    }

    const price = calculateCasePrice();
    
    // Create new published Case object
    const createdCase = {
      name: name,
      price: price,
      desc: newCaseDesc.trim() || 'A custom community unboxing mystery collection.',
      icon: 'chest',
      color: newCaseColor,
      creator: user ? user.username : 'SpinnerLucky',
      creatorId: user ? user.id : 'unknown',
      createdAt: serverTimestamp(),
      items: newItems.map((it, idx) => ({
        id: `ct_ci_${idx}_${Date.now()}`,
        name: it.name.trim() || 'Cosmetic Item',
        value: it.value,
        percent: it.percent,
        rarity: it.rarity as any
      }))
    };

    try {
      await addDoc(collection(db, 'cases'), createdCase);
      
      // Reset inputs
      setNewCaseName('');
      setNewCasePrice(20000);
      setNewCaseDesc('Custom community collection!');
      setNewItems([
        { name: 'Common Ingot', value: 2000, percent: 50, rarity: 'Common' },
        { name: 'Uncommon Charm', value: 8000, percent: 30, rarity: 'Uncommon' },
        { name: 'Rare Blade', value: 25050, percent: 15, rarity: 'Rare' },
        { name: 'Legendary Beacon', value: 120000, percent: 5, rarity: 'Legendary' }
      ]);
      setShowCreator(false);
      toast(`🎨 Successfully published case "${name}" with 0.6% operator royalties active!`, 'info');
    } catch (err) {
      console.error('Failed to publish case:', err);
      toast('Failed to publish case. Please try again.', 'lose');
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!window.confirm('Delete this community case forever?')) return;
    try {
      await deleteDoc(doc(db, 'cases', id));
      toast('Case deleted successfully!', 'info');
    } catch (err) {
      toast('Failed to delete case.', 'lose');
    }
  };

  const reelControls = useAnimation();
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play mechanical tick sound using browser audio synthesis for high-performance physics ticks
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
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

  const renderItemVisual = (item: CaseItem, caseId: string) => {
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
      <div className="relative w-16 h-16 flex items-center justify-center group">
        <div 
          className="absolute inset-x-0 inset-y-0 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" 
          style={{ backgroundColor: col }}
        />
        <img 
          src={icon} 
          className="w-12 h-12 object-contain relative z-10 transition-transform group-hover:scale-110" 
          alt={item.name}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  };

  const handleOpenCase = async (c: Case) => {
    if (opening) return;
    const totalCost = c.price * openingQuantity;
    if (balance < totalCost) {
      toast(`Insufficient money! Opening ${openingQuantity} cases costs ${formatMoney(totalCost)}`, 'info');
      return;
    }

    setOpening(true);
    setStage('spinning');
    setWinningItems([]);
    updateBalance(-totalCost);
    addXP(Math.max(1, Math.floor(totalCost / 10)));

    // Creator royalty calculation payout (0.6% commission)
    if (c.creator) {
      const royalty = Math.floor(totalCost * 0.006);
      if (royalty > 0) {
        if (user && c.creator === user.username) {
          updateBalance(royalty);
          toast(`🎨 Creator Royalty: You received +${formatMoney(royalty)} (0.6%) because your case "${c.name}" was unboxed!`, 'win');
        } else {
          toast(`🎨 Creator Royalty: Paid 0.6% (${formatMoney(royalty)}) to @${c.creator} as unbox commission!`, 'info');
        }
      }
    }

    const allRolled: CaseItem[][] = [];
    const allWinners: CaseItem[] = [];

    for (let q = 0; q < openingQuantity; q++) {
      const trackItems: CaseItem[] = [];
      const itemPool = [...c.items];
      
      for (let i = 0; i < 55; i++) {
        trackItems.push(itemPool[Math.floor(Math.random() * itemPool.length)]);
      }

      const winIndex = 45;
      let totalP = 0;
      c.items.forEach(it => totalP += it.percent);
      let r = Math.random() * totalP;
      let accumulated = 0;
      let pickedWinner = c.items[c.items.length - 1];

      for (const it of c.items) {
        accumulated += it.percent;
        if (r <= accumulated) {
          pickedWinner = it;
          break;
        }
      }

      trackItems[winIndex] = pickedWinner;
      allRolled.push(trackItems);
      allWinners.push(pickedWinner);
    }

    setRolledItems(allRolled);

    const itemWidth = 135; 
    const winIndex = 45;
    const finalOffset = winIndex * itemWidth - 145; 

    if (openingQuantity === 1) {
      let lastPlayedPosition = 0;
      const soundTimer = setInterval(() => {
        lastPlayedPosition++;
        if (lastPlayedPosition < 45) playTickSound();
        else clearInterval(soundTimer);
      }, 85);

      await reelControls.set({ x: 0 });
      await reelControls.start({
        x: -finalOffset,
        transition: { duration: 4.5, ease: [0.1, 0.65, 0.2, 1] }
      });
      clearInterval(soundTimer);
    } else {
      // Faster animation for multi-open
      await reelControls.set({ x: 0 });
      await reelControls.start({
        x: -finalOffset,
        transition: { duration: 1.5, ease: [0.1, 0.65, 0.2, 1] }
      });
    }

    setWinningItems(allWinners);
    setStage('reveal');
    
    const totalWin = allWinners.reduce((sum, item) => sum + item.value, 0);
    updateBalance(totalWin);
    playSound(true);
    
    if (openingQuantity === 1) {
      toast(`💸 Pulled ${allWinners[0].name} (Value: ${formatMoney(allWinners[0].value)})!`, 'win');
    } else {
      toast(`💸 Opened ${openingQuantity} cases! Total pulled value: ${formatMoney(totalWin)}!`, 'win');
    }
  };

  const handleCollect = () => {
    setOpening(false);
    setSelectedCase(null);
    setWinningItems([]);
    setStage('idle');
    setOpeningQuantity(1);
  };

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease] relative text-left">
      
      {/* Top Banner Overview */}
      <div className="mb-6 p-6 bg-radial-gradient bg-zinc-950 border border-white/5 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 pointer-events-none" />
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest leading-none font-mono">Premium Minecraft Cosmetic Drops</span>
          <h2 className="text-2xl font-black text-white mt-1 leading-none uppercase tracking-tight font-sans">🔮 LunarSpin Premium Loot Chests</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xl leading-relaxed font-sans">
            Open authentic server cases packed with spawners, rich rank vouchers, volcanic netherite armors, and giant cash bundles. Unbox Legendary loot instantly or host high-stakes Battles!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`py-2 px-4 rounded-xl border text-[10px] uppercase font-black tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              soundEnabled ? 'bg-purple-600/10 border-purple-500/30 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.1)]' : 'bg-slate-900 border-white/5 text-slate-500'
            }`}
          >
            <Volume2 className="w-4 h-4" /> {soundEnabled ? 'Audio On & Ticking' : 'Audio Muted'}
          </button>
        </div>
      </div>

      {/* Tab Switcher & Case Creator GUI Row */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/40 p-2 rounded-2xl border border-white/5">
        <div className="flex bg-slate-950 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('regular')}
            className={`py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'regular' ? 'bg-purple-600/20 border border-purple-500/40 text-purple-400 shadow' : 'text-slate-400 border border-transparent hover:text-white'
            }`}
          >
            📦 Official Cases ({officialCases.length})
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'community' ? 'bg-purple-600/20 border border-purple-500/40 text-purple-400 shadow' : 'text-slate-400 border border-transparent hover:text-white'
            }`}
          >
            👥 Community Cases ({communityCases.length})
          </button>
        </div>

        {activeTab === 'community' && (
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="py-2 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2"
          >
            <span>✨</span> {showCreator ? 'Close Forge Editor' : 'Create Custom Case'}
          </button>
        )}
      </div>

      {/* Creator Case Forge GUI form */}
      {showCreator && activeTab === 'community' && (
        <div className="mb-6 p-6 bg-zinc-950 border-2 border-emerald-500/20 rounded-3xl animate-[fadeIn_0.2s_ease]">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <span className="text-base text-emerald-400">✨</span> Creator Case Forge
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-left">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Case Name</span>
              <input
                type="text"
                placeholder="e.g. Master God Chest"
                value={newCaseName}
                onChange={(e) => setNewCaseName(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none focus:border-emerald-500/50 font-sans"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Calculated Price ($)</span>
              <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-xs font-black leading-none font-mono flex items-center justify-between">
                <span>{formatMoney(calculateCasePrice())}</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase">(Auto-derived from EV + 5%)</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Minecraft Chest Theme</span>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 p-2 bg-zinc-900 border border-white/5 rounded-xl">
                {['#8B4513', '#733a10', '#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#fbbf24', '#000000'].map(colorCode => (
                  <button
                    key={colorCode}
                    onClick={() => setNewCaseColor(colorCode)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all p-1
                      ${newCaseColor === colorCode 
                         ? 'border-emerald-500 bg-emerald-500/10' 
                         : 'bg-zinc-950 border-white/5 hover:border-white/10'}`}
                  >
                    <MinecraftChest color={colorCode} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-left">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Custom Color Hex</span>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={newCaseColor}
                  onChange={(e) => setNewCaseColor(e.target.value)}
                  className="w-10 h-10 border border-white/10 rounded-xl cursor-pointer bg-transparent p-0 overflow-hidden"
                />
                <input
                  type="text"
                  value={newCaseColor}
                  onChange={(e) => setNewCaseColor(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-white text-xs font-bold font-mono outline-none leading-none flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Description</span>
              <input
                type="text"
                placeholder="Keep it compelling!"
                value={newCaseDesc}
                onChange={(e) => setNewCaseDesc(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none focus:border-emerald-500/50 font-sans"
              />
            </div>
          </div>

          {/* Items Table details */}
          <div className="border border-white/5 rounded-2xl bg-zinc-900/40 p-4 mb-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black text-white uppercase tracking-wider">Configure Item Rewards</span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="py-1.5 px-3 bg-white/5 border border-white/10 hover:border-emerald-500/30 text-slate-300 font-bold text-[9px] uppercase rounded-lg transition-all"
              >
                + Add Item Row
              </button>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[240px] overflow-y-auto pr-1">
              {newItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.name}
                    placeholder="Item Name"
                    onChange={(e) => handleEditItemField(idx, 'name', e.target.value)}
                    className="bg-zinc-950 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none flex-1 font-sans"
                  />
                  <input
                    type="number"
                    value={item.value}
                    placeholder="Payout Value ($)"
                    onChange={(e) => handleEditItemField(idx, 'value', parseInt(e.target.value) || 0)}
                    className="bg-zinc-950 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none w-28 font-mono"
                  />
                  <input
                    type="number"
                    value={item.percent}
                    placeholder="Chance %"
                    onChange={(e) => handleEditItemField(idx, 'percent', parseFloat(e.target.value) || 0)}
                    className="bg-zinc-950 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none w-24 font-mono"
                  />
                  <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
                    {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'].map(r => (
                      <button
                        key={r}
                        onClick={() => handleEditItemField(idx, 'rarity', r)}
                        className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all
                          ${item.rarity === r 
                            ? 'bg-white/10 text-white border border-white/20' 
                            : 'text-slate-500 hover:text-slate-300'}`}
                        title={r}
                      >
                        {r.substring(0, 1)}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Validation bar */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wider leading-none">Total Items: <b className="text-white ml-1 font-mono">{newItems.length}</b></span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider leading-none">Total Chance Pool:</span>
                <span className={`font-black font-mono text-xs ${Math.abs(100 - getChanceSum()) < 0.01 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {getChanceSum().toFixed(2)}%
                </span>
                <span className="text-slate-600 font-semibold text-[10px]">(Must be exactly 100.00%)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowCreator(false)}
              className="py-2 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePublishCase}
              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20 animate-pulse"
            >
              Publish Community Case (0.6% Royalty Active)
            </button>
          </div>
        </div>
      )}

      {/* Cases Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
        {(activeTab === 'regular' ? officialCases : communityCases).map((c) => {
          const minVal = Math.min(...c.items.map(it => it.value));
          const maxVal = Math.max(...c.items.map(it => it.value));
          const isAdmin = user?.role === 'admin' || user?.role === 'owner';
          
          return (
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              onClick={() => setSelectedCase(c)}
              key={c.id}
              className="bg-zinc-950/70 hover:bg-zinc-950 border-2 border-white/5 hover:border-purple-500/40 rounded-3xl p-6 cursor-pointer flex flex-col gap-4 relative overflow-hidden transition-all shadow-xl group text-left"
              style={{ boxShadow: `0 10px 30px -15px ${c.color}20` }}
            >
              {isAdmin && activeTab === 'community' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCase(c.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all z-20 group/del"
                  title="Delete community case"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Highlight glowing halo relative to case theme */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500"
                style={{ backgroundImage: `radial-gradient(circle at 50% 10%, ${c.color}15 0, transparent 70%)` }}
              />

              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-lg font-black tracking-tight text-white group-hover:text-purple-300 transition-colors uppercase truncate">
                      {c.name}
                    </span>
                    {c.creator && (
                      <span className="py-0.5 px-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[8px] font-black uppercase tracking-wider rounded-full font-mono">
                        by @{c.creator}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal mt-1 max-w-[170px] pr-2">
                    {c.desc}
                  </p>
                </div>
                
                {/* 3D themed item graphics container */}
                <div className="w-14 h-14 bg-zinc-900 border-2 border-white/10 rounded-2xl flex items-center justify-center p-2 group-hover:rotate-6 group-hover:scale-110 transition-transform shadow-inner flex-shrink-0">
                  <MinecraftChest color={c.color || '#8B4513'} />
                </div>
              </div>

              {/* Price Label and Details */}
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 z-10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Unbox Cost</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-lg font-black text-emerald-400">{formatMoney(c.price)}</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 py-1.5 px-3 rounded-xl flex items-center text-[10px] font-black text-slate-400 uppercase tracking-wide group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  Open Chest <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>

              {/* Min/Max Payout Range */}
              <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-500 z-10 font-mono mt-1">
                <span className="flex items-center gap-1">
                  Value Bounds:
                  {c.creator && <span className="text-emerald-400 font-extrabold text-[8px] tracking-wide uppercase">(0.6% Royalty)</span>}
                </span>
                <span className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">{formatMoney(minVal)} - {formatMoney(maxVal)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Case Opener Sliding Modal Frame Overlay */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-2xl">
          <div className="bg-zinc-950 border-2 border-white/10 rounded-[32px] w-full max-w-2xl p-8 relative flex flex-col gap-6 shadow-2xl overflow-hidden">
            
            {/* Ambient themed background glowing blob */}
            <div 
              className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-40 transition-all duration-300"
              style={{ backgroundColor: selectedCase.color }}
            />

            <button
              onClick={() => !opening && setSelectedCase(null)}
              className="absolute top-6 right-6 bg-zinc-900 border border-white/10 hover:bg-zinc-800 hover:text-white rounded-xl w-10 h-10 flex items-center justify-center text-slate-400 transition-all font-bold text-sm cursor-pointer z-50"
              disabled={opening}
            >
              ✕
            </button>

            {/* Title block */}
            <div className="text-center z-10 mt-2 font-sans">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono">Now Inspecting Chest</span>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mt-1">{selectedCase.name}</h3>
              <p className="text-xs text-slate-400 mt-1.5 font-medium leading-none">
                Minecraft Server Edition Case · Price: <span className="text-emerald-400 font-extrabold">{formatMoney(selectedCase.price)}</span>
                {selectedCase.creator && <span className="text-slate-500 font-bold ml-1.5">by @{selectedCase.creator}</span>}
              </p>
              
              {stage === 'idle' && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Open Quantity:</span>
                  <div className="flex bg-zinc-900 border border-white/10 rounded-xl p-1 gap-1">
                    {[1, 5, 10, 20, 30].map(q => (
                      <button
                        key={q}
                        onClick={() => setOpeningQuantity(q)}
                        className={`w-10 py-1.5 rounded-lg text-[10px] font-black transition-all ${openingQuantity === q ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Slider track box body */}
            {stage === 'spinning' && (
              <div className="bg-black/90 border-2 border-white/5 rounded-3xl h-48 overflow-hidden relative shadow-inner p-2 my-2 z-10">
                {/* Visual cursor line purple with dynamic neon glow */}
                <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-[4px] bg-purple-500 z-20 shadow-[0_0_20px_#a855f7]">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-purple-500" />
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent border-b-purple-500" />
                </div>

                {/* Left/Right masks for fade aesthetics */}
                <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent z-10 pointer-events-none" />
                <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-zinc-950 via-zinc-950/60 to-transparent z-10 pointer-events-none" />

                <div className="flex h-full items-center relative">
                  <motion.div
                    animate={reelControls}
                    className="flex gap-3 absolute pl-[50%]"
                    style={{ x: 0 }}
                  >
                    {rolledItems[0].map((it, idx) => {
                      const col = RARITIES[it.rarity]?.color || '#a855f7';
                      return (
                        <div
                          key={idx}
                          className="w-[120px] h-[130px] rounded-2xl bg-zinc-900 border border-white/5 p-3 flex flex-col justify-center items-center gap-1.5 flex-shrink-0 select-none shadow relative transition-all"
                          style={{ 
                            borderColor: idx === 45 ? col : 'rgba(255,255,255,0.05)',
                            boxShadow: idx === 45 ? `0 0 25px -5px ${col}40` : 'none',
                            backgroundColor: idx === 45 ? `${col}10` : '#18181b'
                          }}
                        >
                          {renderItemVisual(it, selectedCase.id)}
                          <span className="text-[10px] font-black text-center leading-tight truncate w-full text-white block mt-1 font-sans">
                            {it.name}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-widest font-mono" style={{ color: col }}>
                            {it.rarity}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            )}

            {/* Pulled reveal output */}
            {stage === 'reveal' && winningItems.length > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-5 text-center my-4 z-10 w-full overflow-hidden"
              >
                {winningItems.length === 1 ? (
                  <>
                    <div className="relative p-6 bg-zinc-900 border-2 rounded-3xl flex items-center justify-center text-5xl select-none" style={{ borderColor: RARITIES[winningItems[0].rarity]?.color, boxShadow: `0 0 40px -10px ${RARITIES[winningItems[0].rarity]?.color}60` }}>
                      {renderItemVisual(winningItems[0], selectedCase.id)}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono block w-fit mx-auto" style={{ color: RARITIES[winningItems[0].rarity]?.color }}>
                        🏅 {winningItems[0].rarity} DROP CLAIMED
                      </span>
                      <span className="text-3xl font-black text-white block mt-3 uppercase tracking-tight">{winningItems[0].name}</span>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-4 w-full bg-zinc-950/50 rounded-[32px] border border-white/5">
                    {winningItems.map((it, idx) => (
                      <div key={idx} className="bg-zinc-900/80 p-2 rounded-2xl border border-white/5 flex flex-col items-center gap-1">
                        <div className="w-10 h-10 flex items-center justify-center text-2xl">
                          {renderItemVisual(it, selectedCase.id)}
                        </div>
                        <span className="text-[8px] font-black text-white uppercase truncate w-full text-center">{it.name}</span>
                        <span className="text-[8px] font-black" style={{ color: RARITIES[it.rarity]?.color }}>${it.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black text-emerald-400">+{formatMoney(winningItems.reduce((s, i) => s + i.value, 0))} CASH</span>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest font-mono">credited</span>
                  </div>
                </div>

                <button
                  onClick={handleCollect}
                  className="py-3.5 px-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-purple-600/30 transition-all text-xs uppercase tracking-widest cursor-pointer mt-2"
                >
                  Return to Lobby Cases
                </button>
              </motion.div>
            )}

            {/* Waiting/Idle state before roll */}
            {stage === 'idle' && (
              <div className="text-center py-4 flex flex-col items-center gap-6 z-10 max-h-[60vh] overflow-y-auto pr-1 font-sans">
                <div className="relative w-28 h-28 bg-zinc-900/80 border-2 border-white/10 rounded-3xl flex items-center justify-center p-4 animate-bounce shadow-xl">
                  <div className="absolute inset-0 bg-white/5 rounded-3xl blur animate-pulse" />
                  <MinecraftChest color={selectedCase.color || '#8B4513'} />
                </div>

                <button
                  onClick={() => handleOpenCase(selectedCase)}
                  className="py-4 px-14 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-purple-500/25 text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 cursor-pointer leading-none"
                >
                  Unbox {openingQuantity}x Case ({formatMoney(selectedCase.price * openingQuantity)})
                </button>

                {/* Grid list of potential contents */}
                <div className="w-full text-left self-stretch">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3 font-mono">
                    📋 Potential drop rewards & win-chances (proportional distribution)
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedCase.items.map((it) => {
                      const col = RARITIES[it.rarity]?.color || '#fff';
                      return (
                        <div 
                          key={it.id} 
                          className="flex justify-between items-center p-3.5 bg-zinc-900 border border-white/5 rounded-2xl text-xs hover:border-white/10 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Tiny bullet indicator */}
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col }} />
                            <span className="font-extrabold text-white truncate max-w-[130px]">{it.name}</span>
                          </div>

                          <div className="flex items-center gap-3 font-mono">
                            <span className="font-bold text-slate-500 text-[10px]">{it.percent}% odds</span>
                            <span className="font-black text-emerald-400">{formatMoney(it.value)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
