# Panduan tayang manual (saat update mengubah dependency)

Gunakan panduan ini kalau tombol **🚀 Tayangkan** menolak dengan pesan:

> Update ini mengubah dependency (composer/npm). Deploy otomatis dihentikan; minta dikerjakan manual.

Tombol menolak karena update menyentuh `package.json`, `package-lock.json`,
`composer.json`, atau `composer.lock`. Langkah di bawah sama dengan yang
dikerjakan tombol (`/opt/surya-bot/deploy.sh`), ditambah langkah memasang
dependency.

## Aturan pakai

- Jalankan semua perintah di server sebagai **root** lewat SSH (`ssh root@srv1975556`).
- Salin **satu kotak perintah sekali jalan**, tempel di terminal, tekan Enter, lalu
  bandingkan hasilnya dengan bagian **Hasil yang benar**.
- Kalau hasilnya berbeda atau muncul tulisan `error` / `failed` / `❌`, **berhenti**.
  Jangan lanjut ke langkah berikutnya. Kirim tangkapan layar ke Surya, atau
  jalankan bagian **Rollback** kalau website sudah terganggu.
- Kerjakan semua langkah di **satu jendela terminal yang sama**. Beberapa langkah
  memakai catatan (variabel) dari langkah sebelumnya. Kalau terminal tertutup,
  lihat "Kalau terminal sempat tertutup" di bagian Rollback.
- Perkiraan waktu: 10–15 menit. Website hanya mati sebentar kalau ada migrasi
  database (langkah 6).

---

## Langkah 0 — Pastikan memang ada yang perlu ditayangkan

```bash
cd /var/www/genialdigitalsolution.com
git fetch -q origin
echo "Produksi : $(git log --oneline -1 HEAD)"
echo "GitHub   : $(git log --oneline -1 origin/main)"
git status --short
git merge-base --is-ancestor HEAD origin/main && echo "BISA MAJU" || echo "TIDAK BISA MAJU"
```

**Hasil yang benar**

- Baris "Produksi" dan "GitHub" **berbeda**. Kalau sama, produksi sudah terbaru;
  panduan selesai, langsung ke bagian **Verifikasi**.
- Di antara baris "GitHub" dan "BISA MAJU" **tidak ada daftar file**.
  Kalau ada, berarti ada perubahan yang belum di-commit di server. Berhenti
  dan hubungi Surya.
- Baris terakhir `BISA MAJU`.

## Langkah 1 — Lihat apa saja yang berubah

```bash
cd /var/www/genialdigitalsolution.com
CHANGED=$(git diff --name-only HEAD origin/main)
NPM=$(echo "$CHANGED" | grep -cE '^package(-lock)?\.json$')
COMPOSER=$(echo "$CHANGED" | grep -cE '^composer\.(json|lock)$')
MIGRATIONS=$(echo "$CHANGED" | grep -c '^database/migrations/')
echo "npm berubah      : $NPM"
echo "composer berubah : $COMPOSER"
echo "migrasi baru     : $MIGRATIONS"
echo "$CHANGED" | grep '^database/migrations/'
```

**Hasil yang benar**: tiga angka muncul, masing-masing 0 atau lebih.
Catat ketiganya. Langkah berikutnya memakai angka ini:

- `npm berubah` lebih dari 0 → langkah 5a wajib.
- `composer berubah` lebih dari 0 → langkah 5b dan 9 wajib.
- `migrasi baru` lebih dari 0 → langkah 6 wajib. Nama file migrasinya ikut
  tampil di bawah angka. Kalau nama file mengandung kata `drop`, `remove`,
  atau `delete`, **berhenti dan tanya Surya dulu**, karena migrasi itu bisa
  menghapus data.

## Langkah 2 — Uji versi baru di salinan terpisah (produksi belum disentuh)

Langkah ini menjalankan seluruh test di folder salinan. Database produksi tidak
dipakai.

```bash
TEST=/root/genial-manual-test
rm -rf "$TEST"
git clone -q --branch main git@github.com:opiksurya/genial.git "$TEST"
cp /var/www/genialdigitalsolution.com/.env "$TEST/.env"
sed -i "s|^DB_DATABASE=.*|DB_DATABASE=$TEST/database/test.sqlite|" "$TEST/.env"
touch "$TEST/database/test.sqlite"
cd "$TEST" && npm ci --no-audit --no-fund >/dev/null 2>&1 && echo "npm OK"
cd "$TEST" && composer install -q --no-interaction >/dev/null 2>&1 && echo "composer OK"
cd "$TEST" && npm run build >/dev/null 2>&1 && echo "build OK"
cd "$TEST" && php artisan test --compact 2>&1 | grep -E 'Tests:'
cd /root && rm -rf "$TEST"
```

**Hasil yang benar**

```
npm OK
composer OK
build OK
  Tests:    266 passed (...)
```

Angka test bisa lebih dari 266 kalau ada test baru. Yang penting:
**tidak ada kata `failed`**, dan tiga baris `OK` semuanya muncul. Kalau ada yang
kurang, berhenti. Produksi masih aman karena belum diubah.

## Langkah 3 — Backup (catat commit saat ini)

```bash
cd /var/www/genialdigitalsolution.com
BACKUP=/root/deploy-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP"
git rev-parse HEAD > "$BACKUP/HEAD.txt"
cp -a database/database.sqlite "$BACKUP/"
cp -a public/build "$BACKUP/build"
cp bootstrap/cache/config.php bootstrap/cache/routes-v7.php "$BACKUP/"
cp package-lock.json composer.lock "$BACKUP/"
LOG_BEFORE=$(wc -l < storage/logs/laravel.log 2>/dev/null || echo 0)
echo "Backup di: $BACKUP"
echo "Commit lama: $(cat $BACKUP/HEAD.txt)"
ls "$BACKUP"
```

**Hasil yang benar**: muncul alamat backup (misalnya
`/root/deploy-backup-20261029-0745..`), kode commit lama (40 huruf/angka), dan
daftar isi folder: `HEAD.txt  build  composer.lock  config.php  database.sqlite
package-lock.json  routes-v7.php`.
**Tulis alamat backup dan kode commit lama di catatan Anda.** Keduanya dipakai
untuk rollback.

## Langkah 4 — Tarik kode baru

Kalau `migrasi baru` di langkah 1 lebih dari 0, kerjakan **langkah 6 bagian A**
dulu (matikan bot dan masuk mode pemeliharaan), baru jalankan langkah ini.

```bash
cd /var/www/genialdigitalsolution.com
git pull -q --ff-only origin main && echo "PULL OK"
git log --oneline -1
```

**Hasil yang benar**: `PULL OK`, lalu satu baris commit yang sama dengan baris
"GitHub" di langkah 0.

## Langkah 5 — Pasang dependency

### 5a. npm (kalau `npm berubah` > 0)

```bash
cd /var/www/genialdigitalsolution.com
npm ci --no-audit --no-fund && echo "NPM OK"
chown -R www-data:www-data node_modules
```

**Hasil yang benar**: diakhiri `added ... packages` lalu `NPM OK`.
Jangan pakai `--omit=dev`, karena alat build (`vite-plus`) termasuk dev dependency
dan dibutuhkan di langkah 7.

### 5b. composer (kalau `composer berubah` > 0)

```bash
cd /var/www/genialdigitalsolution.com
composer install --no-dev --optimize-autoloader --no-interaction && echo "COMPOSER OK"
chown -R www-data:www-data vendor bootstrap/cache
```

**Hasil yang benar**: diakhiri `COMPOSER OK`, tanpa tulisan merah `Your
requirements could not be resolved`.

## Langkah 6 — Migrasi database (hanya kalau `migrasi baru` > 0)

**A. Sebelum langkah 4:** matikan bot yang menulis ke database, lalu tutup
website sementara:

```bash
cd /var/www/genialdigitalsolution.com
systemctl stop finance-bot ads-bot
sudo -u www-data php artisan down --retry=30 && echo "DOWN OK"
```

**B. Setelah langkah 5:** jalankan migrasi lalu buka kembali website:

```bash
cd /var/www/genialdigitalsolution.com
sudo -u www-data php artisan migrate --force && echo "MIGRATE OK"
sudo -u www-data php artisan up
systemctl start finance-bot ads-bot
systemctl is-active finance-bot ads-bot
```

**Hasil yang benar**: `MIGRATE OK`, lalu dua baris `active`.
Kalau migrasi gagal, tetap jalankan `php artisan up` dan `systemctl start ...`
di atas supaya website hidup lagi, lalu lanjut ke **Rollback** poin 4.

## Langkah 7 — Build aset tampilan

```bash
cd /var/www/genialdigitalsolution.com
npm run build > /root/prod-build.log 2>&1 && echo "BUILD OK" || tail -20 /root/prod-build.log
chown -R www-data:www-data public/build
```

**Hasil yang benar**: `BUILD OK`. Kalau yang muncul justru 20 baris log, build
gagal; lanjut ke **Rollback**.

## Langkah 8 — Bersihkan dan buat ulang cache Laravel

```bash
cd /var/www/genialdigitalsolution.com
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:clear
chown -R www-data:www-data bootstrap/cache
```

**Hasil yang benar**: tiga baris berlabel `INFO`, misalnya `Configuration cached
successfully.`, `Routes cached successfully.`, dan `Compiled views cleared
successfully.`

## Langkah 9 — Muat ulang PHP (wajib kalau `composer berubah` > 0)

Langkah ini aman juga dijalankan walau tidak wajib. Pengunjung tidak terputus.

```bash
systemctl reload php8.4-fpm && systemctl is-active php8.4-fpm
```

**Hasil yang benar**: `active`.

## Langkah 10 — Cek halaman utama dan dashboard

```bash
cd /var/www/genialdigitalsolution.com
for p in / /login /privacy-policy /dashboard /finance/dashboard; do
  echo "$p → $(curl -s -o /dev/null -w '%{http_code}' https://genialdigitalsolution.com$p)"
done
echo "Baris baru di log error: $(( $(wc -l < storage/logs/laravel.log 2>/dev/null || echo 0) - ${LOG_BEFORE:-0} ))"
```

**Hasil yang benar**

```
/ → 200
/login → 200
/privacy-policy → 200
/dashboard → 302
/finance/dashboard → 302
Baris baru di log error: 0
```

Kode `302` normal untuk dashboard karena halaman itu mengarahkan ke login kalau
belum masuk. Angka `500` atau `502` berarti ada masalah: jalankan **Rollback**.
Kalau "baris baru di log error" lebih dari 0 tetapi semua halaman normal,
website tidak perlu di-rollback; cukup kabari Surya.

Terakhir, buka https://genialdigitalsolution.com di browser, login, buka
dashboard, dan pastikan tampilannya normal. Tekan Ctrl+Shift+R kalau tampilan
lama masih muncul. Setelah itu lanjutkan ke bagian **Verifikasi**.

---

## Rollback (kembali ke versi sebelumnya)

Gunakan kalau ada langkah yang gagal setelah langkah 4, atau website error
setelah tayang.

**Kalau terminal sempat tertutup**, isi ulang catatan backup dulu. Pilih folder
backup terbaru, yaitu folder yang dibuat di langkah 3:

```bash
BACKUP=$(ls -d /root/deploy-backup-* | tail -1); echo "$BACKUP"; cat "$BACKUP/HEAD.txt"
```

Pastikan alamat dan kode commit yang tampil sama dengan yang Anda catat di
langkah 3.

**1. Kembalikan kode ke commit lama**

```bash
cd /var/www/genialdigitalsolution.com
git reset --hard "$(cat $BACKUP/HEAD.txt)"
git log --oneline -1
```

Hasil: baris commit sama dengan "Produksi" di langkah 0.

**2. Kembalikan dependency lama**

```bash
cd /var/www/genialdigitalsolution.com
npm ci --no-audit --no-fund && chown -R www-data:www-data node_modules && echo "NPM OK"
composer install --no-dev --optimize-autoloader --no-interaction && chown -R www-data:www-data vendor && echo "COMPOSER OK"
```

**3. Kembalikan aset tampilan dan cache**

```bash
cd /var/www/genialdigitalsolution.com
rm -rf public/build && cp -a "$BACKUP/build" public/build && chown -R www-data:www-data public/build
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:clear
systemctl reload php8.4-fpm
```

**4. Kembalikan database (HANYA kalau langkah 6 sudah dijalankan)**

Data yang masuk setelah backup dibuat akan hilang. Lewati poin ini kalau tidak
ada migrasi.

```bash
cd /var/www/genialdigitalsolution.com
systemctl stop finance-bot ads-bot
sudo -u www-data php artisan down --retry=30
cp -a database/database.sqlite "/root/database-gagal-$(date +%Y%m%d-%H%M%S).sqlite"
cp -a "$BACKUP/database.sqlite" database/database.sqlite
chown www-data:www-data database/database.sqlite
sudo -u www-data php artisan up
systemctl start finance-bot ads-bot
```

**5. Cek lagi**: jalankan ulang **langkah 10**. Semua halaman harus kembali
`200`/`302`. Setelah itu kabari Surya. Produksi sekarang tertinggal dari main;
tayangan berikutnya akan mencoba lagi dari commit lama ini.

---

## Verifikasi tiga perbaikan (npm audit, MetaConfig, colSpan)

Jalankan setelah langkah 10. Ketiganya hanya **membaca**, tidak mengubah apa pun.

### A. Audit npm (fix/npm-audit)

```bash
cd /var/www/genialdigitalsolution.com
npm audit --omit=dev
node -p 'require("vite/package.json").version'
```

**Hasil yang benar**

```
found 0 vulnerabilities
8.3.5
```

Baris pertama berarti paket yang ikut terpasang di website bersih. Versi `vite`
`8.3.5` atau lebih baru berarti perbaikan sudah terpasang.

Catatan: `npm audit` **tanpa** `--omit=dev` masih menampilkan sekitar
7 temuan (tinypool, vitest, oxfmt, @vitest/*). Semuanya berasal dari alat
pengembang `vite-plus` 0.3.0, tidak ikut dikirim ke pengunjung, dan baru hilang
setelah `vite-plus` di-upgrade ke versi 1.x. Upgrade itu tugas terpisah.

### B. access_token MetaConfig aman (fix/metaconfig-access-token)

```bash
cd /var/www/genialdigitalsolution.com
sudo -u www-data env HOME=/tmp php artisan tinker --execute 'echo json_encode(array_keys(App\Models\ProjectMetaConfig::query()->first()?->toArray() ?? ["belum ada data"]));' 2>/dev/null
```

**Hasil yang benar**: satu baris daftar nama kolom yang:

- **memuat** `"has_access_token"`, dan
- **tidak memuat** `"access_token"` atau `"app_secret"` (perhatikan tanda kutip;
  `"has_access_token"` bukan `"access_token"`).

Perintah ini hanya menampilkan **nama** kolom, bukan isinya, sehingga tidak
membocorkan token.

Cek di browser: login sebagai Super Admin, buka proyek yang sudah terhubung ke
Meta, lalu buka jendela koneksi Meta. Kolom token harus tampil sebagai titik-titik
(••••), bukan teks token asli.

### C. Baris Total memakai colSpan dengan benar (fix/colspan)

```bash
cd /var/www/genialdigitalsolution.com
grep -c 'colSpan:r,class' public/build/assets/meta-ads-*.js
```

**Hasil yang benar**: angka `1` (atau lebih). Angka `0` atau pesan
`No such file` berarti aset tampilan belum di-build ulang; ulangi langkah 7.

Cek di browser: buka halaman Meta Ads proyek, lalu lihat tabel kampanye.
Baris **Total** di bawah tabel harus:

- memiliki sel "Total" yang melebar menutupi 3 kolom pertama, dan
- menempatkan setiap angka total tepat di bawah judul kolomnya (Spend di bawah
  Spend, Impresi di bawah Impresi, dan seterusnya), sampai kolom paling kanan.

### D. Pastikan ketiga branch sudah ikut tayang

```bash
cd /var/www/genialdigitalsolution.com
git fetch -q origin
for b in fix/npm-audit fix/metaconfig-access-token fix/colspan; do
  git merge-base --is-ancestor "origin/$b" HEAD && echo "$b: TAYANG" || echo "$b: BELUM"
done
```

**Hasil yang benar**: ketiga baris berakhir `TAYANG`.
