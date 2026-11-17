// backend/server.js
// Ultra-lightweight, zero-external-dependency Node.js HTTP server for ORGANA

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const { db, getDashboardData } = require('./database');

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

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
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
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/02-dashboard-utama/index.html';
  }

  let filePath = path.join(ROOT_DIR, safePath);

  // If path is a directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
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
  console.log(`======================================================\n`);
});
