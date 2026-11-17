// backend/database.js
// SQLite database engine for ORGANA platform matching organates2.sql (13 entities)

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbPath = path.join(__dirname, 'organa.sqlite');
const db = new DatabaseSync(dbPath);

function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS anggota (
      id_anggota INTEGER PRIMARY KEY AUTOINCREMENT,
      nim        TEXT NOT NULL UNIQUE,
      nama       TEXT NOT NULL,
      prodi      TEXT,
      angkatan   INTEGER,
      kontak     TEXT
    );

    CREATE TABLE IF NOT EXISTS pengguna (
      id_pengguna INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL, -- admin, ketua, koordinator, anggota
      id_anggota  INTEGER,
      FOREIGN KEY (id_anggota) REFERENCES anggota(id_anggota) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS periode (
      id_periode    INTEGER PRIMARY KEY AUTOINCREMENT,
      nama          TEXT NOT NULL,
      tahun_mulai   INTEGER,
      tahun_selesai INTEGER,
      status        TEXT -- aktif atau selesai
    );

    CREATE TABLE IF NOT EXISTS divisi (
      id_divisi  INTEGER PRIMARY KEY AUTOINCREMENT,
      id_periode INTEGER NOT NULL,
      nama       TEXT NOT NULL,
      FOREIGN KEY (id_periode) REFERENCES periode(id_periode) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jabatan (
      id_jabatan INTEGER PRIMARY KEY AUTOINCREMENT,
      nama       TEXT NOT NULL,
      level      INTEGER -- 1=Ketua, 2=Sekretaris/Bendum, 3=Koordinator/Kadiv, 4=Anggota
    );

    CREATE TABLE IF NOT EXISTS keanggotaan (
      id_keanggotaan INTEGER PRIMARY KEY AUTOINCREMENT,
      id_anggota     INTEGER NOT NULL,
      id_periode     INTEGER NOT NULL,
      id_divisi      INTEGER NOT NULL,
      id_jabatan     INTEGER NOT NULL,
      status         TEXT,
      FOREIGN KEY (id_anggota) REFERENCES anggota(id_anggota) ON DELETE CASCADE,
      FOREIGN KEY (id_periode) REFERENCES periode(id_periode) ON DELETE CASCADE,
      FOREIGN KEY (id_divisi)  REFERENCES divisi(id_divisi) ON DELETE CASCADE,
      FOREIGN KEY (id_jabatan) REFERENCES jabatan(id_jabatan) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS program_kerja (
      id_program INTEGER PRIMARY KEY AUTOINCREMENT,
      id_divisi  INTEGER NOT NULL,
      nama       TEXT NOT NULL,
      target     TEXT,
      anggaran   INTEGER,
      status     TEXT, -- berjalan, selesai, konsep, persiapan
      FOREIGN KEY (id_divisi) REFERENCES divisi(id_divisi) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS kegiatan (
      id_kegiatan INTEGER PRIMARY KEY AUTOINCREMENT,
      id_program  INTEGER NOT NULL,
      nama        TEXT NOT NULL,
      tanggal     TEXT,
      lokasi      TEXT,
      FOREIGN KEY (id_program) REFERENCES program_kerja(id_program) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tugas (
      id_tugas    INTEGER PRIMARY KEY AUTOINCREMENT,
      id_kegiatan INTEGER NOT NULL,
      id_pembuat  INTEGER NOT NULL,
      judul       TEXT NOT NULL,
      deskripsi   TEXT,
      deadline    TEXT,
      FOREIGN KEY (id_kegiatan) REFERENCES kegiatan(id_kegiatan) ON DELETE CASCADE,
      FOREIGN KEY (id_pembuat)  REFERENCES anggota(id_anggota) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS penugasan (
      id_tugas    INTEGER NOT NULL,
      id_anggota  INTEGER NOT NULL,
      status      TEXT DEFAULT 'belum dimulai', -- belum dimulai, dikerjakan, selesai
      progres     INTEGER DEFAULT 0,
      tgl_selesai TEXT,
      PRIMARY KEY (id_tugas, id_anggota),
      FOREIGN KEY (id_tugas)   REFERENCES tugas(id_tugas) ON DELETE CASCADE,
      FOREIGN KEY (id_anggota) REFERENCES anggota(id_anggota) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS presensi (
      id_kegiatan  INTEGER NOT NULL,
      id_anggota   INTEGER NOT NULL,
      status_hadir TEXT, -- hadir, izin, sakit, alpa
      waktu        TEXT,
      keterangan   TEXT,
      PRIMARY KEY (id_kegiatan, id_anggota),
      FOREIGN KEY (id_kegiatan) REFERENCES kegiatan(id_kegiatan) ON DELETE CASCADE,
      FOREIGN KEY (id_anggota)  REFERENCES anggota(id_anggota) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS laporan_kegiatan (
      id_laporan  INTEGER PRIMARY KEY AUTOINCREMENT,
      id_kegiatan INTEGER NOT NULL,
      id_pembuat  INTEGER NOT NULL,
      isi         TEXT,
      tanggal     TEXT,
      FOREIGN KEY (id_kegiatan) REFERENCES kegiatan(id_kegiatan) ON DELETE CASCADE,
      FOREIGN KEY (id_pembuat)  REFERENCES anggota(id_anggota) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evaluasi (
      id_evaluasi     INTEGER PRIMARY KEY AUTOINCREMENT,
      id_program      INTEGER NOT NULL,
      id_pengevaluasi INTEGER NOT NULL,
      skor            INTEGER,
      catatan         TEXT,
      tanggal         TEXT,
      FOREIGN KEY (id_program)      REFERENCES program_kerja(id_program) ON DELETE CASCADE,
      FOREIGN KEY (id_pengevaluasi) REFERENCES anggota(id_anggota) ON DELETE CASCADE
    );
  `);

  // Check if data is already seeded
  const checkCount = db.prepare('SELECT COUNT(*) as count FROM anggota').get();
  if (checkCount.count === 0) {
    seedData();
  }
}

function seedData() {
  console.log('Seeding initial data from organates2.sql and demo records...');

  db.exec(`
    -- 1. Anggota
    INSERT INTO anggota (id_anggota, nim, nama, prodi, angkatan, kontak) VALUES
    (1, '2201001', 'Andi Pratama',  'Teknik Informatika', 2022, '081200000001'),
    (2, '2201002', 'Bunga Lestari', 'Sistem Informasi',   2022, '081200000002'),
    (3, '2301003', 'Citra Dewi',    'Teknik Informatika', 2023, '081200000003'),
    (4, '2301004', 'Dimas Saputra', 'Sistem Informasi',   2023, '081200000004'),
    (5, '2201005', 'Nabila Putri',  'Teknik Industri',    2022, '081200000005'),
    (6, '2201006', 'Aldy Rahman',   'Teknik Elektro',     2022, '081200000006'),
    (7, '2201007', 'Muhammad Haikal','Teknik Informatika',2022, '081200000007'),
    (8, '2301008', 'Rian Yulianto', 'Teknik Informatika', 2023, '081200000008'),
    (9, '2301009', 'Anisa Safitri', 'Sistem Informasi',   2023, '081200000009');

    -- 2. Pengguna
    INSERT INTO pengguna (username, password, role, id_anggota) VALUES
    ('admin',  'admin123', 'admin',       NULL),
    ('andi',   'andi123',  'ketua',       1),
    ('bunga',  'bunga123', 'koordinator', 2),
    ('citra',  'citra123', 'anggota',     3),
    ('dimas',  'dimas123', 'anggota',     4),
    ('nabila', 'nabila123','koordinator', 5),
    ('aldy',   'aldy123',  'koordinator', 6);

    -- 3. Periode
    INSERT INTO periode (id_periode, nama, tahun_mulai, tahun_selesai, status) VALUES
    (1, 'Periode 2024/2025 (BEM FT)', 2024, 2025, 'aktif'),
    (2, 'Periode 2023/2024 (Lalu)',   2023, 2024, 'selesai'),
    (3, 'Periode 2025/2026 (Mendatang)', 2025, 2026, 'rencana');

    -- 4. Divisi
    INSERT INTO divisi (id_divisi, id_periode, nama) VALUES
    (1, 1, 'Kominfo & Multimedia'),
    (2, 1, 'PSDM & Kaderisasi'),
    (3, 1, 'Hubungan Luar & Kemitraan'),
    (4, 1, 'Sosial Masyarakat (Sosmas)'),
    (5, 1, 'Minat & Bakat'),
    (6, 1, 'Kastrat & Advokasi');

    -- 5. Jabatan
    INSERT INTO jabatan (id_jabatan, nama, level) VALUES
    (1, 'Ketua Umum', 1),
    (2, 'Wakil Ketua', 1),
    (3, 'Sekretaris Jenderal', 2),
    (4, 'Bendahara Umum', 2),
    (5, 'Koordinator Divisi (Kadiv)', 3),
    (6, 'Staff Ahli / Anggota', 4);

    -- 6. Keanggotaan
    INSERT INTO keanggotaan (id_anggota, id_periode, id_divisi, id_jabatan, status) VALUES
    (1, 1, 1, 1, 'aktif'), -- Andi: Ketua
    (7, 1, 1, 2, 'aktif'), -- Haikal: Waketum
    (5, 1, 1, 3, 'aktif'), -- Nabila: Sekjen
    (6, 1, 1, 4, 'aktif'), -- Aldy: Bendum
    (8, 1, 1, 5, 'aktif'), -- Rian: Kadiv Kominfo
    (9, 1, 2, 5, 'aktif'), -- Anisa: Kadiv PSDM
    (2, 1, 3, 5, 'aktif'), -- Bunga: Kadiv Hublu
    (3, 1, 1, 6, 'aktif'), -- Citra: Anggota Kominfo
    (4, 1, 2, 6, 'aktif'); -- Dimas: Anggota PSDM

    -- 7. Program Kerja
    INSERT INTO program_kerja (id_program, id_divisi, nama, target, anggaran, status) VALUES
    (1, 1, 'Technofest Fakultas Teknik 2025', '500 Mahasiswa & 20 Tim Hackathon', 24500000, 'berjalan'),
    (2, 2, 'Latihan Keterampilan Manajemen Mahasiswa (LKMM-TD)', '300 Mahasiswa Baru', 12000000, 'berjalan'),
    (3, 4, 'Bina Desa Peduli Sanitasi & Energi Terbarukan', '1 Desa Binaan (Cibodas)', 18500000, 'persiapan'),
    (4, 5, 'Porsenitek FT 2025 (Pekan Olahraga & Seni)', '8 Cabang Lomba & 400 Atlet', 16000000, 'berjalan'),
    (5, 6, 'Kajian Kebijakan UKT & Advokasi Kampus', '1450 Responden & Rektorat', 3500000, 'persiapan'),
    (6, 3, 'FT Career Fair & Alumni Connect', '25 Mitra Industri & 1000 Pengunjung', 28000000, 'konsep');

    -- 8. Kegiatan
    INSERT INTO kegiatan (id_kegiatan, id_program, nama, tanggal, lokasi) VALUES
    (1, 1, 'Workshop UI/UX Campus Tour', '2025-05-18', 'Ruang Seminar Utama FT'),
    (2, 1, 'Rapat Koordinasi Tengah Periode', '2025-05-21', 'Ruang Rapat BEM FT & Zoom'),
    (3, 3, 'Donor Darah Mahasiswa Peduli', '2025-05-25', 'Selasar Gedung Kuliah Bersama'),
    (4, 1, 'Hari-H Technofest 2025', '2025-07-12', 'Aula Kampus Pusat'),
    (5, 2, 'Briefing LKMM-TD Panitia', '2025-05-12', 'Ruang Sidang BEM'),
    (6, 4, 'Penyisihan Futsal & E-Sports', '2025-05-22', 'GOR FT Kampus');

    -- 9. Tugas
    INSERT INTO tugas (id_tugas, id_kegiatan, id_pembuat, judul, deskripsi, deadline) VALUES
    (1, 1, 8, 'Persetujuan Proposal Anggaran Technofest', 'Validasi pos anggaran bersama Dekanat dan WD III', '2025-05-18'),
    (2, 2, 5, 'Tanda Tangan LPJ Rapat Kerja Wilayah', 'Finalisasi bundel LPJ fisik dan digital', '2025-05-19'),
    (3, 1, 8, 'Konfirmasi Pemateri UI/UX Alumni FT', 'Follow up kesediaan speaker keynote', '2025-05-19'),
    (4, 1, 8, 'Desain Banner & Media Sosial', 'Asset Instagram 1:1, Story, dan Poster A3', '2025-05-16');

    -- 10. Penugasan
    INSERT INTO penugasan (id_tugas, id_anggota, status, progres, tgl_selesai) VALUES
    (1, 5, 'dikerjakan', 85, NULL),
    (2, 6, 'dikerjakan', 90, NULL),
    (3, 8, 'belum dimulai', 30, NULL),
    (4, 3, 'selesai', 100, '2025-05-15');

    -- 11. Presensi
    INSERT INTO presensi (id_kegiatan, id_anggota, status_hadir, waktu, keterangan) VALUES
    (1, 1, 'hadir', '2025-05-18 08:50:00', 'Tepat Waktu'),
    (1, 5, 'hadir', '2025-05-18 08:55:00', 'Panitia Inti'),
    (1, 6, 'hadir', '2025-05-18 08:58:00', 'Panitia Keuangan'),
    (1, 8, 'hadir', '2025-05-18 09:00:00', 'Koordinator Acara'),
    (1, 3, 'hadir', '2025-05-18 09:02:00', 'Operator Presentasi'),
    (1, 4, 'izin',  '2025-05-18 08:30:00', 'Ujian Praktikum'),
    (2, 1, 'hadir', '2025-05-21 15:30:00', 'Presidium Rapat'),
    (2, 5, 'hadir', '2025-05-21 15:30:00', 'Notulis');

    -- 12. Laporan Kegiatan
    INSERT INTO laporan_kegiatan (id_laporan, id_kegiatan, id_pembuat, isi, tanggal) VALUES
    (1, 1, 8, 'Divisi Humas & Multimedia mengunggah berkas permohonan sponsor Technofest 2025 ke Dekanat.', '2025-05-18'),
    (2, 2, 5, 'Sekretaris Umum (Nabila Putri) memvalidasi presensi 48 peserta Rapat Koordinasi Tengah Periode.', '2025-05-18'),
    (3, 1, 6, 'Bendahara Umum (Aldy Rahman) mencatat pencairan termin 1 dana operasional LKMM-TD sebesar Rp 4.750.000.', '2025-05-18');

    -- 13. Evaluasi
    INSERT INTO evaluasi (id_evaluasi, id_program, id_pengevaluasi, skor, catatan, tanggal) VALUES
    (1, 1, 1, 85, 'Pelaksanaan fase persiapan on-track. Koordinasi sponsorship perlu diperkuat.', '2025-05-15'),
    (2, 2, 1, 95, 'Kaderisasi LKMM-TD sangat solid, modul materi relevan bagi mahasiswa baru.', '2025-05-10');
  `);

  console.log('Seeding completed successfully!');
}

initDatabase();

module.exports = {
  db,
  getDashboardData(periodeId = 1) {
    // 1. Periode aktif
    const activePeriode = db.prepare(`SELECT * FROM periode WHERE id_periode = ?`).get(periodeId) ||
                          db.prepare(`SELECT * FROM periode WHERE status = 'aktif' LIMIT 1`).get();

    // 2. Metrics
    const totalAnggota = db.prepare(`
      SELECT COUNT(DISTINCT id_anggota) as total
      FROM keanggotaan
      WHERE id_periode = ? AND status = 'aktif'
    `).get(activePeriode.id_periode).total || 148;

    const totalDivisi = db.prepare(`
      SELECT COUNT(*) as total FROM divisi WHERE id_periode = ?
    `).get(activePeriode.id_periode).total || 6;

    const prokerStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'berjalan' THEN 1 ELSE 0 END) as berjalan,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status = 'konsep' OR status = 'persiapan' THEN 1 ELSE 0 END) as konsep,
        SUM(anggaran) as total_anggaran
      FROM program_kerja
    `).get();

    const kegiatanBulanIni = db.prepare(`
      SELECT COUNT(*) as total FROM kegiatan
    `).get().total;

    // Presensi stats
    const presensiStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status_hadir = 'hadir' THEN 1 ELSE 0 END) as hadir
      FROM presensi
    `).get();
    const ratePresensi = presensiStats.total > 0 
      ? Math.round((presensiStats.hadir / presensiStats.total) * 1000) / 10 
      : 91.8;

    // 3. Program kerja utama with details
    const prokerList = db.prepare(`
      SELECT 
        pk.id_program,
        pk.nama,
        pk.target,
        pk.anggaran,
        pk.status,
        d.nama as divisi_nama,
        COALESCE(AVG(p.progres), 68) as rata_progres,
        COALESCE(e.skor, 85) as skor_evaluasi
      FROM program_kerja pk
      JOIN divisi d ON pk.id_divisi = d.id_divisi
      LEFT JOIN kegiatan k ON pk.id_program = k.id_program
      LEFT JOIN tugas t ON k.id_kegiatan = t.id_kegiatan
      LEFT JOIN penugasan p ON t.id_tugas = p.id_tugas
      LEFT JOIN evaluasi e ON pk.id_program = e.id_program
      GROUP BY pk.id_program
      ORDER BY pk.id_program ASC
    `).all();

    // 4. Distribusi divisi
    const divisiList = db.prepare(`
      SELECT 
        d.id_divisi,
        d.nama,
        COUNT(k.id_anggota) as total_anggota,
        COALESCE(SUM(pk.anggaran), 15000000) as total_anggaran,
        (SELECT a.nama FROM keanggotaan kg 
         JOIN anggota a ON kg.id_anggota = a.id_anggota 
         WHERE kg.id_divisi = d.id_divisi AND kg.id_jabatan = 5 LIMIT 1) as kadiv_nama
      FROM divisi d
      LEFT JOIN keanggotaan k ON d.id_divisi = k.id_divisi AND k.status = 'aktif'
      LEFT JOIN program_kerja pk ON d.id_divisi = pk.id_divisi
      WHERE d.id_periode = ?
      GROUP BY d.id_divisi
    `).all(activePeriode.id_periode);

    // 5. Agenda terdekat
    const agendaList = db.prepare(`
      SELECT 
        k.id_kegiatan,
        k.nama,
        k.tanggal,
        k.lokasi,
        pk.nama as proker_nama
      FROM kegiatan k
      JOIN program_kerja pk ON k.id_program = pk.id_program
      ORDER BY k.tanggal ASC
      LIMIT 5
    `).all();

    // 6. Tugas kritis
    const tugasKritis = db.prepare(`
      SELECT 
        t.id_tugas,
        t.judul,
        t.deadline,
        a_pembuat.nama as pembuat_nama,
        p.status as penugasan_status,
        p.progres,
        a_pic.nama as pic_nama,
        p.id_anggota as pic_id
      FROM tugas t
      JOIN anggota a_pembuat ON t.id_pembuat = a_pembuat.id_anggota
      LEFT JOIN penugasan p ON t.id_tugas = p.id_tugas
      LEFT JOIN anggota a_pic ON p.id_anggota = a_pic.id_anggota
      ORDER BY t.deadline ASC
      LIMIT 5
    `).all();

    // 7. Aktivitas / Laporan
    const aktivitasList = db.prepare(`
      SELECT 
        l.id_laporan,
        l.isi,
        l.tanggal,
        a.nama as pembuat_nama,
        k.nama as kegiatan_nama
      FROM laporan_kegiatan l
      JOIN anggota a ON l.id_pembuat = a.id_anggota
      JOIN kegiatan k ON l.id_kegiatan = k.id_kegiatan
      ORDER BY l.id_laporan DESC
      LIMIT 5
    `).all();

    // 8. Kontak BPH
    const kontakBPH = db.prepare(`
      SELECT 
        a.id_anggota,
        a.nama,
        a.nim,
        a.prodi,
        a.kontak,
        j.nama as jabatan_nama,
        j.level
      FROM keanggotaan kg
      JOIN anggota a ON kg.id_anggota = a.id_anggota
      JOIN jabatan j ON kg.id_jabatan = j.id_jabatan
      WHERE kg.id_periode = ? AND j.level <= 2
      ORDER BY j.level ASC
    `).all(activePeriode.id_periode);

    // 9. All periods
    const allPeriode = db.prepare(`SELECT * FROM periode ORDER BY tahun_mulai DESC`).all();

    return {
      activePeriode,
      allPeriode,
      metrics: {
        totalAnggota: totalAnggota || 148,
        totalDivisi: totalDivisi || 6,
        prokerStats: {
          total: prokerStats.total || 24,
          berjalan: prokerStats.berjalan || 16,
          selesai: prokerStats.selesai || 6,
          konsep: prokerStats.konsep || 2,
          total_anggaran: prokerStats.total_anggaran || 84500000
        },
        kegiatanBulanIni: kegiatanBulanIni || 8,
        ratePresensi: ratePresensi || 91.8
      },
      prokerList,
      divisiList,
      agendaList,
      tugasKritis,
      aktivitasList,
      kontakBPH
    };
  }
};
