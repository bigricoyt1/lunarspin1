import React, { useState, useEffect } from 'react';
import { db, doc, updateDoc, increment, getDoc, arrayUnion, arrayRemove, setDoc } from '../../lib/firebase';
import { Coins, Users, Clock, LogIn, LogOut } from 'lucide-react';
import { formatMoney } from '../../data';

const RAIN_POOL_DOC = doc(db, 'config', 'rain_pool');
const USER_ID = 'current_user_id'; // Placeholder for actual user ID

export default function RainPool() {
  const [poolAmount, setPoolAmount] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour countdown

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDoc(RAIN_POOL_DOC);
      if (snap.exists()) {
        const data = snap.data();
        setPoolAmount(data.amount || 0);
        setParticipants(data.participants || []);
        setIsJoined(data.participants?.includes(USER_ID) || false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTip = async (amount: number) => {
    if (isTipping) return;
    setIsTipping(true);
    try {
      await setDoc(RAIN_POOL_DOC, { amount: increment(amount) }, { merge: true });
    } finally {
      setTimeout(() => setIsTipping(false), 1000);
    }
  };

  const toggleJoin = async () => {
    if (isJoined) {
      await setDoc(RAIN_POOL_DOC, { participants: arrayRemove(USER_ID) }, { merge: true });
      setIsJoined(false);
    } else {
      await setDoc(RAIN_POOL_DOC, { participants: arrayUnion(USER_ID) }, { merge: true });
      setIsJoined(true);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-emerald-500/20 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-3 rounded-xl">
            <Coins className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Live Rain Pool</h3>
            <p className="text-2xl font-black text-emerald-400">{formatMoney(poolAmount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold">
           <Clock className="w-4 h-4"/>
           {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>
      
      <button
        onClick={toggleJoin}
        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
          isJoined ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
        }`}
      >
        {isJoined ? <><LogOut className="w-4 h-4"/> Leave Pool</> : <><LogIn className="w-4 h-4"/> Join Pool</>}
      </button>

      <div className="grid grid-cols-3 gap-2">
        {[1000, 1000000, 1000000000].map((amt) => (
          <button
            key={amt}
            onClick={() => handleTip(amt)}
            disabled={isTipping}
            className={`py-2 bg-slate-800 hover:bg-emerald-600/30 text-emerald-300 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-xs font-bold transition-all ${isTipping ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isTipping ? '...' : `Tip ${formatMoney(amt)}`}
          </button>
        ))}
      </div>
    </div>
  );
}
