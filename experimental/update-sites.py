"""Atomic release pointers for both sites; immutable data retained on rollback.
Usage: sudo python3 update-sites.py PACKAGE PREVIOUS_MAIN PREVIOUS_LAB CADDY_SHA
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request

WEB = Path('/srv/mangroove/web')
LAB = Path('/srv/mangroove/laboratorio')
DATA = Path('/srv/mangroove/datos/archivos/public/laboratorio')
CONFIG = Path('/etc/caddy/Caddyfile')
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def valid(value):
    if not re.fullmatch(r'[a-zA-Z0-9-]+', value): raise ValueError('Invalid release')
    return value
def switch(base, target):
    temporary = base / 'current.next'
    temporary.symlink_to(target)
    os.replace(temporary, base / 'current')
def run(*args): subprocess.run(args, check=True, capture_output=True)
def get(origin, route):
    with urllib.request.urlopen(origin + urllib.parse.quote(route, safe='/'), timeout=30) as response:
        return response.read()

package = Path(sys.argv[1]).resolve()
previous_web = WEB / 'releases' / valid(sys.argv[2])
previous_lab = LAB / 'releases' / valid(sys.argv[3])
metadata = json.loads((package / 'release.json').read_text())
release = valid(metadata['release'])
new_web, new_lab = WEB / 'releases' / release, LAB / 'releases' / release
backup = WEB / 'backups' / release
if sha(CONFIG) != sys.argv[4] or (WEB / 'current').resolve() != previous_web or (LAB / 'current').resolve() != previous_lab:
    raise RuntimeError('Current state changed')
if new_web.exists() or new_lab.exists() or backup.exists(): raise RuntimeError('Release exists')
for relative, expected in metadata['hashes'].items():
    supplied = (package / relative).resolve()
    if not supplied.is_relative_to(package): raise RuntimeError('Invalid path')
    file = supplied
    if relative.startswith('data/') and not file.exists(): file = DATA / relative[5:]
    if sha(file) != expected: raise RuntimeError('Hash mismatch: ' + relative)
before_config, before_catalog = CONFIG.read_bytes(), (DATA / 'vigente.json').read_bytes()
backup.mkdir(mode=0o700)
(backup / 'Caddyfile').write_bytes(before_config)
(backup / 'vigente.json').write_bytes(before_catalog)
for previous, target in [(previous_web, new_web), (previous_lab, new_lab)]:
    shutil.copytree(previous, target)
shutil.copytree(package / 'main', new_web, dirs_exist_ok=True)
for target in [new_web / 'laboratorio', new_lab]:
    shutil.copytree(package / 'app', target, dirs_exist_ok=True)
    shutil.copytree(package / 'schemas', target / 'schemas', dirs_exist_ok=True)
    shutil.copy2(package / 'release.json', target / 'release.json')
shutil.copy2(package / 'release.json', new_web / 'release.json')
for relative in metadata['hashes']:
    if relative.startswith('data/') and relative != 'data/vigente.json':
        source, destination = package / relative, DATA / relative[5:]
        if not source.exists(): continue
        if destination.exists():
            if sha(destination) != metadata['hashes'][relative]: raise RuntimeError('Immutable data changed')
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
for root in [new_web, new_lab, DATA]:
    for file in [root, *root.rglob('*')]: file.chmod(0o755 if file.is_dir() else 0o644)
candidate = backup / 'Caddyfile.new'
candidate.write_text(before_config.decode().replace('/laboratorio/aserradores 302', '/laboratorio/chismuyo 302'))
run('caddy', 'validate', '--config', str(candidate), '--adapter', 'caddyfile')
try:
    switch(WEB, new_web)
    switch(LAB, new_lab)
    temporary = DATA / 'vigente.next.json'
    shutil.copy2(package / 'data/vigente.json', temporary)
    os.replace(temporary, DATA / 'vigente.json')
    shutil.copy2(candidate, CONFIG)
    CONFIG.chmod(0o644)
    run('systemctl', 'reload', 'caddy')
    count = 0
    for relative, expected in metadata['hashes'].items():
        if relative.startswith('main/'):
            origin, route = 'https://mangroove.earth', '/' + relative[5:]
        elif relative.startswith('data/'):
            origin, route = 'https://mangroove.earth', '/archivos/laboratorio/' + relative[5:]
        else:
            origin, route = 'https://mangroove.earth', '/laboratorio/' + relative.removeprefix('app/')
        if hashlib.sha256(get(origin, route)).hexdigest() != expected: raise RuntimeError('HTTP mismatch: ' + relative)
        count += 1
    assert b'id="root"' in get('https://api.mangroove.earth', '/laboratorio/chismuyo')
    health = json.loads(get('https://api.mangroove.earth', '/health/'))
    assert health['status'] == 'success'
except Exception:
    switch(WEB, previous_web)
    switch(LAB, previous_lab)
    (DATA / 'vigente.json').write_bytes(before_catalog)
    CONFIG.write_bytes(before_config)
    run('systemctl', 'reload', 'caddy')
    raise
record = {'release': release, 'frontendCommit': metadata['frontendCommit'], 'previousWeb': str(previous_web), 'previousLab': str(previous_lab), 'filesVerified': count, 'caddySha256': sha(CONFIG), 'catalogSha256': sha(DATA / 'vigente.json'), 'health': health}
(backup / 'deployment.json').write_text(json.dumps(record, indent=2))
print(json.dumps(record, indent=2))
