import { createContext, type ReactNode, use } from 'react'
// Type-only: ~/storage's hooks import this provider, so a value import would be a cycle.
import type { KeyValueStorage } from '~/storage'

const StorageContext = createContext<KeyValueStorage | null>(null)

interface StorageProviderProps {
  storage: KeyValueStorage
  children: ReactNode
}

/** Provides the persistent key/value store (sim DataStorage, localStorage or memory). */
export function StorageProvider(props: StorageProviderProps) {
  const { storage, children } = props

  return <StorageContext value={storage}>{children}</StorageContext>
}

export function useStorage(): KeyValueStorage {
  const ctx = use(StorageContext)
  if (!ctx) throw new Error('useStorage() must be used inside <StorageProvider>')
  return ctx
}
