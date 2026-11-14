import { ScrollArea, Tab, TabList, TabPanel, Tabs } from '@nobs/ui'
import { PAGES } from '~/pages'
import { useSettings } from '~/providers'
import styles from './App.module.css'

/**
 * The SimTools shell: a tab per page, remembering the active one. Pages are listed in
 * ~/pages/pageRegistry.ts. Rendered by both entry points inside <AppProviders>.
 *
 * It sits above the pages, so it lives at the root of src/ rather than in a page module.
 */
export function App() {
  const { settings, updateSettings } = useSettings()
  // Fall back to the first page if a stored id no longer exists.
  const active = PAGES.some((p) => p.id === settings.activePage)
    ? settings.activePage
    : (PAGES[0]?.id ?? '')

  return (
    <div className={styles.app}>
      <Tabs value={active} onValueChange={(id) => updateSettings({ activePage: id })}>
        <TabList label="SimTools pages">
          {PAGES.map((page) => (
            <Tab key={page.id} value={page.id} icon={page.icon}>
              {page.label}
            </Tab>
          ))}
        </TabList>
        {PAGES.map(({ id, Component }) => (
          <TabPanel key={id} value={id}>
            <ScrollArea
              viewportClassName={styles.page}
              dragToScroll
              naturalScroll={settings.naturalScroll}
            >
              <Component />
            </ScrollArea>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  )
}
