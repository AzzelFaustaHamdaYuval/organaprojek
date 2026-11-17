# Panduan Alur Interaksi Pengguna & Navigasi Antar-Halaman (User Flow Guide)
## ORGANA — Sistem Manajemen Organisasi Mahasiswa Kampus

Panduan ini mendokumentasikan peta arsitektur informasi, alur navigasi end-to-end, dan pemetaan interaksi antar-layar yang telah terintegrasi dalam platform **ORGANA**. Panduan ini ditujukan bagi pengembang, desainer, dan administrator ormawa untuk memahami bagaimana data relasional ERD mengalir melintasi seluruh modul antarmuka.

---

### 🗺️ Peta Navigasi Global (Shell Navigation & Global Routing)

Seluruh halaman operasional berada dalam kerangka **App Shell Persisten** (Top Navigation Bar + Left Sidebar Navigation), menjamin transisi instan tanpa disorientasi pengguna.

```
[ Pintu Masuk Publik: Landing Page (Organa - Landing Page) ]
                         │
                         ▼ (Login SSO Mahasiswa / Google Workspace)
[ Dashboard Utama BPH (Organa - Dashboard Utama) ]
                         │
     ┌───────────────────┼───────────────────┬───────────────────┐
     ▼                   ▼                   ▼                   ▼
1. Struktur &       2. Program Kerja &  3. Tugas &          4. Evaluasi &
   Keanggotaan         Kegiatan Operasi    Penugasan Tim       Akuntabilitas
```

---

### 🔁 4 Alur Pengguna Utama (Core User Flows)

#### ALUR 1: Siklus Suksesi & Penataan Struktur Kepengurusan (Setup Awal Tahun)
**Aktor:** Super Admin BPH / Presidium Ormawa  
**Tujuan:** Menginisialisasi tahun kepengurusan baru, menetapkan departemen, mendefinisikan hierarki jabatan, dan menempatkan mahasiswa ke struktur organisasi.

1. **Inisialisasi Periode Kepengurusan** (`Organa - Manajemen Periode Kepengurusan`)
   - Super Admin membuat entitas `tb_periode` (contoh: *2024/2025 BEM FT*), menetapkan rentang tahun, dan mengaktifkan status kabinet.
   - *Pemicu Navigasi:* Setelah periode aktif, sistem mengarahkan administrator ke pengaturan divisi.
2. **Pengelolaan Divisi & Alokasi Kuota** (`Organa - Pengelolaan Divisi & Departemen`)
   - Admin mendefinisikan divisi/biro (`tb_divisi`) yang berelasi ke `ID_Periode` (FK) aktif (misal: Kominfo, PSDM, Kastrat).
   - Menetapkan kuota personil dan koordinator divisi.
3. **Standarisasi Jabatan & Hierarki** (`Organa - Pengelolaan Jabatan & Level Hierarki`)
   - Meninjau entitas `tb_jabatan` berjenjang Level 1 (Presidium), Level 2 (Kadiv), Level 3 (Sekdiv/Bendum), hingga Level 4 (Staf).
4. **Registrasi Master Anggota & Penempatan** (`Organa - Manajemen Anggota` ➔ `Organa - Penempatan Keanggotaan`)
   - Sinkronisasi data mahasiswa aktif (`tb_anggota`).
   - Eksekusi form bridging `tb_keanggotaan`: menghubungkan `ID_Anggota` (FK) + `ID_Periode` (FK) + `ID_Divisi` (FK) + `ID_Jabatan` (FK).
5. **Inspeksi Hasil Akhir Visual** (`Organa - Bagan Struktur Organisasi`)
   - Sistem secara otomatis me-render bagan pohon interaktif kepengurusan ormawa secara real-time.

---

#### ALUR 2: Perencanaan & Eksekusi Program Kerja Hingga Agenda Lapangan
**Aktor:** Kepala Divisi (Kadiv) & Staf Operasional  
**Tujuan:** Merancang program kerja tahunan, memecah agenda ke dalam kalender kegiatan, dan memverifikasi presensi kehadiran.

1. **Perancangan Program Kerja** (`Organa - Manajemen Program Kerja`)
   - Kadiv memilih divisi pengampu, menginput `tb_proker` (nama proker, latar belakang, sasaran non-finansial, IKU organisasi).
   - *Status:* Draf ➔ Disetujui BPH ➔ Siap Dieksekusi.
2. **Pembuatan Jadwal & Kegiatan Kepanitiaan** (`Organa - Kalender Kegiatan`)
   - Dari proker yang telah disetujui, panitia membuat entitas turunan `tb_kegiatan` dengan relasi `ID_Proker` (FK).
   - Menetapkan tanggal mulai, selesai, ruang/lokasi fisik acara, dan mencegah tabrakan agenda antar-divisi.
3. **Presensi Kehadiran Realtime via QR Code** (`Organa - Presensi & Kehadiran Kegiatan QR`)
   - Panitia membuka layar presensi saat briefing/kegiatan berlangsung untuk men-generate kode QR dinamis.
   - Mahasiswa melakukan scan QR; sistem mencatat timestamp ke tabel relasional `tb_presensi` (`ID_Kegiatan` FK, `ID_Anggota` FK) untuk validasi keaktifan pengurus.

---

#### ALUR 3: Distribusi Beban Kerja & Pelacakan Tugas (Kanban Lifecycle)
**Aktor:** Project Officer (Ketua Panitia) & Seluruh Anggota Staf  
**Tujuan:** Memastikan mandat operasional tersampaikan jelas, tenggat waktu terpantau, dan beban tugas terdistribusi adil.

1. **Pembuatan Mandat Tugas** (`Organa - Manajemen Tugas (Task Management)`)
   - PO/Kadiv membuat `tb_tugas` terikat langsung pada `ID_Kegiatan` (FK), menetapkan urgensi, tanggal deadline, dan instruksi teknis.
   - Mengklik tombol pintas *"Buka Penugasan Anggota"* pada baris tugas.
2. **Alokasi Personil & Tracking Kanban** (`Organa - Penugasan Anggota (Kanban Board)`)
   - Kartu penugasan (`tb_penugasan`) masuk ke kolom **Belum Dimulai (To-Do)**.
   - Saat staf mulai mengeksekusi, kartu berpindah ke kolom **Sedang Dikerjakan (In Progress)** disertai penyesuaian slider progres (misal: 65%).
   - Saat tugas tuntas, staf/kadiv menekan *"Tandai Selesai"*; kartu berpindah ke kolom **Selesai (Completed)**, dan sistem otomatis merekam `Tanggal_Selesai` aktual.

---

#### ALUR 4: Akuntabilitas, Evaluasi Kinerja & Hak Akses Akun
**Aktor:** BPH, Penilai/Reviewer, DPM (Legislatif), dan Administrator Sistem  
**Tujuan:** Menilai keberhasilan program kerja, menyusun LPJ non-finansial, dan mengelola hak akses akun SSO kampus.

1. **Penilaian Hasil Ketercapaian** (`Organa - Evaluasi Program Kerja & Kinerja Ormawa`)
   - BPH atau penilai membuka formulir `tb_evaluasi`, memilih `ID_Proker` (FK) yang telah selesai dilaksanakan.
   - Memberikan skor kuantitatif (0–100), checklist kepuasan audiens, partisipasi kuorum massa kampus, serta rekomendasi transisi generasi.
   - Data langsung teragregasi ke **Matriks Rapor Rata-Rata Divisi**.
2. **Kompilasi Laporan LPJ Non-Finansial** (`Organa - Laporan LPJ & Keuangan Ormawa`)
   - Panitia mengunggah berkas dokumentasi hasil kegiatan, notula, daftar hadir, dan lembar evaluasi untuk diajukan ke Sidang Verifikasi DPM / Pembina Kemahasiswaan.
3. **Otorisasi & Audit Akun Pengguna** (`Organa - Manajemen Akun Pengguna & Hak Akses`)
   - Admin BPH menghubungkan personil dari master anggota ke entitas `tb_pengguna` (`ID_Anggota` FK).
   - Menetapkan Role-Based Access Control (RBAC): *Super Admin BPH*, *Kepala Divisi*, *Staf Pelaksana*, *DPM*, atau *Kemahasiswaan/Pembina*.

---

### 📌 Ringkasan Tautan Aksi Cepat Antar-Layar (Quick-Action Links)

| Dari Layar Asal | Elemen Interaksi (Tombol/Link) | Menuju Layar Target |
| :--- | :--- | :--- |
| **Dashboard Utama** | Card Widget "Penugasan Mendesak" | `Organa - Penugasan Anggota (Kanban Board)` |
| **Dashboard Utama** | Card Widget "Program Kerja Aktif" | `Organa - Manajemen Program Kerja` |
| **Manajemen Periode** | Banner "Konfigurasi Divisi Periode Ini" | `Organa - Pengelolaan Divisi & Departemen` |
| **Pengelolaan Divisi** | Aksi Baris "Lihat Alokasi Anggota" | `Organa - Penempatan Keanggotaan` |
| **Manajemen Anggota** | Tombol "+ Tempatkan ke Divisi/Jabatan" | `Organa - Penempatan Keanggotaan` |
| **Penempatan Keanggotaan** | Tab "Visualisasikan Struktur" | `Organa - Bagan Struktur Organisasi` |
| **Manajemen Proker** | Aksi Baris "Jadwalkan ke Kalender" | `Organa - Kalender Kegiatan` |
| **Kalender Kegiatan** | Aksi Agenda "Buka Presensi QR Acara" | `Organa - Presensi & Kehadiran Kegiatan QR` |
| **Manajemen Tugas** | Tombol "Buka Distribusi Penugasan" | `Organa - Penugasan Anggota (Kanban Board)` |
| **Evaluasi Proker** | Tombol "Unduh Rapor / Laporan LPJ" | `Organa - Laporan LPJ & Keuangan Ormawa` |
| **Manajemen Akun** | Tombol "Audit Matriks Hak Akses (RBAC)" | Panel Matriks Hak Akses (Scroll-to-View) |

---
*Dokumen ini merupakan acuan resmi interaksi dan navigasi untuk implementasi sistem ORGANA.*
