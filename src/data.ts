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

export const CHAT_PHRASES = [
  'Just won $10k on Coinflip! LFG 💸💸',
  'Mines at 10 mines is impossible, had 7 gems and hit a skeleton',
  'Who wants to do a 4-player classic battle for Rank Case?',
  'Blackjack dealer got 21 three times in a row, rig is real smh',
  'Anyone double down on a 11 in blackjack? Easy win',
  'LunarSpin feels super smooth. Play options are peak',
  'Plinko high risk 13x was so close, hit the 0.2x instead lol',
  'Just link Minecraft username inside wallet to get started, super quick verification',
  'Wow, jackpot pot got to $45k, lucky winner',
  'Can some moderator unmute me? It was a typo',
  'Wither Star pulled from Netherite Case! Let\'s go 🔥',
  'Is towers Easy or Hard better? Easy is very stable'
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

export function formatMoney(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '$0';
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
    // Return formatted string with space commas e.g. 5,000
    formatted = absVal.toLocaleString();
  }

  return isNegative ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Parses shorthand currency strings (1k, 25m, 1.5b) into numbers
 */
export function parseMoney(input: string): number {
  if (!input) return 0;
  // Handle literal numbers first if possible
  const raw = input.trim().toLowerCase();
  
  // Extract multiplier
  let multi = 1;
  let numStr = raw.replace(/[$,]/g, ''); // Remove symbols
  
  if (numStr.endsWith('k')) {
    multi = 1000;
    numStr = numStr.slice(0, -1);
  } else if (numStr.endsWith('m')) {
    multi = 1000000;
    numStr = numStr.slice(0, -1);
  } else if (numStr.endsWith('b')) {
    multi = 1000000000;
    numStr = numStr.slice(0, -1);
  } else if (numStr.endsWith('t')) {
    multi = 1000000000000;
    numStr = numStr.slice(0, -1);
  }

  const val = parseFloat(numStr);
  return isNaN(val) ? 0 : Math.floor(val * multi);
}


