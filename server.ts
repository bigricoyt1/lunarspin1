import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import { initializeApp, App } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Lazy init Firebase Admin
let firebaseAdminApp: App | null = null;
function getFirebaseAdmin() {
  if (!firebaseAdminApp) {
    firebaseAdminApp = initializeApp();
  }
  return firebaseAdminApp;
}

// Lazy init Stripe
let stripeClient: Stripe | null = null;
function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// Real-time State Syncer Store
const syncerState = {
  messages: [] as any[],
  battles: [] as any[],
  requests: [] as any[],
  usersList: [] as any[],
  config: {
    winDifficulty: "fair",
    maintenanceEnabled: false,
    announcementText: "Welcome to LunarSpin Casino!",
    antiCheatEnabled: true
  },
  liveBets: [] as any[],
  promos: [] as any[]
};

// SSE Connected Client Connections
let sseClients: any[] = [];

function broadcastStateUpdate(payload: any) {
  const data = JSON.stringify(payload);
  sseClients.forEach(client => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (e) {
      // Clean up connection on error
    }
  });
}

async function initStateFromDB() {
  try {
    getFirebaseAdmin();
    const db = getFirestore();
    
    // Load initial messages
    try {
      const msgSnap = await db.collection("messages").orderBy("ts", "desc").limit(30).get();
      const loadedMsgs: any[] = [];
      msgSnap.forEach(doc => {
        const data = doc.data();
        loadedMsgs.push({
          id: doc.id,
          ...data,
          ts: data.ts?.toMillis ? data.ts.toMillis() : (data.ts || Date.now())
        });
      });
      syncerState.messages = loadedMsgs.reverse();
    } catch (e) {
      console.warn("Failed to load initial messages from Firestore:", e);
    }

    // Load active battles
    try {
      const batSnap = await db.collection("battles").where("open", "==", true).get();
      const loadedBattles: any[] = [];
      batSnap.forEach(doc => {
        loadedBattles.push({ id: doc.id, ...doc.data() });
      });
      syncerState.battles = loadedBattles;
    } catch (e) {
      console.warn("Failed to load active battles from Firestore:", e);
    }

    // Load pending requests
    try {
      const reqSnap = await db.collection("requests").where("status", "==", "pending").get();
      const loadedReqs: any[] = [];
      reqSnap.forEach(doc => {
        loadedReqs.push({ id: doc.id, ...doc.data() });
      });
      syncerState.requests = loadedReqs;
    } catch (e) {
      console.warn("Failed to load pending requests from Firestore:", e);
    }

    // Load initial config
    try {
      const configSnap = await db.collection("config").doc("global").get();
      if (configSnap.exists) {
        const data = configSnap.data() || {};
        syncerState.config = {
          winDifficulty: data.winDifficulty || "fair",
          maintenanceEnabled: data.maintenanceEnabled ?? false,
          announcementText: data.announcementText || "Welcome to LunarSpin Casino!",
          antiCheatEnabled: data.antiCheatEnabled ?? true
        };
      }
    } catch (e) {
      console.warn("Failed to load config from Firestore:", e);
    }

  } catch (e) {
    console.warn("Firebase Admin not initialized, running purely in-memory developer sandbox mode:", e);
  }
}

// Invoke on boot asynchronously
initStateFromDB();

const state = {
  announcement: "",
  offlineMode: false,
  balances: {} as Record<string, number>,
  logs: [] as any[],
  promos: {} as any,
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get visitor IP
  app.get("/api/security/ip", (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    res.json({ ip });
  });

  // OAUTH ROUTES
  app.get("/api/auth/url", (req, res) => {
    const { provider } = req.query;
    const redirectUri = `${process.env.APP_URL || 'https://' + req.get('host')}/auth/callback`;

    if (provider === 'discord') {
      const clientId = process.env.DISCORD_CLIENT_ID;
      if (!clientId) return res.status(500).json({ error: "Discord Client ID not configured" });

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'identify email'
      });
      return res.json({ url: `https://discord.com/api/oauth2/authorize?${params.toString()}` });
    }

    if (provider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) return res.status(500).json({ error: "Google Client ID not configured" });

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        access_type: 'offline',
        prompt: 'consent'
      });
      return res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
    }

    res.status(400).json({ error: "Invalid provider" });
  });

  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code, state: oauthState } = req.query;
    const redirectUri = `${process.env.APP_URL || 'https://' + req.get('host')}/auth/callback`;
    
    // We need to know which provider this is. Usually we'd use 'state' param.
    // For now, we can try to guess or use a session if we had one.
    // Simple way: check which client secret we have or pass it back in state if we were robust.
    // Since we don't have sessions, let's use a workaround or check if state contains provider.
    
    const provider = oauthState as string || 'discord'; // Defaulting for simple implementation or assuming state=provider

    try {
      let userData: any = null;
      let accessToken = "";

      if (provider === 'discord') {
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID!,
            client_secret: process.env.DISCORD_CLIENT_SECRET!,
            grant_type: 'authorization_code',
            code: code as string,
            redirect_uri: redirectUri,
          }),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!tokenRes.ok) throw new Error(`Discord token exchange failed: ${await tokenRes.text()}`);
        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token;

        const userRes = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!userRes.ok) throw new Error('Failed to fetch Discord user');
        userData = await userRes.json();
        userData.providerId = userData.id;
        userData.provider = 'discord';
      } else {
        // Google exchange
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: 'authorization_code',
            code: code as string,
            redirect_uri: redirectUri,
          }),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!tokenRes.ok) throw new Error(`Google token exchange failed: ${await tokenRes.text()}`);
        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token;

        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!userRes.ok) throw new Error('Failed to fetch Google user');
        userData = await userRes.json();
        userData.providerId = userData.sub;
        userData.provider = 'google';
      }

      // Send success message and data to parent window
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify(userData)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (e: any) {
      console.error("Auth error:", e);
      res.status(500).send(`Authentication error: ${e.message}`);
    }
  });

  // Secure Game Result Generator (Anti-Cheat)
  app.post("/api/games/roll", (req, res) => {
    const { game, params } = req.body;
    
    // Server-authoritative randomness
    let result: any = {};
    const roll = Math.random();

    switch (game) {
      case 'coinflip':
        // Exactly 50/50
        result = { side: roll >= 0.5 ? 'heads' : 'tails' };
        break;
      case 'mines':
        const gridSize = params.gridSize || 25;
        const minesCount = params.minesCount || 3; // Reduced default mines for better odds
        const mines: number[] = [];
        while (mines.length < minesCount) {
          const m = Math.floor(Math.random() * gridSize);
          if (!mines.includes(m)) mines.push(m);
        }
        result = { mines };
        break;
      case 'crash':
        // Removed 1% instant bust to favor the user (50% win rate for 2x cashout)
        // Mathematically, 1 / (1 - roll) gives 50% chance for > 2.0
        const multiplier = 1 / (1 - Math.random());
        result = { crashPoint: Math.max(1.01, +multiplier.toFixed(2)) };
        break;
      case 'plinko':
        const rows = params.rows || 12;
        const path: number[] = [];
        for (let i = 0; i < rows; i++) {
          path.push(Math.random() >= 0.5 ? 1 : 0);
        }
        const bucket = path.reduce((a, b) => a + b, 0);
        result = { path, bucket };
        break;
      default:
        // Guaranteed 50% win rate or better for other games
        result = { win: roll >= 0.5 };
    }

    res.json({ ...result, nonce: Math.random().toString(36).substring(7) });
  });

  // STRIPE PAYMENTS
  app.post("/api/payments/create-checkout-session", async (req, res) => {
    const { amount, userId, username, coins, itemName } = req.body;
    const stripe = getStripe();
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: itemName || "LunarSpin Credits",
                description: coins ? `Purchase of ${coins.toLocaleString()} coins for @${username}` : `Deposit for @${username}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL || 'https://' + req.get('host')}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || 'https://' + req.get('host')}/?payment_cancel=true`,
        metadata: {
          userId,
          username,
          amount: amount.toString(),
          coins: coins ? coins.toString() : "",
          itemName: itemName || ""
        },
      });

      res.json({ url: session.url });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/payments/verify-session", async (req, res) => {
    const { session_id } = req.query;
    const stripe = getStripe();
    if (!stripe || !session_id) return res.status(400).json({ error: "Invalid request" });

    try {
      const session = await stripe.checkout.sessions.retrieve(session_id as string);
      if (session.payment_status === "paid") {
        const userId = session.metadata?.userId;
        const amount = parseFloat(session.metadata?.amount || "0");
        const coins = session.metadata?.coins ? parseFloat(session.metadata.coins) : 0;
        const itemName = session.metadata?.itemName;

        if (userId && amount > 0) {
          getFirebaseAdmin();
          const db = getFirestore();
          const userRef = db.collection("users").doc(userId);
          const processedRef = db.collection("processed_payments").doc(session.id);

          const awardAmount = coins > 0 ? coins : amount;

          await db.runTransaction(async (t) => {
            const processedDoc = await t.get(processedRef);
            if (processedDoc.exists) return; // Already processed

            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new Error("User not found");

            const currentBalance = (userDoc.data()?.balance || 0);
            t.update(userRef, { 
              balance: currentBalance + awardAmount,
              updatedAt: FieldValue.serverTimestamp()
            });
            
            t.set(processedRef, {
              amount,
              coins,
              userId,
              ts: FieldValue.serverTimestamp()
            });

            // Add transaction log
            const txRef = db.collection("users").doc(userId).collection("transactions").doc();
            t.set(txRef, {
              desc: itemName || `Deposit via Stripe (${session.payment_method_types?.[0] || 'card'})`,
              amt: awardAmount,
              ts: Date.now()
            });
          });

          return res.json({ success: true, amount: awardAmount });
        }
      }
      res.json({ success: false });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Proxy endpoint to retrieve and parse player stats from donutstats.net
  app.get("/api/donutstats/player/:username", async (req, res) => {
    const { username } = req.params;
    try {
      const url = `https://www.donutstats.net/player/${username}`;
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
      if (!response.ok) {
        return res.status(response.status).json({ error: `Not found or proxy failure (status ${response.status})` });
      }
      const html = await response.text();
      
      // Clean up dynamic style and script codes
      let cleanText = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      cleanText = cleanText.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      cleanText = cleanText.replace(/<[^>]+>/g, ' ');
      cleanText = cleanText.replace(/\s+/g, ' ');

      // Regex matches
      const moneyMatch = cleanText.match(/Money\s+\$([A-Za-z0-9.]+)/i);
      const money = moneyMatch ? moneyMatch[1] : '0';
      
      const shardsMatch = cleanText.match(/Shards\s+([A-Za-z0-9.]+)/i);
      const shards = shardsMatch ? shardsMatch[1] : '0';
      
      const playtimeMatch = cleanText.match(/Playtime\s+([A-Za-z0-9.dmh ]+?)(?=\s+Kills|$)/i);
      const playtime = playtimeMatch ? playtimeMatch[1].trim() : '0';

      const killsMatch = cleanText.match(/Kills\s+([A-Za-z0-9.,]+)/i);
      const kills = killsMatch ? killsMatch[1] : '0';

      const deathsMatch = cleanText.match(/Deaths\s+([A-Za-z0-9.,]+)/i);
      const deaths = deathsMatch ? deathsMatch[1] : '0';

      const statusMatch = cleanText.match(new RegExp(`${username}\\s+(Online|Offline)`, 'i'));
      const status = statusMatch ? statusMatch[1] : 'Offline';

      // Parse string formats like $411.1B, 140.8K to actual numbers
      const parseValue = (s: string): number => {
        if (!s) return 0;
        const clean = s.replace(/[^0-9.]/g, '');
        const num = parseFloat(clean);
        if (isNaN(num)) return 0;
        const lower = s.toLowerCase();
        if (lower.endsWith('t')) return num * 1000000000000;
        if (lower.endsWith('b')) return num * 1000000000;
        if (lower.endsWith('m')) return num * 1000000;
        if (lower.endsWith('k')) return num * 1000;
        return num;
      };

      const parsePlaytime = (s: string): number => {
        if (!s) return 0;
        let hrs = 0;
        const dMatch = s.match(/(\d+)d/i);
        const hMatch = s.match(/(\d+)h/i);
        const mMatch = s.match(/(\d+)m/i);
        if (dMatch) hrs += parseInt(dMatch[1]) * 24;
        if (hMatch) hrs += parseInt(hMatch[1]);
        if (mMatch) hrs += parseInt(mMatch[1]) / 60;
        return Math.round(hrs);
      };

      res.json({
        username,
        status,
        money,
        moneyNum: parseValue(money),
        shards,
        shardsNum: parseValue(shards),
        playtime,
        playtimeHours: parsePlaytime(playtime),
        kills,
        killsNum: parseValue(kills),
        deaths,
        deathsNum: parseValue(deaths)
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // REAL-TIME SYNCHRONIZER ENDPOINTS
  app.get("/api/sync/state", (req, res) => {
    res.json(syncerState);
  });

  app.get("/api/sync/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Send initial init payload
    res.write(`data: ${JSON.stringify({ type: "init", state: syncerState })}\n\n`);

    sseClients.push(res);

    req.on("close", () => {
      sseClients = sseClients.filter(c => c !== res);
    });
  });

  app.post("/api/sync/action", async (req, res) => {
    const { action, payload } = req.body;
    
    try {
      getFirebaseAdmin();
      const firestore = getFirestore();

      switch (action) {
        case 'add_message': {
          const msg = payload.message;
          syncerState.messages.push(msg);
          if (syncerState.messages.length > 50) syncerState.messages.shift();
          
          broadcastStateUpdate({ type: "update", state: syncerState });

          // Background firestore write
          firestore.collection("messages").add({
            username: msg.username,
            avatar: msg.avatar,
            text: msg.text,
            color: msg.color,
            emoji: msg.emoji,
            role: msg.role,
            level: msg.level || 0,
            ts: FieldValue.serverTimestamp()
          }).catch(e => console.warn("Failed back end firebase message log:", e));
          break;
        }

        case 'clear_chat': {
          syncerState.messages = [];
          broadcastStateUpdate({ type: "update", state: syncerState });

          firestore.collection("messages").get().then((snap: any) => {
            const batch = firestore.batch();
            snap.forEach((d: any) => batch.delete(d.ref));
            batch.commit();
          }).catch(e => console.warn("Failed back end firebase clear chat:", e));
          break;
        }

        case 'update_config': {
          syncerState.config = { ...syncerState.config, ...payload.config };
          broadcastStateUpdate({ type: "update", state: syncerState });

          firestore.collection("config").doc("global").set(syncerState.config, { merge: true })
            .catch(e => console.warn("Failed back end firebase save config:", e));
          break;
        }

        case 'create_battle': {
          const battle = payload.battle;
          syncerState.battles.push(battle);
          broadcastStateUpdate({ type: "update", state: syncerState });

          firestore.collection("battles").doc(battle.id).set(battle)
            .catch(e => console.warn("Failed db create battle:", e));
          break;
        }

        case 'join_battle': {
          const { battleId, players } = payload;
          const bIdx = syncerState.battles.findIndex((b: any) => b.id === battleId);
          if (bIdx !== -1) {
            syncerState.battles[bIdx].players = players;
            broadcastStateUpdate({ type: "update", state: syncerState });
          }

          firestore.collection("battles").doc(battleId).update({ players })
            .catch(e => console.warn("Failed db join battle update:", e));
          break;
        }

        case 'update_battle': {
          const { battleId, battleData } = payload;
          const bIdx = syncerState.battles.findIndex((b: any) => b.id === battleId);
          if (bIdx !== -1) {
            syncerState.battles[bIdx] = { ...syncerState.battles[bIdx], ...battleData };
            broadcastStateUpdate({ type: "update", state: syncerState });
          }

          firestore.collection("battles").doc(battleId).set(battleData, { merge: true })
            .catch(e => console.warn("Failed db battle update:", e));
          break;
        }

        case 'create_request': {
          const reqObj = payload.request;
          syncerState.requests.push(reqObj);
          broadcastStateUpdate({ type: "update", state: syncerState });

          firestore.collection("requests").doc(reqObj.id).set(reqObj)
            .catch(e => console.warn("Failed db write req:", e));
          break;
        }

        case 'update_request': {
          const { requestId, status } = payload;
          const reqIdx = syncerState.requests.findIndex((r: any) => r.id === requestId);
          if (reqIdx !== -1) {
            syncerState.requests[reqIdx].status = status;
            broadcastStateUpdate({ type: "update", state: syncerState });
          }

          firestore.collection("requests").doc(requestId).update({ status })
            .catch(e => console.warn("Failed db request status update:", e));
          break;
        }

        case 'update_user': {
          const { userId, userData } = payload;
          const uIdx = syncerState.usersList.findIndex((u: any) => u.id === userId);
          if (uIdx !== -1) {
            syncerState.usersList[uIdx] = { ...syncerState.usersList[uIdx], ...userData };
          } else {
            syncerState.usersList.push({ id: userId, ...userData });
          }
          broadcastStateUpdate({ type: "update", state: syncerState });

          firestore.collection("users").doc(userId).set(userData, { merge: true })
            .catch(e => console.warn("Failed db update user:", e));
          break;
        }

        case 'log_bet': {
          const bet = payload.bet;
          syncerState.liveBets.unshift(bet);
          if (syncerState.liveBets.length > 50) syncerState.liveBets.pop();
          broadcastStateUpdate({ type: "update", state: syncerState });
          break;
        }

        default:
          return res.status(400).json({ error: 'Unknown sync action' });
      }

      res.json({ success: true });
    } catch (err) {
      // Offline fallback processing
      switch (action) {
        case 'add_message': {
          const msg = payload.message;
          syncerState.messages.push(msg);
          if (syncerState.messages.length > 50) syncerState.messages.shift();
          break;
        }
        case 'clear_chat':
          syncerState.messages = [];
          break;
        case 'update_config':
          syncerState.config = { ...syncerState.config, ...payload.config };
          break;
        case 'create_battle':
          syncerState.battles.push(payload.battle);
          break;
        case 'join_battle': {
          const bIdx = syncerState.battles.findIndex((b: any) => b.id === payload.battleId);
          if (bIdx !== -1) syncerState.battles[bIdx].players = payload.players;
          break;
        }
        case 'update_battle': {
          const bIdx = syncerState.battles.findIndex((b: any) => b.id === payload.battleId);
          if (bIdx !== -1) syncerState.battles[bIdx] = { ...syncerState.battles[bIdx], ...payload.battleData };
          break;
        }
        case 'create_request':
          syncerState.requests.push(payload.request);
          break;
        case 'update_request': {
          const reqIdx = syncerState.requests.findIndex((r: any) => r.id === payload.requestId);
          if (reqIdx !== -1) syncerState.requests[reqIdx].status = payload.status;
          break;
        }
        case 'update_user': {
          const { userId, userData } = payload;
          const uIdx = syncerState.usersList.findIndex((u: any) => u.id === userId);
          if (uIdx !== -1) {
            syncerState.usersList[uIdx] = { ...syncerState.usersList[uIdx], ...userData };
          } else {
            syncerState.usersList.push({ id: userId, ...userData });
          }
          break;
        }
        case 'log_bet': {
          const bet = payload.bet;
          syncerState.liveBets.unshift(bet);
          if (syncerState.liveBets.length > 50) syncerState.liveBets.pop();
          break;
        }
      }
      broadcastStateUpdate({ type: "update", state: syncerState });
      res.json({ success: true, warning: 'Processed fully in-memory sandbox' });
    }
  });

  // API endpoints
  app.post("/api/admin/action", (req, res) => {
    const { password, action, params } = req.body;
    if (password !== (process.env.ADMIN_PASSWORD || "ricopro2011")) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    switch (action) {
      case 'announcement':
        state.announcement = params.value || "";
        res.json({ ok: true, value: state.announcement });
        break;
      case 'offline':
        state.offlineMode = !!params.value;
        res.json({ ok: true, offline: state.offlineMode });
        break;
      case 'setbal':
        state.balances[params.userId] = parseInt(params.balance) || 0;
        res.json({ ok: true, balance: state.balances[params.userId] });
        break;
      case 'ban':
        // Implementation
        res.json({ ok: true });
        break;
      case 'unban':
        // Implementation
        res.json({ ok: true });
        break;
      case 'setrole':
        // Implementation
        res.json({ ok: true });
        break;
      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
