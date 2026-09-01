# Патч NSIS-инсталлятора после сборки

После каждого `npx tauri build --bundles nsis` в `target/release/nsis/x64/installer.nsi` нужно вручную:

1. **Тёмная тема** — добавить после `!endif` перед `!include MUI2.nsh`:
```
; --- Тёмная тема установщика ---
!define MUI_BGCOLOR "1A1A1A"
!define MUI_WELCOMEFINISHPAGE_BGCOLOR "1A1A1A"
!define MUI_TEXTCOLOR "FFFFFF"
!define MUI_FGCOLOR "FFFFFF"
!define MUI_BRANDINGTEXTCOLOR "FFFFFF"
!define MUI_COMPONENTSPAGE_HINTCOLOR "BBBBBB"
!define MUI_FORCECLASSICCONTROLS
```

2. **Иконка и sidebar** — заменить пустые на:
```
!define INSTALLERICON "icon.ico"
!define SIDEBARIMAGE "sidebar.bmp"
!define UNINSTALLERICON "icon.ico"
```

3. **Название ярлыка** — после `!define PRODUCTNAME` добавить:
```
!define DISPLAYNAME "Правовой помощник"
```

4. **Заменить все** `${PRODUCTNAME}.lnk` на `${DISPLAYNAME}.lnk`

5. Скопировать `icon.ico` и `sidebar.bmp` в `target/release/nsis/x64/`

6. Собрать: `makensis installer.nsi` из папки `target/release/nsis/x64/`

7. Скопировать `nsis-output.exe` → `bundle/nsis/law-assistant_1.0.0_x64-setup.exe`

8. Подписать: `npx tauri signer sign -f "keys/bundle_signing.key" -p "Sber2026_Updater_Key!"`

9. Загрузить `.exe` + `.sig` + `latest.json` на GitHub Releases