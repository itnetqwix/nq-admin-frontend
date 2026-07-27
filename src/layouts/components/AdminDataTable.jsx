import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { DataGrid } from '@mui/x-data-grid'
import styles from 'styles/common.module.css'

/**
 * Shared admin table shell: debounced search, server pagination, empty/error/retry.
 * Callers own columns + fetch; this owns the chrome.
 */
export default function AdminDataTable({
  rows,
  columns,
  loading,
  error,
  total = 0,
  page = 0,
  pageSize = 25,
  onPaginationModelChange,
  search = '',
  onSearchChange,
  searchLabel = 'Search',
  searchDebounceMs = 350,
  onRetry,
  extraFilters = null,
  height = 560,
  pageSizeOptions = [25, 50, 100],
  emptyMessage = 'No rows'
}) {
  const [localSearch, setLocalSearch] = useState(search)
  const timer = useRef(null)

  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  const emitSearch = useCallback(
    value => {
      if (!onSearchChange) return
      clearTimeout(timer.current)
      timer.current = setTimeout(() => onSearchChange(value), searchDebounceMs)
    },
    [onSearchChange, searchDebounceMs]
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  const headerClass = styles['header-class']
  const cols = useMemo(
    () =>
      (columns || []).map(c => ({
        headerClassName: c.headerClassName || headerClass,
        cellClassName: c.cellClassName || styles['cell-class'],
        ...c
      })),
    [columns, headerClass]
  )

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ md: 'center' }}>
        {onSearchChange ? (
          <TextField
            size='small'
            fullWidth
            label={searchLabel}
            value={localSearch}
            onChange={e => {
              setLocalSearch(e.target.value)
              emitSearch(e.target.value)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                clearTimeout(timer.current)
                onSearchChange(localSearch)
              }
            }}
          />
        ) : null}
        {extraFilters}
        {onRetry ? (
          <Button variant='outlined' onClick={onRetry} sx={{ flexShrink: 0 }}>
            Retry
          </Button>
        ) : null}
      </Stack>

      {error ? (
        <Alert
          severity='error'
          sx={{ mb: 2 }}
          action={
            onRetry ? (
              <Button color='inherit' size='small' onClick={onRetry}>
                Retry
              </Button>
            ) : null
          }
        >
          {error}
        </Alert>
      ) : null}

      <Box className='admin-data-grid' sx={{ height, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={cols}
          loading={loading}
          paginationMode='server'
          rowCount={total}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={onPaginationModelChange}
          pageSizeOptions={pageSizeOptions}
          disableRowSelectionOnClick
          slots={{
            noRowsOverlay: () => (
              <Stack height='100%' alignItems='center' justifyContent='center'>
                <Typography color='text.secondary'>{emptyMessage}</Typography>
              </Stack>
            )
          }}
        />
      </Box>
    </Box>
  )
}
