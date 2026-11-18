// backend/perbaiki-divisi.js
// Menyamakan divisi di tabel `keanggotaan` dengan daftar staf ahli per divisi.
//
// Cara pakai (hentikan server dulu dengan Ctrl+C):
//   node backend/perbaiki-divisi.js            -> hanya MELIHAT apa yang akan diubah (aman)
//   node backend/perbaiki-divisi.js --apply    -> backup database, lalu menerapkan perubahan
//
// Skrip ini hanya mengubah kolom id_divisi pada baris keanggotaan milik NIM yang ada di daftar.
// Tidak menambah atau menghapus data apa pun.

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const APPLY = process.argv.includes('--apply');
const dbArg = process.argv.find(a => a.startsWith('--db='));
const DB_PATH = dbArg ? dbArg.slice(5) : path.join(__dirname, 'organa.sqlite');

// ---------------------------------------------------------------- daftar staf ahli per divisi
const DAFTAR = {
  SOSMAS:    ['2400016', '2400022', '2400024', '2400028', '2400029', '2400030', '2400031', '2400032', '2400033', '2400034', '2400035'],
  AKASIN:    ['2400017', '2400018', '2400027', '2400036', '2400037', '2400038', '2400039', '2400040', '2400041'],
  EKSTERNAL: ['2400015', '2400021', '2400042', '2400043', '2400044', '2400045', '2400046', '2400047', '2400048'],
  MIKAT:     ['2400019', '2400026', '2400049', '2400050', '2400051', '2400052', '2400053', '2400054', '2400055'],
  EKOKRE:    ['2400007', '2400020', '2400056', '2400057', '2400058', '2400059', '2400060', '2400061', '2400062', '2400063'],
  KOMINFO:   ['2400011', '2400013', '2400064', '2400065', '2400066', '2400067', '2400068', '2400069', '2400070', '2400071', '2400072', '2400073'],
  PSDM:      ['2400012', '2400014', '2400023', '2400025', '2400074', '2400075', '2400076']
};

// Kata kunci untuk mengenali nama divisi di database (huruf kecil, tanpa spasi/simbol).
// Kalau nama divisi di databasemu berbeda, tambahkan kata kuncinya di sini.
const ALIAS = {
  SOSMAS:    ['sosmas', 'sosialmasyarakat'],
  AKASIN:    ['akasin', 'akademik'],
  EKSTERNAL: ['eksternal', 'hubunganluar'],
  MIKAT:     ['mikat', 'minatbakat', 'minatdanbakat'],
  EKOKRE:    ['ekokre', 'ekonomikreatif'],
  KOMINFO:   ['kominfo', 'komunikasiinformasi', 'komunikasidaninformasi'],
  PSDM:      ['psdm', 'sumberdayamahasiswa']
};

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

// ---------------------------------------------------------------- mulai
if (!fs.existsSync(DB_PATH)) {
  console.error(`Database tidak ditemukan: ${DB_PATH}`);
  process.exit(1);
}
const db = new DatabaseSync(DB_PATH);

const periode = db.prepare("SELECT id_periode, nama FROM periode WHERE status = 'aktif' ORDER BY tahun_mulai DESC LIMIT 1").get();
if (!periode) {
  console.error('Tidak ada periode berstatus aktif.');
  process.exit(1);
}
console.log(`Periode aktif : ${periode.nama} (id ${periode.id_periode})`);
console.log(`Mode          : ${APPLY ? 'TERAPKAN (database akan diubah)' : 'UJI SAJA (tidak mengubah apa pun)'}\n`);

const divisiList = db.prepare('SELECT id_divisi, nama FROM divisi WHERE id_periode = ? ORDER BY id_divisi').all(periode.id_periode);
console.log('Divisi di database untuk periode ini:');
divisiList.forEach(d => console.log(`  [${d.id_divisi}] ${d.nama}`));
console.log('');

// 1) kode divisi -> id_divisi
const kodeKeId = {};
let petaGagal = false;
for (const kode of Object.keys(DAFTAR)) {
  const cocok = divisiList.filter(d => ALIAS[kode].some(a => norm(d.nama).includes(a)));
  if (cocok.length === 1) {
    kodeKeId[kode] = cocok[0];
  } else {
    petaGagal = true;
    console.error(cocok.length === 0
      ? `X ${kode}: tidak ada divisi yang namanya cocok. Tambahkan kata kunci di ALIAS.`
      : `X ${kode}: cocok dengan lebih dari satu divisi (${cocok.map(c => c.nama).join(' | ')}). Perjelas kata kunci di ALIAS.`);
  }
}
if (petaGagal) {
  console.error('\nBerhenti: ada kode divisi yang belum bisa dipetakan. Tidak ada yang diubah.');
  process.exit(1);
}
console.log('Pemetaan kode -> divisi:');
Object.entries(kodeKeId).forEach(([k, d]) => console.log(`  ${k.padEnd(10)} -> [${d.id_divisi}] ${d.nama}`));
console.log('');

// 2) periksa tiap NIM
const cariAnggota = db.prepare('SELECT id_anggota, nama FROM anggota WHERE nim = ?');
const cariKeanggotaan = db.prepare(`
  SELECT kg.id_keanggotaan, kg.id_divisi, d.nama AS divisi_sekarang, j.nama AS jabatan
  FROM keanggotaan kg
  JOIN divisi d ON d.id_divisi = kg.id_divisi
  JOIN jabatan j ON j.id_jabatan = kg.id_jabatan
  WHERE kg.id_anggota = ? AND kg.id_periode = ? AND kg.status = 'aktif'
`);

const ubah = [];
const sudahBenar = [];
const masalah = [];

for (const [kode, daftarNim] of Object.entries(DAFTAR)) {
  const target = kodeKeId[kode];
  for (const nim of daftarNim) {
    const a = cariAnggota.get(nim);
    if (!a) { masalah.push(`${nim} (${kode}): NIM tidak ada di tabel anggota`); continue; }
    const rows = cariKeanggotaan.all(a.id_anggota, periode.id_periode);
    if (rows.length === 0) { masalah.push(`${nim} ${a.nama} (${kode}): tidak punya keanggotaan aktif di periode ini`); continue; }
    if (rows.length > 1) {
      masalah.push(`${nim} ${a.nama} (${kode}): punya ${rows.length} keanggotaan aktif (${rows.map(r => `${r.jabatan} @ ${r.divisi_sekarang}`).join('; ')}) -> cek manual`);
      continue;
    }
    const r = rows[0];
    if (r.id_divisi === target.id_divisi) {
      sudahBenar.push(nim);
    } else {
      ubah.push({ nim, nama: a.nama, kode, id_keanggotaan: r.id_keanggotaan, dari: r.divisi_sekarang, ke: target.nama, id_divisi_baru: target.id_divisi });
    }
  }
}

console.log(`Sudah benar     : ${sudahBenar.length}`);
console.log(`Perlu diubah    : ${ubah.length}`);
console.log(`Perlu dicek     : ${masalah.length}\n`);

if (ubah.length) {
  console.log('Perubahan:');
  ubah.forEach(u => console.log(`  ${u.nim}  ${u.nama.padEnd(30)} ${u.dari}  ->  ${u.ke}`));
  console.log('');
}
if (masalah.length) {
  console.log('Tidak diubah (perlu dicek manual):');
  masalah.forEach(m => console.log(`  - ${m}`));
  console.log('');
}

// 3) terapkan
if (!APPLY) {
  console.log(ubah.length ? 'Ini hanya uji. Jika sudah sesuai, jalankan lagi dengan --apply.' : 'Tidak ada yang perlu diubah.');
  process.exit(0);
}
if (ubah.length === 0) {
  console.log('Tidak ada yang perlu diubah.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const backupPath = `${DB_PATH}.bak-${stamp}`;
fs.copyFileSync(DB_PATH, backupPath);
console.log(`Backup dibuat: ${backupPath}`);

const update = db.prepare('UPDATE keanggotaan SET id_divisi = ? WHERE id_keanggotaan = ?');
db.exec('BEGIN');
try {
  for (const u of ubah) update.run(u.id_divisi_baru, u.id_keanggotaan);
  db.exec('COMMIT');
  console.log(`Selesai: ${ubah.length} keanggotaan diperbarui.`);
} catch (err) {
  db.exec('ROLLBACK');
  console.error('Gagal, semua perubahan dibatalkan:', err.message);
  process.exit(1);
}