// backend/auth.js
// Modul autentikasi ORGANA: login per akun (tabel `pengguna`), sesi berbasis cookie HttpOnly,
// hash password scrypt, dan pembatasan percobaan login. Tanpa dependensi eksternal.

const crypto = require('node:crypto');
const { db } = require('./database');

const COOKIE_NAME = 'organa_sid';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;           // sesi biasa: 8 jam
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000;    // "Ingat saya": 30 hari
const MAX_FAILED_ATTEMPTS = 6;                       // gagal berturut-turut sebelum dikunci sementara
const LOCK_WINDOW_MS = 5 * 60 * 1000;                // jendela pengunci: 5 menit

// ---------------------------------------------------------------- password
const HASH_PREFIX = 'scrypt$';

function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(plain, salt, 64);
  return `${HASH_PREFIX}${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(plain, stored) {
  if (typeof stored !== 'string' || typeof plain !== 'string') return false;

  if (stored.startsWith(HASH_PREFIX)) {
    const [, saltHex, hashHex] = stored.split('$');
    if (!saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(plain, Buffer.from(saltHex, 'hex'), expected.length);
    return crypto.timingSafeEqual(actual, expected);
  }

  // Cadangan untuk password lama yang masih teks biasa (seharusnya sudah dimigrasi saat start)
  const a = Buffer.from(plain);
  const b = Buffer.from(stored);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------------------------------------------------------------- inisialisasi
function initAuth() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sesi (
      token_hash  TEXT PRIMARY KEY,
      id_pengguna INTEGER NOT NULL,
      dibuat      INTEGER NOT NULL,
      kedaluwarsa INTEGER NOT NULL,
      FOREIGN KEY (id_pengguna) REFERENCES pengguna(id_pengguna) ON DELETE CASCADE
    );
  `);

  // Migrasi sekali jalan: ubah password teks biasa menjadi hash scrypt.
  const rows = db.prepare('SELECT id_pengguna, password FROM pengguna').all();
  const update = db.prepare('UPDATE pengguna SET password = ? WHERE id_pengguna = ?');
  let migrated = 0;
  for (const row of rows) {
    if (!String(row.password).startsWith(HASH_PREFIX)) {
      update.run(hashPassword(String(row.password)), row.id_pengguna);
      migrated++;
    }
  }
  if (migrated > 0) {
    console.log(`[auth] ${migrated} password pengguna dimigrasi ke hash scrypt.`);
  }

  db.prepare('DELETE FROM sesi WHERE kedaluwarsa < ?').run(Date.now());
}

// ---------------------------------------------------------------- rate limit
const attempts = new Map(); // kunci -> { count, firstAt }

function limiterKey(ip, identifier) {
  return `${ip}|${String(identifier).toLowerCase()}`;
}

function isLocked(key) {
  const rec = attempts.get(key);
  if (!rec) return 0;
  if (Date.now() - rec.firstAt > LOCK_WINDOW_MS) {
    attempts.delete(key);
    return 0;
  }
  if (rec.count >= MAX_FAILED_ATTEMPTS) {
    return Math.ceil((LOCK_WINDOW_MS - (Date.now() - rec.firstAt)) / 1000);
  }
  return 0;
}

function recordFailure(key) {
  const rec = attempts.get(key);
  if (!rec || Date.now() - rec.firstAt > LOCK_WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: Date.now() });
  } else {
    rec.count++;
  }
}

// ---------------------------------------------------------------- user lookup
const USER_SELECT = `
  SELECT
    p.id_pengguna, p.username, p.password, p.role, p.id_anggota,
    a.nim, a.nama, a.prodi, a.angkatan, a.kontak,
    (SELECT j.nama FROM keanggotaan kg
       JOIN jabatan j ON j.id_jabatan = kg.id_jabatan
       JOIN periode pr ON pr.id_periode = kg.id_periode
      WHERE kg.id_anggota = p.id_anggota AND kg.status = 'aktif'
      ORDER BY (pr.status = 'aktif') DESC, j.level ASC LIMIT 1) AS jabatan,
    (SELECT d.nama FROM keanggotaan kg
       JOIN divisi d ON d.id_divisi = kg.id_divisi
       JOIN periode pr ON pr.id_periode = kg.id_periode
      WHERE kg.id_anggota = p.id_anggota AND kg.status = 'aktif'
      ORDER BY (pr.status = 'aktif') DESC, kg.id_keanggotaan ASC LIMIT 1) AS divisi
  FROM pengguna p
  LEFT JOIN anggota a ON a.id_anggota = p.id_anggota
`;

// Identitas bisa berupa username ATAU NIM (tab di UI hanya petunjuk tampilan).
function findUserByIdentifier(identifier) {
  const ident = String(identifier).trim();
  return (
    db.prepare(`${USER_SELECT} WHERE LOWER(p.username) = LOWER(?) LIMIT 1`).get(ident) ||
    db.prepare(`${USER_SELECT} WHERE a.nim = ? LIMIT 1`).get(ident) ||
    null
  );
}

// Keanggotaan aktif milik seorang anggota (untuk kartu "Jabatan & Keanggotaan" di profil)
const MEMBERSHIP_SQL = `
  SELECT kg.id_keanggotaan, j.nama AS jabatan, j.level, d.nama AS divisi,
         pr.nama AS periode, pr.tahun_mulai, pr.tahun_selesai, pr.status AS periode_status
  FROM keanggotaan kg
  JOIN jabatan j ON j.id_jabatan = kg.id_jabatan
  JOIN divisi d ON d.id_divisi = kg.id_divisi
  JOIN periode pr ON pr.id_periode = kg.id_periode
  WHERE kg.id_anggota = ? AND kg.status = 'aktif'
  ORDER BY (pr.status = 'aktif') DESC, j.level ASC, kg.id_keanggotaan ASC
  LIMIT 1
`;

function membershipOf(idAnggota) {
  if (!idAnggota) return null;
  return db.prepare(MEMBERSHIP_SQL).get(idAnggota) || null;
}

function publicUser(u) {
  const roleLabel = { admin: 'Administrator', ketua: 'Ketua', koordinator: 'Koordinator', anggota: 'Anggota' };
  return {
    id_pengguna: u.id_pengguna,
    username: u.username,
    role: u.role,
    role_label: roleLabel[u.role] || u.role,
    id_anggota: u.id_anggota,
    nim: u.nim || null,
    nama: u.nama || (u.role === 'admin' ? 'Administrator ORGANA' : u.username),
    prodi: u.prodi || null,
    angkatan: u.angkatan || null,
    kontak: u.kontak || null,
    jabatan: u.jabatan || null,
    divisi: u.divisi || null,
    keanggotaan: membershipOf(u.id_anggota)
  };
}

// ---------------------------------------------------------------- sesi
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function createSession(idPengguna, remember) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const ttl = remember ? REMEMBER_TTL_MS : SESSION_TTL_MS;
  db.prepare('INSERT INTO sesi (token_hash, id_pengguna, dibuat, kedaluwarsa) VALUES (?, ?, ?, ?)')
    .run(sha256(token), idPengguna, now, now + ttl);
  return { token, maxAgeSeconds: Math.floor(ttl / 1000) };
}

function getUserFromToken(token) {
  if (!token) return null;
  const row = db.prepare('SELECT id_pengguna, kedaluwarsa FROM sesi WHERE token_hash = ?').get(sha256(token));
  if (!row) return null;
  if (row.kedaluwarsa < Date.now()) {
    db.prepare('DELETE FROM sesi WHERE token_hash = ?').run(sha256(token));
    return null;
  }
  const user = db.prepare(`${USER_SELECT} WHERE p.id_pengguna = ?`).get(row.id_pengguna);
  return user ? publicUser(user) : null;
}

function destroySession(token) {
  if (token) db.prepare('DELETE FROM sesi WHERE token_hash = ?').run(sha256(token));
}

// ---------------------------------------------------------------- cookie helper
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function sessionCookie(token, maxAgeSeconds) {
  const parts = [`${COOKIE_NAME}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (maxAgeSeconds) parts.push(`Max-Age=${maxAgeSeconds}`);
  return parts.join('; ');
}

function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function tokenFromRequest(req) {
  return parseCookies(req.headers.cookie)[COOKIE_NAME] || null;
}

function userFromRequest(req) {
  return getUserFromToken(tokenFromRequest(req));
}

// ---------------------------------------------------------------- login
// Mengembalikan { ok, status, message, user?, cookie? }
function login({ identifier, password, remember, ip }) {
  if (!identifier || !password || typeof identifier !== 'string' || typeof password !== 'string') {
    return { ok: false, status: 400, message: 'NIM/username dan kata sandi wajib diisi.' };
  }
  if (identifier.length > 100 || password.length > 200) {
    return { ok: false, status: 400, message: 'Input terlalu panjang.' };
  }

  const key = limiterKey(ip, identifier);
  const lockedFor = isLocked(key);
  if (lockedFor > 0) {
    return {
      ok: false,
      status: 429,
      message: `Terlalu banyak percobaan gagal. Coba lagi dalam ${lockedFor} detik.`
    };
  }

  const user = findUserByIdentifier(identifier);
  // Selalu hitung hash agar waktu respons tidak membocorkan apakah akun ada.
  const valid = user
    ? verifyPassword(password, user.password)
    : (verifyPassword(password, hashPassword('dummy-password')), false);

  if (!valid) {
    recordFailure(key);
    return { ok: false, status: 401, message: 'NIM/username atau kata sandi salah.' };
  }

  attempts.delete(key);
  const { token, maxAgeSeconds } = createSession(user.id_pengguna, !!remember);
  return {
    ok: true,
    status: 200,
    user: publicUser(user),
    cookie: sessionCookie(token, remember ? maxAgeSeconds : null)
  };
}

module.exports = {
  initAuth,
  login,
  userFromRequest,
  tokenFromRequest,
  destroySession,
  clearCookie,
  hashPassword,
  verifyPassword
};