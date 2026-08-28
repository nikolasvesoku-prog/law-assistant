# -*- coding: utf-8 -*-
"""
Полный цикл сборки Правового помощника и генерация манифеста обновлений.

Использование:
    python build_and_release.py <owner/repo> <версия> [--no-build]

Пример:
    python build_and_release.py SomeUser/law-assistant 1.0.1

Что делает:
    1. Собирает фронтенд (client) -> dist
    2. Собирает Tauri-приложение (с подписью обновлений)
    3. Генерирует манифест latest.json

После успешной сборки в папке bundle/nsis лежат 3 файла для GitHub Release:
    - Правовой помощник_<версия>_x64-setup.exe
    - Правовой помощник_<версия>_x64-setup.exe.sig
    - latest.json
"""
import io, sys, os, subprocess

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__)))
CLIENT = os.path.join(ROOT, "web_app", "client")
TAURI = os.path.join(ROOT, "web_app", "desktop", "src-tauri")

# --- Секреты (заполнить своими) ---
ENV_GIGACHAT = {
    "GIGACHAT_CLIENT_ID": "01a02dc3-626e-7cfb-8527-d36e4cc97a3c",
    "GIGACHAT_CLIENT_SECRET": "a2f65377-6796-46a5-93b9-4d37231e993d",
}
KEY_PATH = r"C:\Program\Helper\keys\bundle_signing.key"
KEY_PASSWORD = "Sber2026_Updater_Key!"


def signing_env():
    e = {}
    try:
        with open(KEY_PATH, encoding="utf-8") as f:
            e["TAURI_SIGNING_PRIVATE_KEY"] = f.read().strip()
    except OSError:
        e["TAURI_SIGNING_PRIVATE_KEY_PATH"] = KEY_PATH
    e["TAURI_SIGNING_PRIVATE_KEY_PASSWORD"] = KEY_PASSWORD
    return e


def run(cmd, cwd, env=None):
    e = os.environ.copy()
    if env:
        e.update(env)
    print(">>", " ".join(cmd) if isinstance(cmd, list) else cmd)
    r = subprocess.run(cmd, cwd=cwd, env=e, shell=False)
    if r.returncode != 0:
        print("ОШИБКА в команде:", cmd)
        sys.exit(r.returncode)


def main():
    if len(sys.argv) < 2:
        print("Использование: build_and_release.py <owner/repo> <версия> [--no-build]")
        sys.exit(1)
    repo = sys.argv[1]
    version = sys.argv[2] if len(sys.argv) >= 3 else "1.0.0"
    no_build = "--no-build" in sys.argv

    env_full = {}
    env_full.update(ENV_GIGACHAT)
    env_full.update(signing_env())
    cargo_bin = os.path.join(os.environ.get("USERPROFILE", r"C:\Users\nikol"), ".cargo", "bin")
    env_full["PATH"] = (os.environ.get("PATH", "") + os.pathsep + cargo_bin)

    if not no_build:
        print("=== Сборка фронтенда ===")
        run(["npm.cmd", "run", "build"], CLIENT)
        print("=== Сборка Tauri ===")
        run([r"C:\Users\nikol\AppData\Roaming\npm\tauri.cmd", "build"], TAURI, env=env_full)

    print("=== Генерация манифеста latest.json ===")
    run([r"C:\Python314\python.exe", os.path.join(ROOT, "make_latest.py"), repo, version], ROOT)

    base = os.path.join(TAURI, "target", "release", "bundle", "nsis")
    print()
    print("ГОТОВО. Закинь эти файлы в GitHub Release v" + version + ":")
    print("  1.", os.path.join(base, f"Правовой помощник_{version}_x64-setup.exe") if os.path.exists(os.path.join(base, f"Правовой помощник_{version}_x64-setup.exe")) else "  1.", os.path.join(base, f"law-assistant_{version}_x64-setup.exe"))
    print("  2.", os.path.join(base, f"law-assistant_{version}_x64-setup.exe.sig"))
    print("  3.", os.path.join(base, "latest.json"))


if __name__ == "__main__":
    main()
