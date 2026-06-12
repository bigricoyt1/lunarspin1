import React, { useState } from 'react';
import { parseBet } from '../utils';
import { motion } from 'motion/react';
import { Coins, CheckCircle, Smartphone, User as UserIcon, ArrowUpRight, Gift, Key, Clock, RefreshCw } from 'lucide-react';
import { User, Transaction, User as UserType } from '../types';
import { formatMoney } from '../data';
import { db, handleFirestoreError, OperationType, doc, runTransaction, serverTimestamp } from '../lib/firebase';

interface WalletModalProps {
  user: UserType | null;
  balance: number;
  updateBalance: (amt: number) => void;
  transactions: Transaction[];
  addTransaction: (desc: string, amt: number) => void;
  onLinkMinecraft: (mcName: string) => void;
  onRequestTransaction: (type: 'deposit' | 'withdrawal', amount: number, mcName: string) => void;
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
  onLinkMinecraft,
  onRequestTransaction,
  toast,
  onOpenLogin,
  onClose
}: WalletModalProps) {
  const [tab, setTab] = useState<'deposit' | 'withdraw' | 'tip' | 'promo' | 'history'>('deposit');
  
  // Deposit mock steps
  const [mcName, setMcName] = useState<string>(user?.minecraftUsername || user?.pendingMinecraftUsername || '');
  const [linkingState, setLinkingState] = useState<'idle' | 'linking' | 'verify' | 'pending' | 'linked'>(
    user?.minecraftUsername ? 'linked' : (user?.pendingMinecraftUsername ? 'pending' : 'idle')
  );

  // Sync state when user prop changes (e.g. from Admin approval)
  React.useEffect(() => {
    if (user?.minecraftUsername) {
      setLinkingState('linked');
      setMcName(user.minecraftUsername);
    } else if (user?.pendingMinecraftUsername) {
      setLinkingState('pending');
      setMcName(user.pendingMinecraftUsername);
    } else {
      setLinkingState('idle');
    }
  }, [user?.minecraftUsername, user?.pendingMinecraftUsername]);
  const [verifyAmount, setVerifyAmount] = useState<number>(5);
  const [depositAmt, setDepositAmt] = useState<string>('1k');
  const [depositMethod, setDepositMethod] = useState<'minecraft' | 'stripe'>('stripe');
  const [isProcessingStripe, setIsProcessingStripe] = useState<boolean>(false);

  // Withdrawal outputs
  const [wdUser, setWdUser] = useState<string>(user?.minecraftUsername || '');
  const [wdAmt, setWdAmt] = useState<string>('5k');

  // Tip payouts
  const [tipUser, setTipUser] = useState<string>('');
  const [tipAmt, setTipAmt] = useState<string>('100');

  // Promo inputs
  const [promoCode, setPromoCode] = useState<string>('');
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>(user?.redeemedCodes || []);

  React.useEffect(() => {
    if (user?.redeemedCodes) {
      setRedeemedCodes(user.redeemedCodes);
    }
  }, [user?.redeemedCodes]);

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
    setLinkingState('pending');
    onLinkMinecraft(mcName);
    toast(`⏳ Request to link "${mcName}" sent! Waiting for admin approval.`, 'info');
  };

  const handleCreateDeposit = () => {
    if (!user) { onOpenLogin(); return; }
    const numericAmt = parseBet(depositAmt);
    if (numericAmt < 100) {
      toast('Minimum deposit amount is $100', 'info');
      return;
    }
    if (user.pendingRequest) {
      toast('You already have a pending request! Please wait for approval.', 'info');
      return;
    }
    
    onRequestTransaction('deposit', numericAmt, mcName);
    toast(`⏳ Deposit request of ${formatMoney(numericAmt)} submitted! Waiting for admin.`, 'info');
  };

  const handleStripeDeposit = async () => {
    if (!user) { onOpenLogin(); return; }
    const numericAmt = parseBet(depositAmt);
    if (numericAmt < 5) {
      toast('Minimum deposit amount is $5.00', 'info');
      return;
    }

    setIsProcessingStripe(true);
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmt,
          userId: user.id,
          username: user.username
        })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (e: any) {
      toast(e.message || 'Error initiating payment', 'lose');
    } finally {
      setIsProcessingStripe(false);
    }
  };

  const handleWithdrawalRequest = () => {
    if (!user) { onOpenLogin(); return; }
    const numericAmt = parseBet(wdAmt);
    if (!wdUser.trim() || numericAmt < 5000) {
      toast('Minimum withdrawal amount is $5,000', 'info');
      return;
    }
    if (numericAmt > balance) {
      toast('❌ You got no money left!', 'info');
      return;
    }
    if (user.pendingRequest) {
      toast('You already have a pending request! Please wait for approval.', 'info');
      return;
    }

    onRequestTransaction('withdrawal', numericAmt, wdUser);
    toast(`⏳ Withdrawal request of ${formatMoney(numericAmt)} submitted! Status: Pending Approval`, 'info');
  };

  const handleSendTip = () => {
    if (!user) { onOpenLogin(); return; }
    const numericAmt = parseBet(tipAmt);
    if (!tipUser.trim() || numericAmt <= 0) {
      toast('Invalid username or tip amount!', 'info');
      return;
    }
    if (numericAmt > balance) {
      toast('❌ You got no money left!', 'info');
      return;
    }
    if (tipUser.toLowerCase() === user.username.toLowerCase()) {
      toast('Cannot tip yourself!', 'info');
      return;
    }

    updateBalance(-numericAmt);
    addTransaction(`Tip to ${tipUser}`, -numericAmt);
    toast(`🎁 Sent a tip of $${numericAmt} to ${tipUser}!`, 'win');
    setTipAmt('100');
    setTipUser('');
  };

  const handleRedeemPromo = async () => {
    if (!user) { onOpenLogin(); return; }
    const codeInput = promoCode.trim().toUpperCase();
    if (!codeInput) return;

    if (redeemedCodes.includes(codeInput)) {
      toast('You have already redeemed this code!', 'info');
      return;
    }

    try {
      const promoRef = doc(db, 'promos', codeInput);
      const userRef = doc(db, 'users', user.id);

      await runTransaction(db, async (transaction) => {
        const promoDoc = await transaction.get(promoRef);
        if (!promoDoc.exists()) {
          throw new Error('Invalid promo code!');
        }

        const promoData = promoDoc.data();
        if (promoData.currentRedemptions >= promoData.maxRedemptions) {
          throw new Error('This code has reached its maximum uses!');
        }

        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User not found!');
        }

        const userData = userDoc.data();
        const userCodes = userData.redeemedCodes || [];
        if (userCodes.includes(codeInput)) {
          throw new Error('You have already redeemed this code!');
        }

        const payout = promoData.value;
        const nextBalance = (userData.balance || 0) + payout;

        // Update promo count
        transaction.update(promoRef, {
          currentRedemptions: promoData.currentRedemptions + 1
        });

        // Update user balance and redeemed codes
        transaction.update(userRef, {
          redeemedCodes: [...userCodes, codeInput],
          updatedAt: serverTimestamp()
        });

        // Success local updates after transaction
        updateBalance(payout);
        setRedeemedCodes(prev => [...prev, codeInput]);
        addTransaction(`Promo Code: ${codeInput}`, payout);
        toast(`🎟️ Code redeemed! +${payout.toLocaleString()} Money added to your balance!`, 'info');
        setPromoCode('');
      });
    } catch (err: any) {
      toast(err.message || 'Error redeeming code', 'info');
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
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block font-sans">Wallet Manager</span>
          <div className="flex items-baseline gap-1 mt-2 justify-center py-4 bg-slate-950/40 rounded-2xl border border-white/5">
            <span className="text-xl">💵</span>
            <span className="text-3xl font-black text-white">{formatMoney(balance)}</span>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1 font-mono">CASH</span>
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
              {/* Method Selector */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 mb-2">
                <button 
                  onClick={() => setDepositMethod('stripe')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${depositMethod === 'stripe' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Apple/Google/Card
                </button>
                <button 
                  onClick={() => setDepositMethod('minecraft')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${depositMethod === 'minecraft' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Minecraft In-Game
                </button>
              </div>

              {depositMethod === 'minecraft' ? (
                <>
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
                        /pay [DEPOSIT_BOT_IGN] {verifyAmount}
                      </div>
                      <button
                        onClick={handleVerifyPayment}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl mt-2"
                      >
                        Verify Complete
                      </button>
                    </div>
                  )}

                  {linkingState === 'pending' && (
                    <div className="text-center py-10 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center animate-pulse">
                        <Clock className="w-6 h-6 text-amber-500" />
                      </div>
                      <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Waiting for Admin Approval</span>
                      <p className="text-[10px] text-slate-500 max-w-[200px]">
                        Your request to link <strong>{mcName}</strong> has been sent. This usually takes 5-30 minutes.
                      </p>
                    </div>
                  )}

                  {linkingState === 'linked' && (
                    <div className="flex flex-col gap-4 text-center">
                      <div className="py-2 px-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle className="w-4 h-4 text-emerald-400" /> Admin Confirmed • Link Active
                      </div>
                      <div className="text-xs text-slate-300 font-bold">
                        Connected Character: <span className="text-white bg-slate-800 px-2 py-0.5 rounded ml-1">{mcName}</span>
                      </div>

                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Deposit Count (USD)</span>
                        {user?.pendingRequest ? (
                          <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 text-center">
                            <span className="text-[10px] font-black text-amber-500 uppercase flex items-center justify-center gap-2">
                               <Clock className="w-3 h-3" /> Transaction Pending Approval
                            </span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={depositAmt}
                            onChange={(e) => setDepositAmt(e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none"
                          />
                        )}
                      </div>

                      <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-[10px] text-slate-500 text-left leading-relaxed">
                        💡 <strong>Deposit Process:</strong> Once submitted, the admin will verify your payment in-game.
                      </div>

                      {!user?.pendingRequest && (
                        <button
                          onClick={handleCreateDeposit}
                          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl"
                        >
                          Create Deposit
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-4 text-center">
                  <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed text-left">
                    💳 <strong>Digital Payments:</strong> Instantly credit your balance using Apple Pay, Google Pay, or any major Credit Card. Payments are securely processed via Stripe.
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Deposit Amount (USD)</span>
                    <input
                      type="text"
                      value={depositAmt}
                      onChange={(e) => setDepositAmt(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                      <Smartphone className="w-5 h-5 text-slate-400" />
                      <span className="text-[8px] font-black text-slate-500 uppercase">Apple Pay</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                      <Smartphone className="w-5 h-5 text-slate-400" />
                      <span className="text-[8px] font-black text-slate-500 uppercase">Google Pay</span>
                    </div>
                  </div>

                  <button
                    onClick={handleStripeDeposit}
                    disabled={isProcessingStripe}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                  >
                    {isProcessingStripe ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        SECURE REDIRECTING...
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        DEPOSIT NOW
                      </>
                    )}
                  </button>
                  <p className="text-[8px] text-slate-600 font-mono uppercase tracking-tighter">Secure 256-bit SSL encrypted transaction</p>
                </div>
              )}
            </div>
          )}

          {/* WITHDRAW */}
          {tab === 'withdraw' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed text-left">
                💸 Submit a requests log to payout cash directly to your inside Minecraft character. Minimum withdrawal sum: $5,000.
              </div>

              {user?.pendingRequest ? (
                <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-8 text-center flex flex-col items-center gap-3">
                   <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center animate-pulse">
                      <Clock className="w-5 h-5 text-amber-500" />
                   </div>
                   <span className="text-xs font-black text-amber-500 uppercase tracking-tighter">Transaction Pending Approval</span>
                   <p className="text-[10px] text-slate-500">You already have an active request being reviewed by the admin team.</p>
                </div>
              ) : (
                <>
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
                    <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Amount (Minimum $5,000)</span>
                    <input
                      type="text"
                      value={wdAmt}
                      onChange={(e) => setWdAmt(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none leading-none"
                    />
                  </div>

                  <button
                    onClick={handleWithdrawalRequest}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl mt-2"
                  >
                    Withdraw balance
                  </button>
                </>
              )}
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
                <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase mb-1">Cash tip size</span>
                <input
                  type="text"
                  value={tipAmt}
                  onChange={(e) => setTipAmt(e.target.value)}
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

              <div className="mt-2 text-[10px] text-slate-500 font-sans">
                <span className="font-extrabold text-slate-400">Where to find codes?</span>
                <p className="mt-1 leading-relaxed opacity-60">
                  Stay active in our lobby chat and follow our official social community feeds for random limited-time prize pool codes!
                </p>
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
                      {isPos ? '+' : ''}{formatMoney(tx.amt)}
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
