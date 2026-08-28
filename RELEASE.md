# Как выпустить релиз Правового помощника

## Подготовка

1. Открой **`tauri.conf.json`** (`web_app\desktop\src-tauri\tauri.conf.json`)
2. Поменяй **`"version"`** на новую версию (например `"1.1.6"`)
3. Поменяй `"endpoints"` если репозиторий менялся

## Сборка

Запусти **build_and_release.py**:

```
set PATH=C:\Program Files\nodejs;C:\Users\nikol\.cargo\bin;C:\Users\nikol\AppData\Roaming\npm;%PATH%
set TAURI_SIGNING_PRIVATE_KEY_PATH=C:\Program\Helper\keys\bundle_signing.key
set TAURI_SIGNING_PRIVATE_KEY_PASSWORD=Sber2026_Updater_Key!
set GIGACHAT_CLIENT_ID=01a02dc3-626e-7cfb-8527-d36e4cc97a3c
set GIGACHAT_CLIENT_SECRET=a2f65377-6796-46a5-93b9-4d37231e993d
cd web_app\desktop\src-tauri
C:\Users\nikol\AppData\Roaming\npm\tauri.cmd build
```

Готовые файлы появятся в:
```
web_app\desktop\src-tauri\target\release\bundle\nsis\
```

Там будут:
- `Правовой помощник_<версия>_x64-setup.exe` — установщик
- Там же `.sig` — подпись (создаётся автоматически при сборке)
- `latest.json` — манифест обновлений

## Генерация latest.json

После сборки **нужно вручную создать latest.json**, потому что скрипт может взять старый. Сделай так:

1. Открой PowerShell
2. Прочитай подпись из `.sig` файла
3. Создай JSON с верной ссылкой на новый репозиторий

Либо запусти `make_latest.py` исправленный:
```
python make_latest.py nikolasvesoku-prog/law-assistant 1.1.6
```

Если скрипт говорит «не найден setup.exe» — проверь, что в имени файла есть твоя версия.

## Публикация на GitHub

1. Зайди на github.com → **nikolasvesoku-prog/law-assistant** → Releases
2. Нажми **«Draft a new release»**
3. Tag: `v1.1.6` (с v в начале)
4. Название: `v1.1.6`
5. Описание: напиши, что изменилось
6. Прикрепи файлы (перетащи):
   - `Правовой помощник_1.1.6_x64-setup.exe`
   - `Правовой помощник_1.1.6_x64-setup.exe.sig` (подпись)
   - `latest.json`
7. **Важно!** Убедись, что `latest.json` указывает на новый url:
   `https://github.com/nikolasvesoku-prog/law-assistant/releases/download/v1.1.6/Правовой помощник_1.1.6_x64-setup.exe`
8. Опубликуй релиз

## Как работает обновление

Приложение обращается к:
```
https://github.com/nikolasvesoku-prog/law-assistant/releases/latest/download/latest.json
```

GitHub перенаправляет на `latest.json` из самого свежего релиза. Поэтому **не удаляй старые `latest.json` из старых релизов** — они не мешают.

## Если что-то пошло не так

- `latest.json` не скачивается → проверь, что файл загружен как asset релиза
- Подпись не совпадает → пересобери заново (билд создаёт новую подпись каждый раз)
- Репозиторий приватный → обновление НЕ будет работать (нужен публичный доступ к assets)

## Ключи подписи

Приватный ключ: `C:\Program\Helper\keys\bundle_signing.key`
Пароль: `Sber2026_Updater_Key!`
Публичный ключ (вшит в приложение): прописан в `tauri.conf.json` в `plugins.updater.pubkey`

**Не меняй ключи без необходимости** — если поменяешь, старые версии приложения не смогут обновиться.