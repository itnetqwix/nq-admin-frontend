/**
 * Sidebar favorites — sync to server (extraInfo.admin_nav_favorites) + localStorage cache.
 */
import { getAdminNavPreferences, putAdminNavPreferences } from 'src/services/adminLogsApi'

const KEY = 'nq-admin-nav-favorites'

function storageKey(userId) {
  return userId ? `${KEY}:${userId}` : KEY
}

export function loadNavFavoritesLocal(userId) {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter(f => f && f.path) : []
  } catch {
    return []
  }
}

export function saveNavFavoritesLocal(userId, favorites) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(userId), JSON.stringify(favorites.slice(0, 20)))
}

/** @deprecated use loadNavFavoritesLocal — kept for call sites */
export function loadNavFavorites(userId) {
  return loadNavFavoritesLocal(userId)
}

export function saveNavFavorites(userId, favorites) {
  saveNavFavoritesLocal(userId, favorites)
}

let saveTimer = null

export function persistNavFavorites(userId, favorites) {
  saveNavFavoritesLocal(userId, favorites)
  if (typeof window === 'undefined') return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void putAdminNavPreferences(favorites).catch(() => {
      /* offline / old backend — local cache still works */
    })
  }, 400)
}

export async function hydrateNavFavorites(userId) {
  const local = loadNavFavoritesLocal(userId)
  try {
    const data = await getAdminNavPreferences()
    const remote = Array.isArray(data?.nav_favorites) ? data.nav_favorites.filter(f => f?.path) : []
    if (remote.length) {
      saveNavFavoritesLocal(userId, remote)
      return remote
    }
    // First device: push local to server
    if (local.length) {
      await putAdminNavPreferences(local).catch(() => null)
    }
    return local
  } catch {
    return local
  }
}

export function toggleNavFavorite(userId, item) {
  if (!item?.path) return loadNavFavoritesLocal(userId)
  const list = loadNavFavoritesLocal(userId)
  const exists = list.findIndex(f => f.path === item.path)
  let next
  if (exists >= 0) {
    next = list.filter((_, i) => i !== exists)
  } else {
    next = [
      ...list,
      {
        path: item.path,
        title: item.title,
        icon: item.icon || 'mdi:star-outline',
        action: item.action || 'read',
        subject: item.subject
      }
    ]
  }
  persistNavFavorites(userId, next)
  return next
}
