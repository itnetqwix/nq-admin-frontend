import { combineReducers } from '@reduxjs/toolkit'
import { createAdminListSlice } from '../createAdminListSlice'

const writeUsPkg = createAdminListSlice({
  name: 'supportWriteUs',
  listPath: '/admin/write-us',
  selectState: state => state.support.writeUs,
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
  selectState: state => state.support.raiseConcern,
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

export const selectWriteUs = writeUsPkg.select
export const selectRaiseConcern = raiseConcernPkg.select

export default combineReducers({
  writeUs: writeUsPkg.reducer,
  raiseConcern: raiseConcernPkg.reducer
})
