import { Case, CaseItem } from './types';

export const RARITIES = {
  Common: { color: '#9ca3af', chance: 0.5, bg: 'rgba(156, 163, 175, 0.1)', border: 'rgba(156, 163, 175, 0.3)' },
  Uncommon: { color: '#34d399', chance: 0.25, bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.3)' },
  Rare: { color: '#60a5fa', chance: 0.15, bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.3)' },
  Epic: { color: '#a855f7', chance: 0.07, bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)' },
  Legendary: { color: '#fbbf24', chance: 0.025, bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.4)' },
  Mythic: { color: '#ef4444', chance: 0.005, bg: 'rgba(239, 68, 68, 0.11)', border: 'rgba(239, 68, 68, 0.5)' }
};

export const REWARD_TIERS = [
  { name: 'Bronze', req: 0, icon: '🥉', color: '#cd7f32', glow: 'rgba(205,127,50,.3)' },
  { name: 'Silver', req: 1000, icon: '🥈', color: '#c0c0c0', glow: 'rgba(192,192,192,.3)' },
  { name: 'Gold', req: 10000, icon: '🥇', color: '#fbbf24', glow: 'rgba(251,191,36,.3)' },
  { name: 'Platinum', req: 50000, icon: '💎', color: '#06b6d4', glow: 'rgba(6,182,212,.3)' },
  { name: 'Diamond', req: 200000, icon: '💠', color: '#60a5fa', glow: 'rgba(96,165,250,.3)' },
  { name: 'Obsidian', req: 1000000, icon: '🖤', color: '#a855f7', glow: 'rgba(168,85,247,.3)' },
  { name: 'VIP', req: 5000000, icon: '👑', color: '#f43f5e', glow: 'rgba(244,63,94,.3)' }
];

export const MOCK_BOTS = [
  { username: 'LoverDonut', emoji: '🍩', color: '#fbbf24', role: 'owner', level: 120, avatar: null },
  { username: 'CreeperSlyr', emoji: '⚔️', color: '#16a34a', role: 'member', level: 32, avatar: null },
  { username: 'AxolotlQueen', emoji: '👾', color: '#ec4899', role: 'mod', level: 14, avatar: null },
  { username: 'EnderKing', emoji: '👾', color: '#a855f7', role: 'dev', level: 85, avatar: null },
  { username: 'StevenTheDonut', emoji: '💪', color: '#3b82f6', role: 'member', level: 51, avatar: null },
  { username: 'MineGod', emoji: '👑', color: '#f59e0b', role: 'member', level: 98, avatar: null },
  { username: 'WitchDonut', emoji: '🧪', color: '#d946ef', role: 'member', level: 25, avatar: null },
  { username: 'NetherLord', emoji: '🔥', color: '#ef4444', role: 'admin', level: 75, avatar: null },
  { username: 'GoldenSteve', emoji: '🪙', color: '#eab308', role: 'member', level: 112, avatar: null },
  { username: 'SpongeLlama', emoji: '🦙', color: '#10b981', role: 'member', level: 44, avatar: null }
];

export const CHAT_PHRASES = [
  'Just won 10k donuts on Coinflip! LFG 🍩🍩',
  'Mines at 10 mines is impossible, had 7 gems and hit a fox',
  'Who wants to do a 4-player classic battle for Lunar Case?',
  'Sending 500 donuts to the rain pool, tip to keep it going!',
  'Blackjack dealer got 21 three times in a row, rig is real smh',
  'Anyone double down on a 11 in blackjack? Easy win',
  'Can someone claim rain? Countdown went to zero',
  'LunarSpin feels super smooth. Play options are peak',
  'Plinko high risk 13x was so close, hit the 0.2x instead lol',
  'Just link Minecraft username inside wallet to get started, super quick verification',
  'Wow, jackpot pot got to 45k, lucky winner',
  'Can some moderator unmute me? It was a typo',
  'Wither Star pulled from Nether Case! Let\'s go 🔥',
  'Is towers Easy or Hard better? Easy is very stable',
  'Chicken Road 5 steps daredevil pays insane multipliers'
];

export const MC_ICONS = {
  grass: '🎮',
  gold: '🪙',
  diamond: '💎',
  moon: '🌙',
  emerald: '🍀',
  nether: '🔥',
  ender: '🔮'
};

export const CASES: Case[] = [
  {
    id: 'donut',
    name: 'Donut Case',
    price: 100,
    color: '#e24177',
    desc: 'Sweet starter snacks of LunarSpin',
    items: [
      { id: 'd1', name: 'Stale Donut', percent: 40, value: 10, rarity: 'Common' },
      { id: 'd2', name: 'Glazed Donut', percent: 20, value: 30, rarity: 'Common' },
      { id: 'd3', name: 'Sprinkle Donut', percent: 15, value: 60, rarity: 'Uncommon' },
      { id: 'd4', name: 'Chocolate Donut', percent: 12, value: 120, rarity: 'Uncommon' },
      { id: 'd5', name: 'Jelly Donut', percent: 8, value: 350, rarity: 'Rare' },
      { id: 'd6', name: 'Golden Donut', percent: 4, value: 900, rarity: 'Epic' },
      { id: 'd7', name: 'Enchanted Donut', percent: 0.9, value: 2500, rarity: 'Legendary' },
      { id: 'd8', name: 'Cosmic Donut', percent: 0.1, value: 10000, rarity: 'Mythic' }
    ]
  },
  {
    id: 'gold',
    name: 'Gold Case',
    price: 500,
    color: '#fbbf24',
    desc: 'Shiny Minecraft block treasures',
    items: [
      { id: 'g1', name: 'Gold Coin', percent: 35, value: 100, rarity: 'Common' },
      { id: 'g2', name: 'Gold Nugget', percent: 25, value: 200, rarity: 'Common' },
      { id: 'g3', name: 'Gold Ingot', percent: 18, value: 450, rarity: 'Uncommon' },
      { id: 'g4', name: 'Golden Apple', percent: 12, value: 1000, rarity: 'Rare' },
      { id: 'g5', name: 'Gold Block', percent: 7, value: 2500, rarity: 'Epic' },
      { id: 'g6', name: 'Enchanted Golden Apple', percent: 2.5, value: 6500, rarity: 'Legendary' },
      { id: 'g7', name: 'Midas Touch Gavel', percent: 0.5, value: 30000, rarity: 'Mythic' }
    ]
  },
  {
    id: 'emerald',
    name: 'Emerald Case',
    price: 1500,
    color: '#10b981',
    desc: 'Wealthy villagers exchange artifacts',
    items: [
      { id: 'e1', name: 'Emerald Dust', percent: 35, value: 300, rarity: 'Common' },
      { id: 'e2', name: 'Small Emerald', percent: 25, value: 600, rarity: 'Common' },
      { id: 'e3', name: 'Emerald Shard', percent: 18, value: 1200, rarity: 'Uncommon' },
      { id: 'e4', name: 'Emerald Block', percent: 12, value: 3200, rarity: 'Rare' },
      { id: 'e5', name: 'Villager Totem', percent: 7, value: 8000, rarity: 'Epic' },
      { id: 'e6', name: 'Emerald Crown', percent: 2.5, value: 20000, rarity: 'Legendary' },
      { id: 'e7', name: 'Druid Scepter', percent: 0.5, value: 95000, rarity: 'Mythic' }
    ]
  },
  {
    id: 'diamond',
    name: 'Diamond Case',
    price: 5000,
    color: '#60a5fa',
    desc: 'Luxurious gems & durable relics',
    items: [
      { id: 'dm1', name: 'Diamond Shard', percent: 35, value: 1000, rarity: 'Common' },
      { id: 'dm2', name: 'Raw Diamond', percent: 25, value: 2200, rarity: 'Uncommon' },
      { id: 'dm3', name: 'Cut Diamond', percent: 18, value: 4500, rarity: 'Uncommon' },
      { id: 'dm4', name: 'Diamond Block', percent: 12, value: 12000, rarity: 'Rare' },
      { id: 'dm5', name: 'Diamond Crown', percent: 7, value: 30000, rarity: 'Epic' },
      { id: 'dm6', name: 'Shining Star Gem', percent: 2.5, value: 75000, rarity: 'Legendary' },
      { id: 'dm7', name: 'Unbreakable Diamond Anvil', percent: 0.5, value: 350000, rarity: 'Mythic' }
    ]
  },
  {
    id: 'lunar',
    name: 'Lunar Case',
    price: 15000,
    color: '#a855f7',
    desc: 'Cosmic alignment of extreme riches',
    items: [
      { id: 'l1', name: 'Lunar Dust', percent: 30, value: 3000, rarity: 'Common' },
      { id: 'l2', name: 'Meteor Chunk', percent: 25, value: 6500, rarity: 'Uncommon' },
      { id: 'l3', name: 'Moon Crystal', percent: 20, value: 12000, rarity: 'Uncommon' },
      { id: 'l4', name: 'Lunar Stone', percent: 13, value: 35000, rarity: 'Rare' },
      { id: 'l5', name: 'Nebula Core', percent: 8, value: 85000, rarity: 'Epic' },
      { id: 'l6', name: 'Galaxy Heart', percent: 3, value: 240000, rarity: 'Legendary' },
      { id: 'l7', name: 'Infinite Star Fragment', percent: 1, value: 1000000, rarity: 'Mythic' }
    ]
  },
  {
    id: 'nether',
    name: 'Nether Blazing Case',
    price: 45000,
    color: '#ef4444',
    desc: 'Fiery core of hellish SMP artifacts',
    items: [
      { id: 'nt1', name: 'Blaze Powder', percent: 30, value: 8000, rarity: 'Common' },
      { id: 'nt2', name: 'Ghast Tear', percent: 25, value: 18000, rarity: 'Uncommon' },
      { id: 'nt3', name: 'Wither Skeleton Skull', percent: 18, value: 40000, rarity: 'Rare' },
      { id: 'nt4', name: 'Netherite Ingot', percent: 15, value: 95000, rarity: 'Rare' },
      { id: 'nt5', name: 'Dragon Breath Vial', percent: 9, value: 250000, rarity: 'Epic' },
      { id: 'nt6', name: 'Nether Reactor Core', percent: 2.5, value: 650000, rarity: 'Legendary' },
      { id: 'nt7', name: 'Active Wither Star', percent: 0.5, value: 3000000, rarity: 'Mythic' }
    ]
  }
];

export function formatMoney(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const isNegative = val < 0;
  const absVal = Math.abs(val);

  let formatted = '';
  if (absVal >= 1e12) {
    formatted = (absVal / 1e12).toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1') + 'T';
  } else if (absVal >= 1e9) {
    formatted = (absVal / 1e9).toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1') + 'B';
  } else if (absVal >= 1e6) {
    formatted = (absVal / 1e6).toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1') + 'M';
  } else if (absVal >= 1e3) {
    formatted = (absVal / 1e3).toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1') + 'K';
  } else {
    formatted = absVal % 1 === 0 ? absVal.toString() : absVal.toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1');
  }

  return isNegative ? `-${formatted}` : formatted;
}

