export interface User {
  id: string;
  username: string;
  avatar: string | null;
  role: 'member' | 'mod' | 'dev' | 'admin' | 'owner';
  emoji: string;
  color: string;
  status: string;
  private: boolean;
  xp: number;
  balance: number;
}

export interface Transaction {
  id: string;
  desc: string;
  amt: number;
  ts: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  avatar: string | null;
  text: string;
  color: string;
  emoji: string;
  role: 'member' | 'mod' | 'dev' | 'admin' | 'owner';
  level: number;
  ts: number;
  isSys?: boolean;
}

export interface CaseItem {
  id: string;
  name: string;
  imageURL?: string;
  percent: number; // percentage chance (e.g. 50 = 50%)
  value: number; // in donuts
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
}

export interface Case {
  id: string;
  name: string;
  price: number;
  icon?: string;
  imageURL?: string;
  color: string;
  desc: string;
  items: CaseItem[];
}

export interface PlayerBattleState {
  id: string;
  username: string;
  color: string;
  avatar: string | null;
  items: { name: string; rarity: string; value: number }[];
  total: number;
  opened: boolean;
}

export interface CaseBattle {
  id: string;
  caseId: string;
  slots: number;
  mode: 'classic' | 'jackpot' | 'shared' | 'crazy';
  host: string;
  hostId: string;
  players: PlayerBattleState[];
  open: boolean;
  ended?: number;
  created: number;
}

export interface LiveBet {
  id: string;
  username: string;
  game: string;
  amount: number;
  result: 'win' | 'loss';
  mult: number;
  ts: number;
}
