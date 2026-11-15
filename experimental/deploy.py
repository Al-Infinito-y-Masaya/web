"""Install a verified experimental package on the existing EC2, preserving legacy routes.

Run as root: python3 deploy.py /absolute/path/to/package EXPECTED_CADDY_SHA256
Rollback: python3 deploy.py --rollback /srv/mangroove/laboratorio/backups/RELEASE
Only the experimental pointer/catalog and the backed-up Caddy file are restored.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import urllib.request

BASE = Path('/srv/mangroove/laboratorio')
PUBLIC = Path('/srv/mangroove/datos/archivos/public/laboratorio')
CONFIG = Path('/etc/caddy/Caddyfile')

def digest(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()

def atomic(file, content, mode=0o644):
    temporary = file.with_name(file.name + '.new')
    temporary.write_bytes(content)
    temporary.chmod(mode)
    os.replace(temporary, file)

def pointer(target):
    temporary = BASE / 'current.new'
    temporary.symlink_to(target)
    os.replace(temporary, BASE / 'current')

def restore(backup):
    record = json.loads((backup / 'previous.json').read_text())
    atomic(CONFIG, (backup / 'Caddyfile').read_bytes())
    if record['current']:
        pointer(record['current'])
    elif (BASE / 'current').is_symlink():
        (BASE / 'current').unlink()
    if record['catalog']:
        atomic(PUBLIC / 'vigente.json', (backup / 'vigente.json').read_bytes())
    elif (PUBLIC / 'vigente.json').exists():
        (PUBLIC / 'vigente.json').unlink()
    subprocess.run(['systemctl', 'reload', 'caddy'], check=True)

def http(path):
    with urllib.request.urlopen('https://api.mangroove.earth' + path, timeout=30) as response:
        return response.read()

if sys.argv[1] == '--rollback':
    backup = Path(sys.argv[2]).resolve()
    if backup.parent != BASE / 'backups':
        raise RuntimeError('Backup is outside the experimental backup directory')
    deployed = json.loads((backup / 'deployment.json').read_text())
    if digest(CONFIG) != deployed['caddyAfter'] or (BASE / 'current').resolve() != BASE / 'releases' / deployed['release']:
        raise RuntimeError('A newer deployment or Caddy edit exists; review before rolling back')
    restore(backup)
    print('Experimental route rolled back; immutable packages retained.')
    sys.exit(0)

package = Path(sys.argv[1]).resolve()
expected = sys.argv[2]
if CONFIG.is_symlink() or digest(CONFIG) != expected:
    raise RuntimeError('Caddy configuration changed: review before deploying')
metadata = json.loads((package / 'release.json').read_text())
release = metadata['release']
if not release or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-' for c in release):
    raise RuntimeError('Invalid release identity')
for relative, sha in metadata['hashes'].items():
    file = (package / relative).resolve()
    if not file.is_relative_to(package) or digest(file) != sha:
        raise RuntimeError('Package hash mismatch: ' + relative)
catalog = json.loads((package / 'data/vigente.json').read_text(encoding='utf-8-sig'))
for site in catalog['sitios']:
    if site['id'] not in ('aserradores', 'padre_ramos') or site['publicacion'] != '2026-11-15-r1':
        raise RuntimeError('Unexpected scientific package; review before publishing')

# Record the public legacy response as a regression invariant.
legacy_path = '/archivos/estero_real_demo/1.1.0/manifiesto.json'
legacy_before = hashlib.sha256(http(legacy_path)).hexdigest()
health_before = json.loads(http('/health/'))
old = CONFIG.read_text()
route = '''
	redir /laboratorio /laboratorio/aserradores 302
	handle_path /laboratorio/* {
		root * /srv/mangroove/laboratorio/current
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
'''
if '/laboratorio/' in old or old.count('\thandle_path /archivos/* {') != 1:
    raise RuntimeError('Experimental route already present or configuration differs')
new = old.replace('\thandle_path /archivos/* {', route + '\n\thandle_path /archivos/* {')
cors = '''
		header @origen_permitido Access-Control-Expose-Headers "ETag, Accept-Ranges, Content-Range"
		@preflight {
			method OPTIONS
			header_regexp Origin ^(https://mangroove\\.earth|http://localhost:3000|http://127\\.0\\.0\\.1:3000)$
		}
		header @preflight Access-Control-Allow-Methods "GET, HEAD, OPTIONS"
		header @preflight Access-Control-Allow-Headers "Range, If-Match, If-None-Match"
		header @preflight Access-Control-Max-Age "600"
		respond @preflight 204
'''
new = new.replace('\t\theader Vary Origin', '\t\theader Vary Origin\n' + cors)
draft = package.parent / 'Caddyfile.experimental'
draft.write_text(new, encoding='utf-8')
subprocess.run(['caddy', 'validate', '--config', str(draft), '--adapter', 'caddyfile'], check=True)

backup = BASE / 'backups' / release
target = BASE / 'releases' / release
if backup.exists() or target.exists():
    raise RuntimeError('Release or backup already exists; never overwrite an existing release')
backup.mkdir(parents=True, mode=0o700)
backup.chmod(0o700)
shutil.copy2(CONFIG, backup / 'Caddyfile')
previous = {'current': str((BASE / 'current').resolve()) if (BASE / 'current').is_symlink() else None,
            'catalog': (PUBLIC / 'vigente.json').exists()}
if (BASE / 'current').exists() and not (BASE / 'current').is_symlink():
    raise RuntimeError('Current app is not a symlink')
if previous['catalog']:
    shutil.copy2(PUBLIC / 'vigente.json', backup / 'vigente.json')
(backup / 'previous.json').write_text(json.dumps(previous))
shutil.copytree(package / 'app', target)
shutil.copy2(package / 'release.json', target / 'release.json')
shutil.copytree(package / 'schemas', target / 'schemas')
for site in catalog['sitios']:
    source = package / 'data' / site['id'] / site['publicacion']
    destination = PUBLIC / site['id'] / site['publicacion']
    if destination.exists():
        raise RuntimeError('Scientific release already exists; never overwrite it')
    destination.parent.mkdir(parents=True, exist_ok=True)
    staging = destination.with_name(destination.name + '.staging')
    shutil.copytree(source, staging)
    os.replace(staging, destination)
# Static artifacts are public, never environment/configuration files.
for root in (target, PUBLIC):
    for file in [root, *root.rglob('*')]:
        file.chmod(0o755 if file.is_dir() else 0o644)
pointer(target)
atomic(PUBLIC / 'vigente.json', (package / 'data/vigente.json').read_bytes())
try:
    atomic(CONFIG, new.encode('utf-8'))
    subprocess.run(['systemctl', 'reload', 'caddy'], check=True)
    assert hashlib.sha256(http(legacy_path)).hexdigest() == legacy_before, 'Legacy manifest changed'
    health_after = json.loads(http('/health/'))
    assert health_after == health_before, 'Health changed'
    assert b'id="root"' in http('/laboratorio/aserradores'), 'Experimental app failed'
    assert json.loads(http('/archivos/laboratorio/aserradores/2026-11-15-r1/manifest.json'))['version'] == '0.2.0'
except Exception:
    restore(backup)
    raise
record = {'release': release, 'frontendCommit':metadata['frontendCommit'], 'engineCommit':metadata['engineCommit'],
          'legacySha256':legacy_before, 'caddyBefore':expected, 'caddyAfter':digest(CONFIG), 'health':health_after,
          'backup':str(backup), 'validatedCells':metadata['validatedCells']}
(backup / 'deployment.json').write_text(json.dumps(record, indent=2))
print(json.dumps(record, indent=2))
