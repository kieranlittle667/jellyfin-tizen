"""Package only runtime assets; never include certificates or local settings."""
from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
version = ET.parse(root / 'config.xml').getroot().get('version')
assert version and all(part.isdigit() for part in version.split('.'))
out = root / 'artifacts' / f'JellyfinAccessible-{version}-unsigned.wgt'
out.parent.mkdir(exist_ok=True)
files = [root / f for f in ('config.xml', 'tizen.js', 'icon.png', 'LICENSE', 'LICENSE.jellyfin-web')]
files += sorted(p for p in (root / 'www').rglob('*') if p.is_file())
assert (root / 'www/index.html').is_file(), 'Build the web assets first'
assert all(p.is_file() for p in files)
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in files:
        info = zipfile.ZipInfo(path.relative_to(root).as_posix(), (2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, path.read_bytes())
print(out)
