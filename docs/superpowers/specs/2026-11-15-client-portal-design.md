# Portal Klien: desain

Tanggal: 2026-11-15 · Status: draf menunggu persetujuan

## Maksud dan alasan

Akun demo klien (peran `Reviewer`) sekarang hanya bisa membuka Shopee dan Meta Analytics. Menu lain di
sidebar tampil tetapi dialihkan ke `/shopee`, sehingga terlihat rusak. Pemilik ingin klien melihat ERP dari
sudut pandang klien: tiap menu punya versi klien, bukan sekadar disembunyikan.

Akun yang sama dipakai untuk dua hal: (c) review aplikasi Shopee Open Platform dan peragaan sekarang, dan
(b) akun klien sungguhan nanti. Karena itu pengalamannya harus sama untuk keduanya.

## Tujuan

- Klien login dan hanya melihat menu versi klien, dengan data proyek miliknya sendiri.
- Versi klien dari: Dashboard, Agenda Meeting, Freelancer Hub, Katalog Digital Kreatif, ditambah Shopee dan
  Meta Analytics yang sudah ada. Kalender Konten (AI) dan menu ProjectFlow menyusul di tahap 2.
- `Reviewer` dan `Client` mendapat pengalaman yang sama. Memberi klien sungguhan peran `Client` tidak butuh
  kerja ulang.

## Bukan tujuan

- Klien tidak mengubah data internal: tugas, keuangan, pengguna, peran, pengaturan, kredensial.
- Tidak ada halaman internal yang diubah agar "ramah klien". Halaman internal tetap seperti sekarang.
- Tahap 1 tidak mencakup ProjectFlow dan Kalender Konten.

## Anti-tujuan (gagal walau tampak jalan)

- Klien A melihat data klien B, atau melihat apa pun dari sisi internal (leads, pengguna, tarif freelancer,
  kontak pribadi, kredensial, keuangan).
- Halaman baru terbuka untuk klien tanpa disengaja. Pola tolak-secara-default harus dipertahankan.

## Kendala (dari kode yang ada)

- `ConfineReviewer` menolak semua rute kecuali daftar `ALLOWED_ROUTES`. Rute baru tertutup sampai didaftarkan.
- `Project::MEMBER_ONLY_ROLES = ['Client','Reviewer']` dan `ProjectMember` sudah membatasi proyek per pengguna.
  Semua query klien harus lewat pembatasan ini.
- `DashboardController` memuat leads dan jumlah pengguna; `MeetingController` memuat semua proyek. Keduanya
  tidak boleh dipakai ulang untuk klien.
- Sidebar (`resources/js/components/app-sidebar.tsx`) belum membedakan peran.
- Aplikasi memakai Laravel, Inertia, dan React; tes ada (416) dan PHPStan harus tetap 0 temuan.

## Pendekatan yang dipertimbangkan

| | Pendekatan | Trade-off |
|---|---|---|
| **A (dipilih)** | Area terpisah `/client/*`: controller, halaman, dan sidebar khusus klien | Lebih banyak kode, tetapi tidak ada jalur data internal ke klien |
| B | Halaman yang sama, isi dibedakan per peran di controller | Lebih sedikit file, tetapi satu `if` yang terlewat membocorkan data |
| C | Hanya sembunyikan menu, buka halaman yang ada | Tercepat, tetapi klien melihat data internal |

Dipilih A oleh pemilik karena aman secara default dan konsisten dengan `ConfineReviewer`.

## Desain (tahap 1)

**Akses.** Rute `/client/*` memakai grup `auth`, `verified`, dan middleware baru yang hanya meloloskan peran
`Client` atau `Reviewer`. `ConfineReviewer` diperluas: `ALLOWED_ROUTES` ditambah `client.*`. Pengguna dengan
peran `Client` mendapat pembatasan yang sama dengan `Reviewer` (satu middleware untuk kedua peran). Setelah
login, klien dialihkan ke `/client/dashboard`, bukan `/shopee`. Pengguna internal tidak terdampak.

**Sidebar.** Untuk `Client` dan `Reviewer`, sidebar menampilkan hanya: Dashboard, Agenda Meeting, Freelancer
Hub, Katalog Digital Kreatif, Shopee Analytics, Meta Ads Analytics. Daftar menu dipilih di server (prop
Inertia), bukan disembunyikan di klien, supaya tidak bergantung pada kode front-end.

**Halaman klien** (semua read-only, data dibatasi ke proyek tempat pengguna menjadi anggota):

1. *Dashboard*: nama proyek, status dan progres, ringkasan performa (angka Shopee/Meta bila terhubung),
   rapat terdekat, dan tautan ke menu lain. Tanpa leads, jumlah pengguna, atau pengaturan.
2. *Agenda Meeting*: daftar rapat proyek klien dengan tim Genial (tanggal, judul, tautan rapat, unduh ICS).
   Hanya rapat milik proyek klien itu.
3. *Freelancer Hub*: freelancer yang ditugaskan ke proyek klien: foto, nama, keahlian, portofolio, dan profil
   kinerja (mis. jumlah tugas selesai, ketepatan waktu). Tanpa tarif, kontak pribadi, atau data keuangan.
4. *Katalog Digital Kreatif*: daftar layanan kreatif yang bisa dilihat dan diminta klien. Aksi "ajukan" membuat
   permintaan untuk tim Genial, tidak mengubah katalog. Bentuk akhir permintaan diputuskan builder.

Shopee dan Meta Analytics tidak diubah; hanya disertakan di sidebar klien.

**Data akun demo.** Satu proyek demo dengan data sampel (rapat, freelancer terkait, layanan) dibuat lewat
seeder supaya halaman tidak kosong saat peragaan. Akun `Reviewer` yang ada ditautkan sebagai anggotanya.

## Pengujian

Tes fitur per halaman: (1) klien melihat datanya, (2) klien tidak melihat data proyek lain, (3) klien ditolak
dari rute internal (`/dashboard`, `/finance/*`, `/users`, `/projects/*`, dll.), (4) pengguna internal tidak
berubah. Satu tes menjaga agar setiap rute baru bernama `client.*` dan yang selain itu tetap tertutup.

## Diserahkan ke builder

Nama kolom dan bentuk data persis tiap halaman, tata letak visual (mengikuti komponen yang ada), metrik kinerja
freelancer yang tersedia dari data, bentuk permintaan di Katalog, dan isi seeder demo.

## Tahap 2 (terpisah, setelah tahap 1 disetujui di peragaan)

Kalender Konten (AI), Dashboard Project, Project Board, Timeline, Team, dan Reports versi klien.

## Keputusan yang saya ambil sendiri (silakan koreksi)

- `Client` dan `Reviewer` memakai satu middleware dan satu pengalaman.
- Semua halaman klien read-only, kecuali pengajuan layanan di Katalog.
- Klien dialihkan ke `/client/dashboard` setelah login.
- Tidak ada deploy sebelum Anda menyetujui hasilnya di peragaan.

## Keputusan tambahan setelah pemeriksaan builder (keputusan saya, silakan koreksi)

- **Banyak proyek / tanpa proyek:** halaman klien menggabungkan semua proyek tempat pengguna menjadi anggota,
  dengan filter proyek opsional. URL tetap `/client/...` tanpa ID proyek. Pengguna tanpa proyek melihat
  keadaan kosong yang sopan, bukan galat.
- **Peran `Client`:** saat ini tidak ada pengguna berperan `Client` (diperiksa: 0), jadi tidak ada akses yang
  hilang. Semua sesi `Client` dan `Reviewer` yang tersasar ke rute internal dialihkan ke `/client/dashboard`.
- **Shopee dan Meta Analytics:** halaman tetap sama, tetapi sidebar dipilih di server menurut peran sehingga
  klien tetap melihat sidebar klien. Builder wajib memeriksa bahwa rute Shopee/Meta yang diizinkan tidak
  menampilkan tautan koneksi, token, atau data proyek lain kepada klien.
- **Freelancer Hub:** tanpa perubahan skema. Foto diganti avatar inisial, "keahlian" memakai kolom `role`,
  "kinerja" dihitung dari penugasan yang ada (jumlah selesai dan status), tanpa metrik ketepatan waktu bila data
  tanggal selesai tidak ada. Tarif, biaya, dan data bank tidak pernah dikirim ke klien (DTO eksplisit).
- **Dashboard performa:** memakai ulang layanan analitik Shopee/Meta dengan cache singkat, dan menampilkan
  "belum terhubung" bila konfigurasi kosong.
- **Agenda Meeting:** hanya unduh ICS per rapat; token feed, peserta internal, dan pembuat rapat disembunyikan.
- **Pengaturan akun:** klien boleh membuka profil dan kata sandi sendiri, bukan pengaturan lain.

## Menunggu jawaban pemilik

1. Data demo di production (bergantung pada pilihan Anda).
2. Katalog: harga klien tampil atau tidak, dan cara "ajukan" bekerja.
