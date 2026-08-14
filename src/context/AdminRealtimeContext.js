import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import authConfig from 'src/configs/auth'
import { useAuth } from 'src/hooks/useAuth'
import { useAppDispatch, useAppSelector } from 'src/store/hooks'
import {
  selectDashboard,
  setLiveMetrics,
  setOnlineUsers as setStoreOnlineUsers,
  setSocketConnected as setStoreSocketConnected
} from 'src/store/slices/dashboardSlice'
import { fetchDashboardMetrics, fetchOnlineUsers, unwrapAdminResult } from 'src/services/adminDashboardApi'

const METRICS_POLL_MS = 30000

const defaultValue = {
  onlineUsers: [],
  metrics: null,
  metricsLoading: true,
  socketConnected: false,
  socket: null,
  lastEvent: null,
  refreshMetrics: async () => {},
  refreshOnlineUsers: async () => {}
}

const AdminRealtimeContext = createContext(defaultValue)

const isAdminRole = accountType => String(accountType || '').trim().toLowerCase() === 'admin'

const readStoredAdmin = () => {
  try {
    const raw = window.localStorage.getItem('userData')
    if (!raw) return false
    return isAdminRole(JSON.parse(raw)?.account_type)
  } catch {
    return false
  }
}

const normalizeMetrics = payload => {
  if (!payload || typeof payload !== 'object') return null
  const data = unwrapAdminResult(payload)
  return data && typeof data === 'object' ? data : null
}

export const AdminRealtimeProvider = ({ children }) => {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const dash = useAppSelector(selectDashboard)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const [lastEvent, setLastEvent] = useState(null)
  const socketConnected = dash.socketConnected
  const pollRef = useRef(null)

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
      dispatch(setStoreOnlineUsers(await fetchOnlineUsers()))
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
    return undefined
  }, [isAdmin, refreshMetrics, refreshOnlineUsers, dispatch])

  // HTTP poll only while the socket is down.
  useEffect(() => {
    if (!isAdmin || socketConnected) {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
      return undefined
    }
    pollRef.current = setInterval(() => {
      void refreshMetrics()
      void refreshOnlineUsers()
    }, METRICS_POLL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [isAdmin, socketConnected, refreshMetrics, refreshOnlineUsers])

  useEffect(() => {
    if (!isAdmin) {
      dispatch(setStoreOnlineUsers([]))
      dispatch(setStoreSocketConnected(false))
      setSocket(null)
      return undefined
    }

    const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!token) return undefined

    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
    const next = io(baseUrl, {
      auth: { authorization: token, token },
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 10
    })
    setSocket(next)

    next.on('connect', () => {
      dispatch(setStoreSocketConnected(true))
      void refreshMetrics()
      void refreshOnlineUsers()
    })
    next.on('connect_error', err => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AdminRealtime] socket connect_error', err?.message || err)
      }
    })
    next.on('disconnect', () => dispatch(setStoreSocketConnected(false)))
    next.on('ADMIN_ONLINE_USERS', payload => {
      dispatch(setStoreOnlineUsers(Array.isArray(payload?.users) ? payload.users : []))
    })
    next.on('ADMIN_DASHBOARD_METRICS', payload => {
      const metrics = normalizeMetrics(payload?.metrics)
      if (metrics) {
        dispatch(setLiveMetrics(metrics))
        setMetricsLoading(false)
      }
    })
    const remember = (event, payload) => setLastEvent({ event, payload, at: Date.now() })
    next.on('ADMIN_LIVE_LESSON_CHANGED', payload => remember('ADMIN_LIVE_LESSON_CHANGED', payload))
    next.on('ADMIN_LOG_INGESTED', payload => remember('ADMIN_LOG_INGESTED', payload))
    next.on('ADMIN_OPS_EVENT_CREATED', payload => remember('ADMIN_OPS_EVENT_CREATED', payload))

    return () => {
      next.disconnect()
      setSocket(null)
      dispatch(setStoreSocketConnected(false))
    }
  }, [isAdmin, refreshMetrics, refreshOnlineUsers, dispatch])

  const value = useMemo(
    () => ({
      onlineUsers: dash.onlineUsers,
      metrics: dash.metrics,
      metricsLoading,
      socketConnected: dash.socketConnected,
      socket,
      lastEvent,
      refreshMetrics,
      refreshOnlineUsers
    }),
    [
      dash.onlineUsers,
      dash.metrics,
      dash.socketConnected,
      metricsLoading,
      socket,
      lastEvent,
      refreshMetrics,
      refreshOnlineUsers
    ]
  )

  return <AdminRealtimeContext.Provider value={value}>{children}</AdminRealtimeContext.Provider>
}

export const useAdminRealtime = () => useContext(AdminRealtimeContext)

export { AdminRealtimeContext }
