// =====================================================================
//  Database
//  - Produksi: DATABASE_URL (Neon) via driver `pg`.
//  - Development tanpa DATABASE_URL: PGlite (Postgres asli dalam folder .data/pglite).
//  Keduanya Postgres, jadi SQL di seluruh aplikasi sama persis.
//  Tabel dibuat otomatis saat koneksi pertama (CREATE TABLE IF NOT EXISTS).
// =====================================================================
import { hashPassword } from "./password";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
  name          TEXT NOT NULL,
  login         TEXT NOT NULL UNIQUE,
  phone         TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS invitations (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template    TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  config      JSONB NOT NULL DEFAULT '{}'::jsonb,
  wa_message  TEXT NOT NULL DEFAULT '',
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invitations_user_idx ON invitations(user_id);

CREATE TABLE IF NOT EXISTS guests (
  id             SERIAL PRIMARY KEY,
  invitation_id  INTEGER NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  phone          TEXT NOT NULL DEFAULT '',
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guests_inv_idx ON guests(invitation_id);

CREATE TABLE IF NOT EXISTS rsvps (
  id             SERIAL PRIMARY KEY,
  invitation_id  INTEGER NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  client_key     TEXT NOT NULL,
  guest_name     TEXT NOT NULL,
  attending      BOOLEAN NOT NULL,
  pax            INTEGER NOT NULL DEFAULT 0,
  message        TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (invitation_id, client_key)
);

-- ---- Buku tamu digital (check-in di lokasi acara) ----
-- guestbook: fitur dinyalakan admin per undangan (paket "Undangan + Buku Tamu").
-- scan_token: rahasia di link penerima tamu (/bukutamu/<token>); diganti = link lama mati.
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS guestbook  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS scan_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS invitations_scan_token_idx ON invitations(scan_token);

-- code: kode unik per tamu → link pribadi (?k=<code>) & isi QR check-in.
-- walk_in: tamu yang datang tanpa terdaftar, ditambahkan penerima tamu di lokasi.
ALTER TABLE guests ADD COLUMN IF NOT EXISTS code          TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS walk_in       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS checkin_pax   INTEGER NOT NULL DEFAULT 0;
UPDATE guests SET code = substr(md5(random()::text || id::text), 1, 10) WHERE code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS guests_code_idx ON guests(code);

-- RSVP yang dikirim dari link pribadi langsung terhubung ke tamunya.
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_id INTEGER REFERENCES guests(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS media (
  id             TEXT PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitation_id  INTEGER REFERENCES invitations(id) ON DELETE CASCADE,
  mime           TEXT NOT NULL,
  data           BYTEA NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function connect() {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    return {
      query: async (sql, params = []) => (await pool.query(sql, params)).rows,
      exec: (sql) => pool.query(sql),
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(".data", { recursive: true });
  const pg = new PGlite(".data/pglite");
  await pg.waitReady;
  console.log("[db] DATABASE_URL kosong — memakai PGlite lokal (.data/pglite)");
  return {
    query: async (sql, params = []) => (await pg.query(sql, params)).rows,
    exec: (sql) => pg.exec(sql),
  };
}

// Admin pertama dibuat dari ADMIN_LOGIN + ADMIN_PASSWORD (env).
// Di development tanpa env: admin / admin12345 supaya bisa langsung dicoba.
async function seedAdmin(conn) {
  const [{ n }] = await conn.query("SELECT count(*)::int AS n FROM users WHERE role = 'admin'");
  if (n > 0) return;
  let login = process.env.ADMIN_LOGIN;
  let password = process.env.ADMIN_PASSWORD;
  if (!login || !password) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[db] Belum ada admin. Set ADMIN_LOGIN dan ADMIN_PASSWORD lalu restart.");
      return;
    }
    login = "admin";
    password = "admin12345";
  }
  await conn.query("INSERT INTO users (role, name, login, password_hash) VALUES ('admin', 'Admin', $1, $2)", [
    login.trim().toLowerCase(),
    await hashPassword(password),
  ]);
  console.log(`[db] Admin dibuat dengan login: ${login}`);
}

async function init() {
  const conn = await connect();
  await conn.exec(SCHEMA);
  await seedAdmin(conn);
  return conn;
}

// satu koneksi per proses (aman untuk hot-reload Next dev)
function db() {
  globalThis.__kkDb ??= init().catch((e) => {
    globalThis.__kkDb = undefined;
    throw e;
  });
  return globalThis.__kkDb;
}

export async function query(sql, params) {
  return (await db()).query(sql, params);
}

export async function one(sql, params) {
  return (await query(sql, params))[0] ?? null;
}
