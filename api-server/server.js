import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

// pool Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Supabase/managed PG usually requires SSL
    rejectUnauthorized: false,
  },
  keepAlive: true,
  max: Number(process.env.DB_POOL_MAX || 5),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT || 10_000),
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT || 5_000)
});

// Optional: quick visibility into DB reachability on boot
pool.query('select 1 as ok').then(() => {
  console.log('[db] connection test OK');
}).catch((err) => {
  console.error('[db] connection test FAILED:', err?.code || err?.name || 'error', err?.message || String(err));
});

// Ensure tables exist for IPTV progress/events
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS iptv_watch_events (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        provider_video_id TEXT NOT NULL,
        event TEXT NOT NULL,
        t NUMERIC NOT NULL DEFAULT 0,
        d NUMERIC NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_iptv_events_user ON iptv_watch_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_iptv_events_video ON iptv_watch_events(provider_video_id);
      CREATE INDEX IF NOT EXISTS idx_iptv_events_created ON iptv_watch_events(created_at);

      CREATE TABLE IF NOT EXISTS iptv_positions (
        user_id BIGINT NOT NULL,
        provider_video_id TEXT NOT NULL,
        t NUMERIC NOT NULL DEFAULT 0,
        d NUMERIC NOT NULL DEFAULT 0,
        last_event TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY(user_id, provider_video_id)
      );
      CREATE INDEX IF NOT EXISTS idx_iptv_positions_updated ON iptv_positions(updated_at DESC);
    `);
    console.log('[db] iptv tables ensured');
  } catch (e) {
    console.error('[db] ensure iptv tables failed', e);
  }
})();

function isTransientDbError(err) {
  if (!err) return false;
  const code = err.code || err.name || '';
  const msg = (err.message || '').toLowerCase();
  // network layer
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ENOTFOUND' || code === 'ECONNREFUSED') return true;
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('connect') && msg.includes('timeout')) return true;
  // postgres sqlstate
  const pgCodes = new Set(['57P01' /* admin_shutdown */, '53300' /* too_many_connections */]);
  return pgCodes.has(code);
}

// EXPRESS APP
const app = express();

/**
 * CORS MANUALE (prima di qualunque altra cosa!)
 * Gestiamo TUTTE le request (incluso OPTIONS) prima di body parser e prima delle route.
 */
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Riflettiamo sempre l'origin se presente (più tollerante, utile per CDN/custom domains)
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Max-Age", "600");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// PARSING JSON dopo CORS
app.use(express.json());


app.get("/__debug", (req, res) => {
  res.setHeader("Content-Type", "application/json");

  // mettiamo anche gli header CORS che dovrebbe già mettere il middleware,
  // così vediamo cosa arriva.
  const origin = req.headers.origin || null;
  res.json({
    msg: "debug alive",
    originReceived: origin,
    allowedOrigins: [
      "https://lorenzovichi.it",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:8080"
    ],
    envPort: process.env.PORT || 8080,
    now: new Date().toISOString()
  });
});

// DB health endpoint (helps diagnosing Render/Supabase connectivity)
app.get("/__db", async (req, res) => {
  try {
    const r = await pool.query('select now() as now');
    res.json({ ok: true, now: r.rows[0].now });
  } catch (err) {
    const transient = isTransientDbError(err);
    res.status(transient ? 503 : 500).json({ ok: false, code: err.code || err.name, message: err.message });
  }
});

// Save IPTV player events and update last known position
app.post("/iptv/event", authRequired, async (req, res) => {
  try {
    const { event, currentTime, duration, video_id } = req.body?.data || req.body || {};
    if (!event || typeof currentTime !== 'number' || typeof duration !== 'number' || !video_id) {
      return res.status(400).json({ error: 'invalid payload' });
    }
    const provider_video_id = String(video_id);
    const t = Math.max(0, Number(currentTime) || 0);
    const d = Math.max(0, Number(duration) || 0);

    await pool.query(
      `INSERT INTO iptv_watch_events(user_id, provider_video_id, event, t, d)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, provider_video_id, String(event), t, d]
    );

    await pool.query(
      `INSERT INTO iptv_positions(user_id, provider_video_id, t, d, last_event, updated_at)
       VALUES ($1,$2,$3,$4,$5, NOW())
       ON CONFLICT (user_id, provider_video_id)
       DO UPDATE SET t = EXCLUDED.t, d = EXCLUDED.d, last_event = EXCLUDED.last_event, updated_at = NOW()`,
      [req.user.id, provider_video_id, t, d, String(event)]
    );

    res.json({ ok: true });
  } catch (err) {
    const transient = isTransientDbError(err);
    console.error('iptv/event error', err);
    res.status(transient ? 503 : 500).json({ error: 'server error' });
  }
});

// Get last known position for a given provider video id
app.get("/iptv/position", authRequired, async (req, res) => {
  try {
    const videoId = req.query.video_id;
    if (!videoId) return res.status(400).json({ error: 'missing video_id' });
    const r = await pool.query(
      `SELECT user_id, provider_video_id, t, d, last_event, updated_at
       FROM iptv_positions
       WHERE user_id = $1 AND provider_video_id = $2`,
      [req.user.id, String(videoId)]
    );
    if (!r.rows.length) return res.json({ position: null });
    res.json({ position: r.rows[0] });
  } catch (err) {
    const transient = isTransientDbError(err);
    res.status(transient ? 503 : 500).json({ error: 'server error' });
  }
});

// List recent positions to build a resume row
app.get("/iptv/resume", authRequired, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const r = await pool.query(
      `SELECT provider_video_id, t, d, last_event, updated_at
       FROM iptv_positions
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );
    res.json({ items: r.rows });
  } catch (err) {
    const transient = isTransientDbError(err);
    res.status(transient ? 503 : 500).json({ error: 'server error' });
  }
});

// -------------- UTIL & MIDDLEWARE AUTH --------------
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      public_activity: user.public_activity
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "").trim();
  if (!token) {
    return res.status(401).json({ error: "missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const dbUser = await pool.query(
      `SELECT id, username, avatar_url, public_activity
       FROM users
       WHERE id = $1`,
      [payload.id]
    );

    if (!dbUser.rows.length) {
      return res.status(401).json({ error: "user not found" });
    }

    req.user = dbUser.rows[0];
    next();
  } catch (err) {
    console.error("authRequired error:", err);
    if (isTransientDbError(err)) {
      return res.status(503).json({ error: "db_unavailable", details: err.code || err.name || 'ETIMEDOUT' });
    }
    return res.status(401).json({ error: "invalid token" });
  }
}

// -------------- ROUTES --------------

// signup
app.post("/signup", async (req, res) => {
  try {
    const { username, pin, avatarUrl } = req.body;

    if (!username || !pin) {
      return res.status(400).json({ error: "missing username or pin" });
    }

    const pinHash = await bcrypt.hash(pin, 10);

    const inserted = await pool.query(
      `INSERT INTO users (username, pin_hash, avatar_url, public_activity)
       VALUES ($1,$2,$3,TRUE)
       RETURNING id, username, avatar_url, public_activity`,
      [username, pinHash, avatarUrl || ""]
    );

    const user = inserted.rows[0];
    const token = signToken(user);

    res.json({
      token,
      user
    });
  } catch (err) {
    console.error("signup error", err);
    res.status(500).json({ error: "server error" });
  }
});

// login
app.post("/login", async (req, res) => {
  try {
    const { username, pin } = req.body;

    if (!username || !pin) {
      return res.status(400).json({ error: "missing username or pin" });
    }

    const found = await pool.query(
      `SELECT id, username, pin_hash, avatar_url, public_activity
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (!found.rows.length) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const row = found.rows[0];
    const ok = await bcrypt.compare(pin, row.pin_hash);
    if (!ok) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const user = {
      id: row.id,
      username: row.username,
      avatar_url: row.avatar_url,
      public_activity: row.public_activity
    };

    const token = signToken(user);

    res.json({
      token,
      user
    });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "server error" });
  }
});

// chi sono io
app.get("/me", authRequired, async (req, res) => {
  res.json({ user: req.user });
});

// aggiorna public_activity
app.patch("/me/public_activity", authRequired, async (req, res) => {
  try {
    const { public_activity } = req.body;
    const updated = await pool.query(
      `UPDATE users
       SET public_activity = $1
       WHERE id = $2
       RETURNING id, username, avatar_url, public_activity`,
      [!!public_activity, req.user.id]
    );
    res.json({ user: updated.rows[0] });
  } catch (err) {
    console.error("public_activity error", err);
    res.status(500).json({ error: "server error" });
  }
});

// salva progresso
app.post("/progress/save", authRequired, async (req, res) => {
  try {
    const { series_id, ep_number, seconds } = req.body;

    if (!series_id || !ep_number || seconds == null) {
      return res.status(400).json({ error: "missing fields" });
    }

    await pool.query(
      `INSERT INTO public.watch_progress (user_id, series_id, ep_number, seconds, updated_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (user_id, series_id)
       DO UPDATE SET
         ep_number = EXCLUDED.ep_number,
         seconds = EXCLUDED.seconds,
         updated_at = NOW()`,
      [req.user.id, series_id, ep_number, seconds]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("progress/save error", err);
    res.status(500).json({ error: "server error" });
  }
});

// leggi progressi
app.get("/progress/get", authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT series_id, ep_number, seconds, updated_at
       FROM watch_progress
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ progress: result.rows });
  } catch (err) {
    console.error("progress/get error", err);
    res.status(500).json({ error: "server error" });
  }
});

// avvio server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("API server listening on", PORT);
});

// --- Keep-alive ping (evita cold start) ---
try {
  const PUBLIC_URL = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL || null;
  if (PUBLIC_URL) {
    const PING_EVERY_MS = 4 * 60 * 1000; // 4 minuti
    const doPing = () => {
      const url = PUBLIC_URL.replace(/\/$/, '') + '/__debug?ts=' + Date.now();
      (globalThis.fetch ? fetch(url) : Promise.reject('no-fetch'))
        .then(() => console.log('[keep-alive] ping OK'))
        .catch(() => console.log('[keep-alive] ping failed'));
    };
    setInterval(doPing, PING_EVERY_MS);
    console.log('[keep-alive] enabled ->', PUBLIC_URL);
  }
} catch {}
