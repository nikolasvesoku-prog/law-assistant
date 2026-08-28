import json, os, subprocess, sys
from pathlib import Path

BASE = Path("C:/Program/Helper")
EXE = BASE / "web_app/desktop/src-tauri/target/release/bundle/nsis/law-assistant_1.1.4_x64-setup.exe"
KEYS = BASE / "keys"
TAG = "v1.1.4"
REPO = "nikolasvesoku-prog/T0nyStark-law-assistant"

# 1. latest.json for v1.1.3 (no signature needed — just shows notification)
v1_3_latest = json.dumps({
    "version": "1.1.4",
    "notes": "v1.1.4 — Глобальное обновление. Окно-помощник",
    "pub_date": "2026-08-28T10:00:00Z",
    "platforms": {
        "windows-x86_64": {
            "signature": "",
            "url": f"https://github.com/{REPO}/releases/download/{TAG}/law-assistant_1.1.4_x64-setup.exe"
        }
    }
}, indent=2)

# 2. latest.json for v1.1.4+ (with signature for auto-update)
sig = (BASE / "keys/law-assistant_1.1.4_x64-setup.exe.sig").read_text("utf8").strip()

v1_4_latest = json.dumps({
    "version": "1.1.4",
    "notes": "v1.1.4 — Глобальное обновление.\nАвтообновление работает с этой версии.",
    "pub_date": "2026-08-28T10:00:00Z",
    "platforms": {
        "windows-x86_64": {
            "signature": sig,
            "url": f"https://github.com/{REPO}/releases/download/{TAG}/law-assistant_1.1.4_x64-setup.exe"
        }
    }
}, indent=2)

# Write both
(BASE / "release/latest_v1.3_compat.json").write_text(v1_3_latest, "utf8")
(BASE / "release/latest.json").write_text(v1_4_latest, "utf8")
print("latest.json files ready")
print(f"Signature: {sig[:60]}...")
