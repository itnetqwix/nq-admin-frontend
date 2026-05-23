import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import { DataGrid } from '@mui/x-data-grid'

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
    fontSize: '0.8125rem',
    fontWeight: 600
  },
  '& .MuiDataGrid-cell': {
    borderColor: 'divider',
    fontSize: '0.875rem'
  },
  '& .MuiDataGrid-row:hover': {
    bgcolor: 'action.hover'
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid',
    borderColor: 'divider'
  }
}

function NoRowsOverlay({ message }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
      <Typography variant='body2' color='text.secondary'>
        {message}
      </Typography>
    </Box>
  )
}

/**
 * DataGrid with consistent admin styling and loading bar.
 */
export default function AdminDataGrid({
  loading,
  emptyMessage = 'No records found.',
  autoHeight = true,
  clickableRows = false,
  slots,
  slotProps,
  sx,
  ...props
}) {
  const rowClickable = clickableRows || Boolean(props.onRowClick)
  return (
    <DataGrid
      autoHeight={autoHeight}
      disableRowSelectionOnClick
      pageSizeOptions={[25, 50, 100]}
      initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
      loading={loading}
      slots={{
        loadingOverlay: GridLoadingBar,
        noRowsOverlay: () => <NoRowsOverlay message={emptyMessage} />,
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
