import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getOpsEvents, getOpsStats } from 'src/services/opsApi'
import { listFailedJobs } from 'src/services/adminOpsApi'

const defaultEventFilters = {
  category: '',
  severity: '',
  resolution: '',
  userId: '',
  sessionId: '',
  instantOnly: false,
  refundRelated: false,
  eventType: '',
  search: '',
  fromDate: '',
  toDate: ''
}

const initialState = {
  stats: null,
  statsLoading: false,
  statsFetchedAt: null,
  events: {
    items: [],
    total: 0,
    page: 1,
    limit: 25,
    loading: false,
    error: null,
    filters: { ...defaultEventFilters }
  },
  jobs: {
    items: [],
    total: 0,
    page: 1,
    limit: 25,
    loading: false,
    error: null,
    available: true,
    search: ''
  }
}

function buildEventsQuery(state, overrides = {}) {
  const { filters, page, limit } = { ...state.events, ...overrides }
  const q = { page, limit }
  if (filters.category) q.category = filters.category
  if (filters.severity) q.severity = filters.severity
  if (filters.resolution) q.resolution_status = filters.resolution
  if (filters.userId?.trim()) q.userId = filters.userId.trim()
  if (filters.sessionId?.trim()) q.sessionId = filters.sessionId.trim()
  if (filters.instantOnly) q.instant_only = 'true'
  if (filters.refundRelated) q.refund_related = 'true'
  if (filters.eventType?.trim()) q.event_type = filters.eventType.trim()
  if (filters.search?.trim()) q.search = filters.search.trim()
  if (filters.fromDate) q.from = new Date(filters.fromDate).toISOString()
  if (filters.toDate) q.to = new Date(`${filters.toDate}T23:59:59`).toISOString()
  return q
}

export const fetchOpsStats = createAsyncThunk('ops/fetchStats', async (_, { getState }) => {
  const { statsFetchedAt } = getState().ops
  // ponytail: refresh stats at most every 60s unless forced via fulfilled reset
  if (statsFetchedAt && Date.now() - statsFetchedAt < 60_000) {
    return getState().ops.stats
  }
  return getOpsStats()
})

export const fetchOpsEvents = createAsyncThunk('ops/fetchEvents', async (patch, { getState }) => {
  const state = getState().ops
  const merged = {
    page: patch?.page ?? state.events.page,
    limit: patch?.limit ?? state.events.limit,
    filters: patch?.filters ? { ...state.events.filters, ...patch.filters } : state.events.filters
  }
  const data = await getOpsEvents(buildEventsQuery({ events: merged }))
  return { ...data, page: merged.page, limit: merged.limit, filters: merged.filters }
})

export const fetchFailedJobsList = createAsyncThunk('ops/fetchFailedJobs', async (patch, { getState }) => {
  const state = getState().ops.jobs
  const page = patch?.page ?? state.page
  const limit = patch?.limit ?? state.limit
  const search = patch?.search ?? state.search
  const data = await listFailedJobs({ page, limit, search })
  return { ...data, page, limit, search }
})

const opsSlice = createSlice({
  name: 'ops',
  initialState,
  reducers: {
    setOpsEventFilters(state, action) {
      state.events.filters = { ...state.events.filters, ...action.payload }
      state.events.page = 1
    },
    setOpsEventPage(state, action) {
      const { page, limit } = action.payload || {}
      if (page != null) state.events.page = page
      if (limit != null) state.events.limit = limit
    },
    setFailedJobsSearch(state, action) {
      state.jobs.search = action.payload || ''
      state.jobs.page = 1
    },
    setFailedJobsPage(state, action) {
      const { page, limit } = action.payload || {}
      if (page != null) state.jobs.page = page
      if (limit != null) state.jobs.limit = limit
    },
    invalidateOpsStats(state) {
      state.statsFetchedAt = null
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchOpsStats.pending, state => {
        state.statsLoading = true
      })
      .addCase(fetchOpsStats.fulfilled, (state, action) => {
        state.statsLoading = false
        state.stats = action.payload
        state.statsFetchedAt = Date.now()
      })
      .addCase(fetchOpsStats.rejected, state => {
        state.statsLoading = false
      })
      .addCase(fetchOpsEvents.pending, state => {
        state.events.loading = true
        state.events.error = null
      })
      .addCase(fetchOpsEvents.fulfilled, (state, action) => {
        state.events.loading = false
        state.events.items = (action.payload?.items || []).map((r, i) => ({
          id: r._id || r.event_id || i,
          ...r,
          userLabel: r.user_id?.fullname || r.user_id?.email || r.user_id || '—',
          at: r.createdAt
        }))
        state.events.total = action.payload?.total ?? 0
        state.events.page = action.payload.page
        state.events.limit = action.payload.limit
        state.events.filters = action.payload.filters
      })
      .addCase(fetchOpsEvents.rejected, (state, action) => {
        state.events.loading = false
        state.events.error = action.error?.message || 'Failed to load ops events'
        state.events.items = []
      })
      .addCase(fetchFailedJobsList.pending, state => {
        state.jobs.loading = true
        state.jobs.error = null
      })
      .addCase(fetchFailedJobsList.fulfilled, (state, action) => {
        state.jobs.loading = false
        state.jobs.available = action.payload.available
        state.jobs.total = action.payload.total ?? 0
        state.jobs.page = action.payload.page
        state.jobs.limit = action.payload.limit
        state.jobs.search = action.payload.search
        state.jobs.items = (action.payload.rows || []).map(r => ({
          ...r,
          why: r.why || r.failedReason
        }))
      })
      .addCase(fetchFailedJobsList.rejected, (state, action) => {
        state.jobs.loading = false
        state.jobs.error = action.error?.message || 'Failed to load jobs'
        state.jobs.items = []
      })
  }
})

export const {
  setOpsEventFilters,
  setOpsEventPage,
  setFailedJobsSearch,
  setFailedJobsPage,
  invalidateOpsStats
} = opsSlice.actions

export const selectOpsStats = state => state.ops.stats
export const selectOpsEvents = state => state.ops.events
export const selectFailedJobs = state => state.ops.jobs

export default opsSlice.reducer
