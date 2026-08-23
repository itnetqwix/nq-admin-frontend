import { combineReducers } from '@reduxjs/toolkit'
import { createAdminListSlice } from '../createAdminListSlice'

const writeUsPkg = createAdminListSlice({
  name: 'supportWriteUs',
  listPath: '/admin/write-us',
  initialFilters: { status: '' },
  buildQuery: (cur, params) => ({
    page: params?.page ?? cur.page,
    limit: params?.limit ?? cur.limit,
    search: params?.search ?? cur.search,
    status: params?.status ?? cur.filters.status ?? ''
  }),
  mapQueryToFilters: (query, prev) => ({ ...prev, status: query.status || '' })
})

const raiseConcernPkg = createAdminListSlice({
  name: 'supportRaiseConcern',
  listPath: '/admin/raise-concern',
  initialFilters: { status: '', reason: '' },
  buildQuery: (cur, params) => ({
    page: params?.page ?? cur.page,
    limit: params?.limit ?? cur.limit,
    search: params?.search ?? cur.search,
    status: params?.status ?? cur.filters.status ?? '',
    reason: params?.reason ?? cur.filters.reason ?? ''
  }),
  mapQueryToFilters: (query, prev) => ({
    ...prev,
    status: query.status || '',
    reason: query.reason || ''
  })
})

export const fetchWriteUs = writeUsPkg.fetchList
export const fetchRaiseConcern = raiseConcernPkg.fetchList

export const {
  setFilters: setWriteUsFilters,
  setSearch: setWriteUsSearch,
  setPage: setWriteUsPage
} = writeUsPkg.actions

export const {
  setFilters: setRaiseConcernFilters,
  setSearch: setRaiseConcernSearch,
  setPage: setRaiseConcernPage
} = raiseConcernPkg.actions

export const selectWriteUs = state => state.support.writeUs
export const selectRaiseConcern = state => state.support.raiseConcern

export default combineReducers({
  writeUs: writeUsPkg.reducer,
  raiseConcern: raiseConcernPkg.reducer
})
