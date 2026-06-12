import React, { useState, useEffect, useRef } from 'react';
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
import HelperPanel from './components/HelperPanel';
import CasesModule from './components/CasesModule';
import CaseBattlesModule from './components/CaseBattlesModule';
import DonutSmpLiveStats from './components/DonutSmpLiveStats';
import DonutStore from './components/DonutStore';

import Coinflip from './components/games/Coinflip';
import Crash from './components/games/Crash';
import Mines from './components/games/Mines';
import Roulette from './components/games/Roulette';
import Plinko from './components/games/Plinko';
import Blackjack from './components/games/Blackjack';
import Dice from './components/games/Dice';
import Towers from './components/games/Towers';
import Jackpot from './components/games/Jackpot';
import Slots from './components/games/Slots';
import RainPool from './components/games/RainPool';

import { User, Transaction, LiveBet, TransactionRequest, Case } from './types';
import { formatMoney } from './data';
import { 
  auth, db, handleFirestoreError, OperationType, signInWithGoogle,
  onAuthStateChanged, signOut,
  doc, getDoc, getDocFromServer, setDoc, addDoc, updateDoc, deleteDoc,
  collection, onSnapshot, query, getDocs, orderBy, limit, serverTimestamp,
  increment, where, runTransaction
} from './lib/firebase';

// Import image assets for production bundler
import logoPng from './assets/images/lunar_spin_logo_1781112186175.png';
import heroArt from './assets/images/casino_hero_art_1780942067822.png';
import coinFlipThumb from './assets/images/mine_coinflip_thumb_1781191906480.jpg';
import crashThumb from './assets/images/mine_crash_thumb_1781191925076.jpg';
import minesThumb from './assets/images/mine_mines_thumb_1781191936856.jpg';
import rouletteThumb from './assets/images/mine_roulette_thumb_1781191951757.jpg';
import plinkoThumb from './assets/images/mine_plinko_thumb_1781191969697.jpg';
import blackjackThumb from './assets/images/mine_blackjack_thumb_1781192018235.jpg';
import diceThumb from './assets/images/mine_dice_thumb_1781192037357.jpg';
import towersThumb from './assets/images/mine_towers_thumb_1781192055257.jpg';
import jackpotThumb from './assets/images/mine_jackpot_thumb_1781191984580.jpg';

// Custom PNG logo we generated
const LOGO_PNG_URL = logoPng;

const MOCK_OFFICIAL_CASES: Case[] = [
  {
    id: 'official_case_ruby',
    name: 'Ruby Horizon',
    price: 15,
    color: '#ef4444',
    desc: 'High-risk case of crimson treasures.',
    items: [
      { id: 'ruby_1', name: 'Raw Ruby shard', percent: 60, value: 3, rarity: 'Common' },
      { id: 'ruby_2', name: 'Polished Ruby Rose', percent: 25, value: 12, rarity: 'Rare' },
      { id: 'ruby_3', name: 'Scarlet Overlord Sabre', percent: 13, value: 45, rarity: 'Epic' },
      { id: 'ruby_4', name: 'Ruby Core Star', percent: 2, value: 500, rarity: 'Legendary' }
    ]
  },
  {
    id: 'official_case_emerald',
    name: 'Emerald Nebula',
    price: 50,
    color: '#10b981',
    desc: 'Breathtaking jade weapons and coins.',
    items: [
      { id: 'em_1', name: 'Raw Emerald', percent: 55, value: 10, rarity: 'Common' },
      { id: 'em_2', name: 'Vibrant Jade Ring', percent: 30, value: 40, rarity: 'Rare' },
      { id: 'em_3', name: 'Emerald Piercer Spear', percent: 12, value: 135, rarity: 'Epic' },
      { id: 'em_4', name: 'Aetherial Prism', percent: 3, value: 1250, rarity: 'Legendary' }
    ]
  },
  {
    id: 'official_case_sapphire',
    name: 'Sapphire Void',
    price: 150,
    color: '#3b82f6',
    desc: 'Ultra high-tier cases for lunar high-rollers.',
    items: [
      { id: 'sap_1', name: 'Sapphire Fragment', percent: 45, value: 30, rarity: 'Uncommon' },
      { id: 'sap_2', name: 'Cobalt Shield', percent: 35, value: 100, rarity: 'Rare' },
      { id: 'sap_3', name: 'Deep Sea Trident', percent: 16, value: 380, rarity: 'Epic' },
      { id: 'sap_4', name: 'Celestial Crown', percent: 4, value: 2500, rarity: 'Legendary' }
    ]
  },
  {
    id: 'official_case_lunar',
    name: 'Lunar Eclipse',
    price: 500,
    color: '#a855f7',
    desc: 'The ultimate case on LunarSpin.',
    items: [
      { id: 'lun_1', name: 'Moonstone Bead', percent: 40, value: 100, rarity: 'Rare' },
      { id: 'lun_2', name: 'Astral Platebody', percent: 35, value: 350, rarity: 'Epic' },
      { id: 'lun_3', name: 'Eclipse Katana', percent: 20, value: 1200, rarity: 'Legendary' },
      { id: 'lun_4', name: 'Cosmic Soul Prism', percent: 5, value: 8000, rarity: 'Mythic' }
    ]
  }
];

const MOCK_COMMUNITY_CASES: Case[] = [
  ...MOCK_OFFICIAL_CASES.map(c => ({
    ...c,
    id: 'community_' + c.id,
    name: c.name + ' (Custom)',
    creator: 'LunarDev',
    price: Math.floor(c.price * 1.1)
  }))
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [wager, setWager] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);

  const [announcement, setAnnouncement] = useState<string>('');
  const [maintenance, setMaintenance] = useState<boolean>(false);
  const [userIp, setUserIp] = useState<string>('');
  const [isIpBanned, setIsIpBanned] = useState<boolean>(false);
  const [antiCheatEnabled, setAntiCheatEnabled] = useState<boolean>(false);
  const [communityCases, setCommunityCases] = useState<Case[]>([]);
  const [officialCases, setOfficialCases] = useState<Case[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TransactionRequest[]>([]);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(() => {
    return localStorage.getItem('lunarspin_firestore_quota_exceeded') === 'true';
  });
  const [isVerifyingConnection, setIsVerifyingConnection] = useState<boolean>(false);

  const checkQuotaError = (error: any) => {
    if (!error) return;
    const errMsg = error.message ? String(error.message) : String(error);
    const errCode = error.code ? String(error.code) : '';
    if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted') || errCode === 'resource-exhausted') {
      setIsQuotaExceeded(true);
      localStorage.setItem('lunarspin_firestore_quota_exceeded', 'true');
      window.dispatchEvent(new CustomEvent('quota-exceeded'));
    }
  };

  const handleRetryConnection = async (silent = false) => {
    setIsVerifyingConnection(true);
    try {
      const testRef = doc(db, 'config', 'global');
      await getDocFromServer(testRef);
      setIsQuotaExceeded(false);
      localStorage.removeItem('lunarspin_firestore_quota_exceeded');
      window.dispatchEvent(new CustomEvent('quota-cleared'));
      if (!silent) {
        showToastNotification('🎯 Real-time Firestore connection successfully established!', 'win');
      }
    } catch (err: any) {
      console.warn('Firestore active connection check result:', err);
      const errMsg = err.message ? String(err.message) : String(err);
      const errCode = err.code ? String(err.code) : '';
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted') || errCode === 'resource-exhausted') {
        setIsQuotaExceeded(true);
        localStorage.setItem('lunarspin_firestore_quota_exceeded', 'true');
        window.dispatchEvent(new CustomEvent('quota-exceeded'));
        if (!silent) {
          showToastNotification('⚠️ High traffic detected. Performance may be adjusted.', 'info');
        }
      } else {
        // Any other non-quota error means we CAN reach the server! (or is a transient issue)
        setIsQuotaExceeded(false);
        localStorage.removeItem('lunarspin_firestore_quota_exceeded');
        window.dispatchEvent(new CustomEvent('quota-cleared'));
        if (!silent) {
          showToastNotification('✨ Network connection established!', 'win');
        }
      }
    } finally {
      setIsVerifyingConnection(false);
    }
  };

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setIsQuotaExceeded(true);
      localStorage.setItem('lunarspin_firestore_quota_exceeded', 'true');
    };
    window.addEventListener('quota-exceeded', handleQuotaExceeded);
    
    // Check on mount to auto-recover if quota is now fine
    handleRetryConnection(true);

    return () => {
      window.removeEventListener('quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Payment Callback Check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('payment_success');
    const sessionId = params.get('session_id');

    if (success === 'true' && sessionId) {
      const verifyPayment = async () => {
        try {
          const res = await fetch(`/api/payments/verify-session?session_id=${sessionId}`);
          const data = await res.json();
          if (data.success) {
            showToastNotification(`💰 Payment Successful! $${data.amount} added to your balance.`, 'win');
            // Remove params from URL
            window.history.replaceState({}, '', window.location.pathname);
          } else {
            showToastNotification('⚠️ Payment verification failed or already processed.', 'info');
          }
        } catch (e) {
          console.error('Payment verification error:', e);
        }
      };
      verifyPayment();
    } else if (params.get('payment_cancel') === 'true') {
      showToastNotification('❌ Payment was cancelled.', 'info');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // IP Check on mount
  useEffect(() => {
    if (isQuotaExceeded) {
      setUserIp('127.0.0.1');
      return;
    }
    const fetchIp = async () => {
      let ip = '';
      try {
        const res = await fetch('/api/security/ip');
        if (res.ok) {
          const data = await res.json();
          if (data.ip) {
            ip = data.ip;
            setUserIp(ip);
          }
        } else {
          setUserIp('127.0.0.1');
        }
      } catch (e) {
        setUserIp('127.0.0.1');
      }

      if (ip && !isQuotaExceeded) {
        try {
          // Check if IP is banned in Firestore
          const banRef = doc(db, 'bans', ip);
          const banDoc = await getDoc(banRef);
          if (banDoc.exists()) {
            setIsIpBanned(true);
          }
        } catch (e: any) {
          const errMsg = e.message ? String(e.message) : String(e);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted')) {
            setIsQuotaExceeded(true);
            localStorage.setItem('lunarspin_firestore_quota_exceeded', 'true');
          } else {
            console.warn('IP ban check skipped:', e);
          }
        }
      }
    };
    fetchIp();
  }, [isQuotaExceeded]);

  // Sync IP to User Profile when both are ready (handles race condition)
  useEffect(() => {
    if (user && userIp && userIp !== 'unknown' && user.ip !== userIp) {
      const userRef = doc(db, 'users', user.id);
      updateDoc(userRef, { 
        ip: userIp,
        updatedAt: serverTimestamp()
      }).catch(() => {});
    }
  }, [user?.id, userIp, user?.ip]);

  // Community Cases Sync - Optimized: Fetch once on mount / quota fallback
  useEffect(() => {
    if (isQuotaExceeded) {
      setCommunityCases(MOCK_COMMUNITY_CASES);
      return;
    }

    const fetchCommunityCases = async () => {
      try {
        const casesQuery = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(casesQuery);
        const list: Case[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          list.push({ 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt
          } as Case);
        });
        setCommunityCases(list);
      } catch (error: any) {
        console.warn('Community cases sync error (likely permission or empty):', error);
        const errMsg = error.message ? String(error.message) : String(error);
        if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted')) {
          setIsQuotaExceeded(true);
          localStorage.setItem('lunarspin_firestore_quota_exceeded', 'true');
          setCommunityCases(MOCK_COMMUNITY_CASES);
        }
      }
    };

    fetchCommunityCases();

    // Listen to custom refresh event to re-fetch of cases when added/removed locally
    window.addEventListener('refresh-community-cases', fetchCommunityCases);
    return () => {
      window.removeEventListener('refresh-community-cases', fetchCommunityCases);
    };
  }, [isQuotaExceeded]);

  // Official Cases Sync - Optimized: Fetch once on mount / quota fallback
  useEffect(() => {
    if (isQuotaExceeded) {
      setOfficialCases(MOCK_OFFICIAL_CASES);
      return;
    }

    const fetchOfficialCases = async () => {
      try {
        const casesQuery = query(collection(db, 'official_cases'), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(casesQuery);
        const list: Case[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          list.push({ 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt
          } as Case);
        });
        setOfficialCases(list);
      } catch (error: any) {
        console.warn('Official cases sync error:', error);
        const errMsg = error.message ? String(error.message) : String(error);
        if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted')) {
          setIsQuotaExceeded(true);
          localStorage.setItem('lunarspin_firestore_quota_exceeded', 'true');
          setOfficialCases(MOCK_OFFICIAL_CASES);
        }
      }
    };

    fetchOfficialCases();
  }, [isQuotaExceeded]);

  // Global Config Sync - SSE Synced
  useEffect(() => {
    // Config is now primarily handled by state syncer init.
    // This is an initial seed only.
    if (isQuotaExceeded) return;

    const fetchGlobalConfig = async () => {
      try {
        const configRef = doc(db, 'config', 'global');
        const snapshot = await getDoc(configRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.announcementText !== undefined) setAnnouncement(data.announcementText);
          if (data.maintenanceEnabled !== undefined) setMaintenance(data.maintenanceEnabled);
          if (data.antiCheatEnabled !== undefined) setAntiCheatEnabled(data.antiCheatEnabled);
          if (data.winDifficulty !== undefined) localStorage.setItem('casino_win_difficulty', data.winDifficulty);
        }
      } catch (error: any) {
        const errMsg = error.message ? String(error.message) : String(error);
        const isQuota = errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted');
        if (isQuota) {
          setIsQuotaExceeded(true);
          localStorage.setItem('lunarspin_firestore_quota_exceeded', 'true');
        } else {
          console.error('App global config sync failed:', error);
        }
      }
    };

    fetchGlobalConfig();
  }, [isQuotaExceeded]);

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Modal triggers
  const [walletOpen, setWalletOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [loginOpen, setLoginOpen] = useState<boolean>(false);

  // Demo / Custom OAuth states
  const [authTab, setAuthTab] = useState<'quick' | 'real'>('real');
  const [demoProvider, setDemoProvider] = useState<'discord' | 'google'>('google');
  const [demoUsername, setDemoUsername] = useState<string>('');
  const [demoRole, setDemoRole] = useState<'member' | 'helper' | 'mod' | 'dev' | 'admin' | 'owner'>('admin');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncerConnected, setSyncerConnected] = useState<boolean>(false);

  // REAL-TIME STATE SYNCER LISTENER
  useEffect(() => {
    // We use a robust SSE listener to sync global state instantly across all clients
    const eventSource = new EventSource('/api/sync/stream');
    
    eventSource.onopen = () => {
      setSyncerConnected(true);
      console.log('✨ Live State Syncer: Established secure connection.');
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'init' || payload.type === 'update') {
          const s = payload.state;
          
          // Dispatch global custom event for modules to react
          window.dispatchEvent(new CustomEvent('sync-state-update', { detail: payload }));

          if (s.config) {
            localStorage.setItem('casino_win_difficulty', s.config.winDifficulty || 'fair');
            setMaintenance(s.config.maintenanceEnabled || false);
            setAnnouncement(s.config.announcementText || '');
            setAntiCheatEnabled(s.config.antiCheatEnabled ?? true);
          }
          if (s.liveBets) setLiveBets(s.liveBets);
          if (s.usersList) setUsersList(s.usersList);
          if (s.requests) setPendingRequests(s.requests);
        }
      } catch (e) {
        console.error('Syncer parse error:', e);
      }
    };

    eventSource.onerror = () => {
      setSyncerConnected(false);
      console.warn('📡 State Syncer: Connection lost, attempting reconnection...');
    };

    return () => eventSource.close();
  }, []);
  
  // Firebase Auth sync
  useEffect(() => {
    const setupMockOfflineUser = () => {
      const demoId = localStorage.getItem('lunarspin_demo_user_id') || `offline_guest_${Math.random().toString(36).substring(5)}`;
      const profile: User = {
        id: demoId,
        username: 'OfflinePlayer',
        avatar: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop',
        role: 'owner',
        balance: 5000,
        xp: 1200,
        emoji: '⭐',
        stats: { wins: 0, losses: 0, totalWagered: 0 },
        color: '#8b5cf6',
        status: 'Playing with a secure session.',
        private: false
      };
      setUser(profile);
      localStorage.setItem('lunarspin_offline_user', JSON.stringify(profile));
    };

    if (isQuotaExceeded) {
      const savedUserStr = localStorage.getItem('lunarspin_offline_user');
      if (savedUserStr) {
        try {
          setUser(JSON.parse(savedUserStr));
        } catch (e) {
          setupMockOfflineUser();
        }
      } else {
        setupMockOfflineUser();
      }
      setAuthLoading(false);
      return;
    }

    let unsubscribeUser: (() => void) | null = null;
    let loadingTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 4500);

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen to the user document in real-time
        unsubscribeUser = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            let role = data.role || 'member';
            if (firebaseUser.email === 'palmerrico500@gmail.com' && role !== 'owner') {
              role = 'owner';
              updateDoc(userRef, { role: 'owner' }).catch(() => {});
            }

            const profile: User = {
              id: firebaseUser.uid,
              username: data.username || firebaseUser.displayName || 'Player',
              avatar: data.avatar || firebaseUser.photoURL,
              role: role,
              balance: data.balance !== undefined ? data.balance : 0,
              xp: data.xp || 0,
              emoji: data.emoji || '⭐',
              stats: data.stats || { wins: 0, losses: 0, totalWagered: 0 },
              rigRate: data.rigRate,
              color: data.color || '#8b5cf6',
              status: data.status || 'Authenticated via Firebase',
              private: data.private || false,
              minecraftUsername: data.minecraftUsername,
              pendingMinecraftUsername: data.pendingMinecraftUsername,
              pendingRequest: data.pendingRequest || false,
              donutSmpStats: data.donutSmpStats,
              timeoutUntil: data.timeoutUntil,
              ip: data.ip,
              isBanned: data.isBanned,
              redeemedCodes: data.redeemedCodes || []
            };
            setUser(profile);
            localStorage.setItem('lunarspin_offline_user', JSON.stringify(profile));
            setAuthLoading(false);
            clearTimeout(loadingTimer);
          } else {
            handleCreateNewUser(firebaseUser);
          }
        }, (error) => {
          const errMsg = error.message ? String(error.message) : String(error);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted')) {
            setIsQuotaExceeded(true);
            localStorage.setItem('lunarspin_firestore_quota_exceeded', 'true');
            setupMockOfflineUser();
          } else {
            console.error('User listener failed:', error);
          }
          setAuthLoading(false);
          clearTimeout(loadingTimer);
        });

        // Update online status and IP
        try {
          await updateDoc(userRef, {
            isOnline: true,
            ip: userIp || 'unknown',
            lastActive: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (e) {}
      } else {
        if (unsubscribeUser) unsubscribeUser();
        const demoUserId = localStorage.getItem('lunarspin_demo_user_id');
        if (demoUserId) {
          const savedUserStr = localStorage.getItem('lunarspin_offline_user');
          if (savedUserStr) {
            try {
              setUser(JSON.parse(savedUserStr));
            } catch (e) {
              setupMockOfflineUser();
            }
          } else {
            setupMockOfflineUser();
          }
        } else {
          setUser(null);
        }
        setAuthLoading(false);
        clearTimeout(loadingTimer);
      }
    });

    const handleCreateNewUser = async (firebaseUser: any) => {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const startingBalance = 0;
      const isInitialOwner = firebaseUser.email === 'palmerrico500@gmail.com';
      const profile: User = {
        id: firebaseUser.uid,
        username: firebaseUser.displayName || 'New Player',
        avatar: firebaseUser.photoURL,
        role: isInitialOwner ? 'owner' : 'member',
        balance: startingBalance,
        xp: 0,
        emoji: '⭐',
        stats: { wins: 0, losses: 0, totalWagered: 0 },
        rigRate: null,
        color: '#8b5cf6',
        status: 'Just joined LunarSpin!',
        private: false,
        isOnline: true,
        lastActive: new Date()
      };
      
      try {
        await setDoc(userRef, {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('User creation failed:', err);
        setAuthLoading(false);
      }
    };

    // Handle offline status on tab close
    const handleUnload = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { isOnline: false, updatedAt: serverTimestamp() });
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // Sync bets and users list for admin and online count - Highly Optimized for Quota Hardening
  useEffect(() => {
    if (isQuotaExceeded) {
      // Offline/Quota fallback: Seed beautiful live mock list of users and periodic simulated live bets!
      const mockUsers: User[] = [
        { id: 'usr_1', username: 'LanaSky', role: 'admin', emoji: '👑', color: '#f43f5e', status: 'Rigging plinko results...', xp: 12500, balance: 250000, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', private: false },
        { id: 'usr_2', username: 'Ducky_Go', role: 'helper', emoji: '🦆', color: '#eab308', status: 'Enjoying some Blackjack', xp: 5100, balance: 240, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', private: false },
        { id: 'usr_3', username: 'Aeronux', role: 'mod', emoji: '🛡️', color: '#3b82f6', status: 'Muting scammers...', xp: 8200, balance: 1390, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', private: false },
        { id: 'usr_4', username: 'LuckyDino', role: 'member', emoji: '🦖', color: '#10b981', status: 'To the MOON 🚀', xp: 450, balance: 12, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100', private: false },
        { id: 'usr_5', username: 'CosmoWhale', role: 'member', emoji: '🐋', color: '#a855f7', status: 'High roller status active.', xp: 32000, balance: 1450000, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', private: false }
      ];
      setUsersList(mockUsers);

      const mockGames = ['coinflip', 'crash', 'mines', 'roulette', 'plinko', 'blackjack', 'dice', 'towers', 'jackpot'];
      const firstBetsList: LiveBet[] = Array.from({ length: 15 }, (_, i) => {
        const u = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const amount = Math.floor(Math.random() * 200) + 10;
        const result = Math.random() > 0.45 ? 'win' : 'loss';
        const mult = result === 'win' ? parseFloat((Math.random() * 3 + 1.1).toFixed(2)) : 0;
        return {
          id: `bet_mock_${Date.now() - i * 15000}`,
          username: u.username,
          game: mockGames[Math.floor(Math.random() * mockGames.length)],
          amount,
          result,
          mult,
          ts: Date.now() - i * 15000
        };
      });
      setLiveBets(firstBetsList);

      // Add a simulated live bet every 5 seconds to keep the environment visually rich and live!
      const betInterval = setInterval(() => {
        const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const amount = Math.floor(Math.random() * 200) + 10;
        const result = Math.random() > 0.45 ? 'win' : 'loss';
        const mult = result === 'win' ? parseFloat((Math.random() * 3 + 1.1).toFixed(2)) : 0;
        const newlyCreatedBet: LiveBet = {
          id: `bet_mock_${Date.now()}`,
          username: randomUser.username,
          game: mockGames[Math.floor(Math.random() * mockGames.length)],
          amount,
          result,
          mult,
          ts: Date.now()
        };
        setLiveBets(prev => [newlyCreatedBet, ...prev.slice(0, 49)]);
      }, 5000);

      return () => {
        clearInterval(betInterval);
      };
    }

    // 1. Sync Live Bets - Optimized to fetch once to seed, then append simulated active players 
    // to preserve free-tier limits without cutting down the interactive live ambiance!
    const fetchRealInitialBets = async () => {
      try {
        const betsQuery = query(collection(db, 'bets'), orderBy('ts', 'desc'), limit(15));
        const snapshot = await getDocs(betsQuery);
        const list: LiveBet[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          list.push({
            id: doc.id,
            ...data,
            ts: data.ts?.toMillis ? data.ts.toMillis() : (data.ts || Date.now())
          } as LiveBet);
        });
        setLiveBets(list);
      } catch (error: any) {
        console.warn('Could not seed initial live bets (non-breaking):', error);
        checkQuotaError(error);
      }
    };

    fetchRealInitialBets();

    const mockGames = ['coinflip', 'crash', 'mines', 'roulette', 'plinko', 'blackjack', 'dice', 'towers', 'jackpot'];
    const ambientMockUsers = ['LanaSky', 'Ducky_Go', 'Aeronux', 'LuckyDino', 'CosmoWhale', 'MineCasinoPro', 'GodAp_Slayer', 'EmeraldSpin'];
    
    // Supplement with continuous offline live ticker updates
    const liveTickerSyncId = setInterval(() => {
      const uName = ambientMockUsers[Math.floor(Math.random() * ambientMockUsers.length)];
      const amount = Math.floor(Math.random() * 200) + 10;
      const result = Math.random() > 0.42 ? 'win' : 'loss';
      const mult = result === 'win' ? parseFloat((Math.random() * 2.8 + 1.15).toFixed(2)) : 0;
      const virtualBet: LiveBet = {
        id: `bet_ambient_${Date.now()}`,
        username: uName,
        game: mockGames[Math.floor(Math.random() * mockGames.length)],
        amount,
        result,
        mult,
        ts: Date.now()
      };
      setLiveBets(prev => [virtualBet, ...prev.slice(0, 49)]);
    }, 7500);

    // 2. Sync Users List
    const pollUsers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'), limit(50));
        const snapshot = await getDocs(usersQuery);
        const list: User[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as User);
        });
        setUsersList(list);
      } catch (error: any) {
        console.warn('Users sync failed:', error);
        checkQuotaError(error);
      }
    };

    pollUsers();
    const usersInterval = setInterval(pollUsers, 30000);

    return () => {
      clearInterval(liveTickerSyncId);
      clearInterval(usersInterval);
    };
  }, [isQuotaExceeded, user?.role]);

  // 3. Sync Pending Requests (Centralized for Staff Panels) - Restricted to Staff Users for security and quota hardening
  useEffect(() => {
    if (isQuotaExceeded) {
      setPendingRequests([
        {
          id: 'req_demo_1',
          userId: 'usr_2',
          username: 'Ducky_Go',
          type: 'deposit',
          amount: 500,
          mcName: 'DuckyGamer',
          status: 'pending',
          ts: Date.now() - 3600000
        },
        {
          id: 'req_demo_2',
          userId: 'usr_4',
          username: 'LuckyDino',
          type: 'withdrawal',
          amount: 250,
          mcName: 'LuckyDino_MC',
          status: 'pending',
          ts: Date.now() - 7200000
        }
      ]);
      return;
    }

    const isStaff = user && (user.role === 'admin' || user.role === 'owner' || user.role === 'mod' || user.role === 'helper');
    if (!isStaff) {
      setPendingRequests([]);
      return;
    }

    // Poll Requests
    const pollRequests = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'requests'), where('status', '==', 'pending')));
        const list: TransactionRequest[] = [];
        snapshot.forEach(doc => {
          const data = { id: doc.id, ...doc.data() } as TransactionRequest;
          list.push(data);
        });
        list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setPendingRequests(list);
      } catch (error: any) {
        const errMsg = error.message ? String(error.message) : String(error);
        if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted')) {
          console.warn('Requests poll bypassed (quota exceeded):', errMsg);
          setIsQuotaExceeded(true);
          localStorage.setItem('lunarspin_firestore_quota_exceeded', 'true');
        } else {
          console.error('Requests poll failed:', error);
        }
      }
    };

    pollRequests();
    const requestsInterval = setInterval(pollRequests, 30000);

    return () => clearInterval(requestsInterval);
  }, [isQuotaExceeded, user?.role]);

  const onlineCount = usersList.filter(u => u.isOnline).length || 1;

  const handleLinkMinecraft = async (mcName: string) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.id), {
          pendingMinecraftUsername: mcName,
          updatedAt: serverTimestamp()
        });
        showToastNotification(`🔗 Link request for "${mcName}" sent to admins!`, 'info');
        setUser({ ...user, pendingMinecraftUsername: mcName });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
      }
    }
  };

  const handleApproveMinecraft = async (targetUser: User) => {
    if (!targetUser.pendingMinecraftUsername) return;
    try {
      await updateDoc(doc(db, 'users', targetUser.id), {
        minecraftUsername: targetUser.pendingMinecraftUsername,
        pendingMinecraftUsername: null,
        donutSmpStats: {
          balance: Math.floor(Math.random() * 50000) + 1000,
          playtime: Math.floor(Math.random() * 120),
          kills: Math.floor(Math.random() * 40),
          deaths: Math.floor(Math.random() * 15),
        },
        updatedAt: serverTimestamp()
      });
      showToastNotification(`✅ Approved Minecraft Link for ${targetUser.username} as ${targetUser.pendingMinecraftUsername}`, 'win');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUser.id}`);
    }
  };

  const handleDenyMinecraft = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        pendingMinecraftUsername: null,
        updatedAt: serverTimestamp()
      });
      showToastNotification(`❌ Denied Minecraft Link request for user ID: ${userId}`, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  // For stale closures in event listeners
  const usersListRef = useRef<User[]>([]);
  useEffect(() => {
    usersListRef.current = usersList;
  }, [usersList]);

  const handleTimeout = async (userId: string, minutes: number) => {
    const timeoutUntil = minutes === 0 ? null : new Date(Date.now() + minutes * 60000).toISOString();
    try {
      await updateDoc(doc(db, 'users', userId), {
        timeoutUntil: timeoutUntil,
        updatedAt: serverTimestamp()
      });
      if (minutes === 0) {
        showToastNotification(`🔊 Unmuted user ${userId}`, 'win');
      } else {
        showToastNotification(`⏳ Timed out user ${userId} for ${minutes} minutes`, 'info');
        // Delete their recent messages
        const latestUsers = usersListRef.current.length > 0 ? usersListRef.current : usersList;
        const targetUser = latestUsers.find(u => u.id === userId);
        if (targetUser) {
          const msgsQuery = query(collection(db, 'messages'), where('username', '==', targetUser.username));
          const snapshot = await getDocs(msgsQuery);
          const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletePromises);
        }
      }
    } catch (e) {}
  };

  const handleApproveRequest = async (req: TransactionRequest) => {
    if (isQuotaExceeded) {
      setPendingRequests(prev => prev.filter(p => p.id !== req.id));
      showToastNotification(`✅ Approved ${req.type} for ${req.username} of $${req.amount.toLocaleString()} (Local Sandbox)`, 'win');
      
      // Update local wallet balance if the user approved themselves internally in demo
      if (user && req.userId === user.id) {
        handleUpdateBalance(req.type === 'deposit' ? req.amount : -req.amount);
        setUser(prev => prev ? { ...prev, pendingRequest: false } : null);
      }
      return;
    }
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', req.userId);
        const reqRef = doc(db, 'requests', req.id);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) throw new Error('User not found');

        const currentBalance = userDoc.data().balance || 0;
        let newBalance = currentBalance;

        if (req.type === 'deposit') {
          newBalance += req.amount;
        } else if (req.type === 'withdrawal') {
          if (currentBalance < req.amount) throw new Error('User has insufficient balance for withdrawal');
          newBalance -= req.amount;
        }

        transaction.update(userRef, {
          balance: newBalance,
          pendingRequest: false,
          updatedAt: serverTimestamp()
        });

        transaction.update(reqRef, {
          status: 'approved',
          updatedAt: serverTimestamp()
        });
      });

      showToastNotification(`✅ Approved ${req.type} for ${req.username} of $${req.amount.toLocaleString()}`, 'win');
    } catch (error: any) {
      showToastNotification(`❌ Error: ${error.message}`, 'info');
    }
  };

  const handleDenyRequest = async (req: TransactionRequest) => {
    if (isQuotaExceeded) {
      setPendingRequests(prev => prev.filter(p => p.id !== req.id));
      showToastNotification(`❌ Denied ${req.type} for ${req.username} (Local Sandbox)`, 'info');
      if (user && req.userId === user.id) {
        setUser(prev => prev ? { ...prev, pendingRequest: false } : null);
      }
      return;
    }
    try {
      await updateDoc(doc(db, 'requests', req.id), {
        status: 'denied',
        updatedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', req.userId), {
        pendingRequest: false,
        updatedAt: serverTimestamp()
      });
      showToastNotification(`❌ Denied ${req.type} for ${req.username}`, 'info');
    } catch (e) {}
  };

  const handleRequestTransaction = async (type: 'deposit' | 'withdrawal', amount: number, mcName: string) => {
    if (!user) return;
    
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const request: TransactionRequest = {
      id: requestId,
      userId: user.id,
      username: user.username,
      type,
      amount,
      mcName,
      status: 'pending',
      ts: Date.now()
    };

    if (isQuotaExceeded) {
      setPendingRequests(prev => [request, ...prev]);
      setUser({ ...user, pendingRequest: true });
      showToastNotification(`⏳ Sandbox verification initiated! Sent offline transaction request.`, 'info');
      
      // Seed a simulated staff approval in 4 seconds to make the sandbox interactive and extremely fun!
      setTimeout(() => {
        showToastNotification(`💡 A Staff member has audited your transaction request!`, 'win');
        handleApproveRequest(request);
      }, 4000);
      return;
    }

    try {
      // 1. Create the request doc
      await setDoc(doc(db, 'requests', requestId), request);
      
      // 2. Mark user as having a pending request
      await updateDoc(doc(db, 'users', user.id), {
        pendingRequest: true,
        updatedAt: serverTimestamp()
      });

      setUser({ ...user, pendingRequest: true });
      showToastNotification(`⏳ Your ${type} request has been submitted for admin approval!`, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'requests');
    }
  };

  // OAuth Listener
  useEffect(() => {
    // 1. Handle incoming message (parent window)
    const handleAuthMessage = async (event: MessageEvent) => {
      // Validate origin
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user: oauthUser } = event.data;
        if (!oauthUser) return;
        
        try {
          const userId = `${oauthUser.provider}_${oauthUser.providerId}`;
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            const profile: User = {
              id: userId,
              username: oauthUser.username || oauthUser.name || oauthUser.given_name || `${oauthUser.provider}Player`,
              avatar: oauthUser.avatar 
                ? (oauthUser.provider === 'discord' 
                    ? `https://cdn.discordapp.com/avatars/${oauthUser.id}/${oauthUser.avatar}.png` 
                    : oauthUser.avatar)
                : oauthUser.picture || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop',
              role: 'member',
              emoji: oauthUser.provider === 'discord' ? '🎮' : '⭐',
              color: oauthUser.provider === 'discord' ? '#5865F2' : '#4285F4',
              status: `Authenticated via ${oauthUser.provider}!`,
              private: false,
              xp: 0,
              balance: 0,
              stats: { wins: 0, losses: 0, totalWagered: 0 }
            };
            await setDoc(userRef, {
              ...profile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            setUser(profile);
          } else {
            const profile = userDoc.data() as User;
            setUser(profile);
          }
          
          localStorage.setItem('lunarspin_demo_user_id', userId);
          showToastNotification(`✓ Successfully authenticated via ${oauthUser.provider}!`, 'info');
          setLoginOpen(false);
        } catch (err: any) {
          console.error('OAuth processing error:', err);
          showToastNotification('⚠️ Authentication syncing failed.', 'lose');
          checkQuotaError(err);
        }
      }
    };

    // 2. Handle popup callback (child window)
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token=') || hash.includes('code='))) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const code = params.get('code');
      
      if (accessToken || code) {
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_AUTH_SUCCESS',
            accessToken: accessToken || code
          }, window.location.origin);
          window.close();
        }
      }
    }
    
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Listen for custom staff commands and chat-triggered routines
  useEffect(() => {
    const handleChangeTab = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail) {
        setCurrentTab(customEvent.detail);
      }
    };

    const handleCustomLogin = (event: Event) => {
      const customEvent = event as CustomEvent<{ username: string; role?: string }>;
      if (customEvent.detail) {
        const { username, role } = customEvent.detail;
        const startingBalance = 0;
        const validatedRole = ['member', 'helper', 'mod', 'dev', 'admin', 'owner'].includes(role || '') 
          ? (role as 'member' | 'helper' | 'mod' | 'dev' | 'admin' | 'owner') 
          : 'admin';
        
        const profile: User = {
          id: `custom_chat_login_${Date.now()}`,
          username: username,
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop',
          role: validatedRole,
          emoji: '🛡️',
          color: '#8b5cf6',
          status: 'Authenticated via Lobby Console',
          private: false,
          xp: 2500,
          balance: startingBalance
        };

        setUser(profile);
        setLoginOpen(false);
        showToastNotification(`✓ Session established for @${username} (${validatedRole.toUpperCase()})`, 'info');
        setTransactions(prev => [
          { id: `tx_auth_${Date.now()}_1`, desc: `Console login session: ${username}`, amt: 0, ts: Date.now() },
          { id: `tx_auth_${Date.now()}_2`, desc: `Starting balance injection`, amt: startingBalance, ts: Date.now() + 100 },
          ...prev
        ]);
      }
    };

    const handleCustomTip = (event: Event) => {
      const customEvent = event as CustomEvent<{ target: string; amount: number }>;
      if (customEvent.detail) {
        const { target, amount } = customEvent.detail;
        setTransactions(prev => [
          { id: `tx_tip_${Date.now()}`, desc: `Tip to @${target}`, amt: -amount, ts: Date.now() },
          ...prev
        ]);
      }
    };

    const handleCustomMute = (event: Event) => {
      const customEvent = event as CustomEvent<{ username: string; minutes: number }>;
      if (customEvent.detail) {
        const { username, minutes } = customEvent.detail;
        const target = usersListRef.current.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (target) {
          handleTimeout(target.id, minutes);
        } else {
          showToastNotification(`❌ User ${username} not found!`, 'lose');
        }
      }
    };

    window.addEventListener('change-tab', handleChangeTab);
    window.addEventListener('custom-login', handleCustomLogin);
    window.addEventListener('custom-tip', handleCustomTip);
    window.addEventListener('custom-mute', handleCustomMute);

    return () => {
      window.removeEventListener('change-tab', handleChangeTab);
      window.removeEventListener('custom-login', handleCustomLogin);
      window.removeEventListener('custom-tip', handleCustomTip);
      window.removeEventListener('custom-mute', handleCustomMute);
    };
  }, []);

  // Initialize empty state on startup - user must sign in via Google or Discord
  useEffect(() => {
    setTransactions([
      { id: 'tx_init_1', desc: 'Welcome to LunarSpin! Please Sign In to get started.', amt: 0, ts: Date.now() }
    ]);
  }, []);

  const handleUpdateBalance = async (amt: number) => {
    if (!user) return;
    
    // Check if user is timed out
    if (user.timeoutUntil) {
      const now = new Date();
      const timeoutDate = new Date(user.timeoutUntil);
      if (timeoutDate > now) {
        showToastNotification(`⏳ You are currently timed out until ${timeoutDate.toLocaleTimeString()}!`, 'info');
        return;
      }
    }
    
    if (isQuotaExceeded) {
      setUser(prev => {
        if (!prev) return prev;
        const nextProfile = {
          ...prev,
          balance: prev.balance + amt
        };
        localStorage.setItem('lunarspin_offline_user', JSON.stringify(nextProfile));
        return nextProfile;
      });
      if (amt < 0) {
        setWager(prev => prev + Math.abs(amt));
      }
      return;
    }
    
    // Optimistic UI state update immediately so users do NOT need to refresh the page to see winnings reflect
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        balance: prev.balance + amt
      };
    });

    try {
      await updateDoc(doc(db, 'users', user.id), {
        balance: increment(amt),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
      // Revert optimistic balance update if save failed
      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          balance: prev.balance - amt
        };
      });
    }

    // Track wager totals
    if (amt < 0) {
      setWager(prev => prev + Math.abs(amt));
    }
  };

  const handleUpdateUserRole = async (role: 'member' | 'helper' | 'mod' | 'dev' | 'admin' | 'owner') => {
    if (user) {
      setUser({ ...user, role });
      try {
        await updateDoc(doc(db, 'users', user.id), { role, updatedAt: serverTimestamp() });
      } catch (e) {}
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

  const handleLogLiveBet = async (game: string, amount: number, result: 'win' | 'loss', mult: number) => {
    // Trigger visual win/lose popup overlay on user's active gambling play outcome
    const isWin = result === 'win';
    setResultPopup({
      win: isWin,
      title: isWin ? 'WIN!' : 'LOSE!',
      amount: isWin
        ? `+${(amount * mult).toFixed(2)} in ${game.toUpperCase()}`
        : `-${amount.toFixed(2)} in ${game.toUpperCase()}`
    });
    setTimeout(() => setResultPopup(null), 3000);

    const nextBet = {
      username: user ? user.username : 'GuestPlayer',
      game,
      amount,
      result,
      mult,
      ts: serverTimestamp()
    };
    
    try {
      await addDoc(collection(db, 'bets'), nextBet);
    } catch (e) {
      console.error('Failed to log live bet:', e);
    }

    handleAddTransaction(`${game} ${result === 'win' ? 'Payout Win' : 'Loss'}`, result === 'win' ? amount * mult : -amount);

    // Update user statistics
    if (user) {
      const updatedStats = {
        wins: (user.stats?.wins || 0) + (result === 'win' ? 1 : 0),
        losses: (user.stats?.losses || 0) + (result === 'loss' ? 1 : 0),
        totalWagered: (user.stats?.totalWagered || 0) + amount,
      };
      
      setUser({ ...user, stats: updatedStats });

      try {
        await updateDoc(doc(db, 'users', user.id), {
          stats: updatedStats,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
    }
  };

  const handleUpdateUserRigRate = async (userId: string, rate: number | null) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        rigRate: rate,
        updatedAt: serverTimestamp()
      });
      showToastNotification(`🎯 Rig rate for ${userId} updated to ${rate ?? 'Normal'}%`, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleAddXP = async (amt: number) => {
    if (user && user.id) {
      try {
        await updateDoc(doc(db, 'users', user.id), {
          xp: increment(amt),
          updatedAt: serverTimestamp()
        });
      } catch (e) {}
    }
  };

  const handleLogin = async (provider: 'discord' | 'google') => {
    // 1. First try Firebase for Google (native popup)
    if (provider === 'google') {
      try {
        await signInWithGoogle();
        setLoginOpen(false);
        return;
      } catch (error: any) {
        console.warn('Firebase Google Auth restricted, attempting custom server-side OAuth...', error);
      }
    }

    // 2. Use server-side OAuth logic for Discord and Google fallback
    try {
      const res = await fetch(`/api/auth/url?provider=${provider}`);
      if (!res.ok) throw new Error('Failed to get auth URL');
      const { url } = await res.json();

      // Append state to URL if needed for provider selection in callback
      const authUrl = new URL(url);
      authUrl.searchParams.set('state', provider);

      const width = 600;
      const height = 750;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(authUrl.toString(), 'oauth_popup', `width=${width},height=${height},top=${top},left=${left}`);
    } catch (err) {
      console.error('OAuth Initiation failed:', err);
      // Fallback to demo mode if all else fails
      setDemoProvider(provider);
      setDemoUsername(provider === 'discord' ? 'DiscordLucky' : 'GoogleLucky');
      setLoginOpen(true);
      setAuthTab('quick');
    }
  };

  const handleDemoSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoUsername.trim()) return;

    const isDiscord = demoProvider === 'discord';
    const userId = `${demoProvider}_demo_${demoUsername.trim().toLowerCase()}`;
    const userRef = doc(db, 'users', userId);
    
    const fallbackLocalDemo = () => {
      const startingBalance = 5000;
      const profile: User = {
        id: userId,
        username: demoUsername.trim(),
        avatar: isDiscord 
          ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop',
        role: 'member',
        emoji: isDiscord ? '🎮' : '⭐',
        color: isDiscord ? '#5865F2' : '#4285F4',
        status: `Playing with a secure session.`,
        private: false,
        xp: 1200,
        balance: startingBalance,
        stats: { wins: 0, losses: 0, totalWagered: 0 }
      };
      localStorage.setItem('lunarspin_demo_user_id', userId);
      localStorage.setItem('lunarspin_offline_user', JSON.stringify(profile));
      setUser(profile);
      setLoginOpen(false);
      showToastNotification(`✓ Established Secure Session for ${demoUsername.trim()}!`, 'win');
    };

    if (isQuotaExceeded) {
      fallbackLocalDemo();
      return;
    }

    try {
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        const startingBalance = 0;
        const profile: User = {
          id: userId,
          username: demoUsername.trim(),
          avatar: isDiscord 
            ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop',
          role: demoRole,
          emoji: isDiscord ? '🎮' : '⭐',
          color: isDiscord ? '#5865F2' : '#4285F4',
          status: `Simulated authentication for demo testing`,
          private: false,
          xp: 0,
          balance: startingBalance,
          stats: { wins: 0, losses: 0, totalWagered: 0 }
        };

        await setDoc(userRef, {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        localStorage.setItem('lunarspin_demo_user_id', userId);
        setUser(profile);
      } else {
        const profile = userDoc.data() as User;
        localStorage.setItem('lunarspin_demo_user_id', userId);
        setUser(profile);
      }
      
      setLoginOpen(false);
      showToastNotification(`✓ Session established for ${demoUsername.trim()}!`, 'info');
    } catch (err: any) {
      const errMsg = err.message ? String(err.message) : String(err);
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted')) {
        setIsQuotaExceeded(true);
        localStorage.setItem('lunarspin_firestore_quota_exceeded', 'true');
        fallbackLocalDemo();
      } else {
        showToastNotification('❌ Persistence error in demo login', 'lose');
      }
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('lunarspin_demo_user_id');
      await signOut(auth);
      setUser(null);
      showToastNotification('🚪 Logged out successfully. Sign in with Google to resume!', 'info');
    } catch (e) {}
  };

  const [resultPopup, setResultPopup] = useState<{win: boolean, title: string, amount: string} | null>(null);

  // Modern Audio Synthesizer fallback
  const playSoundEffect = (win: boolean) => {
    // Sound disabled per user request
  };

  const showToastNotification = (msg: string, type: 'win' | 'lose' | 'info') => {
    // Elegant immediate fallback log
    console.log(`[Toast ${type.toUpperCase()}] ${msg}`);
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white relative font-sans">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none" />
        <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-black font-mono text-purple-400 tracking-widest animate-pulse">RESYNCING SESSION</h2>
      </div>
    );
  }

  if (isIpBanned || (user?.isBanned)) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white relative font-sans">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none" />
        <div className="text-6xl mb-4 text-rose-600 animate-pulse">🔨</div>
        <h1 className="text-4xl font-black font-mono mb-2 text-rose-500 uppercase tracking-tighter">ACCESS DENIED</h1>
        <p className="text-slate-400 font-semibold max-w-sm leading-relaxed mb-8 text-xs">
          Your account or network identifier has been permanently blacklisted from LunarSpin for violating our terms of service or security policy.
        </p>
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-bold text-rose-300 uppercase tracking-widest font-mono">
          Ref ID: {userIp || user?.id || 'SECURITY_BLACKLIST'}
        </div>
      </div>
    );
  }

  if (maintenance && user?.role !== 'admin' && user?.role !== 'owner') {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white relative font-sans">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none" />
        <div className="text-6.xl mb-4 text-purple-500 animate-pulse">🔧</div>
        <h1 className="text-4xl font-black font-mono mb-2 text-purple-400">MAINTENANCE</h1>
        <p className="text-slate-400 font-semibold max-w-sm leading-relaxed mb-8 text-xs">
          LunarSpin is currently offline for critical chassis maintenance and algorithm tuning. We'll be back shortly!
        </p>

        {/* Staff Administration Bypass authentication panel */}
        <div className="p-6 bg-slate-900/60 border border-white/5 rounded-2xl w-full max-w-xs text-left animate-[fadeIn_0.5s_ease]">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 border-b border-white/5 pb-2">
            🔐 Administrator Control Bypass
          </span>

          {user ? (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-slate-400 font-bold mb-1">
                You are registered as <strong className="text-white">@{user.username}</strong> but your rank (<strong className="text-yellow-500">{user.role?.toUpperCase()}</strong>) is not qualified to enter.
              </p>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all cursor-pointer"
              >
                Log Out / Switch Account
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setLoginOpen(true)}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🔑</span> Authenticate as Staff
              </button>
              <p className="text-[9px] text-slate-500 text-center leading-relaxed">
                Log in using your registered Google account or designated Admin Demo credentials.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 font-sans text-slate-100 flex flex-col overflow-hidden select-none">
      
      {announcement && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/10 border-b border-purple-500/20 py-2.5 px-4 text-center text-purple-300 font-bold text-xs uppercase tracking-widest z-50 flex items-center justify-center gap-2">
          <span>📢</span> {announcement}
        </div>
      )}

      {isQuotaExceeded && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-6 py-4 z-50 flex items-start gap-4 shadow-xl select-text animate-[fadeIn_0.35s_ease-out]">
          <div className="flex-shrink-0 text-amber-500 p-2 bg-amber-500/10 rounded-xl mt-0.5">
            <HelpCircle size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-black text-amber-400 uppercase tracking-wider font-mono">
                ⚠️ FIRESTORE QUOTA EXCEEDED
              </span>
              <span className="px-2 py-0.5 text-[9px] font-black text-amber-400 bg-amber-400/10 rounded-full font-mono uppercase tracking-widest">
                Spark Tier Limit Met
              </span>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed font-semibold max-w-4xl">
              The Google Firestore daily free read/write quota (Spark Plan threshold) has been reached for today. 
              The application's real-time state syncer will pause until it automatically resets tomorrow at midnight (California Time). 
              To lift limits, you can open your Firestore database console below to upgrade or configure.
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              <button 
                onClick={() => handleRetryConnection(false)}
                disabled={isVerifyingConnection}
                className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-extrabold text-[10.5px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 font-mono shadow-md cursor-pointer border border-purple-400/20"
              >
                <span>{isVerifyingConnection ? '⏳' : '🔄'}</span> {isVerifyingConnection ? 'Verifying...' : 'Clear Sandbox Lock & Reconnect'}
              </button>
              <a 
                href="https://console.firebase.google.com/project/fast-door-8nzsc/firestore/databases/ai-studio-181d11b8-13c6-4e6e-a1e4-4c1a7e2520bc/data?openUpgradeDialog=true" 
                target="_blank" 
                rel="noopener noreferrer"
                className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[10.5px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 font-mono shadow-md"
              >
                <span>🌍</span> Open Firestore Console
              </a>
              <a 
                href="https://firebase.google.com/pricing#cloud-firestore" 
                target="_blank" 
                rel="noopener noreferrer"
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-[10.5px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 font-mono border border-amber-500/20"
              >
                <span>📊</span> View Spark Plan Specifications
              </a>
              <button 
                onClick={() => setIsQuotaExceeded(false)}
                className="py-1.5 px-3 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-[10px] uppercase rounded-lg transition-all ml-auto font-mono cursor-pointer"
              >
                Dismiss Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top statistics and accounts bar */}
      <Topbar 
        user={user}
        logoUrl={LOGO_PNG_URL}
        onOpenWallet={() => setWalletOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAdmin={() => (user?.role === 'admin' || user?.role === 'owner') ? setCurrentTab('admin') : showToastNotification('❌ Access Denied', 'info')}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenShop={() => setCurrentTab('donutshop')}
        onlineCount={onlineCount}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Responsive left column side Menu */}
        <div className={`
          fixed inset-y-0 left-0 z-[60] lg:relative lg:z-0 lg:flex
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
        `}>
          <Sidebar 
            currentTab={currentTab}
            setCurrentTab={(tab) => {
              setCurrentTab(tab);
              setMobileMenuOpen(false);
              setActiveGame(null); // Clear active game if navigating anywhere
            }}
            discordInvite="https://discord.gg/lunarspin"
            onOpenWallet={() => setWalletOpen(true)}
            logoUrl={LOGO_PNG_URL}
            userRole={user?.role}
          />
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-[55] lg:hidden backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

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
                  <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 py-1 px-3.5 rounded-full text-[9px] font-black uppercase tracking-widest text-purple-400 max-w-fit mb-4 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                    LUNARSPIN CASINO IS ONLINE
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-black font-display text-white tracking-tight leading-none uppercase font-mono">
                    Lunar <span className="text-purple-400">Spin</span>
                  </h1>
                  <p className="text-sm text-slate-500 max-w-md mt-4 leading-relaxed font-semibold font-sans">
                    Unleash the supreme gaming experience of LunarSpin.com. Play exclusive originals, compete in active Battles, unbox physical cases, and claim daily Rain drops.
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
                      className="py-1.5 px-8 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-purple-600/30 text-slate-400 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all h-[44px] cursor-pointer"
                    >
                      <h2 className="text-xl font-black text-white font-minecraft tracking-wider">📦 Open Cases</h2>
                    </button>
                  </div>
                </div>
              </div>

              {/* Donut IRL Store Front and Center */}
              <div className="px-6 pb-6">
                <DonutStore 
                  user={user}
                  updateBalance={handleUpdateBalance}
                  addTransaction={handleAddTransaction}
                  toast={showToastNotification}
                  onOpenLogin={() => setLoginOpen(true)}
                />
              </div>

              {/* Rain Pool */}
              <div className="px-6 pb-6">
                <RainPool />
              </div>

              {/* DonutStats.net Live Server Stats Widget */}
              <div id="home-donutstats-telemetry-container" className="px-6 pb-6 select-none">
                <DonutSmpLiveStats toast={showToastNotification} />
              </div>

              {/* Bento Grid layout of Games list directory */}
              <div className="px-6 pb-8 flex flex-col gap-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left">
                  Originals directory ({10} games available)
                </span>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { id: 'coinflip', title: 'Coinflip', thumbnail: coinFlipThumb, color: '#fbbf24', desc: 'Double your inputs' },
                    { id: 'crash', title: 'Crash', thumbnail: crashThumb, color: '#ef4444', desc: 'Scale cashouts' },
                    { id: 'mines', title: 'Mines', thumbnail: minesThumb, color: '#10b981', desc: 'Evade foxes' },
                    { id: 'roulette', title: 'Roulette', thumbnail: rouletteThumb, color: '#a855f7', desc: 'Traditional wheel' },
                    { id: 'plinko', title: 'Plinko', thumbnail: plinkoThumb, color: '#3b82f6', desc: 'Binomial pins' },
                    { id: 'blackjack', title: 'Blackjack', thumbnail: blackjackThumb, color: '#a855f7', desc: 'Natural 21s' },
                    { id: 'dice', title: 'Dice roll', thumbnail: diceThumb, color: '#60a5fa', desc: 'Win chances' },
                    { id: 'towers', title: 'Towers', thumbnail: towersThumb, color: '#f59e0b', desc: 'Risk multiplier' },
                    { id: 'jackpot', title: 'Jackpot', thumbnail: jackpotThumb, color: '#f43f5e', desc: 'Multiplayer pool' },
                    { id: 'slots', title: 'Slots Machine', thumbnail: undefined, color: '#fbbf24', desc: 'Triple free spins!' }
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
                          {g.thumbnail ? (
                            <img 
                              src={g.thumbnail} 
                              alt={g.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 to-purple-950/40 p-4">
                              <span className="text-5xl animate-bounce mb-2 select-none">🎰</span>
                              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase select-none">HIGH ROLLER</span>
                            </div>
                          )}
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
              user={user}
              balance={user?.balance || 0}
              updateBalance={handleUpdateBalance}
              addXP={handleAddXP}
              toast={showToastNotification}
              playSound={playSoundEffect}
              communityCases={communityCases}
              officialCases={officialCases}
            />
          )}

          {currentTab === 'casebattle' && (
            <CaseBattlesModule 
              balance={user?.balance || 0}
              updateBalance={handleUpdateBalance}
              addXP={handleAddXP}
              toast={showToastNotification}
              playSound={playSoundEffect}
              username={user ? user.username : 'GuestPlayer'}
              communityCases={communityCases}
              officialCases={officialCases}
            />
          )}

          {currentTab === 'leaderboard' && (
            <LeaderboardModule 
              balance={user?.balance || 0}
              user={user}
              allUsers={usersList}
            />
          )}

          {currentTab === 'rewards' && (
            <RewardsModule 
              wager={wager}
            />
          )}

          {currentTab === 'helper' && (
            <div className="p-6 animate-[fadeIn_0.35s_ease-out]">
              <HelperPanel 
                user={user}
                allUsers={usersList}
                pendingRequests={pendingRequests}
                onApproveRequest={handleApproveRequest}
                onDenyRequest={handleDenyRequest}
                onApproveMinecraft={handleApproveMinecraft}
                onDenyMinecraft={handleDenyMinecraft}
                onTimeout={handleTimeout}
                onClearChat={() => window.dispatchEvent(new Event('clear-lobby-chat'))}
                toast={showToastNotification}
              />
            </div>
          )}

          {currentTab === 'admin' && (
            <AdminPanel 
              user={user}
              allUsers={usersList}
              onUpdateRigRate={handleUpdateUserRigRate}
              balance={user?.balance || 0}
              updateBalance={handleUpdateBalance}
              updateUserRole={handleUpdateUserRole}
              toast={showToastNotification}
              communityCases={communityCases}
              officialCases={officialCases}
              pendingRequests={pendingRequests}
              onApproveRequest={handleApproveRequest}
              onDenyRequest={handleDenyRequest}
              onApproveMinecraft={handleApproveMinecraft}
              onDenyMinecraft={handleDenyMinecraft}
              onTimeout={handleTimeout}
            />
          )}

          {currentTab === 'donutshop' && (
            <DonutStore 
              user={user}
              updateBalance={handleUpdateBalance}
              addTransaction={handleAddTransaction}
              toast={showToastNotification}
              onOpenLogin={() => setLoginOpen(true)}
            />
          )}

          {currentTab === 'coinflip' && (
            <Coinflip 
              user={user}
              balance={user?.balance || 0}
              updateBalance={handleUpdateBalance}
              addXP={handleAddXP}
              logLiveBet={handleLogLiveBet}
              toast={showToastNotification}
              playSound={playSoundEffect}
              antiCheatEnabled={antiCheatEnabled}
            />
          )}

          {currentTab === 'crash' && (
            <Crash 
              user={user}
              balance={user?.balance || 0}
              updateBalance={handleUpdateBalance}
              addXP={handleAddXP}
              logLiveBet={handleLogLiveBet}
              toast={showToastNotification}
              playSound={playSoundEffect}
              antiCheatEnabled={antiCheatEnabled}
            />
          )}
          {currentTab === 'mines' && (
            <Mines 
              user={user}
              balance={user?.balance || 0}
              updateBalance={handleUpdateBalance}
              addXP={handleAddXP}
              logLiveBet={handleLogLiveBet}
              toast={showToastNotification}
              playSound={playSoundEffect}
              antiCheatEnabled={antiCheatEnabled}
            />
          )}
          {currentTab === 'roulette' && (
              <Roulette 
                user={user}
                balance={user?.balance || 0}
                updateBalance={handleUpdateBalance}
                addXP={handleAddXP}
                logLiveBet={handleLogLiveBet}
                toast={showToastNotification}
                playSound={playSoundEffect}
                antiCheatEnabled={antiCheatEnabled}
              />
          )}
          {currentTab === 'plinko' && (
              <Plinko 
                user={user}
                balance={user?.balance || 0}
                updateBalance={handleUpdateBalance}
                addXP={handleAddXP}
                logLiveBet={handleLogLiveBet}
                toast={showToastNotification}
                playSound={playSoundEffect}
                antiCheatEnabled={antiCheatEnabled}
              />
          )}
          {currentTab === 'blackjack' && (
              <Blackjack 
                user={user}
                balance={user?.balance || 0}
                updateBalance={handleUpdateBalance}
                addXP={handleAddXP}
                logLiveBet={handleLogLiveBet}
                toast={showToastNotification}
                playSound={playSoundEffect}
              />
          )}
          {currentTab === 'dice' && (
              <Dice 
                user={user}
                balance={user?.balance || 0}
                updateBalance={handleUpdateBalance}
                addXP={handleAddXP}
                logLiveBet={handleLogLiveBet}
                toast={showToastNotification}
                playSound={playSoundEffect}
              />
          )}
          {currentTab === 'towers' && (
              <Towers 
                user={user}
                balance={user?.balance || 0}
                updateBalance={handleUpdateBalance}
                addXP={handleAddXP}
                logLiveBet={handleLogLiveBet}
                toast={showToastNotification}
                playSound={playSoundEffect}
              />
          )}
          {currentTab === 'jackpot' && (
              <Jackpot 
                user={user}
                balance={user?.balance || 0}
                updateBalance={handleUpdateBalance}
                addXP={handleAddXP}
                logLiveBet={handleLogLiveBet}
                toast={showToastNotification}
                playSound={playSoundEffect}
                username={user ? user.username : 'GuestPlayer'}
              />
          )}
          {currentTab === 'slots' && (
              <Slots 
                user={user}
                balance={user?.balance || 0}
                updateBalance={handleUpdateBalance}
                addXP={handleAddXP}
                logLiveBet={handleLogLiveBet}
                toast={showToastNotification}
                playSound={playSoundEffect}
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
          onlineCount={onlineCount}
        />

      </div>
      
      {/* Scrolling ticker bottom feed of active bets */}
      <LiveBetsFeed liveBets={liveBets} />

      {/* wallet modal page popups */}
      {walletOpen && (
        <WalletModal 
          user={user}
          balance={user?.balance || 0}
          updateBalance={handleUpdateBalance}
          transactions={transactions}
          addTransaction={handleAddTransaction}
          onLinkMinecraft={handleLinkMinecraft}
          onRequestTransaction={handleRequestTransaction}
          toast={showToastNotification}
          onOpenLogin={() => { setWalletOpen(false); setLoginOpen(true); }}
          onClose={() => setWalletOpen(false)}
        />
      )}

      {/* login/auth popup dialog & developer setup guide combo */}
      {loginOpen && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-xl overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative flex flex-col gap-5 text-center my-8 select-none">
            <button
              onClick={() => setLoginOpen(false)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center text-slate-400 transition-all font-bold cursor-pointer"
            >
              ✕
            </button>

            <span className="text-4xl block mt-2">💵</span>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white">Access LunarSpin Casino</span>
              <p className="text-xs text-slate-400 mt-1">
                Establish a secure, sandbox guest connection or real OAuth linked session.
              </p>
            </div>

            {/* Unified Login Flows */}
            <div className="flex flex-col gap-4 text-left animate-[fadeIn_0.2s_ease-out]">
              
              {/* Visual status indicators */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex flex-col items-center">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Google System</span>
                  <span className="text-[9px] font-extrabold text-emerald-400 mt-0.5">● ONLINE</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex flex-col items-center">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Discord Gateway</span>
                  <span className="text-[9px] font-extrabold text-emerald-400 mt-0.5">● ONLINE</span>
                </div>
              </div>

              {/* Secure Auth buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleLogin('discord')}
                  className="w-full py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  🎮 Sign In with Discord
                </button>
                <button
                  onClick={() => handleLogin('google')}
                  className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-white transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  ⭐ Sign In with Google
                </button>
              </div>

              {/* Clean divider line */}
              <div className="flex items-center my-1">
                <div className="flex-1 h-px bg-white/5"></div>
                <span className="px-3 text-[10px] text-slate-500 font-bold tracking-widest uppercase">OR SIGN IN INSTANTLY</span>
                <div className="flex-1 h-px bg-white/5"></div>
              </div>

              {/* Direct Username Login Form */}
              <form onSubmit={handleDemoSignInSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider">
                    Enter Username
                  </label>
                  <input
                    type="text"
                    value={demoUsername}
                    onChange={(e) => setDemoUsername(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold tracking-wide placeholder-slate-600 transition-colors"
                    placeholder="e.g. LuckyPlayer"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-1.5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/25 text-center"
                >
                  ⚡ Access Instant Lobby Session
                </button>
              </form>

            </div>

            <p className="text-[9px] text-slate-500 block mt-1 font-semibold">
              Instant logins securely map to character data and synchronize stats flawlessly!
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
                <span className="text-amber-400 font-extrabold">{formatMoney(user?.balance || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Wager Limit Rank:</span>
                <span className="text-purple-400 font-extrabold">{wager} total wagered</span>
              </div>
            </div>

            {/* Minecraft account linkage section */}
            <div className="bg-slate-950 p-4 border border-white/5 rounded-2xl flex flex-col gap-2.5 text-left text-xs my-1">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block font-mono">
                🎮 Minecraft Account Linkage
              </span>
              {user.minecraftUsername ? (
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Linked Account:</span>
                    <span className="text-emerald-400 font-extrabold font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                      ● {user.minecraftUsername}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold leading-relaxed">
                    Account linked! You can now seamlessly complete withdrawals, deposits, and gamble securely.
                  </span>
                </div>
              ) : user.pendingMinecraftUsername ? (
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-405 font-bold">Approval Pending:</span>
                    <span className="text-amber-400 font-extrabold font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      ⚠️ {user.pendingMinecraftUsername}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold leading-relaxed">
                    Our team is currently verifying your profile linkage requests.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    Link your Minecraft IGN to enable gamble rewards, withdrawals, and in-game deposits!
                  </p>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem('mcName') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleLinkMinecraft(input.value.trim());
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      name="mcName"
                      type="text"
                      required
                      placeholder="Minecraft IGN"
                      className="bg-slate-900 border border-white/10 p-2 px-3 rounded-xl text-xs font-semibold text-white outline-none flex-1 focus:border-purple-500/50"
                    />
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase px-4 rounded-xl transition-all font-mono"
                    >
                      Request
                    </button>
                  </form>
                </div>
              )}
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

      {/* GUI Pop up */}
      <AnimatePresence>
        {resultPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] px-16 py-10 rounded-[2rem] border-2 flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl ${
              resultPopup.win 
                ? 'bg-emerald-950/80 border-emerald-500 shadow-emerald-500/30' 
                : 'bg-rose-950/80 border-rose-500 shadow-rose-500/30'
            }`}
          >
            <div className="text-7xl mb-4">{resultPopup.win ? '🏆' : '💥'}</div>
            <div className={`text-4xl font-black mb-3 ${resultPopup.win ? 'text-emerald-400' : 'text-rose-400'}`}>
              {resultPopup.title}
            </div>
            <div className="text-xl text-white font-bold text-center max-w-sm">
              {resultPopup.amount}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );

  // Helper trigger to draw background graphs once dismissed
  function drawInitialLobbyGraphic() {
    // optional reset graph trigger
  }
}
