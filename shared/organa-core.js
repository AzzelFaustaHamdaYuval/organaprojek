// shared/organa-core.js
// Global Router, ERD State Sync & Error-Free Interaction Engine for ORGANA

(function () {
  'use strict';

  // Navigation Route Dictionary (supporting all naming variants across slides)
  const ROUTES = {
    'dashboard': '../02-dashboard-utama/index.html',
    'kalender-kegiatan': '../06-kalender-kegiatan/index.html',
    'anggota': '../03-manajemen-anggota/index.html',
    'anggota-members': '../03-manajemen-anggota/index.html',
    'struktur-organisasi': '../04-bagan-struktur-organisasi/index.html',
    'divisi-dan-departemen': '../11-pengelolaan-divisi/index.html',
    'divisi-departemen': '../11-pengelolaan-divisi/index.html',
    'periode-kepengurusan': '../12-periode-kepengurusan/index.html',
    'program-kerja': '../05-manajemen-program-kerja/index.html',
    'manajemen-kegiatan': '../06-kalender-kegiatan/index.html',
    'presensi-dan-kehadiran': '../09-presensi-qr/index.html',
    'presensi-kehadiran': '../09-presensi-qr/index.html',
    'penugasan-dan-tugas': '../10-penugasan-kanban/index.html',
    'penugasan-tugas': '../10-penugasan-kanban/index.html',
    'laporan-pertanggungjawaban-lpj': '../07-laporan-lpj-keuangan/index.html',
    'laporan-lpj': '../07-laporan-lpj-keuangan/index.html',
    'evaluasi-kinerja': '../08-evaluasi-kinerja/index.html',
    'pengaturan-organisasi': '../13-manajemen-akun/index.html',
    'profil': '../14-profil/index.html',
    'profil-pengguna': '../14-profil/index.html',
    'landing': '../01-landing-page/index.html',
    'login': '../15-organa-login/index.html'
  };

  // Toast System
  window.showToast = function (message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-20 right-6 z-[99999] flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const icon = type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'info');
    const borderColor = type === 'success' ? 'border-[#C9F36A]' : (type === 'error' ? 'border-rose-500' : 'border-cyan-500');

    toast.className = `flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border ${borderColor} text-white shadow-2xl transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-[#C9F36A] text-[20px]">${icon}</span>
      <span class="font-heading text-xs lg:text-sm font-semibold">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    }, 50);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  };

  // Modal Controllers
  window.openOrganaModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeOrganaModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = 'auto';
    }
  };

  // Inject Global Modals if not present
  function injectGlobalModals() {
    if (document.getElementById('organa-global-modals')) return;

    const modalHost = document.createElement('div');
    modalHost.id = 'organa-global-modals';
    modalHost.innerHTML = `
      <!-- Modal: Ganti Periode (tb_periode) -->
      <div id="modal-global-periode" class="fixed inset-0 modal-backdrop z-[9999] hidden items-center justify-center p-4">
        <div class="glass-panel p-6 lg:p-8 rounded-3xl max-w-md w-full space-y-4 border-violet-500/30 shadow-2xl relative">
          <button onclick="closeOrganaModal('modal-global-periode')" class="absolute top-5 right-5 text-slate-400 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
          <div class="space-y-1">
            <span class="text-xs text-violet-400 font-extrabold uppercase tracking-wider">Entitas tb_periode</span>
            <h3 class="font-heading text-xl text-white font-bold">Pilih Periode Kepengurusan</h3>
            <p class="text-xs text-slate-300">Ganti tahun kabinet aktif untuk memfilter data organisasi.</p>
          </div>
          <form id="form-global-periode" class="space-y-4 pt-2">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-300">Periode Terdaftar</label>
              <select id="select-global-periode" class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-violet-400">
                <option value="1" selected>Periode 2024/2025 (BEM FT) - AKTIF</option>
                <option value="2">Periode 2023/2024 (Lalu) - SELESAI</option>
                <option value="3">Periode 2025/2026 (Mendatang) - RENCANA</option>
              </select>
            </div>
            <div class="pt-3 flex items-center justify-end gap-2">
              <button type="button" onclick="closeOrganaModal('modal-global-periode')" class="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-300 hover:bg-white/5">
                Batal
              </button>
              <button type="submit" class="px-6 py-2.5 rounded-full bg-violet-600 text-white font-heading text-xs font-bold shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-105 transition-all">
                Terapkan
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Buat Kegiatan Baru (tb_kegiatan) -->
      <div id="modal-global-kegiatan" class="fixed inset-0 modal-backdrop z-[9999] hidden items-center justify-center p-4">
        <div class="glass-panel p-6 lg:p-8 rounded-3xl max-w-lg w-full space-y-4 border-cyan-500/30 shadow-2xl relative">
          <button onclick="closeOrganaModal('modal-global-kegiatan')" class="absolute top-5 right-5 text-slate-400 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
          <div class="space-y-1">
            <span class="text-xs text-cyan-400 font-extrabold uppercase tracking-wider">Entitas tb_kegiatan</span>
            <h3 class="font-heading text-xl text-white font-bold">Buat Kegiatan Kepanitiaan Baru</h3>
            <p class="text-xs text-slate-300">Jadwalkan agenda operasional yang terhubung ke Program Kerja resmi ormawa.</p>
          </div>
          <form id="form-global-kegiatan" class="space-y-4 pt-2">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-300">Nama Kegiatan</label>
              <input id="input-global-kegiatan-nama" type="text" required placeholder="Contoh: IconLab Sains Competition" class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"/>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-300">Program Kerja Induk (FK: id_program)</label>
              <select id="input-global-kegiatan-program" class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400">
                <option value="SEMINAR">Seminar</option>
                <option value="INTERNAL">Kegiatan Internal</option>
                <option value="RAPAT">Rapat Koordinasi</option>
                <option value="LOMBA">Perlombaan</option>
                <option value="INTERNASIONAL">Acara Nasional / Internasional</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-300">Tanggal Pelaksanaan</label>
                <input id="input-global-kegiatan-tanggal" type="date" required value="2025-05-28" class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"/>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-300">Lokasi / Ruang</label>
                <input id="input-global-kegiatan-lokasi" type="text" required placeholder="Aula D12 Lantai 3 / Zoom" class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"/>
              </div>
            </div>
            <div class="pt-3 flex items-center justify-end gap-2">
              <button type="button" onclick="closeOrganaModal('modal-global-kegiatan')" class="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-300 hover:bg-white/5">
                Batal
              </button>
              <button type="submit" class="px-6 py-2.5 rounded-full bg-[#C9F36A] text-slate-950 font-heading text-xs font-bold shadow-[0_0_20px_rgba(201,243,106,0.3)] hover:scale-105 transition-all">
                Simpan Kegiatan
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Presensi Cepat (tb_presensi) -->
      <div id="modal-global-presensi" class="fixed inset-0 modal-backdrop z-[9999] hidden items-center justify-center p-4">
        <div class="glass-panel p-6 lg:p-8 rounded-3xl max-w-lg w-full space-y-4 border-[#C9F36A]/30 shadow-2xl relative">
          <button onclick="closeOrganaModal('modal-global-presensi')" class="absolute top-5 right-5 text-slate-400 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
          <div class="space-y-1">
            <span class="text-xs text-[#C9F36A] font-extrabold uppercase tracking-wider">Entitas tb_presensi</span>
            <h3 class="font-heading text-xl text-white font-bold">Catat Presensi Kehadiran Cepat</h3>
            <p class="text-xs text-slate-300">Validasi kehadiran pengurus ke dalam database presensi kegiatan.</p>
          </div>
          <form id="form-global-presensi" class="space-y-4 pt-2">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-300">Pilih Agenda Kegiatan</label>
              <select class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#C9F36A]">
                <option>Workshop UI/UX Campus Tour (18 Mei 2025)</option>
                <option>Rapat Koordinasi Tengah Periode (21 Mei 2025)</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-300">Nama Anggota (FK: id_anggota)</label>
              <select id="select-global-presensi-anggota" class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#C9F36A]">
                <option value="Citra Dewi">Citra Dewi (NIM: 2301003 - Teknik Informatika)</option>
                <option value="Dimas Saputra">Dimas Saputra (NIM: 2301004 - Sistem Informasi)</option>
                <option value="Rian Yulianto">Rian Yulianto (NIM: 2301008 - Teknik Informatika)</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-300">Status Kehadiran</label>
              <select id="select-global-presensi-status" class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#C9F36A]">
                <option value="hadir">Hadir (Tepat Waktu)</option>
                <option value="izin">Izin (Disertai Alasan)</option>
                <option value="sakit">Sakit</option>
                <option value="alpa">Alpa / Tanpa Keterangan</option>
              </select>
            </div>
            <div class="pt-3 flex items-center justify-end gap-2">
              <button type="button" onclick="closeOrganaModal('modal-global-presensi')" class="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-300 hover:bg-white/5">
                Batal
              </button>
              <button type="submit" class="px-6 py-2.5 rounded-full bg-[#C9F36A] text-slate-950 font-heading text-xs font-bold shadow-[0_0_20px_rgba(201,243,106,0.3)] hover:scale-105 transition-all">
                Simpan Presensi
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Tambah Program Kerja (tb_program_kerja) -->
      <div id="modal-global-proker" class="fixed inset-0 modal-backdrop z-[9999] hidden items-center justify-center p-4">
        <div class="glass-panel p-6 lg:p-8 rounded-3xl max-w-lg w-full space-y-4 border-[#C9F36A]/30 shadow-2xl relative">
          <button onclick="closeOrganaModal('modal-global-proker')" class="absolute top-5 right-5 text-slate-400 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
          <div class="space-y-1">
            <span class="text-xs text-[#C9F36A] font-extrabold uppercase tracking-wider">Entitas tb_program_kerja</span>
            <h3 class="font-heading text-xl text-white font-bold">Tambah Program Kerja Baru</h3>
            <p class="text-xs text-slate-300">Definisikan rencana strategis, alokasi anggaran, dan target capaian ormawa.</p>
          </div>
          <form id="form-global-proker" class="space-y-4 pt-2">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-300">Nama Program Kerja</label>
              <input id="input-global-proker-nama" type="text" required placeholder="Contoh: Hackathon Nasional Mahasiswa 2025" class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#C9F36A]"/>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-300">Divisi Pengampu (FK: id_divisi)</label>
                <select id="input-global-proker-divisi" class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#C9F36A]">
                  <option value="1">Kominfo & Multimedia</option>
                  <option value="2">PSDM & Kaderisasi</option>
                  <option value="3">Hubungan Luar & Kemitraan</option>
                  <option value="4">Sosial Masyarakat</option>
                  <option value="5">Minat & Bakat</option>
                  <option value="6">Kastrat & Advokasi</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-300">Alokasi Anggaran (Rp)</label>
                <input id="input-global-proker-anggaran" type="number" required value="15000000" class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#C9F36A]"/>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-300">Target Sasaran Kuantitatif</label>
              <input id="input-global-proker-target" type="text" required placeholder="Contoh: 300 Mahasiswa & 15 Mitra Kampus" class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#C9F36A]"/>
            </div>
            <div class="pt-3 flex items-center justify-end gap-2">
              <button type="button" onclick="closeOrganaModal('modal-global-proker')" class="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-300 hover:bg-white/5">
                Batal
              </button>
              <button type="submit" class="px-6 py-2.5 rounded-full bg-[#C9F36A] text-slate-950 font-heading text-xs font-bold shadow-[0_0_20px_rgba(201,243,106,0.3)] hover:scale-105 transition-all">
                Simpan Program Kerja
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modalHost);

    // Bind form submits
    const fPeriod = document.getElementById('form-global-periode');
    if (fPeriod) {
      fPeriod.addEventListener('submit', (e) => {
        e.preventDefault();
        const sel = document.getElementById('select-global-periode');
        const text = sel.options[sel.selectedIndex].text;
        closeOrganaModal('modal-global-periode');
        window.showToast(`Periode aktif diubah ke: ${text.split(' - ')[0]}`, 'success');
      });
    }

    const fKegiatan = document.getElementById('form-global-kegiatan');
    if (fKegiatan) {
      fKegiatan.addEventListener('submit', (e) => {
        e.preventDefault();
        const nama = document.getElementById('input-global-kegiatan-nama').value;
        closeOrganaModal('modal-global-kegiatan');
        window.showToast(`Kegiatan "${nama}" berhasil didaftarkan ke database!`, 'success');
        fKegiatan.reset();
      });
    }

    const fPresensi = document.getElementById('form-global-presensi');
    if (fPresensi) {
      fPresensi.addEventListener('submit', (e) => {
        e.preventDefault();
        const m = document.getElementById('select-global-presensi-anggota').value;
        const s = document.getElementById('select-global-presensi-status').value;
        closeOrganaModal('modal-global-presensi');
        window.showToast(`Presensi ${s.toUpperCase()} untuk ${m} berhasil dicatat!`, 'success');
      });
    }

    const fProker = document.getElementById('form-global-proker');
    if (fProker) {
      fProker.addEventListener('submit', (e) => {
        e.preventDefault();
        const nama = document.getElementById('input-global-proker-nama').value;
        closeOrganaModal('modal-global-proker');
        window.showToast(`Program Kerja "${nama}" berhasil ditambahkan ke database!`, 'success');
        fProker.reset();
      });
    }
  }

  // Interconnect Sidebar Links & Options
  function setupNavigation() {
    // Current folder detection
    const currentPath = window.location.pathname.replace(/\\/g, '/');
    let activeKey = 'dashboard';

    if (currentPath.includes('01-landing-page')) activeKey = 'landing';
    else if (currentPath.includes('02-dashboard-utama')) activeKey = 'dashboard';
    else if (currentPath.includes('03-manajemen-anggota')) activeKey = 'anggota';
    else if (currentPath.includes('04-bagan-struktur-organisasi')) activeKey = 'struktur-organisasi';
    else if (currentPath.includes('05-manajemen-program-kerja')) activeKey = 'program-kerja';
    else if (currentPath.includes('06-kalender-kegiatan')) activeKey = 'kalender-kegiatan';
    else if (currentPath.includes('07-laporan-lpj-keuangan')) activeKey = 'laporan-pertanggungjawaban-lpj';
    else if (currentPath.includes('08-evaluasi-kinerja')) activeKey = 'evaluasi-kinerja';
    else if (currentPath.includes('09-presensi-qr')) activeKey = 'presensi-dan-kehadiran';
    else if (currentPath.includes('10-penugasan-kanban')) activeKey = 'penugasan-dan-tugas';
    else if (currentPath.includes('11-pengelolaan-divisi')) activeKey = 'divisi-dan-departemen';
    else if (currentPath.includes('12-periode-kepengurusan')) activeKey = 'periode-kepengurusan';
    else if (currentPath.includes('13-manajemen-akun')) activeKey = 'pengaturan-organisasi';
    else if (currentPath.includes('14-profil')) activeKey = 'profil';

    // Interconnect all elements with data-path
    const allPathLinks = document.querySelectorAll('[data-path]');
    allPathLinks.forEach(el => {
      const pathKey = el.getAttribute('data-path');
      if (ROUTES[pathKey]) {
        el.setAttribute('href', ROUTES[pathKey]);
        
        // Active pill highlighting matching Core Reference screenshot
        if (pathKey === activeKey || 
           (activeKey === 'anggota' && pathKey === 'anggota-members') ||
           (activeKey === 'divisi-dan-departemen' && pathKey === 'divisi-departemen') ||
           (activeKey === 'presensi-dan-kehadiran' && pathKey === 'presensi-kehadiran')) {
          el.className = 'flex items-center gap-space-sm px-space-md py-2 transition-all bg-secondary-fixed text-on-secondary-fixed font-bold shadow-[0_4px_12px_rgba(201,243,106,0.35)] rounded-full';
          el.setAttribute('aria-current', 'page');
        } else {
          el.className = 'flex items-center gap-space-sm px-space-md py-2 rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all';
          el.removeAttribute('aria-current');
        }
      }
    });

    // Interconnect common buttons by text content
    const allButtonsAndLinks = document.querySelectorAll('button, a');
    allButtonsAndLinks.forEach(el => {
      const text = el.innerText ? el.innerText.trim() : '';

      // Periode Switcher trigger
      if (text.includes('Periode Aktif:') || el.id === 'btn-period-switch') {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          window.openOrganaModal('modal-global-periode');
        });
      }

      // Buat / Jadwalkan Kegiatan Baru
      if (text.includes('Buat Kegiatan') || text.includes('Jadwalkan Kegiatan') || text.includes('Tambah Kegiatan')) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          window.openOrganaModal('modal-global-kegiatan');
        });
      }

      // Tambah Program Kerja
      if (text.includes('Tambah Program Kerja') || text.includes('Buat Proker Baru')) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          window.openOrganaModal('modal-global-proker');
        });
      }

      // Presensi Hari Ini / Presensi QR
      if (text === 'Presensi Hari Ini' || text.includes('Presensi Cepat')) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          window.openOrganaModal('modal-global-presensi');
        });
      }
      if (text.includes('Presensi QR') || text.includes('Scan QR')) {
        el.addEventListener('click', (e) => {
          if (ROUTES['presensi-dan-kehadiran']) {
            window.location.href = ROUTES['presensi-dan-kehadiran'];
          }
        });
      }

      // Buka Jadwal Lengkap (Kalender)
      if (text.includes('Buka Jadwal Lengkap') || text.includes('Jadwalkan ke Kalender')) {
        el.addEventListener('click', () => {
          window.location.href = ROUTES['kalender-kegiatan'];
        });
      }

      // Lihat Semua Proker
      if (text.includes('Lihat Semua Proker') || text.includes('Kelola Program Kerja')) {
        el.addEventListener('click', () => {
          window.location.href = ROUTES['program-kerja'];
        });
      }

      // Buka Ruang Arsip / Buka LPJ / Ekspor LPJ
      if (text.includes('Buka Ruang Arsip') || text.includes('Buka LPJ') || text.includes('Ekspor Rekap LPJ')) {
        el.addEventListener('click', () => {
          window.location.href = ROUTES['laporan-pertanggungjawaban-lpj'];
        });
      }

      // Buka Penugasan / Distribusi Tugas
      if (text.includes('Buka Distribusi Penugasan') || text.includes('Buka Penugasan Anggota')) {
        el.addEventListener('click', () => {
          window.location.href = ROUTES['penugasan-dan-tugas'];
        });
      }

      // Visualisasikan Struktur
      if (text.includes('Visualisasikan Struktur') || text.includes('Lihat Demo Bagan')) {
        el.addEventListener('click', () => {
          window.location.href = ROUTES['struktur-organisasi'];
        });
      }

      // Buka Room Komando
      if (text.includes('Buka Room') || text.includes('Ruang Komando')) {
        el.addEventListener('click', () => {
          window.showToast('Menghubungkan ke Ruang Komando BEM FASILKOM Online...', 'info');
        });
      }

      // Filter tabs in Proker / Kalender / Evaluasi
      if (el.tagName === 'BUTTON' && (
        text === 'Semua Proker' || text === 'Sedang Berjalan' || text === 'Selesai & LPJ' || text === 'Fase Konsep / Revisi' ||
        text === 'Bulan' || text === 'Minggu' || text === 'Agenda / List' || text === 'Gantt Timeline' ||
        text === 'Hari Ini' || text.includes('Bulan Sebelumnya') || text.includes('Bulan Berikutnya')
      )) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          window.showToast(`Tampilan diperbarui: ${text}`, 'info');
        });
      }
    });

    // Interconnect Brand Logo (click to go to Dashboard)
    const logoLinks = document.querySelectorAll('aside .h-16 a, aside .h-16');
    logoLinks.forEach(l => {
      l.style.cursor = 'pointer';
      l.addEventListener('click', () => {
        window.location.href = ROUTES['dashboard'];
      });
    });

    // Interconnect Header User Profile
    const userProfileEl = document.querySelectorAll('header .flex.items-center.gap-space-sm.pl-space-xs');
    userProfileEl.forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        if (!el.closest('a')) {
          e.preventDefault();
          window.location.href = ROUTES['profil'];
        }
      });
    });
  }

  // ---------- Autentikasi: penjaga sesi, data pengguna di header, tombol Keluar ----------
  const LOGIN_URL = '../15-organa-login/index.html';

  function isPublicPage() {
    const p = window.location.pathname.replace(/\\/g, '/');
    return p.includes('01-landing-page') || p.includes('15-organa-login');
  }

  function goToLogin() {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`${LOGIN_URL}?next=${next}`);
  }

  window.organaLogout = async function () {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) { /* tetap lanjut ke halaman login */ }
    window.location.href = LOGIN_URL;
  };

  function applyUserToHeader(user) {
    document.querySelectorAll('header .flex.items-center.gap-space-sm.pl-space-xs').forEach(el => {
      const spans = el.querySelectorAll('.flex.flex-col span');
      if (spans[0]) spans[0].textContent = user.nama;
      if (spans[1]) spans[1].textContent = user.jabatan || user.role_label;

      if (!el.parentElement.querySelector('[data-organa-logout]')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-organa-logout', '');
        btn.title = 'Keluar';
        btn.setAttribute('aria-label', 'Keluar dari akun');
        btn.className = 'p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors';
        btn.innerHTML = '<span class="material-symbols-outlined text-[20px]">logout</span>';
        btn.addEventListener('click', window.organaLogout);
        el.insertAdjacentElement('afterend', btn);
      }
    });
  }

  // ---------- Personalisasi: sapaan & profil mengikuti akun yang login ----------
  // Hanya berlaku di Dashboard (02) dan Profil (14), karena di sana semua tulisan
  // "Charly Gerald ..." adalah identitas pengguna yang sedang login (bukan daftar anggota).
  function personalizeCurrentUserPage(user) {
    const path = window.location.pathname.replace(/\\/g, '/');
    if (!path.includes('02-dashboard-utama') && !path.includes('14-profil')) return;

    const jam = new Date().getHours();
    const waktu = jam < 11 ? 'Pagi' : jam < 15 ? 'Siang' : jam < 18 ? 'Sore' : 'Malam';
    const kosong = 'Belum diisi';
    const nama = user.nama;
    const prodi = user.prodi || '—';
    const angkatan = user.angkatan || '—';
    const jabatan = user.jabatan || user.role_label;
    const inisial = nama.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

    // Urutan penting: pola yang lebih panjang dulu
    const rules = [
      [/S1 Teknik Informatika • 2024/g, () => `S1 ${prodi} • ${angkatan}`],
      [/Teknik Informatika \(Angkatan 2024\)/g, () => `${prodi} (Angkatan ${angkatan})`],
      [/2024 \(Reguler\)/g, () => `${angkatan} (Reguler)`],
      [/Teknik Informatika/g, () => prodi],
      [/Charly Gerald Simanjuntak/g, () => nama],
      [/Charly Gerald/g, () => nama],
      [/2400001/g, () => user.nim || '—'],
      [/KETUA UMUM BEM FASILKOM 2024\/2025/gi, (m) => {
        const t = `${jabatan} BEM FASILKOM 2024/2025`;
        return m === m.toUpperCase() ? t.toUpperCase() : t;
      }],
      [/charly\.gerald@students\.unnes\.ac\.id/g, () => kosong],
      [/\+62 812-3456-7890/g, () => user.kontak || kosong],
      [/Selamat Pagi/g, () => `Selamat ${waktu}`]
    ];

    // Kartu "Jabatan & Keanggotaan Aktif" (hanya di halaman profil)
    if (path.includes('14-profil')) {
      const m = user.keanggotaan || {};
      const levelLabel = { 1: 'PIMPINAN TERTINGGI', 2: 'PIMPINAN HARIAN', 3: 'KOORDINATOR DIVISI', 4: 'ANGGOTA' };
      const tidakAda = 'Belum tercatat';
      const periodeTeks = m.tahun_mulai
        ? `${m.tahun_mulai}/${m.tahun_selesai} (${m.periode_status ? m.periode_status.charAt(0).toUpperCase() + m.periode_status.slice(1) : '—'})`
        : '—';
      rules.push(
        [/LEVEL 1 - PIMPINAN TERTINGGI/g, () => m.level ? `LEVEL ${m.level} - ${levelLabel[m.level] || 'ANGGOTA'}` : 'BELUM ADA JABATAN'],
        [/ID: KGT-2024-001/g, () => m.id_keanggotaan ? `ID: KGT-${m.tahun_mulai}-${String(m.id_keanggotaan).padStart(3, '0')}` : 'ID: —'],
        [/SK-REK\/2024\/091/g, () => tidakAda],
        [/Ketua Umum BEM FASILKOM(?! 2024)/g, () => `${jabatan} BEM FASILKOM`],
        [/Badan Pengurus Harian \(BPH\) \/ Presidium Inti/g, () => m.divisi ? `Divisi ${m.divisi}` : 'Belum terdaftar di divisi'],
        [/2024\/2025 \(Genap\)/g, () => periodeTeks],
        [/15 Februari 2024/g, () => tidakAda],
        [/Full Access \(BPH\)/g, () => user.role_label]
      );
    }

    // Teks utuh (satu node berisi hanya itu)
    const exact = [
      [/^\s*Laki-laki\s*$/, kosong],
      [/^\s*(CG|AP)\s*$/, inisial]
    ];

    const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'OPTION', 'SELECT'];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && !skipTags.includes(n.parentElement.tagName)
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      let text = node.nodeValue;
      const original = text;
      exact.forEach(([re, val]) => { if (re.test(text)) text = text.replace(re, val); });
      rules.forEach(([re, fn]) => { text = text.replace(re, fn); });
      if (text !== original) node.nodeValue = text;
    });

    // Kolom yang diisi lewat atribut value (mis. input nama yang terkunci)
    document.querySelectorAll('input').forEach(inp => {
      if (inp.value === 'Charly Gerald Simanjuntak') inp.value = nama;
      if (inp.id === 'input-edit-wa') inp.value = user.kontak || '';
    });

    // Email SSO tidak ada di database -> jangan tampilkan centang "terverifikasi"
    document.querySelectorAll('[title="Email SSO Terverifikasi"]').forEach(el => { el.style.display = 'none'; });

    document.title = document.title.replace(/Charly Gerald Simanjuntak/g, nama);
  }

  async function setupAuth() {
    // Dibuka langsung dari file:// (tanpa server) -> tidak ada sesi yang bisa dicek
    if (window.location.protocol === 'file:' || isPublicPage()) return;

    // Sesi habis di tengah jalan: API mengembalikan 401 -> kembali ke login
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async function (...args) {
      const res = await nativeFetch(...args);
      const target = String(args[0] && args[0].url ? args[0].url : args[0]);
      if (res.status === 401 && target.includes('/api/') && !target.includes('/api/auth/')) {
        goToLogin();
      }
      return res;
    };

    try {
      const res = await nativeFetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.status === 401) return goToLogin();
      const json = await res.json();
      if (json && json.user) {
        window.ORGANA_USER = json.user;
        applyUserToHeader(json.user);
        personalizeCurrentUserPage(json.user);
      }
    } catch (e) {
      console.warn('Organa: gagal memeriksa sesi', e);
    }
  }

  // Prevent uncaught errors from stopping script execution
  window.addEventListener('error', function (e) {
    console.warn('Organa intercepted error:', e.message);
  });

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectGlobalModals();
      setupNavigation();
      setupAuth();
    });
  } else {
    injectGlobalModals();
    setupNavigation();
    setupAuth();
  }
})();