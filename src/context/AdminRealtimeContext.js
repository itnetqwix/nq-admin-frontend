// ** React Imports
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'

// ** Config
import authConfig from 'src/configs/auth'
import { useAuth } from 'src/hooks/useAuth'
import { useAppDispatch, useAppSelector } from 'src/store/hooks'
import {
  selectDashboard,
  setLiveMetrics,
  setOnlineUsers as setStoreOnlineUsers,
  setSocketConnected as setStoreSocketConnected
} from 'src/store/slices/dashboardSlice'
import {
  fetchDashboardMetrics,
  fetchOnlineUsers,
  unwrapAdminResult
} from 'src/services/adminDashboardApi'

const METRICS_POLL_MS = 30000

const defaultValue = {
  onlineUsers: [],
  metrics: null,
  metricsLoading: true,
  socketConnected: false,
  refreshMetrics: async () => {},
  refreshOnlineUsers: async () => {}
}

const AdminRealtimeContext = createContext(defaultValue)

const isAdminRole = accountType => {
  if (!accountType) return false
  return String(accountType).trim().toLowerCase() === 'admin'
}

const readStoredAdmin = () => {
  try {
    const raw = window.localStorage.getItem('userData')
    if (!raw) return false
    const u = JSON.parse(raw)
    return isAdminRole(u?.account_type)
  } catch {
    return false
  }
}

const normalizeMetrics = payload => {
  if (!payload || typeof payload !== 'object') return null
  const data = unwrapAdminResult(payload)
  if (!data || typeof data !== 'object') return null
  return data
}

/**
 * Socket + poll for live admin metrics.
 * Mirrors into Redux `dashboard` so pages can use either context or selectors.
 */
export const AdminRealtimeProvider = ({ children }) => {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const dash = useAppSelector(selectDashboard)
  const [metricsLoading, setMetricsLoading] = useState(true)

  const isAdmin = useMemo(() => {
    if (user && user.account_type != null) return isAdminRole(user.account_type)
    return readStoredAdmin()
  }, [user])

  const refreshMetrics = useCallback(async () => {
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token || !isAdmin) {
      dispatch(setLiveMetrics(null))
      setMetricsLoading(false)
      return
    }
    try {
      const data = await fetchDashboardMetrics()
      if (data) dispatch(setLiveMetrics(data))
    } catch (e) {
      console.error('refreshMetrics', e)
    } finally {
      setMetricsLoading(false)
    }
  }, [isAdmin, dispatch])

  const refreshOnlineUsers = useCallback(async () => {
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token || !isAdmin) return
    try {
      const users = await fetchOnlineUsers()
      dispatch(setStoreOnlineUsers(users))
    } catch (e) {
      console.error('refreshOnlineUsers', e)
    }
  }, [isAdmin, dispatch])

  useEffect(() => {
    if (!isAdmin) {
      dispatch(setLiveMetrics(null))
      dispatch(setStoreOnlineUsers([]))
      dispatch(setStoreSocketConnected(false))
      setMetricsLoading(false)
      return undefined
    }
    setMetricsLoading(true)
    void refreshMetrics()
    void refreshOnlineUsers()
    const timer = setInterval(() => {
      void refreshMetrics()
      void refreshOnlineUsers()
    }, METRICS_POLL_MS)
    return () => clearInterval(timer)
  }, [isAdmin, refreshMetrics, refreshOnlineUsers, dispatch])

  useEffect(() => {
    if (!isAdmin) {
      dispatch(setStoreOnlineUsers([]))
      dispatch(setStoreSocketConnected(false))
      return undefined
    }

    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token) return undefined

    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
    // Stay on HTTP long-polling — websocket upgrade returns 400 behind Cloudflare/LB.
    const socket = io(baseUrl, {
      auth: { authorization: token, token },
      transports: ['polling'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 10
    })

    socket.on('connect', () => {
      dispatch(setStoreSocketConnected(true))
      void refreshMetrics()
      void refreshOnlineUsers()
    })
    socket.on('connect_error', err => {
      // Quiet in production — metrics still poll every 30s without the socket.
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[AdminRealtime] socket connect_error', err?.message || err)
      }
    })
    socket.on('disconnect', () => dispatch(setStoreSocketConnected(false)))
    socket.on('ADMIN_ONLINE_USERS', payload => {
      dispatch(setStoreOnlineUsers(Array.isArray(payload?.users) ? payload.users : []))
    })
    socket.on('ADMIN_DASHBOARD_METRICS', payload => {
      const next = normalizeMetrics(payload?.metrics)
      if (next) {
        dispatch(setLiveMetrics(next))
        setMetricsLoading(false)
      }
    })

    return () => {
      socket.disconnect()
      dispatch(setStoreSocketConnected(false))
    }
  }, [isAdmin, refreshMetrics, refreshOnlineUsers, dispatch])

  const value = useMemo(
    () => ({
      onlineUsers: dash.onlineUsers,
      metrics: dash.metrics,
      metricsLoading,
      socketConnected: dash.socketConnected,
      refreshMetrics,
      refreshOnlineUsers
    }),
    [dash.onlineUsers, dash.metrics, dash.socketConnected, metricsLoading, refreshMetrics, refreshOnlineUsers]
  )

  return <AdminRealtimeContext.Provider value={value}>{children}</AdminRealtimeContext.Provider>
}

export const useAdminRealtime = () => useContext(AdminRealtimeContext)

export { AdminRealtimeContext }
