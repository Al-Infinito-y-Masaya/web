"""Read-only HTTPS acceptance checks, run on EC2 after deploying the package."""
import hashlib
import json
from pathlib import Path
import sys
import urllib.request
import urllib.error

root = Path(sys.argv[1]).resolve()
base = 'https://api.mangroove.earth'
release = json.loads((root / 'release.json').read_text())
checks = []

def request(path, headers=None, method='GET'):
    return urllib.request.urlopen(urllib.request.Request(base+path, headers=headers or {}, method=method), timeout=30)

for relative, expected in release['hashes'].items():
    if relative.startswith('data/'):
        url = '/archivos/laboratorio/' + relative.removeprefix('data/')
    elif relative.startswith('app/'):
        url = '/laboratorio/' + relative.removeprefix('app/')
    else:
        url = '/laboratorio/' + relative
    with request(url) as response:
        assert response.status == 200
        assert hashlib.sha256(response.read()).hexdigest() == expected, relative
        if relative.startswith('data/') and relative != 'data/vigente.json':
            assert 'immutable' in response.headers['Cache-Control']
    checks.append(relative)

tile = '/archivos/laboratorio/aserradores/2026-11-15-r1/tiles/conectividad.pmtiles'
headers={'Origin':'https://mangroove.earth','Range':'bytes=0-126'}
with request(tile,headers) as response:
    assert response.status==206
    assert response.headers['Access-Control-Allow-Origin']=='https://mangroove.earth'
    assert 'Content-Range' in response.headers['Access-Control-Expose-Headers']
    assert response.headers['Content-Range'].startswith('bytes 0-126/')
    assert response.read()==(root/'data/aserradores/2026-11-15-r1/tiles/conectividad.pmtiles').read_bytes()[:127]
    etag=response.headers['ETag']
with request(tile,{**headers,'If-Match':etag}) as response:
    assert response.status==206
with request(tile,{'Origin':'https://mangroove.earth','Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'range,if-match'},'OPTIONS') as response:
    assert response.status==204
    assert response.headers['Access-Control-Allow-Origin']=='https://mangroove.earth'
with request(tile,{'Origin':'https://example.org','Range':'bytes=0-126'}) as response:
    assert response.headers.get('Access-Control-Allow-Origin') is None
for path in ['/laboratorio/aserradores','/laboratorio/padre_ramos']:
    with request(path) as response:
        assert response.headers['Cache-Control']=='no-store'
        assert 'text/html' in response.headers['Content-Type']
        assert b'id="root"' in response.read()
with request('/archivos/laboratorio/vigente.json') as response:
    assert 'max-age=300' in response.headers['Cache-Control']
with request('/archivos/estero_real_demo/1.1.0/manifiesto.json') as response:
    legacy_sha=hashlib.sha256(response.read()).hexdigest()
assert legacy_sha=='3a68aca6f149007e6708657cd06d6d1fe2b2215743657219cf891d4364ee089b'
for path in ['/laboratorio/assets/missing.js','/archivos/laboratorio/missing.json']:
    try:
        request(path)
    except urllib.error.HTTPError as error:
        assert error.code==404
        assert error.headers['Cache-Control']=='no-store'
    else:
        raise AssertionError('Missing asset returned success')
with request('/health/') as response:
    health=json.load(response)
    assert health['status']=='success'
print(json.dumps({'release':release['release'],'httpsFilesVerified':len(checks),'range':206,'preflight':204,'etag':True,'allowedOrigin':True,'otherOriginsNotGranted':True,'immutableData':True,'htmlNoStore':True,'missingAssets':404,'legacySha256':legacy_sha,'health':health},indent=2))
