import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import { DataGrid } from '@mui/x-data-grid'
import AdminEmptyState from './AdminEmptyState'
import { ops } from 'src/styles/opsSurface'

function GridLoadingBar() {
  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }}>
      <LinearProgress color='secondary' />
    </Box>
  )
}

const defaultSx = {
  border: 'none',
  fontFamily: ops.sans,
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: ops.canvasSoft,
    borderRadius: 0,
    borderBottom: `1px solid ${ops.hairline}`
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontFamily: ops.mono,
    fontSize: '0.6875rem',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: ops.mute
  },
  '& .MuiDataGrid-cell': {
    borderColor: ops.hairline,
    fontSize: '0.875rem',
    lineHeight: 1.45,
    borderBottom: `1px solid ${ops.hairline}`
  },
  '& .MuiDataGrid-row:nth-of-type(even)': {
    bgcolor: 'transparent'
  },
  '& .MuiDataGrid-row:hover': {
    bgcolor: `${ops.canvasSoft} !important`
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: `1px solid ${ops.hairline}`,
    minHeight: 52
  },
  '& .MuiTablePagination-root': {
    fontFamily: ops.mono,
    fontSize: 12
  }
}

function NoRowsOverlay({ message, description, onAction, actionLabel }) {
  return (
    <AdminEmptyState
      compact
      title={message}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  )
}

/**
 * Ops Surface data grid — mono headers, hairline rows, soft hover.
 */
export default function AdminDataGrid({
  loading,
  emptyMessage = 'No records found',
  emptyDescription = 'Try adjusting filters or refresh the list.',
  emptyActionLabel,
  onEmptyAction,
  autoHeight = true,
  clickableRows = false,
  density = 'comfortable',
  slots,
  slotProps,
  sx,
  ...props
}) {
  const rowClickable = clickableRows || Boolean(props.onRowClick)
  return (
    <DataGrid
      autoHeight={autoHeight}
      density={density}
      disableRowSelectionOnClick
      pageSizeOptions={[25, 50, 100]}
      initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
      loading={loading}
      slots={{
        loadingOverlay: GridLoadingBar,
        noRowsOverlay: () => (
          <NoRowsOverlay
            message={emptyMessage}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        ),
        ...slots
      }}
      slotProps={{ ...slotProps }}
      sx={{
        ...defaultSx,
        ...(rowClickable ? { '& .MuiDataGrid-row': { cursor: 'pointer' } } : {}),
        ...sx
      }}
      {...props}
    />
  )
}
