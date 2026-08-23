import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { createListState, fetchAdminList } from 'src/services/adminListApi'

/**
 * Factory for paginated admin list slices (bookings, support, etc.).
 */
export function createAdminListSlice({
  name,
  listPath,
  buildQuery,
  initialFilters = {},
  mapQueryToFilters
}) {
  const fetchList = createAsyncThunk(`${name}/fetchList`, async (params, { getState }) => {
    const cur = getState()[name]
    const query = buildQuery(cur, params)
    const data = await fetchAdminList(listPath, query)
    return { ...data, query }
  })

  const slice = createSlice({
    name,
    initialState: createListState({ filters: initialFilters }),
    reducers: {
      setFilters(state, action) {
        state.filters = { ...state.filters, ...action.payload }
        state.page = 1
      },
      setSearch(state, action) {
        state.search = action.payload || ''
        state.page = 1
      },
      setPage(state, action) {
        const { page, limit } = action.payload || {}
        if (page != null) state.page = page
        if (limit != null) state.limit = limit
      },
      resetList(state) {
        state.items = []
        state.total = 0
        state.error = null
      }
    },
    extraReducers: builder => {
      builder
        .addCase(fetchList.pending, state => {
          state.loading = true
          state.error = null
        })
        .addCase(fetchList.fulfilled, (state, action) => {
          state.loading = false
          state.items = action.payload.items
          state.total = action.payload.total
          state.page = action.payload.query.page
          state.limit = action.payload.query.limit
          state.search = action.payload.query.search || ''
          if (mapQueryToFilters) {
            state.filters = mapQueryToFilters(action.payload.query, state.filters)
          }
          state.counts = action.payload.counts
          state.fetchedAt = Date.now()
        })
        .addCase(fetchList.rejected, (state, action) => {
          state.loading = false
          state.error = action.error?.message || 'Failed to load list'
          state.items = []
          state.total = 0
        })
    }
  })

  return {
    reducer: slice.reducer,
    actions: slice.actions,
    fetchList,
    select: state => state[name]
  }
}
