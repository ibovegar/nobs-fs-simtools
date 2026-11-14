# Prebuilt panel definition

`InGamePanels/nobs-fs-simtools-panel.spb` is the compiled toolbar panel definition
(source: `msfs/PackageSources/InGamePanels/nobs-fs-simtools-panel.xml`).

It is committed so that building the package, the installer and the CI release does **not**
need the MSFS SDK. Regenerate it only when the panel XML changes:

```powershell
pnpm package:spb   # needs the MSFS 2024 SDK; see docs/development.md
```

…then commit the updated `.spb`.
