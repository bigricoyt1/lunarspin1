import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Users, Gift, Moon, Star, RefreshCw, AlertCircle, Sparkles, Check, CheckSquare
} from 'lucide-react';
import { MOCK_BOTS, CHAT_PHRASES } from '../data';
import { ChatMessage, User as UserType } from '../types';

interface ChatPanelProps {
  user: UserType | null;
  onOpenLogin: () => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  updateBalance: (amt: number) => void;
  playSound: (win: boolean) => void;
}

export default function ChatPanel({
  user,
  onOpenLogin,
  toast,
  updateBalance,
  playSound
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState<string>('');

  // Rain Pool state
  const [rainTips, setRainTips] = useState<number>(5000);
  const [rainTimeSecs, setRainTimeSecs] = useState<number>(180); // 3 minutes countdown
  const [inRainPool, setInRainPool] = useState<boolean>(false);
  const [rainClaimAvailable, setRainClaimAvailable] = useState<boolean>(false);
  const [lastRainDrop, setLastResultDrop] = useState<number | null>(null);

  const listEndRef = useRef<HTMLDivElement | null>(null);

  // Generate initial welcome messages
  useEffect(() => {
    const list: ChatMessage[] = [
      {
        id: 'sys_welcome_1',
        username: 'System',
        avatar: null,
        text: '🍩 Welcome to LunarSpin chat lobby! Host case battles, play original casino games, and win Donuts!',
        color: '#d4af37',
        emoji: '🔔',
        role: 'admin',
        level: 100,
        ts: Date.now() - 30000,
        isSys: true
      },
      {
        id: 'sys_welcome_2',
        username: 'Rain Bot',
        avatar: null,
        text: '🌧️ Tip Donuts to increase the rain pool. All active players can claim the rain when the countdown hits zero!',
        color: '#60a5fa',
        emoji: '🌧️',
        role: 'mod',
        level: 75,
        ts: Date.now() - 15000,
        isSys: true
      }
    ];
    setMessages(list);

    // Rain drop timer countdown loop
    const rainTimer = setInterval(() => {
      setRainTimeSecs(prev => {
        if (prev <= 1) {
          // RAIN DISPERSION DROP EVENT
          setRainClaimAvailable(true);
          const dropAmount = 150 + Math.floor(Math.random() * 250);
          setLastResultDrop(dropAmount);
          return 180; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(rainTimer);
    };
  }, []);

  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendChat = () => {
    if (!user) {
      onOpenLogin();
      return;
    }
    if (!text.trim()) return;

    // Client-side profanity filters
    const badFilter = /\b(fuck|shit|ass|asshole|bitch|dick|cock|pussy|crap|damn|bastard|slut|whore)\b/gi;
    if (badFilter.test(text)) {
      toast('Inappropriate language detected! Keep it Minecraft friendly.', 'lose');
      setText('');
      return;
    }

    const nextMsg: ChatMessage = {
      id: `m_user_${Date.now()}`,
      username: user.username,
      avatar: user.avatar,
      text: text.trim(),
      color: user.color || '#a855f7',
      emoji: user.emoji || '🍩',
      role: user.role,
      level: 12,
      ts: Date.now()
    };

    setMessages(prev => [...prev, nextMsg]);
    setText('');
  };

  const handleJoinRain = () => {
    if (!user) {
      onOpenLogin();
      return;
    }
    setInRainPool(true);
    toast('🌧️ Joined the Rain Pool! Keep chat active to secure drops.', 'info');
  };

  const handleClaimRain = () => {
    if (!lastRainDrop) return;
    updateBalance(lastRainDrop);
    playSound(true);
    toast(`🌧️ Rain Claimed! +${lastRainDrop} donuts deposited!`, 'win');
    
    setInRainPool(false);
    setRainClaimAvailable(false);
    setLastResultDrop(null);
  };

  // Convert seconds to min:sec
  const getTimerString = () => {
    const mins = Math.floor(rainTimeSecs / 60);
    const secs = rainTimeSecs % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
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
          1 Online
        </div>
      </div>

      {/* Rain drop widget pool */}
      <div className="mx-3 mt-3 p-3 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-purple-500/15 rounded-2xl flex flex-col gap-2 relative">
        <Sparkles className="absolute top-2 right-2 w-3.5 h-3.5 text-purple-400 opacity-20" />
        
        <div className="flex justify-between items-center text-[9px] font-black text-slate-500 tracking-wider">
          <span>RAIN PRIZE POOL</span>
          <span className="text-purple-400 text-xs font-bold font-mono">🍩 {rainTips}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wide">Next Drop</span>
            <span className="text-sm font-extrabold text-white block mt-0.5">{getTimerString()}</span>
          </div>
          <div>
            <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wide">Eligibility</span>
            {inRainPool ? (
              <span className="text-[10px] font-extrabold text-emerald-400 block mt-0.5 flex items-center gap-1">
                ✓ Enrolled
              </span>
            ) : (
              <button
                onClick={handleJoinRain}
                className="py-1 px-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 hover:text-white hover:bg-purple-600/20 rounded-lg text-[9px] font-bold mt-1 uppercase"
              >
                Join Pool
              </button>
            )}
          </div>
        </div>

        {/* Claim Rain Drop popup */}
        <AnimatePresence>
          {rainClaimAvailable && inRainPool && lastRainDrop && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-0 bg-slate-950/95 rounded-2xl flex flex-col items-center justify-center p-3 text-center z-30"
            >
              <div className="text-[26px] animate-bounce">🌧️</div>
              <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1">
                Lobby Rain Drop!
              </div>
              <div className="text-sm font-black text-white mt-1">+{lastRainDrop} 🍩</div>
              <button
                onClick={handleClaimRain}
                className="py-1 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-[9px] rounded-lg mt-3 uppercase tracking-wider"
              >
                Claim Donuts
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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
                        backgroundColor: m.role === 'owner' ? 'rgba(251,191,36,.1)' : 'rgba(239,68,68,.1)',
                        color: m.role === 'owner' ? '#fbbf24' : '#f87171' 
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
      <div className="p-3 border-t border-white/5 flex-shrink-0 bg-slate-950">
        {user ? (
          <div className="flex bg-slate-900 border border-white/5 rounded-xl p-1 items-center">
            <input
              type="text"
              placeholder="Minecraft chat chat..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              maxLength={120}
              className="bg-transparent border-none text-white text-xs outline-none w-full px-3 py-2 font-semibold"
            />
            <button
              onClick={handleSendChat}
              className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-all flex-shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="w-full py-2.5 bg-slate-900 border border-white/5 hover:border-purple-600/30 text-slate-400 text-xs font-semibold rounded-xl text-center cursor-pointer transition-all"
          >
            Log in to chat
          </button>
        )}
      </div>

    </div>
  );
}
