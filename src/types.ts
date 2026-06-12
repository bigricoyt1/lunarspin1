export interface TransactionRequest {
  id: string;
  userId: string;
  username: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  mcName: string;
  status: 'pending' | 'approved' | 'denied';
  ts: any;
}

export interface User {
  id: string;
  username: string;
  minecraftUsername?: string;
  pendingMinecraftUsername?: string;
  pendingRequest?: boolean; // UI flag to show "Waiting for Approval"
  donutSmpStats?: {
    balance: number;
    playtime: number;
    kills: number;
    deaths: number;
  };
  stats?: {
    wins: number;
    losses: number;
    totalWagered: number;
  };
  rigRate?: number | null; // 0-100 or null for normal
  avatar: string | null;
  role: 'member' | 'helper' | 'mod' | 'dev' | 'admin' | 'owner';
  emoji: string;
  color: string;
  status: string;
  private: boolean;
  xp: number;
  balance: number;
  ip?: string;
  isBanned?: boolean;
  isOnline?: boolean;
  lastActive?: any;
  timeoutUntil?: any;
  redeemedCodes?: string[];
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
  role: 'member' | 'helper' | 'mod' | 'dev' | 'admin' | 'owner';
  level: number;
  ts: number;
  isSys?: boolean;
}

export interface CaseItem {
  id: string;
  name: string;
  imageURL?: string;
  percent: number; // percentage chance (e.g. 50 = 50%)
  value: number; // in money
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
  creator?: string;
  creatorId?: string;
  createdAt?: any;
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
  caseIds: string[]; // Supports multiple rounds
  slots: number;
  teamMode: '1v1' | '2v2' | '3v3' | '1v1v1v1' | '1v1v1v1v1v1' | 'none'; 
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
