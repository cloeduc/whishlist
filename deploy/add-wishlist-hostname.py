#!/usr/bin/env python3
"""Add wishlist.mesdamesduc.fr to the remotely-managed Cloudflare tunnel config.

Requires CF_API_TOKEN with Account.Cloudflare Tunnel:Edit (or Zero Trust edit).
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request

ACCOUNT = "0f5451fcdff45aa800d9100c6f3e9fc3"
TUNNEL = "9b4d9b73-7474-4ebc-8e4e-40667845678b"
HOSTNAME = os.environ.get("WHISHLIST_DOMAIN", "wishlist.mesdamesduc.fr")
SERVICE = os.environ.get("WHISHLIST_ORIGIN", "http://10.0.0.1:8740")


def api(method: str, path: str, body: dict | None = None) -> dict:
    token = os.environ.get("CF_API_TOKEN") or os.environ.get("CLOUDFLARE_API_TOKEN")
    if not token:
        print("Set CF_API_TOKEN (Account Cloudflare Tunnel Edit)", file=sys.stderr)
        raise SystemExit(2)
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())


def main() -> None:
    current = api("GET", f"/accounts/{ACCOUNT}/cfd_tunnel/{TUNNEL}/configurations")
    result = current.get("result") or {}
    config = result.get("config") or {}
    ingress = list(config.get("ingress") or [])
    if any(rule.get("hostname") == HOSTNAME for rule in ingress):
        print(f"already present: {HOSTNAME}")
        return
    catchall = [rule for rule in ingress if not rule.get("hostname")]
    rest = [rule for rule in ingress if rule.get("hostname")]
    rest.append({"hostname": HOSTNAME, "service": SERVICE, "originRequest": {}})
    config["ingress"] = rest + catchall
    payload = {"config": config}
    saved = api("PUT", f"/accounts/{ACCOUNT}/cfd_tunnel/{TUNNEL}/configurations", payload)
    if not saved.get("success"):
        print(saved, file=sys.stderr)
        raise SystemExit(1)
    print(f"added {HOSTNAME} -> {SERVICE}")


if __name__ == "__main__":
    main()
