#!/usr/bin/env bash
#
# Rewrites /etc/nginx/nginx.conf with a clean, correct version that:
#   - keeps the existing mocki.ru HTTP→HTTPS + HTTPS→frontend(:3001) proxy
#   - adds dev.mocki.ru HTTP→HTTPS + HTTPS→MinIO(:9010) proxy
#   - keeps the default_server 444 catch-all
#
# Why a full rewrite instead of in-place edits: the current nginx.conf has
# accumulated broken state (server blocks accidentally placed inside the
# events{} block from earlier surgical sed runs). Wholesale replacement
# is safer than another patch.
#
# Safety:
#   - Backs up the old file with a timestamp
#   - Runs `nginx -t` before reloading; auto-reverts from backup if test fails
#   - Idempotent: re-running re-applies the same content (no drift)

set -euo pipefail

NGINX_CONF="/etc/nginx/nginx.conf"
BACKUP="${NGINX_CONF}.bak.$(date +%Y%m%d-%H%M%S)"
TMP_CONF="$(mktemp /tmp/nginx.conf.new.XXXXXX)"

require_root() {
    if [[ $EUID -ne 0 ]]; then
        echo "This script must be run as root. Try: sudo $0" >&2
        exit 1
    fi
}

cleanup() {
    rm -f "$TMP_CONF"
}
trap cleanup EXIT

write_clean_conf() {
    cat > "$TMP_CONF" <<'EOF'
user  www-data;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;

include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;
    sendfile        on;
    keepalive_timeout  65;

    # --- mocki.ru: HTTP → HTTPS ---
    server {
        listen 80;
        listen [::]:80;
        server_name mocki.ru www.mocki.ru;
        return 301 https://$host$request_uri;
    }

    # --- mocki.ru: HTTPS → frontend container (127.0.0.1:3001) ---
    server {
        listen 443 ssl;
        listen [::]:443 ssl;
        server_name mocki.ru www.mocki.ru;

        ssl_certificate /etc/letsencrypt/live/mocki.ru/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/mocki.ru/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        client_max_body_size 500M;

        location / {
            proxy_pass http://127.0.0.1:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }

    # --- dev.mocki.ru: HTTP → HTTPS ---
    server {
        listen 80;
        listen [::]:80;
        server_name dev.mocki.ru;
        return 301 https://$host$request_uri;
    }

    # --- dev.mocki.ru: HTTPS → local MinIO (127.0.0.1:9010) ---
    server {
        listen 443 ssl;
        listen [::]:443 ssl;
        server_name dev.mocki.ru;

        ssl_certificate /etc/letsencrypt/live/dev.mocki.ru/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/dev.mocki.ru/privkey.pem;
        include /etc/letsencrypt/options-ssl-nginx.conf;
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

        client_max_body_size 500M;

        proxy_request_buffering off;
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        ignore_invalid_headers off;

        location / {
            proxy_pass http://127.0.0.1:9010;
        }
    }

    # --- catch-all: drop requests with unknown Host header ---
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;
        return 444;
    }
}
EOF
}

main() {
    require_root

    echo "==> Step 1/5: Backing up current nginx.conf → $BACKUP"
    cp "$NGINX_CONF" "$BACKUP"

    echo "==> Step 2/5: Writing clean nginx.conf to $TMP_CONF"
    write_clean_conf

    echo "==> Step 3/5: Installing new nginx.conf"
    cp "$TMP_CONF" "$NGINX_CONF"

    echo "==> Step 4/5: Testing nginx config"
    if ! nginx -t; then
        echo "[error] nginx -t failed. Reverting from $BACKUP" >&2
        cp "$BACKUP" "$NGINX_CONF"
        nginx -t || echo "[error] backup also fails -t — investigate $BACKUP manually" >&2
        exit 1
    fi

    echo "==> Step 5/5: Reloading nginx"
    systemctl reload nginx

    echo
    echo "==> Verification"
    echo "--- cert served for SNI=dev.mocki.ru:"
    echo | openssl s_client -connect 127.0.0.1:443 -servername dev.mocki.ru 2>/dev/null \
        | openssl x509 -noout -subject 2>/dev/null || true
    echo
    echo "--- HTTPS health check (expect 200):"
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 https://dev.mocki.ru/minio/health/live || true)
    echo "    https://dev.mocki.ru/minio/health/live → $code"

    echo
    echo "--- mocki.ru still serving frontend (expect 200):"
    code2=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 https://mocki.ru/ || true)
    echo "    https://mocki.ru/ → $code2"

    if [[ "$code" == "200" ]] && [[ "$code2" == "200" ]]; then
        echo
        echo "✓ Done. dev.mocki.ru proxies to MinIO; mocki.ru still serves frontend."
    else
        echo
        echo "✗ Verification failed. Inspect:"
        echo "    sudo tail -30 /var/log/nginx/error.log"
        echo "    sudo tail -20 /var/log/nginx/access.log"
        echo
        echo "Old config is at: $BACKUP"
        exit 1
    fi
}

main "$@"
