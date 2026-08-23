import { createAdminListSlice } from '../createAdminListSlice'

const bookings = createAdminListSlice({
  name: 'bookings',
  listPath: '/admin/bookings',
  initialFilters: { status: '', from: '', to: '' },
  buildQuery: (cur, params) => ({
    page: params?.page ?? cur.page,
    limit: params?.limit ?? cur.limit,
    search: params?.search ?? cur.search,
    status: params?.status ?? cur.filters.status ?? '',
    from: params?.from ?? cur.filters.from ?? '',
    to: params?.to ?? cur.filters.to ?? ''
  }),
  mapQueryToFilters: (query, prev) => ({
    ...prev,
    status: query.status || '',
    from: query.from || '',
    to: query.to || ''
  })
})

export const fetchBookings = bookings.fetchList
export const { setFilters: setBookingFilters, setSearch: setBookingSearch, setPage: setBookingPage } =
  bookings.actions
export const selectBookings = bookings.select
export default bookings.reducer
