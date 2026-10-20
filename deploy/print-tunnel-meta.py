import json
from pathlib import Path

p = Path.home() / ".cloudflared" / "9b4d9b73-7474-4ebc-8e4e-40667845678b.json"
c = json.loads(p.read_text())
print("keys", sorted(c.keys()))
print("account", c.get("AccountTag") or c.get("accountTag"))
print("tunnel", c.get("TunnelID") or c.get("TunnelId") or c.get("tunnelID"))
