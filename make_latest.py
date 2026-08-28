import io, sys, os, json, base64
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Скрипт генерирует манифест обновлений latest.json для tauri-plugin-updater.
# Использование:
#   python make_latest.py <repo> <version> [url_на_exe]
# Пример:
#   python make_latest.py SomeUser/law-assistant 1.0.1

def main():
    if len(sys.argv) < 3:
        print("Использование: make_latest.py <owner/repo> <version> [url_setup_exe]")
        print("Если url не задан, берётся github.com/<repo>/releases/download/v<version>/<имя_exe>")
        sys.exit(1)

    repo = sys.argv[1]           # напр. "SomeUser/law-assistant"
    version = sys.argv[2]        # напр. "1.0.1" (без ведущей v)

    # Папка, где лежат setup.exe и .sig
    base = os.path.abspath(os.path.join(os.path.dirname(__file__),
        "web_app", "desktop", "src-tauri", "target", "release", "bundle", "nsis"))

    # Ищем setup.exe с версией version (фильтр по номеру версии, чтобы не перепутать)
    setup_exe = None
    sig_file = None
    for f in os.listdir(base):
        if f.endswith("-setup.exe") and version.replace(".", "_") in f:
            setup_exe = f
            sig_file = f + ".sig"
        elif f.endswith("-setup.exe") and version in f:
            setup_exe = f
            sig_file = f + ".sig"

    if not setup_exe or not sig_file or not os.path.exists(os.path.join(base, sig_file)):
        print("НЕ найден setup.exe и/или .sig в", base)
        print("Содержимое папки:", os.listdir(base))
        sys.exit(1)

    signature = open(os.path.join(base, sig_file), encoding="utf-8").read().strip()

    url = sys.argv[3] if len(sys.argv) >= 4 else f"https://github.com/{repo}/releases/download/v{version}/{setup_exe}"

    # Квотирование URL (пробелы и кириллица в имени файла)
    url = url.replace(" ", "%20")

    manifest = {
        "version": version,
        "notes": f"Обновление {version}",
        "pub_date": "2026-08-23T00:00:00Z",
        "platforms": {
            "windows-x86_64": {
                "signature": signature,
                "url": url,
            }
        }
    }

    out_path = os.path.join(base, "latest.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)
    print("Манифест создан:", out_path)
    print("  version:", version)
    print("  url:", url)
    print("  файл подписи:", sig_file)

if __name__ == "__main__":
    main()
