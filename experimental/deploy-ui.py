"""Update only the experimental UI, retaining immutable scientific data and Caddy.

sudo python3 deploy-ui.py PACKAGE EXPECTED_PREVIOUS_RELEASE
sudo python3 deploy-ui.py --rollback NEW_RELEASE
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import urllib.parse
import urllib.request

BASE=Path('/srv/mangroove/laboratorio')
PUBLIC=Path('/srv/mangroove/datos/archivos/public/laboratorio')
CONFIG=Path('/etc/caddy/Caddyfile')
def sha(file): return hashlib.sha256(file.read_bytes()).hexdigest()
def valid(value):
    if not re.fullmatch(r'[A-Za-z0-9-]+',value): raise ValueError('Invalid release')
    return value
def switch(target):
    temporary=BASE/'current.new'
    temporary.symlink_to(target)
    os.replace(temporary,BASE/'current')
def get(path):
    with urllib.request.urlopen('https://api.mangroove.earth'+urllib.parse.quote(path,safe='/'),timeout=30) as response:
        assert response.status==200
        return response.read()

if sys.argv[1]=='--rollback':
    release=valid(sys.argv[2])
    record=json.loads((BASE/'backups'/release/'ui-deployment.json').read_text())
    if (BASE/'current').resolve()!=BASE/'releases'/release or sha(CONFIG)!=record['caddySha256']:
        raise RuntimeError('Another release/configuration is active; review before rollback')
    switch(Path(record['previous']))
    print('Previous experimental UI restored; data and Caddy unchanged.')
    sys.exit(0)

package=Path(sys.argv[1]).resolve()
previous=BASE/'releases'/valid(sys.argv[2])
metadata=json.loads((package/'release.json').read_text())
release=valid(metadata['release'])
target=BASE/'releases'/release
backup=BASE/'backups'/release
if (BASE/'current').resolve()!=previous or target.exists() or backup.exists():
    raise RuntimeError('Unexpected current release or new release already exists')
caddy_hash=sha(CONFIG)
catalog_hash=sha(PUBLIC/'vigente.json')
for relative,expected in metadata['hashes'].items():
    if relative.startswith('data/'):
        base=PUBLIC
        file=(PUBLIC/relative.removeprefix('data/')).resolve()
    elif relative.startswith(('app/','schemas/')):
        base=package
        file=(package/relative).resolve()
    else: raise RuntimeError('Unexpected artifact path')
    if not file.is_relative_to(base) or sha(file)!=expected:
        raise RuntimeError('Hash mismatch: '+relative)
legacy='/archivos/estero_real_demo/1.1.0/manifiesto.json'
legacy_hash=hashlib.sha256(get(legacy)).hexdigest()
assert legacy_hash=='3a68aca6f149007e6708657cd06d6d1fe2b2215743657219cf891d4364ee089b'
backup.mkdir(mode=0o700)
shutil.copytree(package/'app',target)
shutil.copytree(package/'schemas',target/'schemas')
shutil.copy2(package/'release.json',target/'release.json')
for file in [target,*target.rglob('*')]: file.chmod(0o755 if file.is_dir() else 0o644)
switch(target)
try:
    count=0
    for relative,expected in metadata['hashes'].items():
        if relative.startswith('data/'): continue
        route='/laboratorio/'+relative.removeprefix('app/')
        assert hashlib.sha256(get(route)).hexdigest()==expected,relative
        count+=1
    assert hashlib.sha256(get(legacy)).hexdigest()==legacy_hash
    assert sha(CONFIG)==caddy_hash and sha(PUBLIC/'vigente.json')==catalog_hash
    health=json.loads(get('/health/'))
    assert health['status']=='success'
    for site in ('aserradores','padre_ramos'):
        assert b'id="root"' in get('/laboratorio/'+site)
except Exception:
    switch(previous)
    raise
record={'release':release,'previous':str(previous),'frontendCommit':metadata['frontendCommit'],'httpsUiFilesVerified':count,'scientificFilesUnchanged':True,'legacySha256':legacy_hash,'caddySha256':caddy_hash,'catalogSha256':catalog_hash,'health':health}
(backup/'ui-deployment.json').write_text(json.dumps(record,indent=2))
print(json.dumps(record,indent=2))
