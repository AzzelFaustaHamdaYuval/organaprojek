// backend/server.js
// Ultra-lightweight, zero-external-dependency Node.js HTTP server for ORGANA

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const { db, getDashboardData } = require('./database');
const auth = require('./auth');

auth.initAuth();

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function sendJson(res, statusCode, data, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

function redirect(res, location) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1_000_000) {
        reject(new Error('Payload terlalu besar'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // ==================== REST API ENDPOINTS ====================
  if (pathname.startsWith('/api/')) {
    try {
      // ---------- AUTENTIKASI (publik) ----------
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await parseBody(req);
        const result = auth.login({
          identifier: body.identifier,
          password: body.password,
          remember: body.remember === true,
          ip: req.socket.remoteAddress || 'unknown'
        });
        if (!result.ok) {
          return sendJson(res, result.status, { success: false, error: result.message });
        }
        return sendJson(res, 200, { success: true, user: result.user }, { 'Set-Cookie': result.cookie });
      }

      if (pathname === '/api/auth/me' && req.method === 'GET') {
        const user = auth.userFromRequest(req);
        if (!user) return sendJson(res, 401, { success: false, error: 'Belum masuk.' });
        return sendJson(res, 200, { success: true, user });
      }

      if (pathname === '/api/auth/logout' && req.method === 'POST') {
        auth.destroySession(auth.tokenFromRequest(req));
        return sendJson(res, 200, { success: true }, { 'Set-Cookie': auth.clearCookie() });
      }

      // Ringkasan angka untuk halaman login (hanya agregat, tanpa data pribadi)
      if (pathname === '/api/public/login-stats' && req.method === 'GET') {
        const pengurus = db.prepare(`
          SELECT COUNT(DISTINCT kg.id_anggota) AS total
          FROM keanggotaan kg JOIN periode p ON p.id_periode = kg.id_periode
          WHERE kg.status = 'aktif' AND p.status = 'aktif'
        `).get().total;
        const divisi = db.prepare(`
          SELECT COUNT(*) AS total FROM divisi d JOIN periode p ON p.id_periode = d.id_periode
          WHERE p.status = 'aktif'
        `).get().total;
        const presensi = db.prepare(`
          SELECT COUNT(*) AS total, SUM(CASE WHEN status_hadir = 'hadir' THEN 1 ELSE 0 END) AS hadir
          FROM presensi
        `).get();
        const rate = presensi.total > 0 ? Math.round((presensi.hadir / presensi.total) * 1000) / 10 : null;
        return sendJson(res, 200, { success: true, data: { pengurus, divisi, ratePresensi: rate } });
      }

      // ---------- Semua endpoint lain wajib login ----------
      if (!auth.userFromRequest(req)) {
        return sendJson(res, 401, { success: false, error: 'Sesi tidak valid. Silakan masuk kembali.' });
      }

      // 1. Dashboard complete data
      if (pathname === '/api/dashboard' && req.method === 'GET') {
        const periodeId = parsedUrl.query.periode ? parseInt(parsedUrl.query.periode) : 1;
        const data = getDashboardData(periodeId);
        return sendJson(res, 200, { success: true, data });
      }

      // 2. Periode
      if (pathname === '/api/periode' && req.method === 'GET') {
        const rows = db.prepare('SELECT * FROM periode ORDER BY tahun_mulai DESC').all();
        return sendJson(res, 200, { success: true, data: rows });
      }
      if (pathname === '/api/periode' && req.method === 'POST') {
        const body = await parseBody(req);
        const stmt = db.prepare('INSERT INTO periode (nama, tahun_mulai, tahun_selesai, status) VALUES (?, ?, ?, ?)');
        const result = stmt.run(body.nama, body.tahun_mulai, body.tahun_selesai, body.status || 'aktif');
        return sendJson(res, 201, { success: true, id_periode: result.lastInsertRowid });
      }

      // 3. Program Kerja
      if (pathname === '/api/program-kerja' && req.method === 'GET') {
        const rows = db.prepare(`
          SELECT pk.*, d.nama as divisi_nama 
          FROM program_kerja pk 
          JOIN divisi d ON pk.id_divisi = d.id_divisi
        `).all();
        return sendJson(res, 200, { success: true, data: rows });
      }
      if (pathname === '/api/program-kerja' && req.method === 'POST') {
        const body = await parseBody(req);
        const stmt = db.prepare('INSERT INTO program_kerja (id_divisi, nama, target, anggaran, status) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(body.id_divisi, body.nama, body.target, body.anggaran || 0, body.status || 'berjalan');
        return sendJson(res, 201, { success: true, id_program: result.lastInsertRowid });
      }

      // 4. Kegiatan
      if (pathname === '/api/kegiatan' && req.method === 'GET') {
        const rows = db.prepare(`
          SELECT k.*, pk.nama as proker_nama 
          FROM kegiatan k 
          JOIN program_kerja pk ON k.id_program = pk.id_program 
          ORDER BY k.tanggal ASC
        `).all();
        return sendJson(res, 200, { success: true, data: rows });
      }
      if (pathname === '/api/kegiatan' && req.method === 'POST') {
        const body = await parseBody(req);
        const stmt = db.prepare('INSERT INTO kegiatan (id_program, nama, tanggal, lokasi) VALUES (?, ?, ?, ?)');
        const result = stmt.run(body.id_program, body.nama, body.tanggal, body.lokasi);
        return sendJson(res, 201, { success: true, id_kegiatan: result.lastInsertRowid });
      }

      // 5. Presensi
      if (pathname === '/api/presensi' && req.method === 'GET') {
        const rows = db.prepare(`
          SELECT pr.*, a.nama as anggota_nama, a.nim, k.nama as kegiatan_nama 
          FROM presensi pr 
          JOIN anggota a ON pr.id_anggota = a.id_anggota 
          JOIN kegiatan k ON pr.id_kegiatan = k.id_kegiatan 
          ORDER BY pr.waktu DESC
        `).all();
        return sendJson(res, 200, { success: true, data: rows });
      }
      if (pathname === '/api/presensi' && req.method === 'POST') {
        const body = await parseBody(req);
        const stmt = db.prepare(`
          INSERT INTO presensi (id_kegiatan, id_anggota, status_hadir, waktu, keterangan)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id_kegiatan, id_anggota) DO UPDATE SET
            status_hadir = excluded.status_hadir,
            waktu = excluded.waktu,
            keterangan = excluded.keterangan
        `);
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        stmt.run(body.id_kegiatan, body.id_anggota, body.status_hadir || 'hadir', now, body.keterangan || 'Presensi Mandiri');
        return sendJson(res, 201, { success: true });
      }

      // 6. Tugas & Penugasan
      if (pathname === '/api/penugasan' && req.method === 'PATCH') {
        const body = await parseBody(req);
        const stmt = db.prepare(`
          UPDATE penugasan 
          SET status = ?, progres = ?, tgl_selesai = ?
          WHERE id_tugas = ? AND id_anggota = ?
        `);
        const tglSelesai = body.status === 'selesai' ? new Date().toISOString().substring(0, 10) : null;
        stmt.run(body.status, body.progres, tglSelesai, body.id_tugas, body.id_anggota);
        return sendJson(res, 200, { success: true });
      }

      // 7. Anggota & Divisi helpers
      if (pathname === '/api/anggota' && req.method === 'GET') {
        const rows = db.prepare('SELECT * FROM anggota ORDER BY nama ASC').all();
        return sendJson(res, 200, { success: true, data: rows });
      }
      if (pathname === '/api/divisi' && req.method === 'GET') {
        const rows = db.prepare('SELECT * FROM divisi ORDER BY id_divisi ASC').all();
        return sendJson(res, 200, { success: true, data: rows });
      }

      // 404 for unknown api
      return sendJson(res, 404, { error: 'API route not found' });
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // ==================== STATIC FILE HANDLER ====================
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Bad request');
    return;
  }

  // Alur utama: halaman awal = landing page (tombol "Masuk" -> login -> dashboard)
  if (decodedPath === '/' || decodedPath === '\\') {
    return redirect(res, '/01-landing-page/index.html');
  }

  // Jangan pernah sajikan kode server, database, git, atau berkas tersembunyi
  if (/^\/(backend|node_modules)(\/|$)/i.test(decodedPath) ||
      /(^|\/)\.[^/]/.test(decodedPath) ||
      /^\/package(-lock)?\.json$/i.test(decodedPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end(`File not found: ${pathname}`);
    return;
  }

  let safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT_DIR, safePath);
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Forbidden');
    return;
  }

  // If path is a directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Halaman dashboard (folder 02-14) hanya untuk pengguna yang sudah login
  const isProtectedPage =
    /^\/(0[2-9]|1[0-4])-[^/]+(\/|$)/.test(decodedPath) &&
    path.extname(filePath).toLowerCase() === '.html';
  if (isProtectedPage && !auth.userFromRequest(req)) {
    const next = encodeURIComponent(pathname + (parsedUrl.search || ''));
    return redirect(res, `/15-organa-login/index.html?next=${next}`);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end(`File not found: ${pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  ORGANA PLATFORM SERVER IS RUNNING`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Dashboard: http://localhost:${PORT}/02-dashboard-utama/index.html`);
  console.log(`  Landing:   http://localhost:${PORT}/01-landing-page/index.html`);
  console.log(`  Login:     http://localhost:${PORT}/15-organa-login/index.html`);
  console.log(`======================================================\n`);
});