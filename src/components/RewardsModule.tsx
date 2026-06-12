import React from 'react';
import { Award, ShieldAlert, Sparkles, CheckCircle, Lock } from 'lucide-react';
import { REWARD_TIERS, formatMoney } from '../data';

interface RewardsModuleProps {
  wager: number;
}

export default function RewardsModule({ wager }: RewardsModuleProps) {
  
  // Find current index
  const getCurrentTierIdx = () => {
    for (let i = REWARD_TIERS.length - 1; i >= 0; i--) {
      if (wager >= REWARD_TIERS[i].req) return i;
    }
    return 0;
  };

  const curIdx = getCurrentTierIdx();
  const curTier = REWARD_TIERS[curIdx];
  const nextTier = REWARD_TIERS[curIdx + 1] || null;

  let progress = 100;
  if (nextTier) {
    const range = nextTier.req - curTier.req;
    progress = range > 0 ? Math.min(100, Math.floor(((wager - curTier.req) / range) * 100)) : 100;
  }

  return (
    <div className="flex flex-col gap-6 p-4 animate-[fadeIn_0.3s_ease]">
      
      {/* Header progressions overall summary card */}
      <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-purple-500/15 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-xl">
        <div 
          className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-4xl shadow"
          style={{ borderColor: curTier.color, backgroundColor: curTier.glow }}
        >
          {curTier.icon}
        </div>
        <div className="flex-1 text-center md:text-left">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-1">
            Current VIP Progression Rank
          </span>
          <span className="text-2xl font-black block" style={{ color: curTier.color }}>
            {curTier.name} Status
          </span>
          <span className="text-xs font-semibold text-slate-400 block mt-1">
            Total wagered: <strong className="text-purple-400">{formatMoney(wager)}</strong> 🍩
          </span>

          {nextTier ? (
            <div className="mt-4 w-full max-w-sm">
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: curTier.color }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-bold block mt-2 text-right">
                {progress}% to {nextTier.name} (wager {formatMoney(nextTier.req - wager)} more)
              </span>
            </div>
          ) : (
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider block mt-3 flex items-center gap-1.5 justify-center md:justify-start">
              👑 MAX rank unlock accomplished
            </span>
          )}
        </div>
      </div>

      {/* Ranks grid timelines listings */}
      <div className="flex flex-col gap-4">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Rewards Tier Levels milestones List
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REWARD_TIERS.map((tier, idx) => {
            const isUnlocked = wager >= tier.req;
            const isActive = idx === curIdx;

            return (
              <div
                key={tier.name}
                className={`p-5 rounded-2xl border transition-all flex flex-col gap-3 relative overflow-hidden
                  ${isActive 
                    ? 'bg-slate-900 border-purple-500 shadow-lg shadow-purple-500/5' 
                    : isUnlocked 
                      ? 'bg-slate-900/40 border-white/5 opacity-80' 
                      : 'bg-slate-950/20 border-white/5 opacity-40'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div 
                    className="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-2xl"
                    style={{ borderColor: isUnlocked ? tier.color : '#334155', backgroundColor: isUnlocked ? tier.glow : 'transparent' }}
                  >
                    {tier.icon}
                  </div>

                  {isUnlocked ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-600 block" />
                  )}
                </div>

                <div className="flex flex-col mt-2">
                  <span className="text-sm font-black text-white" style={{ color: isUnlocked ? tier.color : '#94a3b8' }}>
                    {tier.name} Tier
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mt-1">
                    Req: {formatMoney(tier.req)} wagered 🍩
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
