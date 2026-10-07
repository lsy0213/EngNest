"""局域网 HTTPS 用的自签名证书：手机浏览器只有在 HTTPS 下才允许录音（跟读评测、AI 语伴说话）。

证书放在数据目录的 lan/ 里，包含本机的局域网 IP，有效期 2 年；IP 变了或快过期时自动重新生成。
因为是自己签的，手机第一次打开会提示「不安全」，点「高级 → 继续访问」一次就行。
"""

import datetime
import ipaddress
import json
import logging
import ssl

from .paths import sub_dir

log = logging.getLogger(__name__)


def _files():
    d = sub_dir("lan")
    return d / "cert.pem", d / "key.pem", d / "cert.json"


def ensure(ips: list) -> tuple:
    """返回 (证书路径, 私钥路径)，需要时重新生成"""
    cert, key, meta = _files()
    want = sorted({ip for ip in ips if ip} | {"127.0.0.1"})
    try:
        info = json.loads(meta.read_text(encoding="utf-8"))
        fresh = (cert.exists() and key.exists() and set(want) <= set(info.get("ips", []))
                 and datetime.date.fromisoformat(info["expires"]) > datetime.date.today() + datetime.timedelta(days=30))
    except (OSError, ValueError, KeyError):
        fresh = False
    if not fresh:
        _generate(cert, key, want)
        meta.write_text(json.dumps({"ips": want, "expires": (datetime.date.today() + datetime.timedelta(days=730)).isoformat()}), encoding="utf-8")
        log.info("已生成局域网 HTTPS 证书：%s", want)
    return cert, key


def _generate(cert_path, key_path, ips):
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.x509.oid import NameOID

    key = ec.generate_private_key(ec.SECP256R1())
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "EngNest LAN"), x509.NameAttribute(NameOID.ORGANIZATION_NAME, "EngNest")])
    now = datetime.datetime.now(datetime.timezone.utc)
    san = [x509.DNSName("localhost")] + [x509.IPAddress(ipaddress.ip_address(ip)) for ip in ips]
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
            .serial_number(x509.random_serial_number()).not_valid_before(now - datetime.timedelta(days=1))
            .not_valid_after(now + datetime.timedelta(days=730))
            .add_extension(x509.SubjectAlternativeName(san), critical=False)
            .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
            .sign(key, hashes.SHA256()))
    key_path.write_bytes(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    cert_path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))


def context(ips: list) -> ssl.SSLContext:
    cert, key = ensure(ips)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.minimum_version = ssl.TLSVersion.TLSv1_2
    ctx.load_cert_chain(str(cert), str(key))
    return ctx
