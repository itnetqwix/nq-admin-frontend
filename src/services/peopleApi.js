import { adminApi } from 'src/services/adminApi'

export const getGrowthOverview = days => adminApi.get('/admin/growth/overview', { query: { days } })
export const getGrowthFunnel = (days, role = 'Trainee') => adminApi.get('/admin/growth/funnel', { query: { days, role } })
export const getGrowthCohorts = ({ granularity = 'week', cohorts = 12, role = 'Trainee', metric = 'retention' } = {}) =>
  adminApi.get('/admin/growth/cohorts', { query: { granularity, cohorts, role, metric } })
export const getGrowthSegments = () => adminApi.get('/admin/growth/segments')
export const getGrowthSupply = () => adminApi.get('/admin/growth/supply')
export const getUserTrajectory = userId => adminApi.get(`/admin/users/${encodeURIComponent(userId)}/trajectory`)
export const getUserMetrics = ids => adminApi.post('/admin/users/metrics', { ids })
