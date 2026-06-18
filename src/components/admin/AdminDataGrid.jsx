import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import { DataGrid } from '@mui/x-data-grid'
import AdminEmptyState from './AdminEmptyState'

function GridLoadingBar() {
  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }}>
      <LinearProgress />
    </Box>
  )
}

const defaultSx = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: 'action.hover',
    borderRadius: 0,
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  },
  '& .MuiDataGrid-cell': {
    borderColor: 'divider',
    fontSize: '0.875rem',
    lineHeight: 1.45
  },
  '& .MuiDataGrid-row:nth-of-type(even)': {
    bgcolor: 'action.hover'
  },
  '& .MuiDataGrid-row:hover': {
    bgcolor: theme => `${theme.palette.primary.main}08`
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid',
    borderColor: 'divider',
    minHeight: 52
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
 * DataGrid with consistent admin styling and loading bar.
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
