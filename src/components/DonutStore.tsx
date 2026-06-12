import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, ShieldCheck, CreditCard, Coins, ChevronRight, 
  CheckCircle2, ArrowRightLeft, Apple, Flame, BadgeAlert 
} from 'lucide-react';
import { User as UserType } from '../types';

interface DonutStoreProps {
  user: UserType | null;
  updateBalance: (amt: number) => Promise<void> | void;
  addTransaction?: (desc: string, amt: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  onOpenLogin: () => void;
}

const STORE_BUNDLES = [
  {
    id: 'pack_starter',
    name: 'Starter Pack',
    coins: 100000000, // 100M
    coinsLabel: '100 Million',
    price: 3.00,
    desc: 'Unleash standard bets and start custom battle openings instantly!',
    badge: 'Popular',
    color: 'from-blue-600/20 to-indigo-600/10 border-blue-500/20 text-blue-400'
  },
  {
    id: 'pack_grinder',
    name: 'Grinder Pack',
    coins: 250000000, // 250M
    coinsLabel: '250 Million',
    price: 7.50,
    desc: 'Perfect for climbing up the high roller multiplier towers and coinflips.',
    badge: 'Most Popular',
    color: 'from-yellow-600/20 to-amber-600/10 border-amber-500/20 text-amber-400'
  },
  {
    id: 'pack_highroller',
    name: 'High Roller Bundle',
    coins: 500000000, // 500M
    coinsLabel: '500 Million',
    price: 15.00,
    desc: 'Unlock premium VIP tier status speeds. Dominate the high tables safely.',
    badge: 'Best Value',
    color: 'from-purple-600/20 to-pink-600/10 border-purple-500/20 text-purple-400'
  },
  {
    id: 'pack_whale',
    name: 'Whale Tier Drop',
    coins: 1200000000, // 1.2B
    coinsLabel: '1.2 Billion',
    price: 36.00,
    desc: 'Bepose extreme dominance. Instantly back dozens of high-value battles.',
    badge: 'VIP Elite',
    color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/20 text-emerald-400'
  }
];

export default function DonutStore({ user, updateBalance, addTransaction, toast, onOpenLogin }: DonutStoreProps) {
  // Calculator states
  const [calcInput, setCalcInput] = useState<string>('100'); // 100M default
  const [calcCost, setCalcCost] = useState<number>(3.00);

  // Selected item to buy
  const [selectedItem, setSelectedItem] = useState<{ name: string; coins: number; price: number } | null>(null);

  // Checkout states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCalcInput = (val: string) => {
    // Sanitize non-digits/decimals
    const cleaned = val.replace(/[^0-9.]/g, '');
    setCalcInput(cleaned);
    const mAmount = parseFloat(cleaned) || 0;
    // $0.03 per 1M in-game cash
    setCalcCost(parseFloat((mAmount * 0.03).toFixed(2)));
  };

  const handleCalcCost = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '');
    const dollarVal = parseFloat(cleaned) || 0;
    // Cost = M * 0.03 => M = Cost / 0.03
    const mAmount = parseFloat((dollarVal / 0.03).toFixed(1));
    setCalcInput(mAmount > 0 ? String(mAmount) : '');
    setCalcCost(dollarVal);
  };

  const handleInitiateBundlePurchase = (coins: number, price: number, name: string) => {
    if (!user) {
      toast('🔒 You must login with Google or Discord to make purchases!', 'info');
      onOpenLogin();
      return;
    }
    setSelectedItem({ name, coins, price });
    setIsSuccess(false);
    setIsProcessing(false);
  };

  const handleInitiateCustomPurchase = () => {
    if (!user) {
      toast('🔒 You must login with Google or Discord to make purchases!', 'info');
      onOpenLogin();
      return;
    }
    const mAmount = parseFloat(calcInput) || 0;
    if (mAmount <= 0) {
      toast('❌ Please enter a valid coins amount to purchase.', 'info');
      return;
    }
    const coins = Math.floor(mAmount * 1000000);
    const cost = calcCost;
    setSelectedItem({
      name: `Custom Refill (${calcInput}M Coins)`,
      coins,
      price: cost
    });
    setIsSuccess(false);
    setIsProcessing(false);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !user) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedItem.price,
          coins: selectedItem.coins,
          userId: user.id,
          username: user.username,
          itemName: selectedItem.name
        })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      setIsProcessing(false);
      toast(err.message || 'Payment gateway error. Please try again.', 'lose');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6 text-left selection:bg-purple-500/30 selection:text-white">
      {/* Visual Header */}
      <div 
        className="relative p-8 rounded-3xl border border-white/5 overflow-hidden flex flex-col gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(23, 14, 56, 0.6) 0%, rgba(10, 8, 20, 0.95) 100%)',
          boxShadow: 'inset 0 0 50px rgba(168, 85, 247, 0.05)'
        }}
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-4 right-4 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
          <Flame className="w-3 h-3 fill-current" />
          DonutSMP Gold Rate: $0.03 / 1,000,000 Coins
        </div>

        <div className="flex items-center gap-2.5">
          <span className="p-2.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-2xl text-xl select-none">
            🍩
          </span>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white font-mono uppercase tracking-tight">
              Donut IRL Shop
            </h1>
            <span className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest mt-0.5">
              Secure Coin Replenishments
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 max-w-2xl font-semibold leading-relaxed mt-2">
          Replenish your LunarSpin balance instantly using real currency. Get top rates across absolute peer-verified networks with no hidden costs. Delivered safely straight into your registered wallet.
        </p>
      </div>

      {/* Main Grid: Packages + Dynamic Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Center: Coin Bundles (grid 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">
            Featured Gold Packages
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STORE_BUNDLES.map((bundle) => (
              <div 
                key={bundle.id}
                className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-purple-500/30 transition-all shadow-xl"
              >
                {/* Highlight blur on hover */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />

                {bundle.badge && (
                  <span className={`absolute top-4 right-4 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-current ${bundle.color}`}>
                    {bundle.badge}
                  </span>
                )}

                <div className="flex flex-col gap-1 text-left">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider font-sans">
                    {bundle.name}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white font-mono">
                      {bundle.coinsLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase font-sans">
                      Coins
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 font-semibold leading-relaxed">
                    {bundle.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-2">
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] font-bold text-slate-500 uppercase">One-time payment</span>
                    <span className="text-lg font-black text-yellow-400 font-mono">
                      ${bundle.price.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleInitiateBundlePurchase(bundle.coins, bundle.price, bundle.coinsLabel + ' bundle')}
                    className="h-10 px-4 bg-purple-600 hover:bg-purple-500 hover:scale-[1.02] text-white font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    Buy Package
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Dynamic Rate Calculator */}
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">
            Rate Converter & Custom Order
          </span>

          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 flex flex-col gap-5 relative overflow-hidden h-full shadow-xl">
            <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase border-b border-white/5 pb-3">
              <ArrowRightLeft className="w-4 h-4 text-purple-400" />
              Real-time Exchange Engine
            </div>

            {/* In-Game Cash input (M) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase block">
                Coins Amount in Millions (M)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 100"
                  value={calcInput}
                  onChange={(e) => handleCalcInput(e.target.value)}
                  className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs font-extrabold text-white outline-none focus:border-purple-600/30 transition-all font-mono"
                />
                <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-black text-slate-500 uppercase select-none">
                  M Coins
                </span>
              </div>
            </div>

            {/* Price input (USD) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase block">
                Total Payment Price (USD)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 6"
                  value={calcCost > 0 ? String(calcCost) : ''}
                  onChange={(e) => handleCalcCost(e.target.value)}
                  className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-8 pr-4 text-xs font-extrabold text-white outline-none focus:border-purple-600/30 transition-all font-mono"
                />
                <span className="absolute inset-y-0 left-3.5 flex items-center text-xs font-black text-yellow-400 select-none">
                  $
                </span>
                <span className="absolute inset-y-0 right-4 flex items-center text-[10px] font-black text-slate-500 uppercase select-none">
                  USD
                </span>
              </div>
            </div>

            {/* Display Stats Info */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-white/5 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                <span>Calculated Coins:</span>
                <span className="font-mono font-bold text-white">
                  {Math.floor((parseFloat(calcInput) || 0) * 1000000).toLocaleString()} Coins
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                <span>Shop Price (Fixed):</span>
                <span className="font-mono font-extrabold text-yellow-400">
                  ${calcCost.toFixed(2)} USD
                </span>
              </div>
              <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] text-slate-500">
                <span>Exchange rate limit</span>
                <span className="font-sans font-bold text-emerald-400">Locked Rate</span>
              </div>
            </div>

            <button
              onClick={handleInitiateCustomPurchase}
              disabled={parseFloat(calcInput) <= 0}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-auto"
            >
              <Coins className="w-4 h-4" />
              Prepare Order Card
            </button>
          </div>

        </div>

      </div>

      {/* Checkout Modal Window Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-slate-950/90 z-55 flex items-center justify-center p-4 backdrop-blur-xl select-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]"
            >
              
              {/* Close Button */}
              <button
                onClick={() => {
                  if (!isProcessing) setSelectedItem(null);
                }}
                disabled={isProcessing}
                className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center text-slate-400 transition-all font-bold z-10 cursor-pointer disabled:opacity-30"
              >
                ✕
              </button>

              <div className="flex h-12 bg-slate-950/60 border-b border-white/5 items-center px-5 font-mono text-[10px] font-black uppercase text-slate-500 tracking-wider">
                🛒 DONUT IRL CHECKOUT GATEWAY v3.2
              </div>

              {!isSuccess ? (
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-left">
                  {/* Order Overview */}
                  <div className="bg-slate-950/80 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Item Selected</span>
                      <h4 className="text-sm font-black text-white mt-0.5">{selectedItem.name}</h4>
                      <p className="text-[10px] text-purple-300 font-semibold font-sans mt-0.5">
                        Increases in-game purse by +{selectedItem.coins.toLocaleString()} Coins
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Total price</span>
                      <span className="text-lg font-black text-yellow-400 font-mono mt-0.5 block">
                        ${selectedItem.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Form fields */}
                  <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-4">
                    <div className="p-8 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                      <div className="flex gap-4">
                        <Apple className="w-8 h-8 text-white opacity-80" />
                        <CreditCard className="w-8 h-8 text-blue-400 opacity-80" />
                        <ShieldCheck className="w-8 h-8 text-emerald-400 opacity-80" />
                      </div>
                      <h4 className="text-xs font-black text-white uppercase font-mono mt-2">Secure Global Payments</h4>
                      <p className="text-[10px] text-slate-400 max-w-xs font-semibold leading-relaxed">
                        You will be redirected to our encrypted checkout gateway to complete your purchase using Apple Pay, Google Pay, or Credit Card.
                      </p>
                      
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="mt-4 w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl cursor-pointer flex items-center justify-center gap-3 transition-all disabled:opacity-40 shadow-xl shadow-purple-500/20"
                      >
                        {isProcessing ? (
                          <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            SECURE REDIRECTING...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5" />
                            SECURE PAY ${selectedItem.price.toFixed(2)}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Success screen */
                <div className="p-8 flex flex-col items-center justify-center text-center gap-4 flex-1">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center p-3 animate-[pulse_2s_infinite]">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="flex flex-col mt-2">
                    <h3 className="text-lg font-black text-white font-mono uppercase tracking-tight">
                      Coins Credited successfully
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-mono mt-0.5">
                      Secure banking authorization completed
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 border border-white/5 rounded-2xl w-full text-left font-serif text-slate-400 text-xs flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px] font-sans font-bold text-slate-500 border-b border-white/5 pb-2 uppercase text-left">
                      <span>Receipt Summary</span>
                      <span>Order: approved</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[11px] font-semibold">Coins Purchased:</span>
                      <strong className="font-mono text-white text-[11px]">+{selectedItem.coins.toLocaleString()} Coins</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[11px] font-semibold">Price custom rate:</span>
                      <strong className="font-mono text-yellow-400 text-[11px]">${selectedItem.price.toFixed(2)} USD</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[11px] font-semibold">Wallet Account Target:</span>
                      <strong className="font-mono text-slate-200 text-[11px]">@{user.username}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-full mt-2 h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                  >
                    Close Receipt
                  </button>
                </div>
              )}

              <div className="bg-slate-950/60 p-3 text-center text-[9px] text-slate-600 font-sans border-t border-white/5 uppercase">
                Encrypted with SSL, 256-bit bank authorization layer
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
