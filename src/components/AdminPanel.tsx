import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Key, Plus, RefreshCw, Star, Trash2, 
  Terminal, Server, Users, CloudRain, Flame, Activity, Percent
} from 'lucide-react';
import { User as UserType, TransactionRequest, Case } from '../types';
import { parseBet } from '../utils';
import { 
  db, handleFirestoreError, OperationType,
  doc, 
  getDoc,
  setDoc,
  addDoc,
  deleteDoc, 
  updateDoc, 
  collection, 
  query, 
  getDocs,
  orderBy,
  runTransaction,
  increment,
  serverTimestamp 
} from '../lib/firebase';

interface AdminPanelProps {
  user: UserType | null;
  allUsers: UserType[];
  onUpdateRigRate: (userId: string, rate: number | null) => void;
  balance: number;
  updateBalance: (amt: number) => void;
  updateUserRole: (role: 'member' | 'helper' | 'mod' | 'dev' | 'admin' | 'owner') => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  communityCases: Case[];
  officialCases: Case[];
  pendingRequests: TransactionRequest[];
  onApproveRequest: (req: TransactionRequest) => void;
  onDenyRequest: (req: TransactionRequest) => void;
  onApproveMinecraft: (targetUser: UserType) => void;
  onDenyMinecraft: (userId: string) => void;
  onTimeout: (userId: string, minutes: number) => void;
}

interface CustomPromo {
  code: string;
  value: number;
  maxRedemptions: number;
  currentRedemptions: number;
}

export default function AdminPanel({
  user,
  allUsers,
  onUpdateRigRate,
  balance,
  updateBalance,
  updateUserRole,
  toast,
  communityCases,
  officialCases,
  pendingRequests,
  onApproveRequest,
  onDenyRequest,
  onApproveMinecraft,
  onDenyMinecraft,
  onTimeout
}: AdminPanelProps) {
  const [password, setPassword] = useState<string>('');
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'console' | 'economy' | 'promos' | 'odds' | 'security' | 'system'| 'smp' | 'users' | 'pending' | 'community' | 'official_cases'>('console');
  
  // Official Case Creator State
  const [newOffName, setNewOffName] = useState<string>('');
  const [newOffColor, setNewOffColor] = useState<string>('#8B4513');
  const [newOffDesc, setNewOffDesc] = useState<string>('Exclusive site original!');
  const [newOffItems, setNewOffItems] = useState<{name: string, value: number, percent: number, rarity: string}[]>([
    { name: 'Common Ingot', value: 2000, percent: 50, rarity: 'Common' },
    { name: 'Uncommon Charm', value: 8000, percent: 30, rarity: 'Uncommon' },
    { name: 'Rare Blade', value: 25050, percent: 15, rarity: 'Rare' },
    { name: 'Legendary Beacon', value: 120000, percent: 5, rarity: 'Legendary' }
  ]);
  
  // Track user-specific balance fields in admin panel
  const [userBalanceInputs, setUserBalanceInputs] = useState<Record<string, string>>({});
  
  // SMP Integration states
  const [checkSmpUser, setCheckSmpUser] = useState<string>('');
  
  // SMP Stats editing states
  const [selectedSmpUser, setSelectedSmpUser] = useState<UserType | null>(null);
  const [smpBalance, setSmpBalance] = useState<number>(0);
  const [smpPlaytime, setSmpPlaytime] = useState<number>(0);
  const [smpKills, setSmpKills] = useState<number>(0);
  const [smpDeaths, setSmpDeaths] = useState<number>(0);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // BOT REMOVED: handleUpdateBotUsername
  
  const handleCheckSmpStats = async () => {
    if (!checkSmpUser.trim()) return;
    const queryStr = checkSmpUser.trim().toLowerCase();
    
    // Find registered user by site username or minecraft username
    const foundUser = allUsers.find(
      u => (u.username && u.username.toLowerCase() === queryStr) || 
           (u.minecraftUsername && u.minecraftUsername.toLowerCase() === queryStr)
    );
    
    toast(`📡 Querying donutstats.net proxy database for "${checkSmpUser}"...`, 'info');

    try {
      const res = await fetch(`/api/donutstats/player/${encodeURIComponent(checkSmpUser.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        if (foundUser) {
          setSelectedSmpUser(foundUser);
          setSmpBalance(data.moneyNum);
          setSmpPlaytime(data.playtimeHours);
          setSmpKills(data.killsNum);
          setSmpDeaths(data.deathsNum);
          setIsSimulated(false);
          toast(`🔍 Found registered user with Live donutstats.net analytics: @${foundUser.username}`, 'win');
        } else {
          setSelectedSmpUser(null);
          setSmpBalance(data.moneyNum);
          setSmpPlaytime(data.playtimeHours);
          setSmpKills(data.killsNum);
          setSmpDeaths(data.deathsNum);
          setIsSimulated(true);
          toast(`✓ Player "${checkSmpUser}" found on donutstats.net. Retrieved live data!`, 'win');
        }
      } else {
        // Fallback if not found on donutstats.net website
        if (foundUser) {
          setSelectedSmpUser(foundUser);
          setSmpBalance(foundUser.donutSmpStats?.balance ?? 0);
          setSmpPlaytime(foundUser.donutSmpStats?.playtime ?? 0);
          setSmpKills(foundUser.donutSmpStats?.kills ?? 0);
          setSmpDeaths(foundUser.donutSmpStats?.deaths ?? 0);
          setIsSimulated(false);
          toast(`🔍 Found registered user: @${foundUser.username} (could not fetch live proxy stats)`, 'info');
        } else {
          // Return simulated player stats if not registered on our site and not on donutstats
          setSelectedSmpUser(null);
          setSmpBalance(Math.floor(Math.random() * 50000) + 500);
          setSmpPlaytime(Math.floor(Math.random() * 100) + 1);
          setSmpKills(Math.floor(Math.random() * 30));
          setSmpDeaths(Math.floor(Math.random() * 15));
          setIsSimulated(true);
          toast(`⚠️ MC name "${checkSmpUser}" not found on donutstats.net. Showing simulated snapshot.`, 'info');
        }
      }
    } catch (e: any) {
      if (foundUser) {
        setSelectedSmpUser(foundUser);
        setSmpBalance(foundUser.donutSmpStats?.balance ?? 0);
        setSmpPlaytime(foundUser.donutSmpStats?.playtime ?? 0);
        setSmpKills(foundUser.donutSmpStats?.kills ?? 0);
        setSmpDeaths(foundUser.donutSmpStats?.deaths ?? 0);
        setIsSimulated(false);
        toast(`🔍 Found registered user: @${foundUser.username}`, 'info');
      } else {
        setSelectedSmpUser(null);
        setSmpBalance(Math.floor(Math.random() * 50000) + 500);
        setSmpPlaytime(Math.floor(Math.random() * 100) + 1);
        setSmpKills(Math.floor(Math.random() * 30));
        setSmpDeaths(Math.floor(Math.random() * 15));
        setIsSimulated(true);
        toast(`⚠️ Network error connecting to proxy. Showing simulated snapshot.`, 'info');
      }
    }
  };

  const handleSaveSmpStats = async () => {
    if (!selectedSmpUser) {
      toast("❌ Cannot save stats for unregistered simulated players.", 'info');
      return;
    }
    try {
      const updatedStats = {
        balance: smpBalance,
        playtime: smpPlaytime,
        kills: smpKills,
        deaths: smpDeaths
      };
      await updateDoc(doc(db, 'users', selectedSmpUser.id), {
        donutSmpStats: updatedStats,
        updatedAt: serverTimestamp()
      });
      toast(`✓ Successfully updated DonutSMP Stats for @${selectedSmpUser.username}!`, 'info');
      
      setSelectedSmpUser({
        ...selectedSmpUser,
        donutSmpStats: updatedStats
      });
    } catch (err) {
      toast(`❌ Error updating stats: ${err instanceof Error ? err.message : String(err)}`, 'info');
    }
  };

  const [antiCheatEnabled, setAntiCheatEnabled] = useState<boolean>(false);
  const [banUsername, setBanUsername] = useState<string>('');
  const [bannedIps, setBannedIps] = useState<string[]>([]);

  // System Config states
  const [maintenanceEnabled, setMaintenanceEnabled] = useState<boolean>(false);
  const [announcementText, setAnnouncementText] = useState<string>('');
  
  const [grantAmt, setGrantAmt] = useState<number>(10000);
  const [grantTargetUserId, setGrantTargetUserId] = useState<string>('me');
  const [roleSelect, setRoleSelect] = useState<'member' | 'helper' | 'mod' | 'dev' | 'admin' | 'owner'>('admin');
  const [roleTargetUserId, setRoleTargetUserId] = useState<string>('me');
  
  // Custom Promo codes
  const [customCodes, setCustomCodes] = useState<CustomPromo[]>([]);
  const [newPromoCode, setNewPromoCode] = useState<string>('');
  const [newPromoVal, setNewPromoVal] = useState<number>(5000);
  const [newPromoMax, setNewPromoMax] = useState<number>(100);

  // Difficulty/Odds states
  const [winDifficulty, setWinDifficulty] = useState<string>('fair');
  
  // Simulated server stats
  const [serverTps, setServerTps] = useState<number>(20.0);
  const [systemLoad, setSystemLoad] = useState<number>(31.4);

    // Load difficulty and system config from Firestore
    useEffect(() => {
      // Poll Promos
      const pollPromos = async () => {
        try {
          const snapshot = await getDocs(query(collection(db, 'promos')));
          const list: CustomPromo[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as CustomPromo);
          });
          setCustomCodes(list);
        } catch (error) {
          console.error('Sync promos failed:', error);
          const errMsg = error instanceof Error ? error.message : String(error);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted')) {
            window.dispatchEvent(new CustomEvent('quota-exceeded'));
          }
        }
      };

      pollPromos();
      const intervalPromos = setInterval(pollPromos, 10000);

      // Poll Bans
      const pollBans = async () => {
        try {
          const snapshot = await getDocs(query(collection(db, 'bans')));
          const list: string[] = [];
          snapshot.forEach(doc => {
            list.push(doc.id);
          });
          setBannedIps(list);
        } catch (error) {
          console.error('Sync bans failed:', error);
          const errMsg = error instanceof Error ? error.message : String(error);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted')) {
            window.dispatchEvent(new CustomEvent('quota-exceeded'));
          }
        }
      };

      pollBans();
      const intervalBans = setInterval(pollBans, 30000);

      // Poll Global Config
      const pollConfig = async () => {
        try {
          const snap = await getDoc(doc(db, 'config', 'global'));
          if (snap.exists()) {
            const data = snap.data();
            if (data.winDifficulty) setWinDifficulty(data.winDifficulty);
            if (data.maintenanceEnabled !== undefined) setMaintenanceEnabled(data.maintenanceEnabled);
            if (data.announcementText !== undefined) setAnnouncementText(data.announcementText);
            if (data.antiCheatEnabled !== undefined) setAntiCheatEnabled(data.antiCheatEnabled);
          }
        } catch (error) {
          console.error('Admin config sync failed:', error);
          const errMsg = error instanceof Error ? error.message : String(error);
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted')) {
            window.dispatchEvent(new CustomEvent('quota-exceeded'));
          }
        }
      };

      pollConfig();
      const intervalConfig = setInterval(pollConfig, 10000);

      return () => {
        clearInterval(intervalPromos);
        clearInterval(intervalBans);
        clearInterval(intervalConfig);
      };
  }, []);

  // Fluctuating TPS for visual fidelity
  useEffect(() => {
    if (!unlocked) return;
    const interval = setInterval(() => {
      setServerTps(+(19.85 + Math.random() * 0.15).toFixed(2));
      setSystemLoad(+(28.5 + Math.random() * 6).toFixed(1));
    }, 3000);
    return () => clearInterval(interval);
  }, [unlocked]);

  const handleUnlock = () => {
    if (password === 'adminrico2011') {
      setUnlocked(true);
      toast('🔑 Access Granted! Welcome back, Admin.', 'info');
    } else {
      toast('❌ Wrong Password! Hint: Standard SMP Admin override keys apply.', 'info');
    }
  };

  const handleGrantFunds = async () => {
    if (grantAmt <= 0) return;
    if (grantTargetUserId === 'me') {
      updateBalance(grantAmt);
      toast(`✓ Credited +${grantAmt.toLocaleString()} Money directly into your player wallet!`, 'info');
    } else {
      try {
        await updateDoc(doc(db, 'users', grantTargetUserId), {
          balance: increment(grantAmt),
          updatedAt: serverTimestamp()
        });
        toast(`✓ Credited +${grantAmt.toLocaleString()} Money to targeted user!`, 'info');
      } catch (err) {
        toast(`❌ Failed to update targeted user's wallet.`, 'info');
      }
    }
  };

  const handleSaveRole = async () => {
    if (roleTargetUserId === 'me') {
      updateUserRole(roleSelect);
      toast(`✓ Your account group permissions overwrote to ${roleSelect.toUpperCase()}`, 'info');
    } else {
      try {
        await updateDoc(doc(db, 'users', roleTargetUserId), {
          role: roleSelect,
          updatedAt: serverTimestamp()
        });
        toast(`✓ Permissions group overwrote to ${roleSelect.toUpperCase()} for targeted user.`, 'info');
      } catch (err) {
        toast(`❌ Failed to assign role to targeted user.`, 'info');
      }
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newPromoCode.trim().toUpperCase();
    if (!code) return;

    if (customCodes.some(c => c.code === code)) {
      toast('That code already exists!', 'info');
      return;
    }

    const newPromo: CustomPromo = { 
      code, 
      value: newPromoVal, 
      maxRedemptions: newPromoMax, 
      currentRedemptions: 0 
    };

    try {
      await setDoc(doc(db, 'promos', code), newPromo);
      toast(`🎟️ Created promo code "${code}" with value ${newPromoVal} Money!`, 'info');
      setNewPromoCode('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'promos');
    }
  };

  const handleDeletePromo = async (codeToDelete: string) => {
    try {
      await deleteDoc(doc(db, 'promos', codeToDelete));
      toast(`✓ Promo code "${codeToDelete}" dissolved.`, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'promos');
    }
  };

  const handleUpdateDifficulty = async (difficulty: string) => {
    setWinDifficulty(difficulty);
    try {
      await setDoc(doc(db, 'config', 'global'), { winDifficulty: difficulty }, { merge: true });
      localStorage.setItem('casino_win_difficulty', difficulty); // Legacy fallback
      toast(`🎲 Calibrated odd biases to ${difficulty.toUpperCase()}!`, 'info');
    } catch (e) {}
  };

  const handleToggleAntiCheat = async () => {
    const newVal = !antiCheatEnabled;
    setAntiCheatEnabled(newVal);
    try {
      await setDoc(doc(db, 'config', 'global'), { antiCheatEnabled: newVal }, { merge: true });
      if (newVal) toast('🛡️ Secure Warden Anti-Cheat and VPN detection ENABLED!', 'info');
      else toast('⚠️ Anti-Cheat DISABLED! Site is vulnerable.', 'info');
    } catch (e) {}
  };

  const handleBanUser = async () => {
    if (!banUsername.trim()) return;
    
    // Find user
    const target = allUsers.find(u => u.username.toLowerCase() === banUsername.toLowerCase());
    
    try {
      if (target) {
        // Ban the account
        await updateDoc(doc(db, 'users', target.id), {
          isBanned: true,
          updatedAt: serverTimestamp()
        });
        
        // Ban the IP if exists
        if (target.ip && target.ip !== 'unknown') {
          await setDoc(doc(db, 'bans', target.ip), {
            bannedBy: user?.username || 'Admin',
            userId: target.id,
            username: target.username,
            ts: serverTimestamp()
          });
        }
        toast(`🔨 Ban Hammer has swung on @${target.username}! Account and IP blacklisted.`, 'win');
      } else {
        // Option to IP ban directly if it looks like an IP
        if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(banUsername)) {
          await setDoc(doc(db, 'bans', banUsername), {
            bannedBy: user?.username || 'Admin',
            ts: serverTimestamp()
          });
          toast(`🔨 IP Address ${banUsername} has been blacklisted.`, 'win');
        } else {
          toast(`❌ User "${banUsername}" not found.`, 'info');
        }
      }
      setBanUsername('');
    } catch (e) {
      toast('❌ Error applying ban.', 'info');
    }
  };

  const handleUnbanUser = async (identifier: string) => {
    try {
      // Check if it's an IP
      if (bannedIps.includes(identifier)) {
        await deleteDoc(doc(db, 'bans', identifier));
        toast(`✅ IP ${identifier} has been whitelisted.`, 'win');
        return;
      }

      // Check if it's a User ID or Username
      const target = allUsers.find(u => u.id === identifier || u.username.toLowerCase() === identifier.toLowerCase());
      if (target) {
        await updateDoc(doc(db, 'users', target.id), {
          isBanned: false,
          updatedAt: serverTimestamp()
        });
        
        // Also remove IP ban if linked
        if (target.ip) {
          await deleteDoc(doc(db, 'bans', target.ip));
        }
        toast(`✅ User @${target.username} has been unbanned.`, 'win');
      }
    } catch (e) {
      toast('❌ Error removing ban.', 'info');
    }
  };

  const handleChatCleanupAll = () => {
    window.dispatchEvent(new Event('clear-lobby-chat'));
    toast('🧹 Live Lobby chat history cleared successfully!', 'info');
  };

  const handleToggleMaintenance = async () => {
    const newVal = !maintenanceEnabled;
    setMaintenanceEnabled(newVal);
    try {
      await setDoc(doc(db, 'config', 'global'), { maintenanceEnabled: newVal }, { merge: true });
      toast(newVal ? '🔧 Maintenance Mode Enabled!' : '✅ Maintenance Mode Disabled!', 'info');
    } catch (e) {}
  };

  const handleUpdateAnnouncement = async () => {
    try {
      await setDoc(doc(db, 'config', 'global'), { announcementText }, { merge: true });
      toast('📢 Announcement Broadcasted Live!', 'info');
    } catch (e) {}
  };

  const handleWipeBalance = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        balance: 0,
        updatedAt: serverTimestamp()
      });
      toast(`💸 Wiped balance for user ${userId}`, 'info');
    } catch (e) {}
  };

  const handleWipeXP = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        xp: 0,
        updatedAt: serverTimestamp()
      });
      toast(`📉 Wiped XP for user ${userId}`, 'info');
    } catch (e) {}
  };

  const handleRemoveTimeout = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        timeoutUntil: null,
        updatedAt: serverTimestamp()
      });
      toast(`✅ Removed timeout for user ${userId}`, 'info');
    } catch (e) {}
  };

  const handleUpdateUserBalance = async (userId: string, balanceStr: string) => {
    const parsedAmt = parseBet(balanceStr);
    try {
      await updateDoc(doc(db, 'users', userId), {
        balance: parsedAmt,
        updatedAt: serverTimestamp()
      });
      toast(`✓ Updated player balance to $${parsedAmt.toLocaleString()}`, 'win');
    } catch (error: any) {
      toast(`❌ Error updating balance: ${error.message}`, 'info');
    }
  };

  const handleTipUser = async (userId: string, amountStr: string) => {
    const parsedAmt = parseBet(amountStr);
    if (parsedAmt <= 0) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        balance: increment(parsedAmt),
        updatedAt: serverTimestamp()
      });
      toast(`✓ Tipped $${parsedAmt.toLocaleString()} to user!`, 'win');
    } catch (error: any) {
      toast(`❌ Error tipping user: ${error.message}`, 'info');
    }
  };

  const handleDeleteCase = async (id: string, isOfficial: boolean) => {
    if (!window.confirm(`Delete this ${isOfficial ? 'official' : 'community'} case forever?`)) return;
    try {
      await deleteDoc(doc(db, isOfficial ? 'official_cases' : 'cases', id));
      toast('Case deleted successfully!', 'info');
    } catch (err) {
      toast('Failed to delete case.', 'lose');
    }
  };

  const handleWipeAllCases = async () => {
    if (!window.confirm('DANGER: This will delete ALL cases and ALL battle history. Continue?')) return;
    try {
      const qc = await getDocs(collection(db, 'cases'));
      const qo = await getDocs(collection(db, 'official_cases'));
      const qb = await getDocs(collection(db, 'battles'));
      
      const deletions = [
        ...qc.docs.map(d => deleteDoc(d.ref)),
        ...qo.docs.map(d => deleteDoc(d.ref)),
        ...qb.docs.map(d => deleteDoc(d.ref))
      ];
      
      await Promise.all(deletions);
      toast('🔥 The entire game database has been purged.', 'win');
    } catch (e) {
      toast('Failed to wipe cases.', 'lose');
    }
  };

  const calculateCasePrice = (itemsList: any[]) => {
    const ev = itemsList.reduce((acc, curr) => acc + (curr.value * (curr.percent / 100)), 0);
    return Math.ceil(ev * 1.05); // 5% house edge
  };

  const handleCreateOfficialCase = async () => {
    if (!newOffName.trim()) {
      toast('Please enter a case name!', 'info');
      return;
    }
    const sum = newOffItems.reduce((acc, it) => acc + it.percent, 0);
    if (Math.abs(100 - sum) > 0.0001) {
      toast(`Validation error: Total chance must be 100% (currently ${sum.toFixed(2)}%)`, 'info');
      return;
    }

    const price = calculateCasePrice(newOffItems);
    const caseData = {
      name: newOffName,
      price: price,
      desc: newOffDesc,
      icon: 'chest',
      color: newOffColor,
      createdAt: serverTimestamp(),
      items: newOffItems.map((it, idx) => ({
        id: `off_ci_${idx}_${Date.now()}`,
        ...it
      }))
    };

    try {
      await addDoc(collection(db, 'official_cases'), caseData);
      setNewOffName('');
      toast('✓ Official Case published!', 'win');
    } catch (e) {
      toast('Failed to create case.', 'lose');
    }
  };

  const handleSeedOfficialCases = async () => {
    const defaultCases = [
      {
        name: 'Money Case',
        price: 2500,
        color: '#22c55e',
        desc: 'Precious cash rolls of LunarSpin',
        icon: '💵',
        items: [
          { name: 'Common Bill Stack', percent: 40, value: 500, rarity: 'Common' },
          { name: 'Uncommon Loot Bundle', percent: 20, value: 1500, rarity: 'Common' },
          { name: 'Rare Cash Pack', percent: 15, value: 5000, rarity: 'Uncommon' },
          { name: 'Epic Money Bag', percent: 12, value: 12500, rarity: 'Uncommon' },
          { name: 'Safe Combination', percent: 8, value: 50000, rarity: 'Rare' },
          { name: 'Golden Vault Card', percent: 4, value: 120000, rarity: 'Epic' },
          { name: 'Jackpot Safe Box', percent: 0.9, value: 500000, rarity: 'Legendary' },
          { name: 'Infinite Coin Vault', percent: 0.1, value: 2500000, rarity: 'Mythic' }
        ]
      },
      {
        name: 'Spawner Case',
        price: 100000,
        color: '#d946ef',
        desc: 'High-yield generator mob traps',
        icon: '🥚',
        items: [
          { name: 'Chicken Spawner', percent: 40, value: 15000, rarity: 'Common' },
          { name: 'Cow Spawner', percent: 25, value: 45000, rarity: 'Common' },
          { name: 'Skeleton Spawner', percent: 15, value: 120000, rarity: 'Uncommon' },
          { name: 'Blaze Spawner', percent: 12, value: 300000, rarity: 'Rare' },
          { name: 'Iron Golem Spawner', percent: 7, value: 900000, rarity: 'Epic' },
          { name: 'Ender Dragon Spawner', percent: 1, value: 5000000, rarity: 'Mythic' }
        ]
      }
    ];

    try {
      for (const c of defaultCases) {
        await addDoc(collection(db, 'official_cases'), {
          ...c,
          createdAt: serverTimestamp(),
          items: c.items.map((it, idx) => ({ id: `seed_${idx}_${Date.now()}`, ...it }))
        });
      }
      toast('✓ Seeded official cases!', 'win');
    } catch (e) {
      toast('Failed to seed cases.', 'lose');
    }
  };

  if (!unlocked) {
    return (
      <div id="admin-passcode-gate" className="flex flex-col items-center justify-center p-12 bg-slate-950/20 my-10 border border-white/5 rounded-3xl max-w-sm mx-auto shadow-2xl animate-[popIn_0.3s_ease]">
        <Lock className="w-12 h-12 text-purple-500 block mb-4 animate-pulse" />
        <span className="text-sm font-extrabold text-white block font-sans">LUNAR SPIN STAFF CONSOLE</span>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 block font-mono">
          Enter master Administrator Key
        </span>

        <div className="w-full flex flex-col gap-3 mt-6">
          <input
            id="admin-password-input"
            type="password"
            placeholder="Type passcode..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-center text-xs font-bold text-white outline-none leading-none focus:border-purple-500/50"
          />

          <button
            id="admin-auth-btn"
            onClick={handleUnlock}
            className="py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-600/25"
          >
            Authenticate Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-main-panel" className="flex flex-col gap-6 p-4 max-w-3xl mx-auto animate-[fadeIn_0.3s_ease]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Staff Command Center</span>
            <span className="text-xl font-black text-white">⚙️ LUNAR_SMP MANAGEMENT CONSOLE</span>
          </div>
        </div>

        {/* Real-time Ticker stats */}
        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-2xl border border-white/5 font-mono text-[10px]">
          <div className="flex items-center gap-1.5" title="Ticks Per Second (Game Rate)">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">TPS:</span>
            <span className={serverTps > 19.9 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {serverTps}
            </span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1.5" title="Simulated Host CPU Load">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">LOAD:</span>
            <span className="text-indigo-300 font-bold">{systemLoad}%</span>
          </div>
          <span className="text-white/10">|</span>
          
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-4 md:grid-cols-10 bg-slate-950 p-1 rounded-2xl border border-white/5 gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('console')}
          className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
            activeTab === 'console' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          💻 Console
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
            activeTab === 'users' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          👥 Users
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
            activeTab === 'pending' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          ⏳ Pending
        </button>
        <button
          onClick={() => setActiveTab('smp')}
          className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
            activeTab === 'smp' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          🔗 SMP
        </button>
        <button
          onClick={() => setActiveTab('economy')}
          className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
            activeTab === 'economy' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          💰 Economy
        </button>
        <button
          onClick={() => setActiveTab('promos')}
          className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
            activeTab === 'promos' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          🎟️ Promos
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
            activeTab === 'security' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          🛡️ Security
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
            activeTab === 'system' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          ⚙️ System
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
            activeTab === 'community' ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          👥 Community
        </button>
        <button
          onClick={() => setActiveTab('official_cases')}
          className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
            activeTab === 'official_cases' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          💎 Official
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-4 text-left">
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
            <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              👥 Registered Users & Minecraft Profiles
            </span>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-black uppercase tracking-wider">
                    <th className="p-2 font-black">User</th>
                    <th className="p-2 font-black">MC Username</th>
                    <th className="p-2 font-black">Win Rate</th>
                    <th className="p-2 font-black">Wagered</th>
                    <th className="p-2 font-black">Site Balance</th>
                    <th className="p-2 font-black">Rig Control</th>
                    <th className="p-2 font-black">Role</th>
                    <th className="p-2 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => {
                    const totalGames = (u.stats?.wins || 0) + (u.stats?.losses || 0);
                    const winRate = totalGames > 0 ? ((u.stats?.wins || 0) / totalGames * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-2 flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs">
                            {u.emoji}
                          </div>
                          <span className="font-bold text-white">{u.username}</span>
                        </td>
                        <td className="p-2 font-mono text-purple-400 font-bold">
                          {u.minecraftUsername || 'Not Linked'}
                        </td>
                        <td className="p-2 font-mono text-emerald-400 font-bold">
                          {winRate}%
                        </td>
                        <td className="p-2 font-mono text-slate-400">
                          ${(u.stats?.totalWagered || 0).toLocaleString()}
                        </td>
                        <td className="p-2 min-w-[130px]">
                          <div className="flex gap-1">
                            <input 
                              type="text"
                              value={userBalanceInputs[u.id] ?? u.balance.toString()}
                              placeholder={u.balance.toLocaleString()}
                              onChange={(e) => {
                                setUserBalanceInputs(prev => ({ ...prev, [u.id]: e.target.value }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateUserBalance(u.id, userBalanceInputs[u.id] ?? u.balance.toString());
                                }
                              }}
                              className="w-[70px] bg-slate-950 border border-white/10 p-1 px-1.5 rounded text-[10px] text-amber-400 font-extrabold font-mono text-center"
                            />
                            <button 
                              onClick={() => handleUpdateUserBalance(u.id, userBalanceInputs[u.id] ?? u.balance.toString())}
                              className="px-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/10 rounded text-[9px] font-black uppercase cursor-pointer"
                              title="Set Balance (supports 1K, 1M, 1B)"
                            >
                              Set
                            </button>
                          </div>
                        </td>
                        <td className="p-2 min-w-[140px]">
                          <div className="flex gap-1.5">
                            <input 
                              type="number"
                              placeholder="Normal"
                              value={u.rigRate ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                onUpdateRigRate(u.id, val);
                              }}
                              className="w-16 bg-slate-950 border border-white/10 p-1 px-1.5 rounded text-[10px] text-white font-bold"
                            />
                            <button 
                              onClick={() => onUpdateRigRate(u.id, null)}
                              className="px-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[9px] font-bold"
                            >
                              Reset
                            </button>
                          </div>
                        </td>
                        <td className="p-2">
                          <select
                            value={u.role}
                            onChange={(e) => {
                              const newRole = e.target.value as any;
                              updateDoc(doc(db, 'users', u.id), { role: newRole, updatedAt: serverTimestamp() });
                              toast(`✓ @${u.username} role updated to ${newRole.toUpperCase()}`, 'info');
                            }}
                            className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[8px] font-black uppercase text-purple-400 outline-none cursor-pointer"
                          >
                            <option value="member">Member</option>
                            <option value="helper">Helper</option>
                            <option value="mod">Mod</option>
                            <option value="dev">Dev</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button 
                              onClick={() => handleWipeBalance(u.id)}
                              title="Wipe Money"
                              className="w-7 h-7 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded flex items-center justify-center transition-all cursor-pointer"
                            >
                              💸
                            </button>
                            <button 
                              onClick={() => {
                                const amt = prompt(`Enter amount to tip @${u.username}:`);
                                if (amt) {
                                  handleTipUser(u.id, amt);
                                }
                              }}
                              title="Tip User (Add to balance)"
                              className="w-7 h-7 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded flex items-center justify-center transition-all cursor-pointer"
                            >
                              💰
                            </button>
                            <button 
                              onClick={() => handleWipeXP(u.id)}
                              title="Wipe XP"
                              className="w-7 h-7 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded flex items-center justify-center transition-all cursor-pointer"
                            >
                              📉
                            </button>
                            {u.timeoutUntil ? (
                              <button 
                                onClick={() => handleRemoveTimeout(u.id)}
                                title="Remove Timeout"
                                className="px-2 h-7 bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-black uppercase rounded transition-all cursor-pointer"
                              >
                                Free
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => onTimeout(u.id, 10)}
                                  title="10m Timeout"
                                  className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-white/5 rounded flex items-center justify-center text-[10px] font-bold cursor-pointer"
                                >
                                  10m
                                </button>
                                <button 
                                  onClick={() => onTimeout(u.id, 60)}
                                  title="1h Timeout"
                                  className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-white/5 rounded flex items-center justify-center text-[10px] font-bold cursor-pointer"
                                >
                                  1h
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="flex flex-col gap-4 text-left">
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
            <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              ⏳ Pending Minecraft Link Requests
            </span>
            <div className="flex flex-col gap-2 mt-4">
              {allUsers.filter(u => u.pendingMinecraftUsername).map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-slate-950 border border-white/10 rounded-xl">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                        LINK REQUEST
                      </span>
                      <span className="text-xs font-bold text-white">{u.username}</span>
                    </div>
                    <span className="text-[10px] text-purple-400 font-bold mt-1">
                      Wants to link: {u.pendingMinecraftUsername}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onApproveMinecraft(u)}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => onDenyMinecraft(u.id)}
                      className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black uppercase rounded-lg transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
              {allUsers.filter(u => u.pendingMinecraftUsername).length === 0 && (
                <div className="py-12 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">
                  No pending link requests found.
                </div>
              )}
            </div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
            <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              ⏳ Pending Deposit & Withdrawal Requests
            </span>
            <div className="flex flex-col gap-2 mt-4">
              {pendingRequests.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-950 border border-white/10 rounded-xl">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {tx.type}
                      </span>
                      <span className="text-xs font-bold text-white">{tx.username}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono mt-1">
                      Target: {tx.mcName} • {tx.ts?.toDate ? tx.ts.toDate().toLocaleString() : 'Just now'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-white">${tx.amount.toLocaleString()}</span>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => onApproveRequest(tx)}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => onDenyRequest(tx)}
                        className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black uppercase rounded-lg transition-colors"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <div className="py-12 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">
                  No pending requests found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'smp' && (
        <div className="flex flex-col gap-4 text-left w-full">
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3">
            <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              🔍 SMP Player Stats Search (donutstats.net proxy)
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="MC Username (e.g., BC3500, Abuodee)..."
                value={checkSmpUser}
                onChange={(e) => setCheckSmpUser(e.target.value)}
                className="bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-extrabold text-white outline-none flex-1 font-mono"
              />
              <button
                onClick={handleCheckSmpStats}
                className="px-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase rounded-xl transition-colors cursor-pointer"
              >
                Lookup
              </button>
            </div>
            <p className="text-[9px] text-slate-500 tracking-wide font-sans mt-1">
              Search by LunarSpin username or linked Minecraft IGN to pull real-time stats directly via our donutstats.net proxy interface.
            </p>
          </div>

          {/* SMP Stats Edit Result Box */}
          {(selectedSmpUser || isSimulated) && (
            <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-4 text-left w-full">
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    📊 {selectedSmpUser ? `Registered Minecraft Stats: @${selectedSmpUser.username}` : `Simulated Minecraft Stats: ${checkSmpUser}`}
                  </span>
                  {selectedSmpUser && (
                    <span className="text-[9px] font-semibold text-slate-500 mt-1 font-mono">
                      Linked IGN: {selectedSmpUser.minecraftUsername || 'None'} • Site ID: {selectedSmpUser.id}
                    </span>
                  )}
                </div>
                {isSimulated ? (
                  <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Simulated User
                  </span>
                ) : (
                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Registered & Linked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-1">
                <div className="flex flex-col gap-1 bg-slate-950 p-3 rounded-xl border border-white/5">
                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">DonutSMP Money Balance</span>
                  <input
                    type="number"
                    disabled={isSimulated}
                    value={smpBalance}
                    onChange={(e) => setSmpBalance(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`bg-transparent border-0 p-0 text-amber-400 font-extrabold text-xs outline-none font-mono ${isSimulated ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div className="flex flex-col gap-1 bg-slate-950 p-3 rounded-xl border border-white/5">
                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Playtime (Hours)</span>
                  <input
                    type="number"
                    disabled={isSimulated}
                    value={smpPlaytime}
                    onChange={(e) => setSmpPlaytime(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`bg-transparent border-0 p-0 text-white font-extrabold text-xs outline-none font-mono ${isSimulated ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div className="flex flex-col gap-1 bg-slate-950 p-3 rounded-xl border border-white/5">
                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Kills Stat</span>
                  <input
                    type="number"
                    disabled={isSimulated}
                    value={smpKills}
                    onChange={(e) => setSmpKills(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`bg-transparent border-0 p-0 text-emerald-400 font-extrabold text-xs outline-none font-mono ${isSimulated ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div className="flex flex-col gap-1 bg-slate-950 p-3 rounded-xl border border-white/5">
                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Deaths Stat</span>
                  <input
                    type="number"
                    disabled={isSimulated}
                    value={smpDeaths}
                    onChange={(e) => setSmpDeaths(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`bg-transparent border-0 p-0 text-rose-500 font-extrabold text-xs outline-none font-mono ${isSimulated ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {!isSimulated && selectedSmpUser && (
                <div className="flex justify-end mt-1">
                  <button
                    onClick={handleSaveSmpStats}
                    className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/15 cursor-pointer"
                  >
                    💾 Save stats to database
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {activeTab === 'console' && (
        <div id="panel-console" className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          
          {/* Chat clean & Rain commands */}
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3 justify-between">
            <div>
              <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                📢 Active Lobby Broadcasts & Controls
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-2 font-medium">
                Admin commands bypass standard security limits. Wiping Chat logs clears active spam, while starting an organic Rain Fall showers dynamic bonus cash onto claims immediately.
              </p>
            </div>
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={handleChatCleanupAll}
                className="flex-1 py-3 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-500/10 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                🧹 Wipe Chat History
              </button>
              <button
                className="flex-1 py-3 bg-purple-950/35 hover:bg-purple-950/50 text-purple-300 border border-purple-500/20 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <CloudRain className="w-3.5 h-3.5 text-purple-400" /> Force Rain Drop
              </button>
            </div>
          </div>
          
        </div>
      )}

      {activeTab === 'economy' && (
        <div id="panel-economy" className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          
          {/* Grant Funds Module */}
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3 justify-between">
            <div>
              <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                💵 Operator balance injection
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-2 font-medium">
                Directly inject money into your player balance wallet instantly. Handy for testing games, inspecting payouts, or simulating large high-roller casino wagers.
              </p>
            </div>

            <div className="flex gap-2 mt-4 flex-col">
              <select
                value={grantTargetUserId}
                onChange={(e) => setGrantTargetUserId(e.target.value)}
                className="bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-slate-300 outline-none w-full"
              >
                <option value="me">Myself ({user?.username})</option>
                <optgroup label="Other Players">
                  {allUsers.filter(u => u.id !== user?.id).map((u) => (
                    <option key={`grant_u_${u.id}`} value={u.id}>@{u.username} ({u.role})</option>
                  ))}
                </optgroup>
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={grantAmt}
                  onChange={(e) => setGrantAmt(Math.max(1, Math.floor(parseFloat(e.target.value)) || 0))}
                  className="bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-extrabold text-white outline-none flex-1 leading-none font-mono"
                />
                <button
                  onClick={handleGrantFunds}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase rounded-xl cursor-pointer transition-colors"
                >
                  Add Money
                </button>
              </div>
            </div>
          </div>

          {/* Group Roles overwrite */}
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3 justify-between">
            <div>
              <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                👑 Overwrite permissions group
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-2 font-medium">
                Overwrite player user ranks immediately to test group limitations. Overwrites update topbar badge aesthetics, chat message ranks, and live profiles.
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <select
                value={roleTargetUserId}
                onChange={(e) => setRoleTargetUserId(e.target.value)}
                className="bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-slate-300 outline-none w-full mb-2"
              >
                <option value="me">Myself ({user?.username})</option>
                <optgroup label="Other Players">
                  {allUsers.filter(u => u.id !== user?.id).map((u) => (
                    <option key={`role_u_${u.id}`} value={u.id}>@{u.username} ({u.role})</option>
                  ))}
                </optgroup>
              </select>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { id: 'member', label: 'Member', icon: '🎮' },
                  { id: 'helper', label: 'Helper', icon: '🤝' },
                  { id: 'mod', label: 'Mod', icon: '⚔️' },
                  { id: 'dev', label: 'Dev', icon: '💻' },
                  { id: 'admin', label: 'Admin', icon: '🛡️' },
                  { id: 'owner', label: 'Owner', icon: '👑' }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRoleSelect(r.id as any)}
                    className={`py-2.5 px-3 rounded-xl border font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5
                      ${roleSelect === r.id 
                        ? 'bg-purple-600/20 border-purple-500/40 text-purple-400' 
                        : 'bg-slate-950 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
                  >
                    <span>{r.icon}</span> {r.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSaveRole}
                className="w-full py-3 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[10px] uppercase rounded-xl cursor-pointer transition-all shadow-lg shadow-purple-600/20"
              >
                Save Permissions Group
              </button>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'promos' && (
        <div id="panel-promos" className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          
          {/* Create Promo code form */}
          <form onSubmit={handleCreatePromo} className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3 justify-between">
            <div>
              <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                🎟️ Forge New promo code
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-2 font-medium">
                Create custom codes redeemable in the real player wallet modal. Generated codes save directly in the cache so your community can redeem them.
              </p>
            </div>

            <div className="flex flex-col gap-3.5 mt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase select-none">CODE STRING</span>
                <input
                  type="text"
                  placeholder="e.g. EXTRA50K, CHIPRED"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value)}
                  required
                  className="bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-extrabold text-white outline-none leading-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase select-none font-mono">COIN VALUE AWARD</span>
                  <input
                    type="number"
                    value={newPromoVal}
                    onChange={(e) => setNewPromoVal(Math.max(1, parseInt(e.target.value) || 0))}
                    required
                    className="bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-extrabold text-white outline-none leading-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase select-none font-mono">MAX REDEMPTIONS</span>
                  <input
                    type="number"
                    value={newPromoMax}
                    onChange={(e) => setNewPromoMax(Math.max(1, parseInt(e.target.value) || 0))}
                    required
                    className="bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-extrabold text-white outline-none leading-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-lg shadow-purple-650/15"
              >
                <Plus className="w-4 h-4" /> Forge Promo Code
              </button>
            </div>
          </form>

          {/* Active custom promos list */}
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3 justify-between">
            <div>
              <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                📋 Currently active custom codes
              </span>
              <p className="text-[10px] text-slate-400  mb-3 mt-2 font-medium leading-relaxed">
                Active community-forged code keys. Players can paste these keys into their profile Wallet modal's Promo tab.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[190px] border border-white/5 rounded-xl bg-slate-950 p-2.5 flex flex-col gap-2 min-h-[160px]">
              {customCodes.length === 0 ? (
                <div className="m-auto text-center flex flex-col items-center gap-1 p-4">
                  <Star className="w-5 h-5 text-slate-750" />
                  <span className="text-[10px] text-slate-600 font-extrabold uppercase tracking-wider font-mono">No Custom Promos</span>
                </div>
              ) : (
                customCodes.map((c) => (
                  <div key={c.code} className="flex items-center justify-between bg-slate-900 border border-white/5 p-2 rounded-lg pr-1">
                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-xs font-black font-mono text-purple-300 truncate">{c.code}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 font-bold font-mono">+{c.value.toLocaleString()} Money</span>
                        <span className="text-[9px] text-slate-600 font-black">|</span>
                        <span className={`text-[9px] font-black font-mono ${c.currentRedemptions >= c.maxRedemptions ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {c.currentRedemptions}/{c.maxRedemptions} USES
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePromo(c.code)}
                      className="p-1 px-2.5 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                      title="Delete code"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'odds' && (
        <div id="panel-odds" className="max-w-md mx-auto w-full text-left">
          
          {/* Cheat and rig modes calibration */}
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3">
            <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Percent className="w-4 h-4 text-purple-400" /> Administrative Casino Odds Bias Control
            </span>
            <p className="text-[10px] text-slate-400 leading-relaxed mt-1 font-medium">
              Calibrate default house-edge coefficients across casino gaming engines. Settings calibrate mines RNG paths, crash multipliers limiters, jackpot win-rates, and tower block probabilities!
            </p>

            <div className="flex flex-col gap-3.5 mt-4">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'god', label: '👑 Admin God-Mode (99% Player Win)', desc: 'Rig games to win almost every turn. Testing payouts & multipliers is a breeze.' },
                  { id: 'lucky', label: '🍀 Lucky Tier (75% Win Bias)', desc: 'Considerable player-favoured bonus calibrator. Wins hit very frequently.' },
                  { id: 'fair', label: '⚖️ Fair Play (50% Standard Odds)', desc: 'Standard fair mechanics. Minecraft native server default percentages apply.' },
                  { id: 'rigged', label: '⚠️ Strict House Edge (Rigged - 15% Player Win)', desc: 'Intense SMP administrative tax rate. Highly profitable house configuration.' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleUpdateDifficulty(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      winDifficulty === opt.id 
                        ? 'bg-purple-950/20 border-purple-500/40 shadow-inner' 
                        : 'bg-slate-950 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <span className={`text-[10px] font-black ${winDifficulty === opt.id ? 'text-purple-300' : 'text-slate-300'}`}>
                      {opt.label}
                    </span>
                    <span className="text-[9px] text-slate-500 leading-relaxed font-semibold">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'security' && (
        <div id="panel-security" className="flex flex-col gap-6 text-left">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Anti-Cheat Configuration */}
            <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3 justify-between">
              <div>
                <span className="text-xs font-black text-rose-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Shield className="w-4 h-4 text-rose-400" /> Secure Warden Anti-Cheat & VPN Detection
                </span>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-2 font-medium">
                  Detects proxy patterns, high-frequency autoclickers, and VPN tunneling. Uses server-authoritative randomness when enabled to prevent client-side manipulation.
                </p>
              </div>
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={handleToggleAntiCheat}
                  className={`w-full py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
                    antiCheatEnabled 
                      ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/50' 
                      : 'bg-slate-950 hover:bg-slate-900 text-slate-400 border-white/10'
                  }`}
                >
                  {antiCheatEnabled ? 'Disable Secure Warden' : 'Enable Anti-Cheat / VPN Block'}
                </button>
              </div>
            </div>

            {/* Ban Hammer configuration */}
            <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3 justify-between">
              <div>
                <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                  🔨 Administrative Ban Hammer
                </span>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-2 font-medium">
                  Instantly IP ban and account-lock malicious users permanently. You can enter a Username or a direct IPv4 address.
                </p>
              </div>
              <div className="flex gap-2.5 mt-4">
                <input
                  type="text"
                  placeholder="Username or IP..."
                  value={banUsername}
                  onChange={(e) => setBanUsername(e.target.value)}
                  className="bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-extrabold text-white outline-none flex-1 leading-none font-mono"
                />
                <button
                  onClick={handleBanUser}
                  className="py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase rounded-xl cursor-pointer transition-colors"
                >
                  BAN NOW
                </button>
              </div>
            </div>
          </div>

          {/* Active Bans List */}
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
            <span className="text-xs font-black text-white mb-4 block border-b border-white/5 pb-2">
              📋 Active Punishment Database
            </span>
            
            <div className="flex flex-col gap-2">
              {/* Account Bans */}
              {allUsers.filter(u => u.isBanned).map(ub => (
                <div key={ub.id} className="flex items-center justify-between p-3 bg-slate-950 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-rose-950/30 border border-rose-500/20 flex items-center justify-center text-xs">
                      🔨
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white">@{ub.username}</span>
                      <span className="text-[9px] text-slate-500 font-mono">ID: {ub.id} • IP: {ub.ip || 'Unknown'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUnbanUser(ub.id)}
                    className="py-1.5 px-4 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white text-[9px] font-black uppercase rounded-lg transition-all"
                  >
                    Unban Account
                  </button>
                </div>
              ))}

              {/* IP Bans (Anonymous or IP only) */}
              {bannedIps.filter(ip => !allUsers.some(u => u.ip === ip && u.isBanned)).map(ip => (
                <div key={ip} className="flex items-center justify-between p-3 bg-slate-950 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-rose-950/30 border border-rose-500/20 flex items-center justify-center text-xs">
                      🌐
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white">IP: {ip}</span>
                      <span className="text-[9px] text-slate-500 font-mono">Direct Network Block</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUnbanUser(ip)}
                    className="py-1.5 px-4 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white text-[9px] font-black uppercase rounded-lg transition-all"
                  >
                    Unban IP
                  </button>
                </div>
              ))}

              {allUsers.filter(u => u.isBanned).length === 0 && bannedIps.length === 0 && (
                <div className="py-10 text-center text-slate-600 font-bold uppercase tracking-widest text-[9px]">
                  No active bans in database. Site is in "Low Restraint" mode.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'system' && (
        <div id="panel-system" className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Main System Controls */}
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col gap-3">
            <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              ⚙️ Global System Overrides
            </span>
            
            <div className="mt-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 block">Global Maintenance Mode</label>
              <button
                onClick={handleToggleMaintenance}
                className={`w-full py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
                  maintenanceEnabled 
                    ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/50' 
                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                }`}
              >
                {maintenanceEnabled ? 'Site Offline (Click to Enable)' : 'Site Online (Click to Disable)'}
              </button>
            </div>

            <div className="mt-4">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 block">Public Announcement Broadcast</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Leave empty to clear..."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white outline-none flex-1 leading-none"
                />
                <button
                  onClick={handleUpdateAnnouncement}
                  className="py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase rounded-xl cursor-pointer transition-colors"
                >
                  BROADCAST
                </button>
              </div>
            </div>
          </div>


        </div>
      )}

      {activeTab === 'official_cases' && (
        <div className="flex flex-col gap-6 text-left">
          {/* Creator Forge for Officials */}
          <div className="p-6 bg-slate-900/60 border-2 border-indigo-500/20 rounded-3xl animate-[fadeIn_0.2s_ease]">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-6">
              <span className="text-base text-indigo-400">💎</span> Official Case Forge
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col gap-1.5 col-span-2">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Case Name</span>
                <input
                  type="text"
                  placeholder="e.g. Master God Chest"
                  value={newOffName}
                  onChange={(e) => setNewOffName(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none focus:border-indigo-500/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Color Accent</span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newOffColor}
                    onChange={(e) => setNewOffColor(e.target.value)}
                    className="w-10 h-10 border border-white/10 rounded-xl cursor-pointer bg-transparent p-0 overflow-hidden"
                  />
                   <input
                    type="text"
                    value={newOffColor}
                    onChange={(e) => setNewOffColor(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold font-mono outline-none flex-1"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Price (EV + 5%)</span>
                <div className="bg-slate-950 border border-white/10 rounded-xl p-3 text-emerald-400 text-xs font-black leading-none font-mono">
                  ${calculateCasePrice(newOffItems).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1.5 col-span-2">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Description</span>
                <input
                  type="text"
                  placeholder="Compelling marketing text..."
                  value={newOffDesc}
                  onChange={(e) => setNewOffDesc(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="border border-white/5 rounded-2xl bg-slate-950/40 p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-white uppercase tracking-wider">Configure Rewards</span>
                <button
                  onClick={() => setNewOffItems([...newOffItems, { name: 'New Item', value: 1000, percent: 10, rarity: 'Common' }])}
                  className="py-1.5 px-3 bg-white/5 border border-white/10 hover:border-indigo-500/30 text-indigo-400 font-bold text-[9px] uppercase rounded-lg transition-all"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {newOffItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...newOffItems] as any[];
                        updated[idx].name = e.target.value;
                        setNewOffItems(updated);
                      }}
                      className="bg-slate-950 border border-white/5 rounded-lg p-2 text-[10px] text-white outline-none flex-1"
                    />
                    <input
                      type="number"
                      value={item.value}
                      onChange={(e) => {
                        const updated = [...newOffItems] as any[];
                        updated[idx].value = parseInt(e.target.value) || 0;
                        setNewOffItems(updated);
                      }}
                      className="bg-slate-950 border border-white/5 rounded-lg p-2 text-[10px] text-white outline-none w-20"
                    />
                    <input
                      type="number"
                      value={item.percent}
                      onChange={(e) => {
                        const updated = [...newOffItems] as any[];
                        updated[idx].percent = parseFloat(e.target.value) || 0;
                        setNewOffItems(updated);
                      }}
                      className="bg-slate-950 border border-white/5 rounded-lg p-2 text-[10px] text-white outline-none w-16"
                    />
                    <select
                      value={item.rarity}
                      onChange={(e) => {
                        const updated = [...newOffItems] as any[];
                        updated[idx].rarity = e.target.value;
                        setNewOffItems(updated);
                      }}
                      className="bg-slate-950 border border-white/5 rounded-lg p-2 text-[10px] text-white outline-none w-24"
                    >
                      <option value="Common">Common</option>
                      <option value="Uncommon">Uncommon</option>
                      <option value="Rare">Rare</option>
                      <option value="Epic">Epic</option>
                      <option value="Legendary">Legendary</option>
                      <option value="Mythic">Mythic</option>
                    </select>
                    <button
                      onClick={() => setNewOffItems(newOffItems.filter((_, i) => i !== idx))}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateOfficialCase}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20"
            >
              🚀 PUBLISH OFFICIAL CASE
            </button>
          </div>

          {/* List of Officials */}
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-4">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                💎 Active Official Cases ({officialCases.length})
              </span>
              {officialCases.length === 0 && (
                <button
                  onClick={handleSeedOfficialCases}
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase rounded-lg transition-all"
                >
                  🌱 Seed Defaults
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-black uppercase tracking-wider">
                    <th className="p-2 font-black">Case Name</th>
                    <th className="p-2 font-black">Price</th>
                    <th className="p-2 font-black">Items</th>
                    <th className="p-2 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {officialCases.map(c => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-2 font-bold text-white flex items-center gap-2">
                        <span className="text-sm">{c.icon || '📦'}</span>
                        {c.name}
                      </td>
                      <td className="p-2 font-mono text-emerald-400 font-bold">${c.price.toLocaleString()}</td>
                      <td className="p-2 text-slate-400">{c.items?.length || 0} items</td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleDeleteCase(c.id, true)}
                          className="w-7 h-7 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 rounded flex items-center justify-center transition-all ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'community' && (
        <div className="flex flex-col gap-4 text-left">
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
            <span className="text-xs font-black text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              👥 Community Cases Management
            </span>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-black uppercase tracking-wider">
                    <th className="p-2 font-black">Case Name</th>
                    <th className="p-2 font-black">Creator</th>
                    <th className="p-2 font-black">Price</th>
                    <th className="p-2 font-black">Items</th>
                    <th className="p-2 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {communityCases.map(c => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-2 font-bold text-white flex items-center gap-2">
                        <span className="text-sm">{c.icon || '📦'}</span>
                        {c.name}
                      </td>
                      <td className="p-2 font-mono text-purple-400 font-bold">
                        @{c.creator}
                      </td>
                      <td className="p-2 font-mono text-emerald-400 font-bold">
                        ${c.price.toLocaleString()}
                      </td>
                      <td className="p-2 text-slate-400">
                        {c.items.length} items
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Delete community case "${c.name}" forever?`)) return;
                            try {
                              await deleteDoc(doc(db, 'cases', c.id));
                              toast(`✓ Case "${c.name}" has been removed.`, 'info');
                            } catch (e) {
                              toast('Failed to delete case.', 'lose');
                            }
                          }}
                          className="w-7 h-7 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 rounded flex items-center justify-center transition-all ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {communityCases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">
                        No community cases found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <p className="text-[9px] text-slate-600 font-semibold block text-center mt-2 lowercase">
        Protected system. Changes write to the active persistent session store logs instantly.
      </p>
    </div>
  );
}
