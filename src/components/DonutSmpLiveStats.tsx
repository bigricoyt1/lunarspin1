import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Clock, DollarSign, Swords, Trophy, Activity, 
  ExternalLink, User, Flame, Skull, Sparkles
} from 'lucide-react';

interface LeaderboardPlayer {
  username: string;
  status: 'Online' | 'Offline';
  money: string;
  moneyNum: number;
  shards: string;
  shardsNum: number;
  playtime: string;
  playtimeHours: number;
  kills: string;
  killsNum: number;
  deaths: string;
  deathsNum: number;
  kdr: number;
}

interface DonutSmpLiveStatsProps {
  toast?: (msg: string, type: 'win' | 'lose' | 'info') => void;
}

const POPULAR_PLAYERS = ['Abuodee', 'BC3500', 'billford', 'DrDonut'];

export default function DonutSmpLiveStats({ toast }: DonutSmpLiveStatsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorObj, setErrorObj] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<LeaderboardPlayer | null>(null);

  // Auto-load a popular player on first mount so the container is not empty and sad
  useEffect(() => {
    fetchPlayerData('BC3500');
  }, []);

  const fetchPlayerData = async (username: string) => {
    if (!username.trim()) return;
    setLoading(true);
    setErrorObj(null);
    try {
      const res = await fetch(`/api/donutstats/player/${encodeURIComponent(username.trim())}`);
      if (!res.ok) {
        throw new Error(`Player "${username}" not found or proxy error (Status ${res.status})`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPlayerData({
        username: data.username,
        status: data.status as 'Online' | 'Offline',
        money: data.money,
        moneyNum: data.moneyNum,
        shards: data.shards,
        shardsNum: data.shardsNum,
        playtime: data.playtime,
        playtimeHours: data.playtimeHours,
        kills: data.kills,
        killsNum: data.killsNum,
        deaths: data.deaths,
        deathsNum: data.deathsNum,
        kdr: data.kdr || (data.deathsNum > 0 ? parseFloat((data.killsNum / data.deathsNum).toFixed(2)) : data.killsNum),
      });

      if (toast) {
        toast(`📡 Retrieved live stats for ${data.username} from donutstats.net proxy!`, 'win');
      }
    } catch (err: any) {
      console.error(err);
      setErrorObj(err.message || 'Failed to fetch player stats.');
      if (toast) {
        toast(err.message || 'Failed to load player stats.', 'lose');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchPlayerData(searchQuery);
  };

  return (
    <div id="donutstats-search-container" className="w-full bg-slate-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden text-left">
      {/* Decorative clean radial background */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-yellow-400/10 rounded-lg text-yellow-400 border border-yellow-400/20">
              🍩
            </span>
            <span className="text-sm font-black text-white uppercase tracking-wider">
              DonutSMP.net Stats Lookup
            </span>
            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
              Live Proxy
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-semibold font-sans mt-2 max-w-xl">
            Query live statistics directly from the official donutstats.net database indexer. Enter any player's Minecraft username.
          </p>
        </div>

        {/* Popular Quick-Select row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider mr-1">Popular:</span>
          {POPULAR_PLAYERS.map(p => (
            <button
              key={p}
              onClick={() => {
                setSearchQuery(p);
                fetchPlayerData(p);
              }}
              className="px-2.5 py-1 bg-slate-950/60 hover:bg-slate-950 hover:text-white text-slate-400 font-extrabold text-[10px] uppercase rounded-lg border border-white/5 hover:border-purple-600/30 transition-all cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleSearchSubmit} className="mt-5 relative flex gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-1 pr-3 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Enter Java username (e.g., BC3500, Abuodee, DrDonut)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
            className="w-full h-11 bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-purple-500/50 transition-all font-sans"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Lookup Profile'
          )}
        </button>
      </form>

      {/* Main Stats Display Area */}
      <div className="mt-5">
        <AnimatePresence mode="wait">
          {errorObj && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3"
            >
              <div className="p-1 px-2.5 bg-rose-500/20 text-rose-400 rounded-lg text-xs font-black">
                ⚠️
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-white uppercase">Profile Query Offline</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold leading-relaxed">
                  {errorObj} Please confirm the Minecraft username is correct and registered.
                </p>
              </div>
            </motion.div>
          )}

          {playerData && !errorObj && (
            <motion.div
              key={playerData.username}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-5"
            >
              {/* Profile Card & Skin view */}
              <div className="md:col-span-1 bg-slate-950 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900 border border-white/10 px-2 py-0.5 rounded-full">
                  <span className={`w-1.5 h-1.5 rounded-full ${playerData.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-[8px] font-black text-white uppercase tracking-wider font-mono">
                    {playerData.status}
                  </span>
                </div>

                {/* Minecraft helm rendering from minotar.net */}
                <div className="relative mt-2">
                  <div className="w-16 h-16 bg-slate-900/80 rounded-2xl border-2 border-white/10 flex items-center justify-center p-1 group-hover:border-purple-500/40 transition-colors shadow-inner overflow-hidden">
                    <img 
                      src={`https://minotar.net/helm/${playerData.username}/128`}
                      alt={playerData.username}
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-xl select-none"
                      onError={(e) => {
                        // Fallback avatar icon if minotar is offline
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${playerData.username}`;
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-sm font-black text-white font-mono flex items-center gap-1 justify-center">
                    {playerData.username}
                    <ExternalLink className="w-3 h-3 text-slate-500 inline-block hover:text-white transition-colors" />
                  </span>
                  <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest mt-1 block">
                    Active Leaderboard Rank
                  </span>
                </div>
              </div>

              {/* Grid breakdown of stats parsed live from proxy */}
              <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Money */}
                <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">In-Game Money</span>
                    <span className="text-sm font-black text-amber-400 font-mono mt-0.5 block">
                      ${playerData.money}
                    </span>
                  </div>
                </div>

                {/* Shards */}
                <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Lifesteal Shards</span>
                    <span className="text-sm font-black text-indigo-400 font-mono mt-0.5 block">
                      {playerData.shards}
                    </span>
                  </div>
                </div>

                {/* Playtime */}
                <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Total Playtime</span>
                    <span className="text-sm font-black text-purple-400 font-mono mt-0.5 block">
                      {playerData.playtime}
                    </span>
                  </div>
                </div>

                {/* Kills */}
                <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 flex items-center justify-center">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">PvP Kills</span>
                    <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">
                      {playerData.kills}
                    </span>
                  </div>
                </div>

                {/* Deaths */}
                <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 flex items-center justify-center">
                    <Skull className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Total Deaths</span>
                    <span className="text-sm font-black text-rose-500 font-mono mt-0.5 block">
                      {playerData.deaths}
                    </span>
                  </div>
                </div>

                {/* K/D Ratio */}
                <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-500/15 text-slate-400 rounded-xl border border-slate-500/30 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Kill / Death Ratio</span>
                    <span className="text-sm font-black text-slate-300 font-mono mt-0.5 block">
                      {playerData.kdr} KDR
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
