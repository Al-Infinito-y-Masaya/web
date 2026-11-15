"""Verify the main domain over HTTPS with normal certificate validation."""
import hashlib
import json
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

BASE = 'https://mangroove.earth'
def get(path, headers=None):
    return urllib.request.urlopen(urllib.request.Request(BASE + urllib.parse.quote(path, safe='/'), headers=headers or {}), timeout=30)

metadata = json.loads(Path('/srv/mangroove/web/current/release.json').read_text())
for relative, expected in metadata['hashes'].items():
    with get('/' + relative) as response:
        assert response.status == 200
        assert hashlib.sha256(response.read()).hexdigest() == expected, relative
for route in ['/', '/historia', '/metodo', '/laboratorio/aserradores', '/laboratorio/padre_ramos']:
    with get(route) as response:
        assert 'no-store' in response.headers['Cache-Control']
        assert b'id="root"' in response.read()
with get('/explorar') as response:
    assert response.url == BASE + '/laboratorio/aserradores'
with get('/api/regiones/') as response:
    assert isinstance(json.load(response), list)
for route in ['/api/auth/user/', '/api/operacion/', '/assets/nonexistent-file.js']:
    try:
        get(route)
        raise AssertionError('Unexpected public endpoint: ' + route)
    except urllib.error.HTTPError as error:
        assert error.code == 404
with get('/archivos/laboratorio/vigente.json') as response:
    catalog = json.load(response)
    assert len(catalog['sitios']) == 2
range_checks = []
for site in catalog['sitios']:
    manifest_url = urllib.parse.urljoin(BASE + '/archivos/laboratorio/vigente.json', site['manifest'])
    with urllib.request.urlopen(manifest_url, timeout=30) as response:
        manifest = json.load(response)
    # Every scientific file still matches the immutable package published on the API.
metadata_lab = json.loads(Path('/srv/mangroove/laboratorio/current/release.json').read_text())
data_count = 0
for relative, expected in metadata_lab['hashes'].items():
    if not relative.startswith('data/'):
        continue
    route = '/archivos/laboratorio/' + relative.removeprefix('data/')
    with get(route) as response:
        assert hashlib.sha256(response.read()).hexdigest() == expected, route
    data_count += 1
    if route.endswith('.pmtiles') and len(range_checks) < 2:
        with get(route, {'Range': 'bytes=0-126'}) as response:
            assert response.status == 206
            assert len(response.read()) == 127
            assert response.headers['Content-Range'].startswith('bytes 0-126/')
            range_checks.append(route)
with get('/archivos/estero_real_demo/1.1.0/manifiesto.json') as response:
    assert hashlib.sha256(response.read()).hexdigest() == '3a68aca6f149007e6708657cd06d6d1fe2b2215743657219cf891d4364ee089b'
with urllib.request.urlopen('https://api.mangroove.earth/health/', timeout=30) as response:
    health = json.load(response)
    assert health['status'] == 'success'
print(json.dumps({'domain': BASE, 'tlsValidation': True, 'uiFilesVerified': len(metadata['hashes']), 'scientificFilesVerified': data_count, 'rangeChecks': range_checks, 'frontendCommit': metadata['frontendCommit'], 'health': health}, indent=2))
