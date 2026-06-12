import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins } from 'lucide-react';

interface BlackjackProps {
  balance: number;
  updateBalance: (amt: number) => void;
  addXP: (amt: number) => void;
  logLiveBet: (game: string, amount: number, result: 'win' | 'loss', mult: number) => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
  playSound: (win: boolean) => void;
}

interface Card {
  suit: string;
  rank: string;
  val: number;
}

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = [
  { name: '2', val: 2 }, { name: '3', val: 3 }, { name: '4', val: 4 }, { name: '5', val: 5 }, { name: '6', val: 6 },
  { name: '7', val: 7 }, { name: '8', val: 8 }, { name: '9', val: 9 }, { name: '10', val: 10 },
  { name: 'J', val: 10 }, { name: 'Q', val: 10 }, { name: 'K', val: 10 }, { name: 'A', val: 11 }
];

export default function Blackjack({
  balance,
  updateBalance,
  addXP,
  logLiveBet,
  toast,
  playSound
}: BlackjackProps) {
  const [bet, setBet] = useState<number>(100);
  const [active, setActive] = useState<boolean>(false);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [outcome, setOutcome] = useState<string | null>(null);

  // Score hand logic
  const calculateHandValue = (hand: Card[]) => {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
      score += card.val;
      if (card.rank === 'A') aces++;
    }
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  const createDeck = (): Card[] => {
    const freshDeck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        freshDeck.push({ suit, rank: rank.name, val: rank.val });
      }
    }
    // Shuffle
    for (let i = freshDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [freshDeck[i], freshDeck[j]] = [freshDeck[j], freshDeck[i]];
    }
    return freshDeck;
  };

  const handleDeal = () => {
    if (active) return;
    if (bet > balance || balance <= 0) {
      toast('Not enough donuts!', 'lose');
      return;
    }

    setOutcome(null);
    updateBalance(-bet);
    addXP(Math.max(1, Math.floor(bet / 10)));

    const newDeck = createDeck();
    const p1 = newDeck.pop()!;
    const d1 = newDeck.pop()!;
    const p2 = newDeck.pop()!;
    const d2 = newDeck.pop()!;

    const player = [p1, p2];
    const dealer = [d1, d2];

    const playerVal = calculateHandValue(player);

    setDeck(newDeck);
    setPlayerHand(player);
    setDealerHand(dealer);
    setActive(true);

    if (playerVal === 21) {
      // Natural Blackjack trigger
      handleStandWithHands(player, dealer, newDeck);
    }
  };

  const handleHit = () => {
    if (!active) return;
    const tempDeck = [...deck];
    const nextCard = tempDeck.pop()!;
    const nextHand = [...playerHand, nextCard];

    setDeck(tempDeck);
    setPlayerHand(nextHand);

    const val = calculateHandValue(nextHand);
    if (val > 21) {
      // Bust
      setActive(false);
      setOutcome('BUST! Dealer Wins.');
      playSound(false);
      toast('💥 Bust! Hand value exceeded 21.', 'lose');
      logLiveBet('Blackjack', bet, 'loss', 0);
    }
  };

  const handleDouble = () => {
    if (!active || playerHand.length !== 2) return;
    if (bet > balance) {
      toast('Not enough balance to double!', 'info');
      return;
    }

    // Spend supplementary bet
    updateBalance(-bet);
    const doubledWager = bet * 2;
    const tempDeck = [...deck];
    const nextCard = tempDeck.pop()!;
    const nextHand = [...playerHand, nextCard];

    const val = calculateHandValue(nextHand);

    if (val > 21) {
      setActive(false);
      setDeck(tempDeck);
      setPlayerHand(nextHand);
      setOutcome('BUST! Dealer Wins.');
      playSound(false);
      toast('💥 Bust! Hand value exceeded 21.', 'lose');
      logLiveBet('Blackjack', doubledWager, 'loss', 0);
    } else {
      // Stand after doubling down
      handleStandWithWager(nextHand, dealerHand, tempDeck, doubledWager);
    }
  };

  const handleStandWithHands = (p: Card[], d: Card[], dk: Card[]) => {
    handleStandWithWager(p, d, dk, bet);
  };

  const handleStandWithWager = (p: Card[], d: Card[], dk: Card[], currentBet: number) => {
    if (!active) return;
    setActive(false);

    // Dealer AI draws soft 17s
    const dealerCards = [...d];
    const restDeck = [...dk];

    while (calculateHandValue(dealerCards) < 17) {
      dealerCards.push(restDeck.pop()!);
    }

    setDealerHand(dealerCards);
    setDeck(restDeck);

    const playerVal = calculateHandValue(p);
    const dealerVal = calculateHandValue(dealerCards);

    let payout = 0;
    let message = '';
    let status: 'win' | 'lose' | 'info' = 'info';

    if (dealerVal > 21) {
      payout = currentBet * 2;
      message = 'WIN! Dealer busted.';
      status = 'win';
    } else if (playerVal > dealerVal) {
      // Natural natural 21 blackjack check
      if (playerVal === 21 && p.length === 2) {
        payout = Math.floor(currentBet * 2.5);
        message = '🏆 NATURAL BLACKJACK!';
      } else {
        payout = currentBet * 2;
        message = 'WIN! Higher value.';
      }
      status = 'win';
    } else if (playerVal === dealerVal) {
      payout = currentBet; // Push returns bet
      message = 'PUSH (Tie).';
      status = 'info';
    } else {
      message = 'LOSE. Dealer score higher.';
      status = 'lose';
    }

    if (payout > 0) {
      updateBalance(payout);
      const isWin = payout > currentBet;
      playSound(isWin);
      toast(isWin ? `🏆 ${message} +${payout - currentBet} donuts!` : `🤜 Push: Bet returned`, 'win');
      logLiveBet('Blackjack', payout - currentBet, isWin ? 'win' : 'loss', isWin ? (payout / currentBet) : 1);
    } else {
      playSound(false);
      toast(`💸 Dealer took the cards: -${currentBet} donuts`, 'lose');
      logLiveBet('Blackjack', currentBet, 'loss', 0);
    }

    setOutcome(message);
  };

  const handleStand = () => {
    handleStandWithHands(playerHand, dealerHand, deck);
  };

  const pScore = calculateHandValue(playerHand);
  const dScore = active ? '?' : calculateHandValue(dealerHand);

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Table Felt Board */}
      <div className="flex-1 flex flex-col p-6 bg-emerald-950/40 border border-emerald-900/10 relative justify-center">
        <div className="absolute top-4 left-4 text-xs font-semibold text-emerald-500 tracking-wider">
          ESTEE CASINO CARD FELT
        </div>

        {/* Board felt contents */}
        <div className="flex flex-col gap-6 items-center my-6">
          
          {/* Dealer hand row */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase mb-2">
              Dealer Score: <span className="text-white underline">{dScore}</span>
            </span>
            <div className="flex gap-2 min-h-[96px] items-center">
              {dealerHand.map((c, i) => (
                <div
                  key={i}
                  className={`w-16 h-24 rounded-lg bg-white shadow-lg flex flex-col justify-between p-2 select-none text-slate-900 border border-slate-200
                    ${i === 1 && active ? 'bg-gradient-to-br from-indigo-800 to-purple-900 border-none' : ''}`}
                >
                  {i === 1 && active ? (
                    <div className="h-full flex items-center justify-center text-white text-xl">🍀</div>
                  ) : (
                    <>
                      <span className="text-xs font-bold leading-none align-top">{c.rank}</span>
                      <span className="text-3xl text-center self-center h-auto">{c.suit}</span>
                      <span className="text-xs font-bold leading-none self-end rotate-180">{c.rank}</span>
                    </>
                  )}
                </div>
              ))}
              {dealerHand.length === 0 && (
                <div className="w-16 h-24 rounded-lg border-2 border-dashed border-emerald-600/30 flex items-center justify-center text-emerald-600/40 text-xs">
                  EMPTY
                </div>
              )}
            </div>
          </div>

          {/* Golden division ring line */}
          <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent my-2" />

          {/* Player Hand row */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase mb-2">
              Your score: <span className="text-white underline">{pScore > 0 ? pScore : '?'}</span>
            </span>
            <div className="flex gap-2 min-h-[96px] items-center">
              {playerHand.map((c, i) => (
                <div
                  key={i}
                  className="w-16 h-24 rounded-lg bg-white shadow-xl flex flex-col justify-between p-2 select-none text-slate-900 border border-slate-200"
                >
                  <span className="text-xs font-bold leading-none align-top">{c.rank}</span>
                  <span className="text-3xl text-center self-center h-auto">{c.suit}</span>
                  <span className="text-xs font-bold leading-none self-end rotate-180">{c.rank}</span>
                </div>
              ))}
              {playerHand.length === 0 && (
                <div className="w-16 h-24 rounded-lg border-2 border-dashed border-emerald-600/30 flex items-center justify-center text-emerald-600/40 text-xs">
                  EMPTY
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Immediate outcomes banner display */}
        {outcome && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-4 rounded-xl border text-center ${
              outcome.includes('WIN') || outcome.includes('NATURAL')
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400' 
                : outcome.includes('PUSH') ? 'bg-slate-900 border-white/5 text-slate-300' : 'bg-rose-500/15 border-rose-500/35 text-rose-400'
            }`}
          >
            <div className="text-md font-extrabold uppercase tracking-widest">{outcome}</div>
          </motion.div>
        )}
      </div>

      {/* Control panel buttons column */}
      <div className="w-full md:w-64 bg-slate-950 p-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/5 overflow-y-auto">
        {active ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleHit}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition-all shadow-md text-xs uppercase tracking-wider"
            >
              HIT CARD 🃏
            </button>
            <button
              onClick={handleStand}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl transition-all shadow-md text-xs uppercase tracking-wider"
            >
              STAND 🤚
            </button>
            <button
              onClick={handleDouble}
              disabled={playerHand.length !== 2}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold rounded-xl transition-all shadow-md text-xs uppercase tracking-wider"
            >
              DOUBLE DOWN 2x
            </button>
          </div>
        ) : (
          <button
            onClick={handleDeal}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm uppercase tracking-wider"
          >
            DEAL BOARD 🃏
          </button>
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-2">
            Wager donut count
          </label>
          <div className="flex bg-slate-900 border border-white/5 rounded-xl p-3 items-center">
            <Coins className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(Math.max(1, Math.min(balance, Math.floor(parseFloat(e.target.value)) || 0)))}
              disabled={active}
              className="bg-transparent border-none text-white font-extrabold text-sm outline-none w-full"
            />
          </div>
        </div>

        {/* Quick wagers multiples */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => !active && setBet(Math.max(1, Math.round(bet / 2)))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            1/2
          </button>
          <button
            onClick={() => !active && setBet(Math.min(balance, bet * 2))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            2x
          </button>
          <button
            onClick={() => !active && setBet(Math.max(1, Math.min(balance, Math.floor(balance / 2))))}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            50%
          </button>
          <button
            onClick={() => !active && setBet(balance)}
            className="p-1 px-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400"
          >
            MAX
          </button>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex flex-col gap-2 mt-auto text-[10px] text-slate-500">
          <div className="flex justify-between font-bold">
            <span>Natural Blackjack</span>
            <span className="text-amber-400 font-extrabold">2.50x payout</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Standard Dealer Winner</span>
            <span className="text-white font-bold">2.00x payout</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Push / Score Tie</span>
            <span className="text-slate-400 font-bold">Bet refund</span>
          </div>
        </div>
      </div>
    </div>
  );
}
