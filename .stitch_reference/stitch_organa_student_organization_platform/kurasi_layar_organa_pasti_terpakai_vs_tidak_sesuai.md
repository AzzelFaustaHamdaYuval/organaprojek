# Panduan Kurasi Layar ORGANA (Kategori "Pasti Terpakai" vs "Layar Usang/Tidak Sesuai")

Berdasarkan analisis kesesuaian terhadap **ERD 13 Entitas Sistem ORGANA** (Diagram Relasi ERD Mahasiswa), berikut adalah pemilahan resmi layar-layar yang ada di kanvas ke dalam dua kelompok bersebelahan:

---

## 🟢 KELOMPOK A: SLIDE / LAYAR UTAMA (PASTI TERPAKAI)
Layar-layar ini 100% mematuhi ERD, menggunakan desain sistem terbaru *Organa Atmospheric Campus*, dan membentuk alur navigasi aplikasi terpadu dari awal hingga akhir:

### 1. Pintu Masuk & Pusat Informasi
* **`Organa - Landing Page`** (`SCREEN_38`) : Halaman publik, perkenalan sistem, dan gerbang SSO.
* **`Organa - Dashboard Utama`** (`SCREEN_36`) : Pusat kendali eksekutif BPH dengan ringkasan metrik lintas modul.

### 2. Modul Struktur & Keanggotaan (ERD Tahap 1)
* **`Organa - Manajemen Periode Kepengurusan`** (`SCREEN_16`) : Mengelola entitas `tb_periode` (PK: `id_periode`, rentang tahun, status aktif).
* **`Organa - Pengelolaan Divisi & Departemen`** (`SCREEN_12`) : Mengelola entitas `tb_divisi` (FK: `id_periode`, nama divisi, kuota personil).
* **`Organa - Pengelolaan Jabatan & Level Hierarki`** (`SCREEN_18`) : Mengelola entitas `tb_jabatan` (level hierarki 1–4).
* **`Organa - Manajemen Anggota (Members)`** (`SCREEN_34`) : Mengelola entitas `tb_anggota` (data mahasiswa kampus: NIM, kontak, prodi).
* **`Organa - Penempatan Keanggotaan (Membership Placement)`** (`SCREEN_14`) : Relasi bridging `tb_keanggotaan` (menghubungkan anggota, periode, divisi, jabatan).
* **`Organa - Bagan Struktur Organisasi`** (`SCREEN_32`) : Visualisasi bagan pohon hierarki kepengurusan ormawa secara interaktif.

### 3. Modul Program Kerja & Kegiatan Lapangan
* **`Organa - Manajemen Program Kerja (Work Programs)`** (`SCREEN_30`) : Mengelola entitas `tb_program_kerja` (FK: `id_divisi`, target program).
* **`Organa - Kalender Kegiatan`** (`SCREEN_28`) : Mengelola entitas `tb_kegiatan` (FK: `id_program`, jadwal tanggal & lokasi).
* **`Organa - Presensi & Kehadiran Kegiatan QR`** (`SCREEN_20`) : Mengelola entitas `tb_presensi` (scan barcode/QR kehadiran panitia).

### 4. Modul Tugas & Penugasan Panitia (ERD Tahap 2)
* **`Organa - Manajemen Tugas (Task Management)`** (`SCREEN_10`) : Mengelola entitas `tb_tugas` (FK: `id_kegiatan`, FK: `id_pembuat`, tenggat waktu).
* **`Organa - Penugasan Anggota (Kanban Board)`** (`SCREEN_8`) : Mengelola relasi komposit `tb_penugasan` (Kanban 3 kolom: Belum Dimulai, Sedang Dikerjakan, Selesai).

### 5. Modul Akuntabilitas & Akun Pengguna (ERD Tahap 3)
* **`Organa - Evaluasi Program Kerja & Kinerja Ormawa`** (`SCREEN_6`) : Mengelola entitas `tb_evaluasi` (FK: `id_program`, FK: `id_penilai`, skor, catatan kendala).
* **`Organa - Manajemen Akun Pengguna & Hak Akses`** (`SCREEN_4`) : Mengelola entitas `tb_pengguna` (FK: `id_anggota`, SSO Google Workspace, Role RBAC).

---

## 🔴 KELOMPOK B: SLIDE YANG TIDAK SESUAI / USANG (DEPRECATED / REDUNDANT)
Layar-layar di bawah ini merupakan versi draf awal sebelum revisi ERD dilakukan atau telah digantikan oleh layar revisi yang lebih akurat:

1. **`Organa - Penugasan & Manajemen Tugas`** (`SCREEN_26`)
   - *Status:* **Digantikan oleh `SCREEN_10` & `SCREEN_8`**.
   - *Alasan:* Pada versi awal ini, entitas `Tugas` dan `Penugasan` masih digabung menjadi satu layar tanpa atribut lengkap ERD (`id_kegiatan`, `id_pembuat`, dan Kanban 3 kolom status `tb_penugasan`).
2. **`Organa - Evaluasi Kinerja & Rapor Ormawa`** (`SCREEN_22`)
   - *Status:* **Digantikan oleh `SCREEN_6`**.
   - *Alasan:* Versi lama ini belum mengaitkan atribut `tb_evaluasi` secara tegas ke `id_program` dan `id_penilai`, serta form entri evaluasi belum sesuai ERD v2.
3. **`Organa - Laporan LPJ & Keuangan Ormawa`** (`SCREEN_24`)
   - *Status:* **Tidak Sesuai ERD (Terdapat Modul Kas/Keuangan)**.
   - *Alasan:* Pada ERD diagram Anda, entitas yang ada hanyalah `Laporan_Kegiatan` (non-finansial: `id_laporan`, `id_kegiatan`, `id_pembuat`, `isi`, `tanggal`). Layar `SCREEN_24` ini memuat modul kas masuk/keluar keuangan kampus yang tidak ada pada ERD relasional Anda.

---

## 🧭 Rekomendasi Urutan Penggunaan Layar (Flow Final)
```
Landing Page (38) ➔ Dashboard (36) ➔ Master Struktur (16, 12, 18, 34, 14, 32) 
➔ Proker & Kalender (30, 28) ➔ Presensi (20) ➔ Tugas & Kanban (10, 8) 
➔ Evaluasi (6) ➔ Kelola Akun (4)
```
