#!/usr/bin/env bash
# 申请 / 续期 Let's Encrypt 的正规证书，装到 Nginx 用的位置（/etc/nginx/ssl/engnest.{crt,key}），换了才重载 Nginx。
# 浏览器认可这个证书以后才会缓存网页文件，第二次打开只问「有没有变」，不用再下载十几 MB。
#   sudo bash cert.sh <IP 或域名> [<更多域名> ...]          第一次申请；之后由 engnest-cert.timer 每天跑两次，快到期才真的续
#   LEGO_SERVER=letsencrypt-staging sudo bash cert.sh ...   先用测试环境试（证书浏览器不认，只看流程通不通）
# IP 证书只有 6 天多有效期（Let's Encrypt 规定，必须用 shortlived），剩一半时自动续。
# 需要：80 端口对外开着（腾讯云防火墙放通 TCP 80），Nginx 的 80 端口把 /.well-known/acme-challenge/ 指到 /var/www/acme。
set -euo pipefail

CONF=/etc/engnest-cert.env           # 记住第一次的参数，定时器续期时不用再填
if [ $# -gt 0 ]; then
  echo "CERT_NAMES=\"$*\"" > $CONF
  echo "CERT_EMAIL=\"${CERT_EMAIL:-}\"" >> $CONF
fi
[ -f $CONF ] && . $CONF
NAMES="${CERT_NAMES:?用法：cert.sh <IP 或域名> [更多域名]}"
EMAIL="${CERT_EMAIL:-}"
SERVER="${LEGO_SERVER:-letsencrypt}"
STORE=/etc/lego
[ "$SERVER" = letsencrypt ] || STORE=/etc/lego-$SERVER   # 测试环境的账号和证书分开放
WEBROOT=/var/www/acme

args=(run --accept-tos --server "$SERVER" --path "$STORE" --http --http.webroot "$WEBROOT")
[ -n "$EMAIL" ] && args+=(--email "$EMAIL")
first=""
for n in $NAMES; do
  args+=(--domains "$n")
  [ -n "$first" ] || first=$n
  # 只要有一个是 IP 就必须用短期证书
  [[ "$n" =~ ^[0-9.]+$ || "$n" == *:* ]] && SHORT=1
done
[ -n "${SHORT:-}" ] && args+=(--profile shortlived)
[ -t 0 ] && args+=(--no-random-sleep)   # 手动跑的时候不用随机等；定时器跑时随机等一会儿，别和全世界同一时刻挤

mkdir -p "$WEBROOT"
lego "${args[@]}"

[ "$SERVER" = letsencrypt ] || { echo "测试环境证书在 $STORE/certificates/，没有装到 Nginx。"; exit 0; }
src=$STORE/certificates/$first
dst=/etc/nginx/ssl/engnest
if ! cmp -s "$src.crt" "$dst.crt"; then
  install -m 644 "$src.crt" "$dst.crt"
  install -m 600 "$src.key" "$dst.key"
  nginx -t -q && systemctl reload nginx
  echo "新证书已装好：$(openssl x509 -in $dst.crt -noout -enddate)"
else
  echo "证书没换，不用重载。"
fi
