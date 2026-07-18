/**
 * Standard admin UI kit — use across all `/apps/*` pages instead of
 * raw MUI Tabs, Materio CardStatistics, `window.confirm`, and legacy modals.
 */
export { default as AdminDataGrid } from './AdminDataGrid'
export { default as AdminGridContainer, ADMIN_LIST_GRID_HEIGHT } from './AdminGridContainer'
export { AdminLoadingState, AdminMasterDetailSkeleton } from './AdminLoadingState'
export { default as AdminRefreshButton } from './AdminRefreshButton'
export { default as AdminFilterBar } from './AdminFilterBar'
export { default as AdminConfirmDialog } from './AdminConfirmDialog'
export { default as AdminEmptyState } from './AdminEmptyState'
export { default as AdminTabs } from './AdminTabs'
export { default as OpsMetricTile } from './OpsMetricTile'
export { default as OpsSurfaceCard } from './OpsSurfaceCard'
export { default as OpsAuthShell } from './OpsAuthShell'
export { default as LogDetailDrawer } from './LogDetailDrawer'
export { default as AdminGoogleSignIn } from './AdminGoogleSignIn'
export { useAdminConfirm } from './useAdminConfirm'
