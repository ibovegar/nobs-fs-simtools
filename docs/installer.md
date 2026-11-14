# The installer

How the Windows installer works, and how to build and test it locally. To publish a
release, see [releasing.md](releasing.md); CI builds the installer for you.

## What it does

`installer/nobs-fs-simtools.nsi` (NSIS 3) is modelled on the Nobs FS app installer: the same
icon, header and sidebar bitmaps, a per-user install with no admin prompt, and unsigned. It:

1. Warns if `FlightSimulator2024.exe` is running (Retry / Ignore / Abort).
2. Finds the Community folder: a folder passed with `/D=` wins, then the previous install
   location, then Steam
   (`%APPDATA%\Microsoft Flight Simulator 2024\UserCfg.opt`), then the Microsoft Store
   (`%LOCALAPPDATA%\Packages\Microsoft.Limitless_8wekyb3d8bbwe\LocalCache\UserCfg.opt`).
   It reads `InstalledPackagesPath` and appends `\Community`, and the user can change the
   folder.
3. Replaces `Community\nobs-fs-simtools` completely. A developer junction from
   `pnpm link:community` is unlinked, never followed.
4. Installs the uninstaller in `%LOCALAPPDATA%\Nobs FS SimTools` (outside the Community
   folder) and registers it under *Settings → Apps*. Its own folder and registry key
   (`HKCU\Software\Nobs FS SimTools`) are deliberately separate from the Nobs FS desktop
   app, which installs to `%LOCALAPPDATA%\Nobs FS`.

Silent install / uninstall (used for testing):

```powershell
nobs-fs-simtools_<version>_setup.exe /S /D=C:\path\to\Community
"%LOCALAPPDATA%\Nobs FS SimTools\uninstall.exe" /S
```

The detection logic is duplicated in `scripts/lib/community.ts`. Keep the two in sync.

### Build locally

```powershell
winget install NSIS.NSIS     # once
pnpm installer               # → dist/installer/nobs-fs-simtools_<version>_setup.exe
```

This needs the compiled panel definition in `msfs/prebuilt/` (see development.md). To change
the branding, replace `installer/assets/icon.png` / `icon.ico` and run
`pnpm installer:images`.


The installer is unsigned, so SmartScreen may warn on first run ("More info → Run anyway").
