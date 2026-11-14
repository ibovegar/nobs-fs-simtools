import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface CommunityFolder {
  store: 'Steam' | 'Microsoft Store'
  path: string
}

/**
 * Where MSFS 2024 keeps its UserCfg.opt for each store. Its `InstalledPackagesPath`
 * line points at the folder that contains `Community`. (The installer uses the same
 * logic — keep installer/nobs-fs-simtools.nsi in sync.)
 */
function userCfgCandidates(): { store: CommunityFolder['store']; cfg: string }[] {
  const appData = process.env.APPDATA ?? ''
  const localAppData = process.env.LOCALAPPDATA ?? ''
  return [
    { store: 'Steam', cfg: join(appData, 'Microsoft Flight Simulator 2024', 'UserCfg.opt') },
    {
      store: 'Microsoft Store',
      cfg: join(
        localAppData,
        'Packages',
        'Microsoft.Limitless_8wekyb3d8bbwe',
        'LocalCache',
        'UserCfg.opt',
      ),
    },
  ]
}

export function parseInstalledPackagesPath(userCfg: string): string | undefined {
  return /^InstalledPackagesPath\s+"([^"]+)"/m.exec(userCfg)?.[1]
}

/** Every MSFS 2024 Community folder found on this machine. */
export function findCommunityFolders(): CommunityFolder[] {
  return userCfgCandidates().flatMap(({ store, cfg }) => {
    if (!existsSync(cfg)) return []
    const packagesPath = parseInstalledPackagesPath(readFileSync(cfg, 'utf8'))
    const community = packagesPath && join(packagesPath, 'Community')
    return community && existsSync(community) ? [{ store, path: community }] : []
  })
}
