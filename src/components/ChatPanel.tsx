import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Users, Gift, Moon, Star, RefreshCw, AlertCircle, Sparkles, Check, CheckSquare,
  Smile
} from 'lucide-react';
import { CHAT_PHRASES } from '../data';
import { getLevel } from '../lib/leveling';
import { ChatMessage, User as UserType } from '../types';
import { 
  db, auth,
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  runTransaction
} from '../lib/firebase';

interface ChatPanelProps {
  user: UserType | null;
  onOpenLogin: () => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  updateBalance: (amt: number) => void;
  playSound: (win: boolean) => void;
  onlineCount: number;
}

export default function ChatPanel({
  user,
  onOpenLogin,
  toast,
  updateBalance,
  playSound,
  onlineCount
}: ChatPanelProps) {
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(() => {
    return localStorage.getItem('lunarspin_firestore_quota_exceeded') === 'true';
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState<string>('');
  const [showEmojis, setShowEmojis] = useState(false);

  const EMOJIS = ['🌙', '⭐', '🔥', '💎', '🍀', '💰', '🎰', '🚀', '👑', '🎮', '💀', '🤡', '🌈', '⚡', '🎉', '🎁'];
  
  const [tipInput, setTipInput] = useState<string>('');
  const [isTipping, setIsTipping] = useState(false);
  
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const MOCK_INITIAL_MESSAGES: ChatMessage[] = [
    {
      id: 'msg_u1',
      username: 'LanaSky',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      text: 'Good luck everyone! CoinFlip in the rooms tonight is crazy 🚀',
      color: '#f43f5e',
      emoji: '👑',
      role: 'admin',
      level: 42,
      ts: Date.now() - 300000
    },
    {
      id: 'msg_u2',
      username: 'Aeronux',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      text: 'agreed, raw ruby shard hit 500x in towers today!',
      color: '#3b82f6',
      emoji: '🛡️',
      role: 'mod',
      level: 28,
      ts: Date.now() - 240000
    },
    {
      id: 'msg_u3',
      username: 'Ducky_Go',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      text: 'who is up for a case battle? Emerald Nebula case ⚔️',
      color: '#eab308',
      emoji: '🦆',
      role: 'helper',
      level: 15,
      ts: Date.now() - 180000
    },
    {
      id: 'msg_u4',
      username: 'CosmoWhale',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
      text: 'putting $50,000 on roulette black color, wish me luck!',
      color: '#a855f7',
      emoji: '🐋',
      role: 'member',
      level: 95,
      ts: Date.now() - 120000
    },
    {
      id: 'msg_u5',
      username: 'LuckyDino',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100',
      text: 'OMG cosmo did u actually hit it ???',
      color: '#10b981',
      emoji: '🦖',
      role: 'member',
      level: 4,
      ts: Date.now() - 60000
    }
  ];

  // Periodic chat simulator for offline mode
  useEffect(() => {
    if (!isQuotaExceeded) return;

    // Load mock initial messages
    setMessages(MOCK_INITIAL_MESSAGES);

// Bots removed.
    return () => clearInterval(undefined as any);
  }, [isQuotaExceeded]);

  // Real-time State Sync
  useEffect(() => {
    // Listen for Sync updates from App.tsx SSE
    const handleSyncUpdate = (e: any) => {
      if (e.detail?.type === 'update' || e.detail?.type === 'init') {
        const s = e.detail.state;
        if (s.messages) setMessages(s.messages);
      }
    };
    window.addEventListener('sync-state-update', handleSyncUpdate);

    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/sync/state');
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      } catch (err) {}
    };
    fetchInitialData();

    return () => window.removeEventListener('sync-state-update', handleSyncUpdate);
  }, []);

  // Synchronize quota state reactively with global state changes
  useEffect(() => {
    const handleExceeded = () => setIsQuotaExceeded(true);
    const handleCleared = () => setIsQuotaExceeded(false);
    window.addEventListener('quota-exceeded', handleExceeded);
    window.addEventListener('quota-cleared', handleCleared);
    return () => {
      window.removeEventListener('quota-exceeded', handleExceeded);
      window.removeEventListener('quota-cleared', handleCleared);
    };
  }, []);

  useEffect(() => {
    const handleClearChatEvent = async () => {
      if (user?.role === 'admin' || user?.role === 'owner' || user?.role === 'dev' || user?.role === 'mod' || user?.role === 'helper') {
        try {
          const snapshot = await getDocs(collection(db, 'messages'));
          const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletePromises);
          
          await addDoc(collection(db, 'messages'), {
            username: 'Announcer',
            avatar: null,
            text: '🧹 Live Lobby chat log cleared by a Staff member.',
            color: '#ef4444',
            emoji: '🛡️',
            role: 'admin',
            level: 100,
            ts: serverTimestamp(),
            isSys: true
          });
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener('clear-lobby-chat', handleClearChatEvent);
    return () => {
      window.removeEventListener('clear-lobby-chat', handleClearChatEvent);
    };
  }, [user]);

  // Bot message simulation
  useEffect(() => {
    // Bots removed.
  }, []);

  const handleSendChat = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (user?.timeoutUntil) {
      const now = new Date();
      const timeoutDate = new Date(user.timeoutUntil);
      if (timeoutDate > now) {
        toast(`⏳ You are timed out until ${timeoutDate.toLocaleTimeString()}`, 'info');
        return;
      }
    }

    // Command handling: /admin or /adminpanel
    if (trimmed.startsWith('/admin') || trimmed.startsWith('/adminpanel')) {
      if (user?.role === 'admin' || user?.role === 'owner') {
        window.dispatchEvent(new CustomEvent('change-tab', { detail: 'admin' }));
        toast('⚙️ Redirection triggered... Welcome to Admin Console!', 'win');
      } else {
        toast('❌ Insufficient permissions for Admin Console.', 'lose');
      }
      setText('');
      return;
    }

    if (trimmed.startsWith('/helper')) {
      if (user?.role === 'helper' || user?.role === 'mod' || user?.role === 'dev' || user?.role === 'admin' || user?.role === 'owner') {
        window.dispatchEvent(new CustomEvent('change-tab', { detail: 'helper' }));
        toast('🛡️ Redirection triggered... Welcome to Helper Panel!', 'win');
      } else {
        toast('❌ Insufficient permissions for Helper Panel.', 'lose');
      }
      setText('');
      return;
    }

    // Command handling: /mute and /unmute
    if (trimmed.startsWith('/mute ') || trimmed.startsWith('/unmute ')) {
      if (user?.role === 'helper' || user?.role === 'mod' || user?.role === 'dev' || user?.role === 'admin' || user?.role === 'owner') {
        const parts = trimmed.split(/\s+/);
        const command = parts[0].toLowerCase();
        let targetUsername = parts[1];
        if (targetUsername && targetUsername.startsWith('@')) {
          targetUsername = targetUsername.substring(1);
        }
        
        let minutes = 0;
        if (command === '/mute') {
          minutes = parts[2] ? parseInt(parts[2]) : 10;
          if (isNaN(minutes) || minutes <= 0) minutes = 10;
        }

        if (targetUsername) {
          window.dispatchEvent(new CustomEvent('custom-mute', { detail: { username: targetUsername, minutes } }));
        } else {
          toast('⚠️ Usage: /mute <username> [minutes] OR /unmute <username>', 'info');
        }
      } else {
        toast('❌ Insufficient permissions to mute/unmute.', 'lose');
      }
      setText('');
      return;
    }

    // Command handling: /tip <username> <amount>
    if (trimmed.startsWith('/tip')) {
      if (!user) {
        onOpenLogin();
        return;
      }
      const parts = trimmed.split(/\s+/);
      if (parts.length < 3) {
        toast('⚠️ Usage: /tip <username> <amount>', 'info');
        setText('');
        return;
      }
      let targetUser = parts[1];
      if (targetUser.startsWith('@')) {
        targetUser = targetUser.substring(1);
      }
      const tipAmt = parseInt(parts[2]);
      if (isNaN(tipAmt) || tipAmt <= 0) {
        toast('⚠️ Please specify a valid tipping amount!', 'lose');
        setText('');
        return;
      }
      if (tipAmt > user.balance) {
        toast('❌ Insufficient balance for this tip!', 'lose');
        setText('');
        return;
      }
      if (targetUser.toLowerCase() === user.username.toLowerCase()) {
        toast('⚠️ You cannot tip yourself!', 'lose');
        setText('');
        return;
      }

      updateBalance(-tipAmt);
      window.dispatchEvent(new CustomEvent('custom-tip', { detail: { target: targetUser, amount: tipAmt } }));

      try {
        await fetch('/api/sync/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_message',
            payload: {
              message: {
                id: `msg_${Date.now()}`,
                username: 'Announcer',
                avatar: null,
                text: `🎁 @${user.username} tipped @${targetUser} +${tipAmt.toLocaleString()} Money!`,
                color: '#10b981',
                emoji: '🎁',
                role: 'admin',
                level: 100,
                ts: Date.now(),
                isSys: true
              }
            }
          })
        });
      } catch (e) {}
      
      toast(`🎁 Sent a tip of ${tipAmt.toLocaleString()} Money to @${targetUser}!`, 'win');
      setText('');
      return;
    }

    if (!user) {
      onOpenLogin();
      return;
    }

    // Client-side profanity filters
    const badFilter = /\b(fuck|shit|ass|asshole|bitch|dick|cock|pussy|crap|damn|bastard|slut|whore)\b/gi;
    if (badFilter.test(trimmed)) {
      toast('Inappropriate language detected! Keep it Minecraft friendly.', 'lose');
      setText('');
      return;
    }

    try {
      await fetch('/api/sync/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_message',
          payload: {
            message: {
              id: `msg_${Date.now()}`,
              username: user.username,
              avatar: user.avatar,
              text: trimmed,
              color: user.color || '#a855f7',
              emoji: user.emoji || '🌙',
              role: user.role,
              level: getLevel(user.xp || 0),
              ts: Date.now()
            }
          }
        })
      });
      setText('');
      setShowEmojis(false);
    } catch (e) {
      toast('Failed to send message.', 'lose');
    }
  };

  const parseShorthand = (val: string): number => {
    const clean = val.toLowerCase().replace(/[^0-9.kmb]/g, '');
    if (!clean) return 0;
    
    let multiplier = 1;
    if (clean.includes('k')) multiplier = 1000;
    if (clean.includes('m')) multiplier = 1000000;
    if (clean.includes('b')) multiplier = 1000000000;
    
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.floor(num * multiplier);
  };

  return (
    <div className="w-64 bg-slate-950 border-l border-white/5 flex flex-col h-full flex-shrink-0 relative overflow-hidden">
      
      {/* Lobby stats header */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-slate-950/80 backdrop-blur">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          💬 Live Lobby Chat
        </span>
        <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-[10px]" title="You are the 1 active session player.">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {onlineCount} Online
        </div>
      </div>

      {/* Scrolling feed container */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0 bg-slate-950/20">
        {messages.map((m) => {
          return (
            <div key={m.id} className="flex gap-2.5 items-start">
              <div 
                className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] select-none flex-shrink-0"
                style={{ backgroundColor: m.color }}
              >
                {m.emoji}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-black tracking-tight" style={{ color: m.color }}>
                    {m.username}
                  </span>
                  {m.role !== 'member' && (
                    <span 
                      className="text-[8px] font-black uppercase tracking-widest px-1 rounded-sm text-[8px]"
                      style={{ 
                        backgroundColor: m.role === 'owner' ? 'rgba(251,191,36,.1)' :
                                         m.role === 'admin' ? 'rgba(168,85,247,.1)' :
                                         m.role === 'mod' ? 'rgba(16,185,129,.1)' :
                                         m.role === 'dev' ? 'rgba(59,130,246,.1)' :
                                         m.role === 'helper' ? 'rgba(14,165,233,.1)' :
                                         'rgba(239,68,68,.1)',
                        color: m.role === 'owner' ? '#fbbf24' :
                               m.role === 'admin' ? '#c084fc' :
                               m.role === 'mod' ? '#34d399' :
                               m.role === 'dev' ? '#60a5fa' :
                               m.role === 'helper' ? '#38bdf8' :
                               '#f87171' 
                      }}
                    >
                      {m.role}
                    </span>
                  )}
                  <span className="text-[8px] font-bold text-slate-500">Lv.{m.level}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium break-words pr-1 mt-0.5">
                  {m.text}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={listEndRef} />
      </div>

      {/* Core chat input area */}
      <div className="p-3 border-t border-white/5 flex-shrink-0 bg-slate-950 relative">
        <AnimatePresence>
          {showEmojis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-3 right-3 bg-slate-900 border border-white/10 p-2 rounded-xl grid grid-cols-8 gap-1 mb-2 shadow-2xl z-50"
            >
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => {
                    setText(prev => prev + e);
                    setShowEmojis(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded text-sm"
                >
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex bg-slate-900 border border-white/5 rounded-xl p-1 items-center">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <Smile className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder={user ? "Type a message or /admin, /tip..." : "Type /login <username> to start..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            maxLength={120}
            className="bg-transparent border-none text-white text-xs outline-none w-full px-1 py-2 font-semibold"
          />
          <button
            onClick={handleSendChat}
            className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-all flex-shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

    </div>
  );
}
