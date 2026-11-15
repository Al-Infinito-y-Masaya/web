"""Publish the original site and the experimental explorer from EC2.

sudo python3 deploy-main.py PACKAGE EXPECTED_CADDY_SHA256
DNS must point mangroove.earth at this EC2 before public TLS can finish.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib.request

BASE = Path('/srv/mangroove/web')
CONFIG = Path('/etc/caddy/Caddyfile')
RELEASE = '2026-11-15-r1'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True)

def get(base, path):
    return urllib.request.urlopen(base + urllib.parse.quote(path, safe='/'), timeout=20)

if sys.argv[1] == '--rollback':
    backup = BASE / 'backups' / RELEASE
    record = json.loads((backup / 'deployment.json').read_text())
    if sha(CONFIG) != record['caddyAfter'] or (BASE / 'current').resolve() != BASE / 'releases' / RELEASE:
        raise RuntimeError('A newer configuration or release exists; review before rollback')
    run('caddy', 'validate', '--config', str(backup / 'Caddyfile'), '--adapter', 'caddyfile')
    installed = CONFIG.read_bytes()
    try:
        CONFIG.write_bytes((backup / 'Caddyfile').read_bytes())
        run('systemctl', 'reload', 'caddy')
    except Exception:
        CONFIG.write_bytes(installed)
        run('systemctl', 'reload', 'caddy')
        raise
    print('Previous Caddy configuration restored. Release files and scientific data retained. DNS must be restored separately if needed.')
    sys.exit(0)

package = Path(sys.argv[1]).resolve()
expected = sys.argv[2]
metadata = json.loads((package / 'release.json').read_text())
target = BASE / 'releases' / RELEASE
backup = BASE / 'backups' / RELEASE
if sha(CONFIG) != expected or target.exists() or backup.exists() or (BASE / 'current').exists():
    raise RuntimeError('Unexpected Caddy version or existing main-site deployment')
for relative, digest in metadata['hashes'].items():
    file = (package / 'app' / relative).resolve()
    if not file.is_relative_to(package / 'app') or sha(file) != digest:
        raise RuntimeError('Invalid artifact: ' + relative)

before = CONFIG.read_bytes()
if b'\nmangroove.earth {' in before:
    raise RuntimeError('Main domain already configured')
backup.mkdir(parents=True, mode=0o700)
(backup / 'Caddyfile').write_bytes(before)
shutil.copytree(package / 'app', target)
shutil.copy2(package / 'release.json', target / 'release.json')
for file in [BASE, BASE / 'releases', target, *target.rglob('*')]:
    file.chmod(0o755 if file.is_dir() else 0o644)

body = '''
    encode zstd gzip
    header -Server
    redir /laboratorio /laboratorio/aserradores 302
    redir /explorar /laboratorio/aserradores 302
    handle_path /laboratorio/* {
        root * /srv/mangroove/web/current/laboratorio
        header X-Robots-Tag "noindex, nofollow"
        handle /assets/* {
            header Cache-Control "public, max-age=31536000, immutable"
            file_server
        }
        handle {
            header Cache-Control "no-store"
            try_files {path} /index.html
            file_server
        }
    }
    handle_path /archivos/* {
        root * /srv/mangroove/datos/archivos/public
        @catalog path */vigente.json
        header @catalog Cache-Control "public, max-age=300"
        @immutable not path */vigente.json
        header @immutable Cache-Control "public, max-age=31536000, immutable"
        file_server
    }
    handle_path /api/* {
        @public {
            path /regiones/*
            method GET HEAD
        }
        handle @public {
            reverse_proxy 127.0.0.1:8080 {
                header_up Host api.mangroove.earth
            }
        }
        handle {
            respond 404
        }
    }
    handle {
        root * /srv/mangroove/web/current
        handle /assets/* {
            header Cache-Control "public, max-age=31536000, immutable"
            file_server
        }
        handle {
            header Cache-Control "no-store"
            try_files {path} /index.html
            file_server
        }
    }
    handle_errors 404 {
        header Cache-Control "no-store"
        respond 404
    }
'''
candidate = backup / 'Caddyfile.new'
candidate.write_text(before.decode() + '\nmangroove.earth {\n' + body + '}\n')
run('caddy', 'validate', '--config', str(candidate), '--adapter', 'caddyfile')
(BASE / 'current').symlink_to(target)
qa_config = backup / 'Caddyfile.qa'
qa_config.write_text('{\nadmin off\nauto_https off\n}\nhttp://127.0.0.1:8091 {\n' + body + '}\n')
qa_log = (backup / 'qa.log').open('w')
qa = subprocess.Popen(['caddy', 'run', '--config', str(qa_config), '--adapter', 'caddyfile'], stdout=qa_log, stderr=qa_log)
try:
    for attempt in range(30):
        if qa.poll() is not None:
            raise RuntimeError('QA server exited; see qa.log')
        try:
            with get('http://127.0.0.1:8091', '/') as response:
                assert response.status == 200
            break
        except OSError:
            time.sleep(0.2)
    count = 0
    for relative, digest in metadata['hashes'].items():
        with get('http://127.0.0.1:8091', '/' + relative) as response:
            assert hashlib.sha256(response.read()).hexdigest() == digest, relative
        count += 1
    for path in ['/historia', '/metodo', '/laboratorio/aserradores', '/laboratorio/padre_ramos']:
        with get('http://127.0.0.1:8091', path) as response:
            assert b'id="root"' in response.read(), path
    with get('http://127.0.0.1:8091', '/api/regiones/') as response:
        assert isinstance(json.load(response), list)
    with get('http://127.0.0.1:8091', '/archivos/laboratorio/vigente.json') as response:
        assert len(json.load(response)['sitios']) == 2
finally:
    qa.terminate()
    qa.wait(timeout=10)
    qa_log.close()

if sha(CONFIG) != expected:
    raise RuntimeError('Caddy changed during verification')
try:
    temporary = CONFIG.with_suffix('.main-new')
    shutil.copy2(candidate, temporary)
    temporary.chmod(0o644)
    os.replace(temporary, CONFIG)
    run('systemctl', 'reload', 'caddy')
    with get('https://api.mangroove.earth', '/health/') as response:
        health = json.load(response)
        assert health['status'] == 'success'
except Exception:
    CONFIG.write_bytes(before)
    run('systemctl', 'reload', 'caddy')
    raise
record = {
    'release': RELEASE,
    'frontendCommit': metadata['frontendCommit'],
    'localHttpFilesVerified': count,
    'caddyBefore': expected,
    'caddyAfter': sha(CONFIG),
    'health': health,
    'publicTlsStatus': 'pending DNS and external HTTPS verification',
    'domain': 'mangroove.earth',
    'requiredARecord': '16.148.46.37'
}
(backup / 'deployment.json').write_text(json.dumps(record, indent=2))
print(json.dumps(record, indent=2))
