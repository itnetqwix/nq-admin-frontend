import { getPendingTraineeAccounts } from 'src/services/clipsAdminApi'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { createListState } from 'src/services/adminListApi'

export const fetchTraineeReviews = createAsyncThunk(
  'traineeReviews/fetchList',
  async (params, { getState }) => {
    const cur = getState().traineeReviews
    const query = {
      page: params?.page ?? cur.page,
      limit: params?.limit ?? cur.limit,
      q: params?.search ?? cur.search
    }
    const data = await getPendingTraineeAccounts(query)
    return {
      items: (data?.items || []).map(r => ({
        ...r,
        id: r._id || r.id,
        submitted: r.updatedAt || r.createdAt
      })),
      total: Number(data?.total) || 0,
      page: Number(data?.page) || query.page,
      limit: Number(data?.limit) || query.limit,
      query
    }
  }
)

const traineeReviewsSlice = createSlice({
  name: 'traineeReviews',
  initialState: createListState({ limit: 30 }),
  reducers: {
    setTraineeReviewSearch(state, action) {
      state.search = action.payload || ''
      state.page = 1
    },
    setTraineeReviewPage(state, action) {
      const { page, limit } = action.payload || {}
      if (page != null) state.page = page
      if (limit != null) state.limit = limit
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTraineeReviews.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTraineeReviews.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.search = action.payload.query.q || ''
        state.fetchedAt = Date.now()
      })
      .addCase(fetchTraineeReviews.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'Failed to load'
        state.items = []
        state.total = 0
      })
  }
})

export const { setTraineeReviewSearch, setTraineeReviewPage } = traineeReviewsSlice.actions
export const selectTraineeReviews = state => state.traineeReviews
export default traineeReviewsSlice.reducer
