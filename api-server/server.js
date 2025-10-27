import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const app = express();

/**
 * CORS CONFIG
 * consenti solo i domini che devono poter parlare con l'API
 * IMPORTANTISSIMO: metti qui esattamente il dominio pubblico da cui carichi il frontend,
 * tipo https://lorenzovichi.it
 */
const allowedOrigins = [
  "https://lorenzovichi.it",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

// middleware CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // curl/postman non mandano origin -> li lasciamo passare
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// gestisce le richieste preflight OPTIONS
app.options("*", cors());

app.use(express.json());


// Utility: crea JWT firmato
function signToken(user) {
  // NON mettere pin_hash nel token, ovviamente
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      avatar_url: user.avatar_url,
      public_activity: user.public_activity,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// Middleware auth: controlla header Authorization: Bearer <token>
async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // {user_id, username, avatar_url, public_activity}
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ------------------------
// TEST ROUTES
// ------------------------

app.get("/", (req, res) => {
  res.json({ ok: true, msg: "API server online" });
});

app.get("/health/db", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, dbtime: r.rows[0].now });
  } catch (err) {
    console.error("DB ERROR", err);
    res.status(500).json({ ok: false, error: "DB connection failed" });
  }
});

// ------------------------
// AUTH: SIGNUP & LOGIN
// ------------------------

// POST /signup {username, pin, avatarUrl?}
app.post("/signup", async (req, res) => {
  try {
    const { username, pin, avatarUrl } = req.body;

    if (!username || !pin) {
      return res.status(400).json({ error: "username e pin obbligatori" });
    }

    // hashiamo il pin con bcrypt
    const pin_hash = await bcrypt.hash(pin, 10);

    // inseriamo utente nel DB
    const result = await pool.query(
      `INSERT INTO users (username, pin_hash, avatar_url)
       VALUES ($1, $2, $3)
       RETURNING user_id, username, avatar_url, public_activity`,
      [username, pin_hash, avatarUrl || null]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.json({ token, user });
  } catch (err) {
    // 23505 = unique_violation su Postgres (username già preso)
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "username già in uso, scegline un altro" });
    }
    console.error("signup error", err);
    res.status(500).json({ error: "server error" });
  }
});

// POST /login {username, pin}
app.post("/login", async (req, res) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) {
      return res.status(400).json({ error: "username e pin obbligatori" });
    }

    // troviamo l'utente
    const result = await pool.query(
      `SELECT user_id, username, pin_hash, avatar_url, public_activity
       FROM users
       WHERE username = $1`,
      [username]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: "credenziali non valide" });
    }

    const user = result.rows[0];

    // confrontiamo il PIN dato con l'hash salvato
    const ok = await bcrypt.compare(pin, user.pin_hash);
    if (!ok) {
      return res.status(401).json({ error: "credenziali non valide" });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        avatar_url: user.avatar_url,
        public_activity: user.public_activity,
      },
    });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "server error" });
  }
});

// GET /me  (controlla il token)
app.get("/me", auth, async (req, res) => {
  // req.user arriva dal token già validato
  res.json({ user: req.user });
});

// PATCH /me/public_activity {public_activity: true/false}
app.patch("/me/public_activity", auth, async (req, res) => {
  const { public_activity } = req.body;
  const boolVal = !!public_activity;

  try {
    const result = await pool.query(
      `UPDATE users
       SET public_activity = $1
       WHERE user_id = $2
       RETURNING user_id, username, avatar_url, public_activity`,
      [boolVal, req.user.user_id]
    );

    const updatedUser = result.rows[0];
    const newToken = signToken(updatedUser); // rigenero token con flag aggiornato

    res.json({ token: newToken, user: updatedUser });
  } catch (err) {
    console.error("public_activity error", err);
    res.status(500).json({ error: "server error" });
  }
});

// ------------------------
// WATCH PROGRESS
// ------------------------

// POST /progress/save {series_id, ep_number, seconds}
app.post("/progress/save", auth, async (req, res) => {
  const { series_id, ep_number, seconds } = req.body;

  if (!series_id || !ep_number || seconds === undefined) {
    return res
      .status(400)
      .json({ error: "series_id, ep_number, seconds obbligatori" });
  }

  try {
    await pool.query(
      `INSERT INTO watch_progress (user_id, series_id, ep_number, seconds)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, series_id)
       DO UPDATE SET
         ep_number = EXCLUDED.ep_number,
         seconds   = EXCLUDED.seconds,
         updated_at = now()`,
      [req.user.user_id, series_id, ep_number, seconds]
    );

    res.json({ status: "ok" });
  } catch (err) {
    console.error("progress save error", err);
    res.status(500).json({ error: "server error" });
  }
});

// GET /progress/get
// restituisce tutta la roba "continua a guardare" per quell'utente
app.get("/progress/get", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT series_id, ep_number, seconds, updated_at
       FROM watch_progress
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user.user_id]
    );

    res.json({ progress: result.rows });
  } catch (err) {
    console.error("progress get error", err);
    res.status(500).json({ error: "server error" });
  }
});

// ------------------------
// API SERVER START
// ------------------------

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("API server listening on", port);
});
