import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getDashboardSummary } from 'src/services/adminLogsApi'
import { getPendingVerificationCount } from 'src/services/verificationApi'
import { getPendingTraineeCount } from 'src/services/clipsAdminApi'
import { fetchDashboardMetrics } from 'src/services/adminDashboardApi'

export const fetchHomeDashboard = createAsyncThunk('dashboard/fetchHome', async () => {
  const [metrics, pendingVerifications, pendingTraineeReviews, logSummary] = await Promise.all([
    fetchDashboardMetrics().catch(() => null),
    getPendingVerificationCount().catch(() => 0),
    getPendingTraineeCount().catch(() => 0),
    getDashboardSummary().catch(() => null)
  ])
  return {
    metrics,
    pendingVerifications,
    pendingTraineeReviews,
    logSummary,
    fetchedAt: Date.now()
  }
})

export const fetchLogSummaryOnly = createAsyncThunk('dashboard/fetchLogSummary', async () => {
  const logSummary = await getDashboardSummary()
  return { logSummary, fetchedAt: Date.now() }
})

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    metrics: null,
    pendingVerifications: null,
    pendingTraineeReviews: null,
    logSummary: null,
    loading: false,
    error: null,
    fetchedAt: null,
    /** Live socket flag — written by AdminRealtimeProvider */
    socketConnected: false,
    onlineUsers: []
  },
  reducers: {
    setSocketConnected(state, action) {
      state.socketConnected = Boolean(action.payload)
    },
    setOnlineUsers(state, action) {
      state.onlineUsers = Array.isArray(action.payload) ? action.payload : []
    },
    setLiveMetrics(state, action) {
      state.metrics = action.payload ?? null
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchHomeDashboard.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchHomeDashboard.fulfilled, (state, action) => {
        state.loading = false
        state.metrics = action.payload.metrics
        state.pendingVerifications = action.payload.pendingVerifications
        state.pendingTraineeReviews = action.payload.pendingTraineeReviews
        state.logSummary = action.payload.logSummary
        state.fetchedAt = action.payload.fetchedAt
      })
      .addCase(fetchHomeDashboard.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'Dashboard load failed'
      })
      .addCase(fetchLogSummaryOnly.fulfilled, (state, action) => {
        state.logSummary = action.payload.logSummary
        state.fetchedAt = action.payload.fetchedAt
      })
  }
})

export const { setSocketConnected, setOnlineUsers, setLiveMetrics } = dashboardSlice.actions
export const selectDashboard = state => state.dashboard
export default dashboardSlice.reducer
