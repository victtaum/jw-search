"""Check tracked text, never print matching secret material."""
import re
import subprocess
from pathlib import Path

patterns = [re.compile(rb'AIza[0-9A-Za-z_-]{35}'), re.compile(rb'gh[pousr]_[A-Za-z0-9]{30,}'),
            re.compile(rb'sk-(?:or-v1-)?[A-Za-z0-9_-]{40,}')]
failures = []
for name in subprocess.check_output(['git','ls-files','-z']).decode('utf-8').split('\0'):
    if not name:
        continue
    path = Path(name)
    if path.name == '.env' or path.name.startswith('.env.') and path.name != '.env.example':
        failures.append(name)
    if path.is_file() and path.stat().st_size < 2_000_000:
        data = path.read_bytes()
        if b'\0' not in data and any(pattern.search(data) for pattern in patterns):
            failures.append(name)
if failures:
    raise SystemExit('Potential secrets in: ' + ', '.join(sorted(set(failures))))
print('Tracked-file secret checks passed.')
