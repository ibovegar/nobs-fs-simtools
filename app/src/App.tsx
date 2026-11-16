import { cx, PageHeaderArea, ScrollArea, Tab, TabList, TabPanel, Tabs } from '@nobs/ui'
import { useState } from 'react'
import { PAGES } from '~/pages'
import { useSettings, useSim } from '~/providers'
import styles from './App.module.css'

/**
 * The SimTools shell: a tab per page, remembering the active one. Pages are listed in
 * ~/pages/pageRegistry.ts. Rendered by both entry points inside <AppProviders>.
 *
 * While the toolbar panel is closed it renders nothing, so no page, poll, timer or listener
 * is alive (sim performance first). Unmounting flushes pending writes; reopening remounts
 * the pages, which restore their saved state and read the sim afresh.
 *
 * It sits above the pages, so it lives at the root of src/ rather than in a page module.
 */
export function App() {
  const { settings, updateSettings } = useSettings()
  const { panelVisible } = useSim()
  // Whether the open page scrolls: the page and its header make room for the scrollbar
  // only then, and otherwise take the full width. Only the open page is mounted.
  const [scrollbar, setScrollbar] = useState(false)
  // Fall back to the first page if a stored id no longer exists.
  const active = PAGES.some((p) => p.id === settings.activePage)
    ? settings.activePage
    : (PAGES[0]?.id ?? '')

  if (!panelVisible) return null

  return (
    <div className={cx(styles.app, scrollbar && styles.withScrollbar)}>
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
            {/* A page's <PageHeader> (e.g. its sub-tabs) is drawn here and doesn't scroll. */}
            <PageHeaderArea className={styles.header}>
              <ScrollArea
                className={styles.scroll}
                viewportClassName={styles.page}
                dragToScroll
                naturalScroll={settings.naturalScroll}
                scrollToTopButton
                scrollbarGutter="auto"
                onScrollbarChange={setScrollbar}
              >
                <Component />
              </ScrollArea>
            </PageHeaderArea>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  )
}
