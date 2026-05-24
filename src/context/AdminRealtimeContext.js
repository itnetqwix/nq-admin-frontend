// ** React Imports
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'

// ** Config
import authConfig from 'src/configs/auth'
import { useAuth } from 'src/hooks/useAuth'
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

export const AdminRealtimeProvider = ({ children }) => {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [socketConnected, setSocketConnected] = useState(false)

  const isAdmin = useMemo(() => {
    if (user && user.account_type != null) return isAdminRole(user.account_type)
    return readStoredAdmin()
  }, [user])

  const refreshMetrics = useCallback(async () => {
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token || !isAdmin) {
      setMetrics(null)
      setMetricsLoading(false)
      return
    }
    try {
      const data = await fetchDashboardMetrics()
      if (data) setMetrics(data)
    } catch (e) {
      console.error('refreshMetrics', e)
    } finally {
      setMetricsLoading(false)
    }
  }, [isAdmin])

  const refreshOnlineUsers = useCallback(async () => {
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token || !isAdmin) return
    try {
      const users = await fetchOnlineUsers()
      setOnlineUsers(users)
    } catch (e) {
      console.error('refreshOnlineUsers', e)
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      setMetrics(null)
      setMetricsLoading(false)
      setOnlineUsers([])
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
  }, [isAdmin, refreshMetrics, refreshOnlineUsers])

  useEffect(() => {
    if (!isAdmin) {
      setOnlineUsers([])
      setSocketConnected(false)
      return undefined
    }

    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token) return undefined

    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
    const socket = io(baseUrl, {
      auth: { authorization: token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10
    })

    socket.on('connect', () => {
      setSocketConnected(true)
      void refreshMetrics()
      void refreshOnlineUsers()
    })
    socket.on('disconnect', () => setSocketConnected(false))
    socket.on('ADMIN_ONLINE_USERS', payload => {
      setOnlineUsers(Array.isArray(payload?.users) ? payload.users : [])
    })
    socket.on('ADMIN_DASHBOARD_METRICS', payload => {
      const next = normalizeMetrics(payload?.metrics)
      if (next) {
        setMetrics(next)
        setMetricsLoading(false)
      }
    })

    return () => {
      socket.disconnect()
      setSocketConnected(false)
    }
  }, [isAdmin, refreshMetrics, refreshOnlineUsers])

  const value = useMemo(
    () => ({
      onlineUsers,
      metrics,
      metricsLoading,
      socketConnected,
      refreshMetrics,
      refreshOnlineUsers
    }),
    [onlineUsers, metrics, metricsLoading, socketConnected, refreshMetrics, refreshOnlineUsers]
  )

  return <AdminRealtimeContext.Provider value={value}>{children}</AdminRealtimeContext.Provider>
}

export const useAdminRealtime = () => useContext(AdminRealtimeContext)

export { AdminRealtimeContext }
