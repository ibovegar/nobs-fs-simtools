# Releasing a new version

A release is cut by pushing a version tag. GitHub Actions
([`.github/workflows/release.yml`](../.github/workflows/release.yml)) does the rest: it checks,
builds and publishes the installer. You never build release artifacts locally.

**Version:** the root `package.json` holds the version, and the git tag must be
`v<that version>`. The CI run checks this.

## Before your first release (once)

1. **Push the repo to GitHub** (`git remote add origin …`, `git push -u origin main`).
2. **Commit the compiled panel definition**
   `msfs/prebuilt/InGamePanels/nobs-fs-simtools-panel.spb`. CI can't build it because it has no
   MSFS, so the release check fails without it.
3. **Allow the workflow to publish releases:** on GitHub, *Settings → Actions → General →
   Workflow permissions* must allow "Read and write permissions", or at least must not block
   the `contents: write` the workflow asks for. That's the default for personal repos.

## Cutting a release

1. **Pick the version** ([semver](https://semver.org)):
   - `0.1.0` → `0.1.1` for fixes only, `0.2.0` for new features, `1.0.0` for the first stable release.
   - For a test build, add a suffix: `0.2.0-beta.1`. Tags with a suffix are published as
     **prereleases**.

2. **Update `CHANGELOG.md`.** Rename `## [Unreleased]` to the version and today's date, and
   add a new, empty `## [Unreleased]` above it:

   ```markdown
   ## [Unreleased]

   ## [0.2.0] - 2026-12-01

   ### Added
   - …
   ```

   That section becomes the release notes on GitHub, so write it for users.

3. **Bump `version`** in the root `package.json`. It's stamped into the app's Settings →
   About, the MSFS `manifest.json`, the installer and Settings → Apps.

4. **Run the release check locally.** It runs the same check as CI, and it's faster to
   find a problem here:

   ```powershell
   pnpm release:check          # checks tag v<version> against package.json + CHANGELOG + .spb
   pnpm lint; pnpm typecheck; pnpm test
   ```

5. **Commit and push:**

   ```powershell
   git add -A
   git commit -m "Release v0.2.0"
   git push
   ```

6. **Tag and push the tag.** This starts the release:

   ```powershell
   git tag v0.2.0
   git push origin v0.2.0
   ```

7. **Watch the run:** GitHub → *Actions → Release*. It takes a few minutes. Steps:
   release check → lint → typecheck → test → build package + installer → publish.

8. **Check the release:** GitHub → *Releases → Nobs SimTools v0.2.0* should have:
   - `nobs-fs-simtools_v0.2.0_setup.exe`, the installer;
   - `nobs-fs-simtools_v0.2.0_community.zip`, for a manual install (unzip into Community);
   - your changelog section as the description.

9. **Smoke-test:** download the setup .exe, install, start MSFS, and open SimTools
   from the toolbar. Check the version under Settings → About.

## When something goes wrong

| Problem | Fix |
|---|---|
| **Release check:** "Tag … does not match package.json version" | You tagged before bumping. Delete the tag (`git tag -d v0.2.0; git push origin :refs/tags/v0.2.0`), fix `package.json`, commit, tag again. |
| **Release check:** "CHANGELOG.md has no ## [x.y.z] - YYYY-MM-DD section" | Step 2 was missed, or the heading isn't in exactly that format. Fix, commit, re-tag as above. |
| **Release check:** "….spb is missing" | Commit `msfs/prebuilt/InGamePanels/nobs-fs-simtools-panel.spb` (see "Panel definition" below). |
| Lint fails in CI on every file ("Formatter would have printed…") but passes locally | CRLF line endings in the checkout. `.gitattributes` forces LF; make sure it is committed and that no file was committed with CRLF (`git add --renormalize .`). |
| Lint / typecheck / test fails in CI | Fix on `main`, then move the tag to the fixed commit (delete and re-create it, as above). |
| The workflow itself was broken (not the code) | Fix the workflow on `main`, then *Actions → Release → Run workflow* with the **existing** tag. It rebuilds that tag's code. |
| Published something wrong | Delete the release on GitHub (and the tag), then release a new patch version. Prefer a new version over replacing assets people may already have downloaded. |

## Panel definition (`.spb`): only when the panel itself changes

The toolbar panel's definition (name, toolbar icon name, default size and position) lives in
`msfs/PackageSources/InGamePanels/nobs-fs-simtools-panel.xml` and is compiled with the MSFS
2024 SDK. Code, styling and new pages **never** need this. Only when that XML changes:

```powershell
# Close MSFS first. The SDK starts its own headless MSFS to build (~15 s); the script
# closes it again afterwards.
pnpm package:spb
git add msfs/prebuilt/InGamePanels/nobs-fs-simtools-panel.spb
```

Details: [development.md](development.md).

## Notes

- **Unsigned installer:** Windows SmartScreen warns on first run (*More info → Run anyway*).
  Removing that needs a code-signing certificate.
- **Building the installer locally** (to test it, not to release it) is described in
  [installer.md](installer.md).
- The workflow runs on `windows-latest` (NSIS is preinstalled; the workflow installs it if
  not), with Node 24 and the pnpm version from `packageManager` in `package.json`.
