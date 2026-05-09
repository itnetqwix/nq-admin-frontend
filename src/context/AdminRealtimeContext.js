// ** React Imports
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'

// ** Config
import authConfig from 'src/configs/auth'
import { useAuth } from 'src/hooks/useAuth'

const defaultValue = {
  onlineUsers: [],
  metrics: null,
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

export const AdminRealtimeProvider = ({ children }) => {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)

  const isAdmin = useMemo(() => {
    if (user && user.account_type != null) return isAdminRole(user.account_type)
    return readStoredAdmin()
  }, [user])

  const refreshMetrics = useCallback(async () => {
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token || !isAdmin) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/dashboard-metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      const payload = json?.result
      if (payload && typeof payload === 'object') {
        const { message, status, ...rest } = payload
        setMetrics(rest)
      }
    } catch (e) {
      console.error('refreshMetrics', e)
    }
  }, [isAdmin])

  const refreshOnlineUsers = useCallback(async () => {
    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token || !isAdmin) return
    try {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
      const res = await fetch(`${base}/admin/online-users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      const payload = json?.result
      if (payload && Array.isArray(payload.users)) {
        setOnlineUsers(payload.users)
      }
    } catch (e) {
      console.error('refreshOnlineUsers', e)
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return undefined
    void refreshOnlineUsers()
    return undefined
  }, [isAdmin, refreshOnlineUsers])

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
      refreshMetrics()
      void refreshOnlineUsers()
    })
    socket.on('disconnect', () => setSocketConnected(false))
    socket.on('ADMIN_ONLINE_USERS', payload => {
      setOnlineUsers(Array.isArray(payload?.users) ? payload.users : [])
    })
    socket.on('ADMIN_DASHBOARD_METRICS', payload => {
      if (payload?.metrics && typeof payload.metrics === 'object') {
        setMetrics(payload.metrics)
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
      socketConnected,
      refreshMetrics,
      refreshOnlineUsers
    }),
    [onlineUsers, metrics, socketConnected, refreshMetrics, refreshOnlineUsers]
  )

  return <AdminRealtimeContext.Provider value={value}>{children}</AdminRealtimeContext.Provider>
}

export const useAdminRealtime = () => useContext(AdminRealtimeContext)

export { AdminRealtimeContext }
