# Tayang otomatis (auto deploy)

Setiap 5 menit, server mengecek apakah `main` di GitHub punya commit baru. Kalau ada, `auto-deploy.sh` menjalankan:

1. **Skrip tayang manual yang sudah ada** (`/opt/surya-bot/deploy.sh main`), tanpa diubah. Skrip ini menjalankan seluruh test di salinan terpisah, membuat backup, menarik kode, menjalankan cache, dan build aset. Kalau test gagal, kode tidak ditarik, jadi tidak ada yang tayang.
2. **Pengecekan kesehatan** setelah tayang: `/` dan `/login` harus membalas 200 atau 302, dan dalam 20 detik setelahnya tidak boleh ada baris `ERROR`/`CRITICAL`/`ALERT`/`EMERGENCY` baru di `storage/logs/laravel.log`. Kegagalan pada pengecekan bawaan `deploy.sh` juga dihitung gagal.
3. **Rollback** kalau pengecekan gagal: kode dikembalikan ke commit sebelumnya (`HEAD.txt` di folder backup `deploy.sh`), `public/build` dipulihkan dari backup, lalu cache config/route dibuat ulang.
4. **Notifikasi Telegram** ke pemilik untuk setiap hasil: ✅ berhasil, ❌ test gagal/tidak ditayangkan, ⏸️ butuh migrasi, ↩️ rollback, 🚨 rollback gagal. Token dibaca dari `/opt/surya-bot/telegram.env` saat mengirim, dan tidak pernah ditulis ke log.

Aturan penting:

- **Migrasi database tidak dijalankan otomatis.** Kalau update membawa migrasi, `deploy.sh` berhenti (kode 3) dan pemilik mendapat pesan ⏸️. Lanjutkan seperti biasa: kirim `/tayangkan main` ke bot, lalu tekan ✅ Ya, jalankan migrasi.
- Update yang mengubah dependency composer/npm tetap ditolak oleh `deploy.sh`, sama seperti cara manual.
- Commit yang gagal dicatat di `/opt/auto-deploy/last-failed-commit` dan tidak dicoba ulang sampai ada commit baru di `main`. Tombol 🚀 Tayangkan manual tetap bisa dipakai kapan saja.
- Kalau `deploy.sh` manual sedang berjalan, putaran otomatis dilewati. Dua putaran otomatis juga tidak bisa jalan bersamaan (`flock`).
- Database tidak ikut di-rollback, karena mode otomatis tidak pernah menjalankan migrasi.
- Log ringkas ada di `/opt/auto-deploy/auto-deploy.log`.

## Memasang (butuh izin pemilik: systemd)

```bash
cd /var/www/genialdigitalsolution.com
install -d -m 700 /opt/auto-deploy
install -m 700 deploy/auto-deploy/auto-deploy.sh /opt/auto-deploy/
install -m 644 deploy/auto-deploy/genial-auto-deploy.service deploy/auto-deploy/genial-auto-deploy.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now genial-auto-deploy.timer
systemctl list-timers genial-auto-deploy.timer
```

Skrip disalin ke `/opt/auto-deploy`, jadi skrip yang dijalankan sebagai root tidak ikut berubah otomatis saat ada PR baru. Kalau skrip di repo diperbarui, ulangi baris `install -m 700 ...`.

## Menonaktifkan

- Sementara (langsung berlaku, tanpa mengubah systemd): `touch /opt/auto-deploy/DISABLED`. Aktifkan lagi dengan `rm /opt/auto-deploy/DISABLED`.
- Permanen: `systemctl disable --now genial-auto-deploy.timer`.

Dalam kedua cara, tombol 🚀 Tayangkan dan `/tayangkan` tetap berfungsi seperti biasa.

## Menguji tanpa menyentuh produksi

```bash
bash deploy/auto-deploy/simulate.sh
```

Simulasi membuat repo, folder website, dan server web palsu di folder sementara, lalu memeriksa empat skenario: test sengaja gagal (tidak tayang dan tidak dicoba ulang), halaman membalas 500 dan muncul error di log (rollback), penayangan dimatikan, dan rilis sehat (tayang).
