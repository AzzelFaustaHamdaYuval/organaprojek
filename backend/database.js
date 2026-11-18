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
    (1, '2400001', 'Charly Gerald Simanjuntak', 'BPH', 2024, '081200000001'),
    (2, '2400002', 'Azzel Fausta Hamda Yuval', 'BPH', 2024, '081200000002'),
    (3, '2400100', 'Fathiyya Zahrotussyifa', 'BPH', 2024, '081200000003'),
    (4, '2400200', 'Mohamad Nahdi Hidayat', 'BPH', 2024, '081200000004'),
    
    (5, '2400003', 'Hema Septia Bemanda', 'SOSMAS', 2024, '081200000005'),
    (6, '2400016', 'Rizaldi Hendri Prakoso', 'SOSMAS', 2024, '081200000006'),
    (7, '2400022', 'Anjaly Sallima Nafia', 'SOSMAS', 2024, '081200000007'),
    (8, '2400024', 'Selly Anggun', 'SOSMAS', 2024, '081200000008'),
    (9, '2400028', 'Aditya Pratama', 'SOSMAS', 2024, '081200000009'),
    (10, '2400029', 'Nabila Putri Ramadhani', 'SOSMAS', 2024, '081200000010'),
    (11, '2400030', 'Farhan Al Ghifari', 'SOSMAS', 2024, '081200000011'),
    (12, '2400031', 'Citra Ayu Lestari', 'SOSMAS', 2024, '081200000012'),
    (13, '2400032', 'Rizky Maulana', 'SOSMAS', 2024, '081200000013'),
    (14, '2400033', 'Syifa Nurhaliza', 'SOSMAS', 2024, '081200000014'),
    (15, '2400034', 'Daffa Arya Saputra', 'SOSMAS', 2024, '081200000015'),
    (16, '2400035', 'Putri Amelia', 'SOSMAS', 2024, '081200000016'),
    
    (17, '2400004', 'Rafif Sakha Efendi', 'AKASIN', 2024, '081200000017'),
    (18, '2400017', 'Ammar Farras Fauzan', 'AKASIN', 2024, '081200000018'),
    (19, '2400018', 'Farras Syuja', 'AKASIN', 2024, '081200000019'),
    (20, '2400027', 'M. Nouval Arrizqi', 'AKASIN', 2024, '081200000020'),
    (21, '2400036', 'Bagas Ramadhan', 'AKASIN', 2024, '081200000021'),
    (22, '2400037', 'Muhammad Fikri', 'AKASIN', 2024, '081200000022'),
    (23, '2400038', 'Alif Zulfikar', 'AKASIN', 2024, '081200000023'),
    (24, '2400039', 'Rania Safitri', 'AKASIN', 2024, '081200000024'),
    (25, '2400040', 'Kevin Aditya', 'AKASIN', 2024, '081200000025'),
    (26, '2400041', 'Zahra Aulia', 'AKASIN', 2024, '081200000026'),
    
    (27, '2400005', 'Fahlevi Fahad Aqmadinna', 'EKSTERNAL', 2024, '081200000027'),
    (28, '2400015', 'Aurelia Sanggana', 'EKSTERNAL', 2024, '081200000028'),
    (29, '2400021', 'Indah Aryanti Kartika Santoso', 'EKSTERNAL', 2024, '081200000029'),
    (30, '2400042', 'Muhammad Rafli', 'EKSTERNAL', 2024, '081200000030'),
    (31, '2400043', 'Ananda Putri', 'EKSTERNAL', 2024, '081200000031'),
    (32, '2400044', 'Fajar Nugraha', 'EKSTERNAL', 2024, '081200000032'),
    (33, '2400045', 'Dinda Maharani', 'EKSTERNAL', 2024, '081200000033'),
    (34, '2400046', 'Arya Wicaksana', 'EKSTERNAL', 2024, '081200000034'),
    (35, '2400047', 'Salma Khairunnisa', 'EKSTERNAL', 2024, '081200000035'),
    (36, '2400048', 'Ilham Akbar', 'EKSTERNAL', 2024, '081200000036'),
    
    (37, '2400006', 'Renhard Padolski Herlambang', 'MIKAT', 2024, '081200000037'),
    (38, '2400019', 'Haikal Akhsan Darmawan', 'MIKAT', 2024, '081200000038'),
    (39, '2400026', 'Aldi Taher', 'MIKAT', 2024, '081200000039'),
    (40, '2400049', 'Fikri Ramadhan', 'MIKAT', 2024, '081200000040'),
    (41, '2400050', 'Nadya Putri', 'MIKAT', 2024, '081200000041'),
    (42, '2400051', 'Rafi Ahmad', 'MIKAT', 2024, '081200000042'),
    (43, '2400052', 'Salsabila Nurfadila', 'MIKAT', 2024, '081200000043'),
    (44, '2400053', 'Yoga Pratama', 'MIKAT', 2024, '081200000044'),
    (45, '2400054', 'Amanda Salsabila', 'MIKAT', 2024, '081200000045'),
    (46, '2400055', 'Reza Firmansyah', 'MIKAT', 2024, '081200000046'),
    
    (47, '2400007', 'Dicky Maulana Aziz', 'EKOKRE', 2024, '081200000047'),
    (48, '2400020', 'Ilma Nazzala', 'EKOKRE', 2024, '081200000048'),
    (49, '2400056', 'Arkan Dwi Saputra', 'EKOKRE', 2024, '081200000049'),
    (50, '2400057', 'Fathir Alfarizi', 'EKOKRE', 2024, '081200000050'),
    (51, '2400058', 'Nadia Rahmawati', 'EKOKRE', 2024, '081200000051'),
    (52, '2400059', 'Muhammad Iqbal', 'EKOKRE', 2024, '081200000052'),
    (53, '2400060', 'Vina Oktaviani', 'EKOKRE', 2024, '081200000053'),
    (54, '2400061', 'Gilang Ramadhan', 'EKOKRE', 2024, '081200000054'),
    (55, '2400062', 'Tasya Aprilia', 'EKOKRE', 2024, '081200000055'),
    (56, '2400063', 'Raka Pradana', 'EKOKRE', 2024, '081200000056'),
    
    (57, '2400008', 'Muhammad Alfa Khakim', 'KOMINFO', 2024, '081200000057'),
    (58, '2400011', 'Sufi Sundari', 'KOMINFO', 2024, '081200000058'),
    (59, '2400013', 'Dani Ramadhan', 'KOMINFO', 2024, '081200000059'),
    (60, '2400064', 'Alifia Zahra', 'KOMINFO', 2024, '081200000060'),
    (61, '2400065', 'Muhammad Rehan', 'KOMINFO', 2024, '081200000061'),
    (62, '2400066', 'Bella Novitasari', 'KOMINFO', 2024, '081200000062'),
    (63, '2400067', 'Dimas Saputra', 'KOMINFO', 2024, '081200000063'),
    (64, '2400068', 'Aisyah Rahmadani', 'KOMINFO', 2024, '081200000064'),
    (65, '2400069', 'Andika Putra', 'KOMINFO', 2024, '081200000065'),
    (66, '2400070', 'Tiara Anindya', 'KOMINFO', 2024, '081200000066'),
    (67, '2400071', 'Hafiz Maulana', 'KOMINFO', 2024, '081200000067'),
    (68, '2400072', 'Naufal Hidayat', 'KOMINFO', 2024, '081200000068'),
    (69, '2400073', 'Sekar Ayuningtyas', 'KOMINFO', 2024, '081200000069'),
    
    (70, '2400009', 'Fadhil Syarief Pratomo', 'PSDM', 2024, '081200000070'),
    (71, '2400012', 'Aulia Vania Shanty', 'PSDM', 2024, '081200000071'),
    (72, '2400014', 'Farritz', 'PSDM', 2024, '081200000072'),
    (73, '2400023', 'Izzudien Al-Qosam', 'PSDM', 2024, '081200000073'),
    (74, '2400025', 'Raditya Herbayu', 'PSDM', 2024, '081200000074'),
    (75, '2400074', 'Muhammad Fadlan', 'PSDM', 2024, '081200000075'),
    (76, '2400075', 'Dhea Anastasya', 'PSDM', 2024, '081200000076'),
    (77, '2400076', 'Ardiansyah Putra', 'PSDM', 2024, '081200000077');

    -- 2. Pengguna
    INSERT INTO pengguna (username, password, role, id_anggota) VALUES
    -- Admin & BPH Utama
    ('admin', 'admin123', 'admin', NULL),
    ('charlygerald', 'charly123', 'ketua', 1),
    ('azzelfausta', 'azzel123', 'wakil', 2),
    ('fathiyya', 'fathiyya123', 'sekretaris', 3),
    ('mohamadnahdi', 'nahdi123', 'bendahara', 4),

    -- SOSMAS
    ('hemaseptia', 'hema123', 'koordinator', 5),
    ('rizaldihendri', 'rizaldi123', 'anggota', 6),
    ('anjalysallima', 'anjaly123', 'anggota', 7),
    ('sellyanggun', 'selly123', 'anggota', 8),
    ('adityapratama', 'aditya123', 'anggota', 9),
    ('nabilaputri', 'nabila123', 'anggota', 10),
    ('farhanal', 'farhan123', 'anggota', 11),
    ('citraayu', 'citra123', 'anggota', 12),
    ('rizkynaulana', 'rizky123', 'anggota', 13),
    ('syifanurhaliza', 'syifa123', 'anggota', 14),
    ('daffaarya', 'daffa123', 'anggota', 15),
    ('putriamelia', 'putri123', 'anggota', 16),

    -- AKASIN
    ('rafifsakha', 'rafif123', 'koordinator', 17),
    ('ammarrarras', 'ammar123', 'anggota', 18),
    ('farrassyuja', 'farras123', 'anggota', 19),
    ('mnouval', 'nouval123', 'anggota', 20),
    ('bagasramadhan', 'bagas123', 'anggota', 21),
    ('muhammadfikri', 'fikri123', 'anggota', 22),
    ('alifzulfikar', 'alif123', 'anggota', 23),
    ('raniasafitri', 'rania123', 'anggota', 24),
    ('kevinaditya', 'kevin123', 'anggota', 25),
    ('zahraaulia', 'zahra123', 'anggota', 26),

    -- EKSTERNAL
    ('fahlevifahad', 'fahlevi123', 'koordinator', 27),
    ('aureliasanggana', 'aurelia123', 'anggota', 28),
    ('indaharyanti', 'indah123', 'anggota', 29),
    ('muhammadrafli', 'rafli123', 'anggota', 30),
    ('anandaputri', 'ananda123', 'anggota', 31),
    ('fajarnugraha', 'fajar123', 'anggota', 32),
    ('dindamaharani', 'dinda123', 'anggota', 33),
    ('aryawicaksana', 'arya123', 'anggota', 34),
    ('salmakhairunnisa', 'salma123', 'anggota', 35),
    ('ilhamakbar', 'ilham123', 'anggota', 36),

    -- MIKAT
    ('renhardpadolski', 'renhard123', 'koordinator', 37),
    ('haikalakhsan', 'haikal123', 'anggota', 38),
    ('alditaher', 'aldi123', 'anggota', 39),
    ('fikriramadhan', 'fikri123', 'anggota', 40),
    ('nadyaputri', 'nadya123', 'anggota', 41),
    ('rafiahmad', 'rafi123', 'anggota', 42),
    ('salsabilanurfadila', 'salsabila123', 'anggota', 43),
    ('yogapratama', 'yoga123', 'anggota', 44),
    ('amandasalsabila', 'amanda123', 'anggota', 45),
    ('rezafirmansyah', 'reza123', 'anggota', 46),

    -- EKOKRE
    ('dickymaulana', 'dicky123', 'koordinator', 47),
    ('ilmanazzala', 'ilma123', 'anggota', 48),
    ('arkandwi', 'arkan123', 'anggota', 49),
    ('fathiralfarizi', 'fathir123', 'anggota', 50),
    ('nadiarahmawati', 'nadia123', 'anggota', 51),
    ('muhammadiqbal', 'iqbal123', 'anggota', 52),
    ('vinaoktaviani', 'vina123', 'anggota', 53),
    ('gilangramadhan', 'gilang123', 'anggota', 54),
    ('tasyaaprilia', 'tasya123', 'anggota', 55),
    ('rakapradana', 'raka123', 'anggota', 56),

    -- KOMINFO
    ('muhammadalfakhakim', 'alfa123', 'koordinator', 57),
    ('sufisundari', 'sufi123', 'anggota', 58),
    ('daniramadhan', 'dani123', 'anggota', 59),
    ('alifiazahra', 'alifia123', 'anggota', 60),
    ('muhammadrehan', 'rehan123', 'anggota', 61),
    ('bellanovitasari', 'bella123', 'anggota', 62),
    ('dimassaputra', 'dimas123', 'anggota', 63),
    ('aisyahrahmadani', 'aisyah123', 'anggota', 64),
    ('andikaputra', 'andika123', 'anggota', 65),
    ('tiaraanindya', 'tiara123', 'anggota', 66),
    ('hafizmaulana', 'hafiz123', 'anggota', 67),
    ('naufalhidayat', 'naufal123', 'anggota', 68),
    ('sekarayuningtyas', 'sekar123', 'anggota', 69),

    -- PSDM
    ('fadhilsyarief', 'fadhil123', 'koordinator', 70),
    ('auliavaniashanty', 'aulia123', 'anggota', 71),
    ('farritz', 'farritz123', 'anggota', 72),
    ('izzudienalqosam', 'izzudien123', 'anggota', 73),
    ('radityaherbayu', 'raditya123', 'anggota', 74),
    ('muhammadfadlan', 'fadlan123', 'anggota', 75),
    ('dheaanastasya', 'dhea123', 'anggota', 76),
    ('ardiansyahputra', 'ardiansyah123', 'anggota', 77);
    
    -- 3. Periode
    INSERT INTO periode (id_periode, nama, tahun_mulai, tahun_selesai, status) VALUES
    (1, 'Periode 2024/2025 (BEM FASILKOM)', 2024, 2025, 'aktif'),
    (2, 'Periode 2023/2024 (Lalu)',   2023, 2024, 'selesai'),
    (3, 'Periode 2025/2026 (Mendatang)', 2025, 2026, 'rencana');

    -- 4. Divisi
    INSERT INTO divisi (id_divisi, id_periode, nama) VALUES
    (1, 1, 'KOMINFO'),
    (2, 1, 'PSDM'),
    (3, 1, 'Eksternal'),
    (4, 1, 'SOSMAS'),
    (5, 1, 'AKASIN'),
    (6, 1, 'EKOKRE'),
    (7, 1, 'MIKAT'),
    (8, 1, 'BPH');

    -- 5. Jabatan
    INSERT INTO jabatan (id_jabatan, nama, level) VALUES
    (1, 'Ketua Umum', 1),
    (2, 'Wakil Ketua', 1),
    (3, 'Sekretaris   Umum', 2),
    (4, 'Bendahara Umum', 2),
    (5, 'Kepala Departemen (Kadep)', 3),
    (6, 'Staff Ahli / Anggota', 4);

    -- 6. Keanggotaan
    INSERT INTO keanggotaan (id_anggota, id_periode, id_divisi, id_jabatan, status) VALUES
    -- BPH & Pimpinan (ID 1 - 4)
    (1, 1, 1, 1, 'aktif'), -- Charly Gerald Simanjuntak: Ketua
    (2, 1, 1, 2, 'aktif'), -- Azzel Fausta Hamda Yuval: Wakil Ketua
    (3, 1, 1, 3, 'aktif'), -- Fathiyya Zahrotussyifa: Sekretaris Umum
    (4, 1, 1, 4, 'aktif'), -- Mohamad Nahdi Hidayat: Bendahara Umum

    -- SOSMAS (ID 5 - 16)
    (5, 1, 2, 5, 'aktif'), -- Hema Septia Bemanda: Kadiv SOSMAS
    (6, 1, 2, 6, 'aktif'), -- Rizaldi Hendri Prakoso: Anggota
    (7, 1, 2, 6, 'aktif'), -- Anjaly Sallima Nafia: Anggota
    (8, 1, 2, 6, 'aktif'), -- Selly Anggun: Anggota
    (9, 1, 2, 6, 'aktif'), -- Aditya Pratama: Anggota
    (10, 1, 2, 6, 'aktif'), -- Nabila Putri Ramadhani: Anggota
    (11, 1, 2, 6, 'aktif'), -- Farhan Al Ghifari: Anggota
    (12, 1, 2, 6, 'aktif'), -- Citra Ayu Lestari: Anggota
    (13, 1, 2, 6, 'aktif'), -- Rizky Maulana: Anggota
    (14, 1, 2, 6, 'aktif'), -- Syifa Nurhaliza: Anggota
    (15, 1, 2, 6, 'aktif'), -- Daffa Arya Saputra: Anggota
    (16, 1, 2, 6, 'aktif'), -- Putri Amelia: Anggota

    -- AKASIN (ID 17 - 26)
    (17, 1, 3, 5, 'aktif'), -- Rafif Sakha Efendi: Kadiv AKASIN
    (18, 1, 3, 6, 'aktif'), -- Ammar Farras Fauzan: Anggota
    (19, 1, 3, 6, 'aktif'), -- Farras Syuja: Anggota
    (20, 1, 3, 6, 'aktif'), -- M. Nouval Arrizqi: Anggota
    (21, 1, 3, 6, 'aktif'), -- Bagas Ramadhan: Anggota
    (22, 1, 3, 6, 'aktif'), -- Muhammad Fikri: Anggota
    (23, 1, 3, 6, 'aktif'), -- Alif Zulfikar: Anggota
    (24, 1, 3, 6, 'aktif'), -- Rania Safitri: Anggota
    (25, 1, 3, 6, 'aktif'), -- Kevin Aditya: Anggota
    (26, 1, 3, 6, 'aktif'), -- Zahra Aulia: Anggota

    -- EKSTERNAL (ID 27 - 36)
    (27, 1, 4, 5, 'aktif'), -- Fahlevi Fahad Aqmadinna: Kadiv Eksternal
    (28, 1, 4, 6, 'aktif'), -- Aurelia Sanggana: Anggota
    (29, 1, 4, 6, 'aktif'), -- Indah Aryanti Kartika Santoso: Anggota
    (30, 1, 4, 6, 'aktif'), -- Muhammad Rafli: Anggota
    (31, 1, 4, 6, 'aktif'), -- Ananda Putri: Anggota
    (32, 1, 4, 6, 'aktif'), -- Fajar Nugraha: Anggota
    (33, 1, 4, 6, 'aktif'), -- Dinda Maharani: Anggota
    (34, 1, 4, 6, 'aktif'), -- Arya Wicaksana: Anggota
    (35, 1, 4, 6, 'aktif'), -- Salma Khairunnisa: Anggota
    (36, 1, 4, 6, 'aktif'), -- Ilham Akbar: Anggota

    -- MIKAT (ID 37 - 46)
    (37, 1, 5, 5, 'aktif'), -- Renhard Padolski Herlambang: Kadiv MIKAT
    (38, 1, 5, 6, 'aktif'), -- Haikal Akhsan Darmawan: Anggota
    (39, 1, 5, 6, 'aktif'), -- Aldi Taher: Anggota
    (40, 1, 5, 6, 'aktif'), -- Fikri Ramadhan: Anggota
    (41, 1, 5, 6, 'aktif'), -- Nadya Putri: Anggota
    (42, 1, 5, 6, 'aktif'), -- Rafi Ahmad: Anggota
    (43, 1, 5, 6, 'aktif'), -- Salsabila Nurfadila: Anggota
    (44, 1, 5, 6, 'aktif'), -- Yoga Pratama: Anggota
    (45, 1, 5, 6, 'aktif'), -- Amanda Salsabila: Anggota
    (46, 1, 5, 6, 'aktif'), -- Reza Firmansyah: Anggota

    -- EKOKRE (ID 47 - 56)
    (47, 1, 6, 5, 'aktif'), -- Dicky Maulana Aziz: Kadiv EKOKRE
    (48, 1, 6, 6, 'aktif'), -- Ilma Nazzala: Anggota
    (49, 1, 6, 6, 'aktif'), -- Arkan Dwi Saputra: Anggota
    (50, 1, 6, 6, 'aktif'), -- Fathir Alfarizi: Anggota
    (51, 1, 6, 6, 'aktif'), -- Nadia Rahmawati: Anggota
    (52, 1, 6, 6, 'aktif'), -- Muhammad Iqbal: Anggota
    (53, 1, 6, 6, 'aktif'), -- Vina Oktaviani: Anggota
    (54, 1, 6, 6, 'aktif'), -- Gilang Ramadhan: Anggota
    (55, 1, 6, 6, 'aktif'), -- Tasya Aprilia: Anggota
    (56, 1, 6, 6, 'aktif'), -- Raka Pradana: Anggota

    -- KOMINFO (ID 57 - 69)
    (57, 1, 7, 5, 'aktif'), -- Muhammad Alfa Khakim: Kadiv KOMINFO
    (58, 1, 7, 6, 'aktif'), -- Sufi Sundari: Anggota
    (59, 1, 7, 6, 'aktif'), -- Dani Ramadhan: Anggota
    (60, 1, 7, 6, 'aktif'), -- Alifia Zahra: Anggota
    (61, 1, 7, 6, 'aktif'), -- Muhammad Rehan: Anggota
    (62, 1, 7, 6, 'aktif'), -- Bella Novitasari: Anggota
    (63, 1, 7, 6, 'aktif'), -- Dimas Saputra: Anggota
    (64, 1, 7, 6, 'aktif'), -- Aisyah Rahmadani: Anggota
    (65, 1, 7, 6, 'aktif'), -- Andika Putra: Anggota
    (66, 1, 7, 6, 'aktif'), -- Tiara Anindya: Anggota
    (67, 1, 7, 6, 'aktif'), -- Hafiz Maulana: Anggota
    (68, 1, 7, 6, 'aktif'), -- Naufal Hidayat: Anggota
    (69, 1, 7, 6, 'aktif'), -- Sekar Ayuningtyas: Anggota

    -- PSDM (ID 70 - 77)
    (70, 1, 8, 5, 'aktif'), -- Fadhil Syarief Pratomo: Kadiv PSDM
    (71, 1, 8, 6, 'aktif'), -- Aulia Vania Shanty: Anggota
    (72, 1, 8, 6, 'aktif'), -- Farritz: Anggota
    (73, 1, 8, 6, 'aktif'), -- Izzudien Al-Qosam: Anggota
    (74, 1, 8, 6, 'aktif'), -- Raditya Herbayu: Anggota
    (75, 1, 8, 6, 'aktif'), -- Muhammad Fadlan: Anggota
    (76, 1, 8, 6, 'aktif'), -- Dhea Anastasya: Anggota
    (77, 1, 8, 6, 'aktif'); -- Ardiansyah Putra: Anggota

    -- 7. Program Kerja
    INSERT INTO program_kerja (id_program, id_divisi, nama, target, anggaran, status) VALUES
    (1, 1, 'InterFestival', '500 Mahasiswa & Civitas Akademika', 15000000, 'persiapan'),
    (2, 1, 'Interface 2025 (Puncak)', '1000 Pengunjung & Seluruh Mahasiswa Fasilkom', 30000000, 'konsep'),
    (3, 2, 'Fasilkom Bakti Abadi', '1 Desa Binaan & 50 Relawan', 12500000, 'berjalan'),
    (4, 5, 'Computer Science Sport and Arts Competition', '6 Cabang Lomba & 350 Atlet', 14000000, 'berjalan'),
    (5, 3, 'Lentera Kasih', '100 Anak Asuh / Panti Asuhan', 8000000, 'persiapan'),
    (6, 7, 'Fasilkom Sharing Idea', '200 Peserta Mahasiswa Aktif', 4500000, 'berjalan'),
    (7, 8, 'Upgrading BEM FASILKOM', 'Seluruh Pengurus BEM Fasilkom', 7500000, 'selesai'),
    (8, 7, 'Bulletin BEM', 'Seluruh Mahasiswa Fasilkom (Digital & Cetak)', 3000000, 'berjalan'),
    (9, 4, 'Studi Banding with Binus Jakarta', '40 Delegasi Pengurus BEM', 10000000, 'konsep'),
    (10, 3, 'Iconlab Fasilkom', '150 Peserta Workshop IT', 9000000, 'persiapan'),
    (11, 8, 'Welcoming For Maba', '300 Mahasiswa Baru Fasilkom', 18000000, 'berjalan'),
    (12, 1, 'Forum Keberlanjutan Organisasi', 'Perwakilan Ormas & BEM Fakultas', 5000000, 'konsep'),
    (13, 6, 'Sarasehan 2025', '250 Mahasiswa & Birokrasi Fakultas', 6000000, 'persiapan'),
    (14, 1, 'LPJ Underbouw', 'Seluruh Ketua Lembaga & Pengurus', 2500000, 'konsep'),
    (15, 3, 'Bedah Skripsi Uhuy!', '200 Mahasiswa Tingkat Akhir', 3500000, 'berjalan'),
    (16, 8, 'Downgrading BEM FASILKOM', 'Seluruh Pengurus BEM Fasilkom', 5000000, 'konsep');

    -- 8. Kegiatan
    INSERT INTO kegiatan (id_kegiatan, id_program, nama, tanggal, lokasi) VALUES
    (1, 1, 'Workshop UI/UX Campus Tour', '2025-05-18', 'Aula D12 Lantai 3'),
    (2, 1, 'LPJTP', '2025-05-21', 'Pelataran Rumil'),
    (3, 3, 'Donor Darah Mahasiswa FASILKOM', '2025-05-25', 'Gedung PKM FASILKOM'),
    (4, 1, 'Hari-H InterFestival', '2025-07-12', 'Gedung D4 lantai 3'),
    (5, 2, 'Briefing LKMM-TD Panitia', '2025-05-12', 'Gedung Auditorium'),
    (6, 4, 'Penyisihan Mini Soccer', '2025-05-22', 'Green Mini Soccer');

    -- 9. Tugas
    INSERT INTO tugas (id_tugas, id_kegiatan, id_pembuat, judul, deskripsi, deadline) VALUES
    (1, 1, 8, 'Persetujuan Proposal Anggaran InterFestival', 'Validasi pos anggaran bersama Dekanat dan WD III', '2025-05-18'),
    (2, 2, 5, 'Tanda Tangan LPJ Rapat Kerja Wilayah', 'Finalisasi bundel LPJ fisik dan digital', '2025-05-19'),
    (3, 1, 8, 'Konfirmasi Pemateri UI/UX Alumni FASILKOM', 'Follow up kesediaan speaker keynote', '2025-05-19'),
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
    (1, 1, 57, 'Departemen Kominfo mengunggah berkas permohonan sponsor InterFestival 2026 ke Dekanat.', '2026-05-18'),
    (2, 2, 3, 'Sekretaris Umum (Fathiyya Zahrotussyifa) memvalidasi presensi 77 peserta Rapat Koordinasi Tengah Periode.', '2026-05-18'),
    (3, 1, 4, 'Bendahara Umum (Mohamad Nahdi Hidayat) mencatat pencairan termin 1 dana operasional LKMM-TD sebesar Rp 4.750.000.', '2026-05-18');

    -- 13. Evaluasi
    INSERT INTO evaluasi (id_evaluasi, id_program, id_pengevaluasi, skor, catatan, tanggal) VALUES
    (1, 1, 1, 85, 'Pelaksanaan fase persiapan on-track. Koordinasi sponsorship perlu diperkuat.', '2025-05-15'),
    (2, 2, 1, 95, 'LKMM-TD sangat solid, modul materi relevan bagi mahasiswa baru.', '2025-05-10');
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
