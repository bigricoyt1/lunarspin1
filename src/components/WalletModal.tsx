import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins, CheckCircle, Smartphone, User, ArrowUpRight, Gift, Key, Clock, RefreshCw } from 'lucide-react';
import { Transaction, User as UserType } from '../types';
import { formatMoney } from '../data';

interface WalletModalProps {
  user: UserType | null;
  balance: number;
  updateBalance: (amt: number) => void;
  transactions: Transaction[];
  addTransaction: (desc: string, amt: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  onOpenLogin: () => void;
  onClose: () => void;
}

export default function WalletModal({
  user,
  balance,
  updateBalance,
  transactions,
  addTransaction,
  toast,
  onOpenLogin,
  onClose
}: WalletModalProps) {
  const [tab, setTab] = useState<'deposit' | 'withdraw' | 'tip' | 'promo' | 'history'>('deposit');
  
  // Deposit mock steps
  const [mcName, setMcName] = useState<string>('');
  const [linkingState, setLinkingState] = useState<'idle' | 'linking' | 'verify' | 'linked'>('idle');
  const [verifyAmount, setVerifyAmount] = useState<number>(5);
  const [depositAmt, setDepositAmt] = useState<number>(1000);

  // Withdrawal outputs
  const [wdUser, setWdUser] = useState<string>('');
  const [wdAmt, setWdAmt] = useState<number>(5000);

  // Tip payouts
  const [tipUser, setTipUser] = useState<string>('');
  const [tipAmt, setTipAmt] = useState<number>(100);

  // Promo inputs
  const [promoCode, setPromoCode] = useState<string>('');
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>([]);

  const handleLinkMinecraft = () => {
    if (!user) { onOpenLogin(); return; }
    if (!mcName.trim()) { toast('Enter Minecraft username first!', 'info'); return; }

    setLinkingState('linking');
    const amt = Math.floor(Math.random() * 8) + 3; // Random verification sum
    setVerifyAmount(amt);

    setTimeout(() => {
      setLinkingState('verify');
      toast('Verification instructions generated. Please complete in-game block transaction.', 'info');
    }, 1200);
  };

  const handleVerifyPayment = () => {
    setLinkingState('linked');
    toast(`✅ Minecraft username "${mcName}" linked successfully!`, 'win');
  };

  const handleCreateDeposit = () => {
    if (depositAmt < 100) {
      toast('Minimum deposit amount is 100 donuts', 'info');
      return;
    }
    toast(`✓ deposit request of ${depositAmt} donuts submitted for verification! Checks pending.`, 'win');
    // Simulate deposit payout
    setTimeout(() => {
      updateBalance(depositAmt);
      addTransaction(`Deposit Credit (${mcName})`, depositAmt);
      toast(`✅ Deposit of ${depositAmt} donuts completed successfully!`, 'win');
    }, 8000);
  };

  const handleWithdrawalRequest = () => {
    if (!user) { onOpenLogin(); return; }
    if (!wdUser.trim() || wdAmt < 5000) {
      toast('Minimum withdrawal amount is 5,000 donuts', 'info');
      return;
    }
    if (wdAmt > balance) {
      toast('Insufficient balance for withdrawal!', 'lose');
      return;
    }

    updateBalance(-wdAmt);
    addTransaction(`Withdrawal (${wdUser})`, -wdAmt);
    toast(`✅ Requested withdrawal of ${wdAmt} donuts! Status: Processing`, 'win');
    setWdAmt(5000);
  };

  const handleSendTip = () => {
    if (!user) { onOpenLogin(); return; }
    if (!tipUser.trim() || tipAmt <= 0) {
      toast('Invalid username or tip amount!', 'info');
      return;
    }
    if (tipAmt > balance) {
      toast('Not enough donuts!', 'lose');
      return;
    }
    if (tipUser.toLowerCase() === user.username.toLowerCase()) {
      toast('Cannot tip yourself!', 'info');
      return;
    }

    updateBalance(-tipAmt);
    addTransaction(`Tip to ${tipUser}`, -tipAmt);
    toast(`🎁 Sent a tip of ${tipAmt} donuts to ${tipUser}!`, 'win');
    setTipAmt(100);
    setTipUser('');
  };

  const handleRedeemPromo = () => {
    if (!user) { onOpenLogin(); return; }
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (redeemedCodes.includes(code)) {
      toast('You have already redeemed this code!', 'info');
      return;
    }

    const promoMap: Record<string, number> = {
      'WELCOME250': 250,
      'DONUT100': 100,
      'LUNAR500': 500,
      'VIP1000': 1000
    };

    const payout = promoMap[code];
    if (payout) {
      updateBalance(payout);
      setRedeemedCodes(prev => [...prev, code]);
      addTransaction(`Promo Code: ${code}`, payout);
      toast(`🎟️ Code redeemed! +${payout} donuts added to your balance!`, 'win');
      setPromoCode('');
    } else {
      toast('Invalid promo code!', 'lose');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-6 backdrop-blur-xl">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative flex flex-col gap-5 shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center text-slate-400 transition-all font-bold"
        >
          ✕
        </button>

        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Wallet Manager</span>
          <div className="flex items-baseline gap-1 mt-2 justify-center py-4 bg-slate-950/40 rounded-2xl border border-white/5">
            <span className="text-xl">🍩</span>
            <span className="text-3xl font-black text-white">{Math.floor(balance).toLocaleString()}</span>
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Donuts</span>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex border-b border-white/5">
          {([
            { id: 'deposit', label: 'Deposit' },
            { id: 'withdraw', label: 'Withdraw' },
            { id: 'tip', label: 'Tip' },
            { id: 'promo', label: 'Promo' },
            { id: 'history', label: 'History' }
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 pb-3 text-xs font-extrabold transition-all border-b-2 cursor-pointer
                ${tab === t.id ? 'border-purple-500 text-purple-400 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Pages */}
        <div className="flex-1 overflow-y-auto max-h-72 pr-0.5">
          
          {/* DEPOSIT */}
          {tab === 'deposit' && (
            <div className="flex flex-col gap-3">
              {linkingState === 'idle' && (
                <>
                  <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed">
                    ⚙️ <strong>Minecraft Linking Required:</strong> Please enter your Minecraft account username to verify deposit holdings.
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Minecraft IGN</span>
                    <input
                      type="text"
                      placeholder="e.g. Steve_Minecraft"
                      value={mcName}
                      onChange={(e) => setMcName(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none"
                    />
                  </div>
                  <button
                    onClick={handleLinkMinecraft}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl mt-2"
                  >
                    Link Minecraft
                  </button>
                </>
              )}

              {linkingState === 'linking' && (
                <div className="text-center py-10 flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                  <span className="text-xs text-slate-400">Verifying on LunarSpin verification node...</span>
                </div>
              )}

              {linkingState === 'verify' && (
                <div className="flex flex-col gap-3 text-center">
                  <div className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/25 p-3 rounded-lg leading-relaxed">
                    ⚠️ Owner verification payment pending!
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed text-left">
                    Please join the Minecraft server and make the following transaction to complete link:
                  </p>
                  <div className="bg-slate-950 p-4 border border-white/5 rounded-xl text-md font-mono text-purple-400 font-extrabold uppercase">
                    /pay lolznumbertree {verifyAmount}
                  </div>
                  <button
                    onClick={handleVerifyPayment}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl mt-2"
                  >
                    Verify Complete
                  </button>
                </div>
              )}

              {linkingState === 'linked' && (
                <div className="flex flex-col gap-4 text-center">
                  <div className="py-2 px-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Minecraft username linked: {mcName}
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Deposit Count (donuts)</span>
                    <input
                      type="number"
                      value={depositAmt}
                      onChange={(e) => setDepositAmt(Math.max(100, Math.floor(parseFloat(e.target.value)) || 100))}
                      className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-[10px] text-slate-500 text-left leading-relaxed">
                    💡 <strong>How to complete:</strong> After submitting, pay standard bot <code>lolznumbertree</code> in-game to reflect coins within 5 mins.
                  </div>

                  <button
                    onClick={handleCreateDeposit}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl"
                  >
                    Create Deposit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* WITHDRAW */}
          {tab === 'withdraw' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed">
                💸 Submit a requests log to payout donuts directly to your inside Minecraft character. Minimum withdrawal sum: 5,000 donuts.
              </div>

              <div className="flex flex-col gap-1 text-left">
                <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Receiving IGN Character</span>
                <input
                  type="text"
                  placeholder="e.g. Steve_Minecraft"
                  value={wdUser}
                  onChange={(e) => setWdUser(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Amount (Minimum 5,000)</span>
                <input
                  type="number"
                  value={wdAmt}
                  onChange={(e) => setWdAmt(Math.max(10, Math.floor(parseFloat(e.target.value)) || 5000))}
                  className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none"
                />
              </div>

              <button
                onClick={handleWithdrawalRequest}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl mt-2"
              >
                Withdraw donuts
              </button>
            </div>
          )}

          {/* TIP */}
          {tab === 'tip' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed">
                🎁 Tip online lobby friends directly! Tipped sums will be credited immediately and broadcasted in active chat.
              </div>

              <div className="flex flex-col gap-1 text-left">
                <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Target Player IGN Name</span>
                <input
                  type="text"
                  placeholder="e.g. LunarPlayer"
                  value={tipUser}
                  onChange={(e) => setTipUser(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Donuts tip size</span>
                <input
                  type="number"
                  value={tipAmt}
                  onChange={(e) => setTipAmt(Math.max(1, Math.floor(parseFloat(e.target.value)) || 100))}
                  className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none"
                />
              </div>

              <button
                onClick={handleSendTip}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl mt-2"
              >
                Send Tip
              </button>
            </div>
          )}

          {/* PROMO */}
          {tab === 'promo' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed">
                🎟️ Claim active welcome coupons for immediate balance credit boost.
              </div>

              <div className="flex flex-col gap-1 text-left">
                <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Coupon Promo Code</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME250"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none uppercase flex-1"
                  />
                  <button
                    onClick={handleRedeemPromo}
                    className="py-3 px-5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-extrabold uppercase text-white shadow shadow-purple-500/10 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-slate-500">
                <span className="font-extrabold text-slate-400">Available Welcome Codes:</span>
                <ul className="list-disc pl-4 mt-1 flex flex-col gap-1">
                  <li><code>WELCOME250</code> (+250 Donuts)</li>
                  <li><code>DONUT100</code> (+100 Donuts)</li>
                  <li><code>LUNAR500</code> (+500 Donuts)</li>
                </ul>
              </div>
            </div>
          )}

          {/* HISTORY */}
          {tab === 'history' && (
            <div className="flex flex-col gap-2">
              {transactions.map((tx) => {
                const isPos = tx.amt >= 0;
                return (
                  <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-950/20 border border-white/5 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-slate-300 block">{tx.desc}</span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">
                        {new Date(tx.ts).toLocaleString()}
                      </span>
                    </div>
                    <span className={`font-black ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{formatMoney(tx.amt)} 🍩
                    </span>
                  </div>
                );
              })}
              {transactions.length === 0 && (
                <div className="text-center text-slate-600 text-xs py-10 font-bold">
                  No previous transaction log history. Try redeeming some codes!
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
