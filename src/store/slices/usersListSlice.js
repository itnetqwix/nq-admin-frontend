import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { listUsers } from 'src/services/userAdminApi'
import { createListState } from 'src/services/adminListApi'

const defaultFilters = {
  account_type: '',
  status: '',
  category: '',
  login_type: '',
  time_zone: '',
  country: '',
  from: '',
  to: '',
  min_sessions: '',
  max_sessions: '',
  kyc: ''
}

export const fetchUsersList = createAsyncThunk('usersList/fetchList', async (params, { getState }) => {
  const cur = getState().usersList
  const query = {
    page: params?.page ?? cur.page,
    limit: params?.limit ?? cur.limit,
    search: params?.search ?? cur.search,
    account_type: params?.account_type ?? cur.filters.account_type ?? '',
    status: params?.status ?? cur.filters.status ?? '',
    category: params?.category ?? cur.filters.category ?? '',
    login_type: params?.login_type ?? cur.filters.login_type ?? '',
    time_zone: params?.time_zone ?? cur.filters.time_zone ?? '',
    country: params?.country ?? cur.filters.country ?? '',
    from: params?.from ?? cur.filters.from ?? '',
    to: params?.to ?? cur.filters.to ?? '',
    min_sessions: params?.min_sessions ?? cur.filters.min_sessions ?? '',
    max_sessions: params?.max_sessions ?? cur.filters.max_sessions ?? '',
    kyc: params?.kyc ?? cur.filters.kyc ?? ''
  }
  const data = await listUsers(query)
  return { ...data, query }
})

const usersListSlice = createSlice({
  name: 'usersList',
  initialState: createListState({ filters: { ...defaultFilters }, limit: 25 }),
  reducers: {
    setUsersFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
      state.page = 1
    },
    setUsersSearch(state, action) {
      state.search = action.payload || ''
      state.page = 1
    },
    setUsersPage(state, action) {
      const { page, limit } = action.payload || {}
      if (page != null) state.page = page
      if (limit != null) state.limit = limit
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUsersList.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsersList.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.search = action.payload.query.search || ''
        state.filters = {
          account_type: action.payload.query.account_type || '',
          status: action.payload.query.status || '',
          category: action.payload.query.category || '',
          login_type: action.payload.query.login_type || '',
          time_zone: action.payload.query.time_zone || '',
          country: action.payload.query.country || '',
          from: action.payload.query.from || '',
          to: action.payload.query.to || '',
          min_sessions: action.payload.query.min_sessions || '',
          max_sessions: action.payload.query.max_sessions || '',
          kyc: action.payload.query.kyc || ''
        }
        state.counts = action.payload.counts
        state.fetchedAt = Date.now()
      })
      .addCase(fetchUsersList.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'Failed to load users'
        state.items = []
        state.total = 0
      })
  }
})

export const { setUsersFilters, setUsersSearch, setUsersPage } = usersListSlice.actions
export const selectUsersList = state => state.usersList
export default usersListSlice.reducer
