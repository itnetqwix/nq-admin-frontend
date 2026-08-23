import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import dashboardReducer from './slices/dashboardSlice'
import bookingsReducer from './slices/bookingsSlice'
import supportReducer from './slices/supportSlice'
import traineeReviewsReducer from './slices/traineeReviewsSlice'
import usersListReducer from './slices/usersListSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    dashboard: dashboardReducer,
    bookings: bookingsReducer,
    support: supportReducer,
    traineeReviews: traineeReviewsReducer,
    usersList: usersListReducer
  },
  // ponytail: user blobs from /user/me include Dates / nested objects
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})

export default store
