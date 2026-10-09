#!/usr/bin/env bash
# 在 Ubuntu 服务器上装好 EngNest 服务器模式（用 root 运行；可以重复运行，已经做过的步骤会跳过）。
# 先把代码放到 /opt/engnest/app（见 tools/deploy/部署说明.md），再：
#   sudo bash /opt/engnest/app/tools/deploy/setup.sh <公网 IP> [端口，默认 8766] [域名，可以不填]
set -euo pipefail

PUBLIC_IP="${1:?用法：setup.sh <公网 IP> [端口] [域名]}"
PORT="${2:-8766}"
DOMAIN="${3:-}"
ROOT=/opt/engnest
APP=$ROOT/app
PIP_MIRROR=https://mirrors.cloud.tencent.com/pypi/simple   # 腾讯云服务器上下载 Python 包最快

echo "== 1. 交换空间（内存偶尔冲高时兜底）"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "   加了 2 GB 交换空间"
else
  echo "   已经有交换空间，跳过"
fi

echo "== 2. 系统软件"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q python3-venv python3-pip sqlite3 nginx openssl >/dev/null

echo "== 3. 专门运行 EngNest 的系统用户（不用 root 运行，更安全）"
id engnest >/dev/null 2>&1 || useradd --system --home-dir $ROOT --shell /usr/sbin/nologin engnest
mkdir -p $ROOT/data
chown -R engnest:engnest $ROOT/data
chmod 750 $ROOT/data

echo "== 4. Python 环境和依赖"
[ -x $ROOT/venv/bin/python ] || python3 -m venv $ROOT/venv
$ROOT/venv/bin/pip install -q --upgrade pip -i $PIP_MIRROR
$ROOT/venv/bin/pip install -q -r $APP/requirements-server.txt -i $PIP_MIRROR

echo "== 5. Nginx（HTTPS、HTTP/2、压缩、缓存；/api/ 转给 EngNest）"
mkdir -p /etc/nginx/ssl
if [ ! -f /etc/nginx/ssl/engnest.crt ]; then
  # 只用 IP 访问时的自签名证书（10 年）；有了备案的域名以后换成 Let's Encrypt
  SAN="IP:$PUBLIC_IP,IP:127.0.0.1${DOMAIN:+,DNS:$DOMAIN}"
  openssl req -x509 -newkey rsa:2048 -nodes -days 3650 -subj "/CN=EngNest" -addext "subjectAltName=$SAN"     -keyout /etc/nginx/ssl/engnest.key -out /etc/nginx/ssl/engnest.crt 2>/dev/null
  chmod 600 /etc/nginx/ssl/engnest.key
fi
python3 -I $APP/tools/deploy/stamp.py $APP/web   # 脚本、样式加版本号，浏览器长期缓存
usermod -aG engnest www-data           # Nginx 要读数据目录里的资料包
sed "s/__PORT__/$PORT/" $APP/tools/deploy/nginx-engnest.conf > /etc/nginx/sites-available/engnest
ln -sf /etc/nginx/sites-available/engnest /etc/nginx/sites-enabled/engnest
rm -f /etc/nginx/sites-enabled/default
nginx -t -q
systemctl enable nginx >/dev/null

echo "== 6. 配置和开机自启"
cat > $ROOT/engnest.env <<EOF
ENGNEST_PORT=$PORT
ENGNEST_PUBLIC_IP=$PUBLIC_IP
ENGNEST_DOMAIN=$DOMAIN
EOF
cp $APP/tools/deploy/engnest.service /etc/systemd/system/engnest.service
cp $APP/tools/deploy/engnest-cert.service $APP/tools/deploy/engnest-cert.timer /etc/systemd/system/
mkdir -p /var/www/acme
systemctl daemon-reload
systemctl enable engnest >/dev/null
systemctl restart engnest
systemctl restart nginx
sleep 3
systemctl --no-pager --lines=0 status engnest | head -5
systemctl is-active nginx

echo
echo "完成。还要做的："
echo "  1) 在腾讯云控制台 → 轻量服务器 → 防火墙，放通 TCP $PORT 和 TCP 80 端口"
echo "  2) 换正规证书（不换的话浏览器每次都要重新下载全部文件），见 部署说明.md 2.5："
echo "     CERT_EMAIL=<邮箱> bash $APP/tools/deploy/cert.sh $PUBLIC_IP && systemctl enable --now engnest-cert.timer"
echo "  3) 浏览器打开 https://$PUBLIC_IP:$PORT"
echo "  4) 第一次启动生成的管理员邀请码：journalctl -u engnest | grep 管理员邀请码"
