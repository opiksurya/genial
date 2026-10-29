#!/usr/bin/env bash
# Exercises auto-deploy.sh in a throwaway sandbox; production is never touched.
#
#   bash deploy/auto-deploy/simulate.sh
#
# A local git "origin", a site checkout and a stand-in for deploy.sh (same
# contract: tests in a copy first, backup folder with HEAD.txt and build, then
# git pull, prints "💾 Backup: <dir>") are created under a temp folder. A PHP
# dev server plays the website; the release decides its status code and writes
# an ERROR line to laravel.log on 5xx, like Laravel does. Telegram messages go
# to a file instead of being sent.
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
T=$(mktemp -d)
PORT=$((20000 + RANDOM % 20000))
SERVER_PID=""
cleanup() { [ -z "$SERVER_PID" ] || kill "$SERVER_PID" 2>/dev/null; rm -rf "$T"; }
trap cleanup EXIT

PASS=0
FAIL=0
check() {
    if eval "$2"; then
        echo "  ✅ $1"
        PASS=$((PASS + 1))
    else
        echo "  ❌ $1"
        FAIL=$((FAIL + 1))
    fi
}

git init -q --bare -b main "$T/origin.git"
git clone -q "$T/origin.git" "$T/work"
cd "$T/work"
git config user.name sim && git config user.email sim@localhost
mkdir -p storage/logs public/build
echo '*' >storage/logs/.gitignore
echo '/public/build' >.gitignore
echo '<?php exit(0);' >artisan
echo 200 >health.txt
echo pass >test-result.txt
git add -A && git commit -qm "release 1" && git push -q origin main
git clone -q "$T/origin.git" "$T/site"
mkdir -p "$T/site/storage/logs" "$T/site/public/build"
echo "build of release 1" >"$T/site/public/build/app.js"
: >"$T/site/storage/logs/laravel.log"

cat >"$T/fake-deploy.sh" <<EOF
#!/usr/bin/env bash
set -uo pipefail
SITE=$T/site
cd "\$SITE"
git fetch -q origin
rm -rf $T/test-copy && git clone -q --branch main $T/origin.git $T/test-copy
if [ "\$(cat $T/test-copy/test-result.txt)" != pass ]; then
    echo "❌ Test gagal (Tests:    1 failed, 265 passed); tidak ditayangkan."
    exit 1
fi
echo "✅ Test:    266 passed"
BACKUP=$T/deploy-backup-\$(date +%s%N)
mkdir -p "\$BACKUP" && git rev-parse HEAD >"\$BACKUP/HEAD.txt" && cp -a public/build "\$BACKUP/build"
git pull -q --ff-only origin main
echo "build of \$(git log -1 --format=%s)" >public/build/app.js
echo "🚀 Tayang: \$(git log --oneline -1)"
echo "💾 Backup: \$BACKUP"
EOF

cat >"$T/router.php" <<EOF
<?php
\$code = (int) trim(file_get_contents('$T/site/health.txt'));
if (\$code >= 500) {
    file_put_contents('$T/site/storage/logs/laravel.log', '['.date('Y-m-d H:i:s')."] production.ERROR: simulated crash\n", FILE_APPEND);
}
http_response_code(\$code);
echo 'ok';
EOF
php -S "127.0.0.1:$PORT" "$T/router.php" >/dev/null 2>&1 &
SERVER_PID=$!
sleep 1

export AUTO_DEPLOY_SITE="$T/site"
export AUTO_DEPLOY_SCRIPT="$T/fake-deploy.sh"
export AUTO_DEPLOY_STATE_DIR="$T/state"
export AUTO_DEPLOY_BASE_URL="http://127.0.0.1:$PORT"
export AUTO_DEPLOY_SETTLE_SECONDS=1
export AUTO_DEPLOY_NOTIFY_FILE="$T/telegram.txt"
export AUTO_DEPLOY_RUN_AS="$(id -un)"

run() { bash "$HERE/auto-deploy.sh" || true; }
site_head() { git -C "$T/site" log -1 --format=%s; }
notes() { cat "$T/telegram.txt" 2>/dev/null || true; }
release() {
    cd "$T/work"
    echo "$2" >health.txt
    echo "$3" >test-result.txt
    git commit -qam "$1" && git push -q origin main
}

echo "1) Merge dengan test sengaja gagal"
release "release 2 (failing test)" 200 fail
run
check "produksi tetap di release 1" '[ "$(site_head)" = "release 1" ]'
check "notifikasi 'Test gagal' terkirim" 'notes | grep -q "Test gagal, TIDAK ditayangkan"'
: >"$T/telegram.txt"
run
check "commit gagal tidak dicoba ulang" '[ ! -s "$T/telegram.txt" ]'

echo "2) Rilis lulus test tapi pengecekan kesehatan gagal (500 + error di log)"
release "release 3 (broken page)" 500 pass
run
check "produksi dikembalikan ke release 1" '[ "$(site_head)" = "release 1" ]'
check "aset build dikembalikan" 'grep -q "release 1" "$T/site/public/build/app.js"'
check "notifikasi ROLLBACK terkirim" 'notes | grep -q "ROLLBACK: "'
check "alasan 500 dan error log disebut" 'notes | grep -q "membalas 500" && notes | grep -q "error baru di log Laravel"'
check "halaman normal setelah rollback" 'notes | grep -q "Setelah rollback halaman normal"'
: >"$T/telegram.txt"

echo "3) Penayangan otomatis dimatikan"
release "release 4 (good)" 200 pass
touch "$T/state/DISABLED"
run
check "tidak ada yang tayang saat DISABLED ada" '[ "$(site_head)" = "release 1" ] && [ ! -s "$T/telegram.txt" ]'
rm "$T/state/DISABLED"

echo "4) Rilis sehat"
run
check "produksi naik ke release 4" '[ "$(site_head)" = "release 4 (good)" ]'
check "notifikasi berhasil terkirim" 'notes | grep -q "Berhasil tayang"'

echo
echo "Hasil: $PASS lulus, $FAIL gagal"
[ "$FAIL" -eq 0 ]
