#!/usr/bin/env bash
# Automatic deploy for genialdigitalsolution.com.
#
# Run by genial-auto-deploy.timer every few minutes. When origin/main has a new
# commit it calls the existing manual deploy script (the one behind the
# "🚀 Tayangkan" button) unchanged, then checks the site again and rolls back
# to the previous release if the check fails. Every outcome is sent to the
# owner on Telegram, using the bot's existing telegram.env.
#
# Kill switch: create the file $DISABLE_FILE (default /opt/auto-deploy/DISABLED).
# See deploy/auto-deploy/README.md.
#
# Paths can be overridden with environment variables so the logic can be
# exercised in a sandbox (see simulate.sh); the defaults are production.
set -uo pipefail

SITE="${AUTO_DEPLOY_SITE:-/var/www/genialdigitalsolution.com}"
DEPLOY_SCRIPT="${AUTO_DEPLOY_SCRIPT:-/opt/surya-bot/deploy.sh}"
TELEGRAM_ENV="${AUTO_DEPLOY_TELEGRAM_ENV:-/opt/surya-bot/telegram.env}"
STATE_DIR="${AUTO_DEPLOY_STATE_DIR:-/opt/auto-deploy}"
DISABLE_FILE="${AUTO_DEPLOY_DISABLE_FILE:-$STATE_DIR/DISABLED}"
BASE_URL="${AUTO_DEPLOY_BASE_URL:-https://genialdigitalsolution.com}"
HEALTH_PATHS="${AUTO_DEPLOY_HEALTH_PATHS:-/ /login}"
SETTLE_SECONDS="${AUTO_DEPLOY_SETTLE_SECONDS:-20}"
NOTIFY_FILE="${AUTO_DEPLOY_NOTIFY_FILE:-}"
RUN_AS="${AUTO_DEPLOY_RUN_AS:-www-data}"

LOG_FILE="$SITE/storage/logs/laravel.log"
FAILED_FILE="$STATE_DIR/last-failed-commit"
RUN_LOG="$STATE_DIR/auto-deploy.log"

log() { echo "$(date -u '+%F %T') $*" >>"$RUN_LOG"; }

# Sends a Telegram message to every owner in telegram.env. The token is read
# from the file at send time and never echoed or logged.
notify() {
    local text="🤖 Tayang otomatis
$1"
    if [ -n "$NOTIFY_FILE" ]; then
        printf '%s\n---\n' "$text" >>"$NOTIFY_FILE"
        return 0
    fi
    python3 - "$TELEGRAM_ENV" "$text" <<'PY' || log "notify failed"
import json, sys, urllib.request
env = dict(l.strip().split("=", 1) for l in open(sys.argv[1]) if "=" in l)
for owner in [x for x in env.get("OWNER_IDS", "").split(",") if x]:
    body = json.dumps({"chat_id": int(owner), "text": sys.argv[2][:4000]}).encode()
    request = urllib.request.Request(
        f"https://api.telegram.org/bot{env['BOT_TOKEN']}/sendMessage",
        data=body, headers={"Content-Type": "application/json"})
    urllib.request.urlopen(request, timeout=20).read()
PY
}

artisan() {
    if [ "$(id -un)" = "$RUN_AS" ]; then
        php artisan "$@"
    else
        sudo -u "$RUN_AS" php artisan "$@"
    fi
}

log_size() { stat -c %s "$LOG_FILE" 2>/dev/null || echo 0; }

# Prints problems found since byte offset $1 of laravel.log; prints nothing when healthy.
health_problems() {
    local offset="$1" path code size errors
    for path in $HEALTH_PATHS; do
        code=$(curl -s -o /dev/null -m 20 -w "%{http_code}" "$BASE_URL$path")
        case "$code" in
            200 | 302) ;;
            *) echo "• $path membalas $code" ;;
        esac
    done
    sleep "$SETTLE_SECONDS"
    size=$(log_size)
    [ "$size" -ge "$offset" ] || offset=0
    errors=$(tail -c +"$((offset + 1))" "$LOG_FILE" 2>/dev/null |
        grep -cE '^\[[^]]+\] [A-Za-z0-9_-]+\.(ERROR|CRITICAL|ALERT|EMERGENCY):' || true)
    [ "$errors" -eq 0 ] || echo "• $errors error baru di log Laravel"
}

# Puts code, built assets and caches back to the release saved in $1 (a
# deploy.sh backup folder). Database is not touched: auto deploy never runs
# migrations.
rollback() {
    local backup="$1" previous
    previous=$(cat "$backup/HEAD.txt" 2>/dev/null) || return 1
    git -C "$SITE" reset -q --hard "$previous" || return 1
    if [ -d "$backup/build" ]; then
        rm -rf "$SITE/public/build" && cp -a "$backup/build" "$SITE/public/build" || return 1
    fi
    (cd "$SITE" && artisan config:cache >/dev/null && artisan route:cache >/dev/null && artisan view:clear >/dev/null) || return 1
    chown -R "$RUN_AS:$RUN_AS" "$SITE/public/build" "$SITE/bootstrap/cache" 2>/dev/null
    return 0
}

main() {
    mkdir -p "$STATE_DIR"
    exec 9>"$STATE_DIR/lock"
    flock -n 9 || exit 0

    if [ -e "$DISABLE_FILE" ]; then
        exit 0
    fi
    if pgrep -f "$DEPLOY_SCRIPT" >/dev/null; then
        log "manual deploy running; skipped"
        exit 0
    fi

    cd "$SITE" || exit 1
    git fetch -q origin main || { log "git fetch failed"; exit 1; }
    local current target subject
    current=$(git rev-parse HEAD)
    target=$(git rev-parse origin/main)
    [ "$current" != "$target" ] || exit 0
    if [ "$(cat "$FAILED_FILE" 2>/dev/null)" = "$target" ]; then
        exit 0
    fi
    subject=$(git log -1 --format='%h %s' "$target" | cut -c1-80)
    log "deploying $subject"

    local offset output status
    offset=$(log_size)
    output=$(bash "$DEPLOY_SCRIPT" main 2>&1)
    status=$?
    log "deploy.sh exit=$status"

    if [ "$(git rev-parse HEAD)" = "$current" ]; then
        echo "$target" >"$FAILED_FILE"
        if [ "$status" -eq 3 ]; then
            notify "⏸️ Tidak ditayangkan otomatis: $subject
Update ini membawa migrasi database, jadi butuh persetujuan Anda.
$output

Kalau sudah yakin, kirim ke bot: /tayangkan main lalu tekan ✅ Ya, jalankan migrasi."
        elif echo "$output" | grep -q 'Test gagal\|Test tidak bisa'; then
            notify "❌ Test gagal, TIDAK ditayangkan: $subject
$output
Website tetap memakai versi sebelumnya."
        else
            notify "❌ Tidak ditayangkan: $subject
$output
Website tetap memakai versi sebelumnya."
        fi
        exit 1
    fi

    target=$(git rev-parse HEAD)
    subject=$(git log -1 --format='%h %s' | cut -c1-80)
    local backup problems
    backup=$(echo "$output" | sed -n 's/^💾 Backup: //p' | tail -1)
    [ -n "$backup" ] || backup=$(ls -1dt /root/deploy-backup-* 2>/dev/null | head -1)
    problems=$(health_problems "$offset")
    [ "$status" -eq 0 ] || problems="• skrip tayang selesai dengan kode $status
$problems"

    if [ -z "$problems" ]; then
        rm -f "$FAILED_FILE"
        notify "✅ Berhasil tayang: $subject
$output"
        log "deployed $target"
        exit 0
    fi

    echo "$target" >"$FAILED_FILE"
    log "health check failed; rolling back to $current"
    if rollback "$backup" && [ "$(git rev-parse HEAD)" = "$current" ]; then
        local after
        after=$(health_problems "$(log_size)")
        notify "↩️ ROLLBACK: $subject
Pengecekan setelah tayang gagal:
$problems
Website dikembalikan ke $(git log -1 --format='%h %s' | cut -c1-70).
${after:-✅ Setelah rollback halaman normal lagi.}
${after:+⚠️ Setelah rollback masih bermasalah; perlu dicek manual.}
Commit ini tidak akan dicoba ulang otomatis sampai ada commit baru di main."
        log "rolled back to $current"
    else
        notify "🚨 ROLLBACK GAGAL: $subject
Pengecekan setelah tayang gagal:
$problems
Rollback otomatis tidak berhasil; perlu dicek manual segera. Backup: ${backup:-tidak ditemukan}"
        log "rollback failed"
    fi
    exit 1
}

main "$@"; exit $?
