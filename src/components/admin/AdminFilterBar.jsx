import Box from '@mui/material/Box'
import InputLabel from '@mui/material/InputLabel'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import AdminRefreshButton from './AdminRefreshButton'

/**
 * Standard search + refresh row above admin tables.
 */
export default function AdminFilterBar({
  searchLabel = 'Search',
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onRefresh,
  refreshLoading,
  children,
  endAdornment
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems={{ sm: 'center' }}
      justifyContent='space-between'
      sx={{ mb: 2 }}
    >
      <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap sx={{ flex: 1, minWidth: 0 }}>
        {searchPlaceholder != null ? (
          <>
            {searchLabel ? (
              <InputLabel sx={{ color: 'text.secondary', fontSize: '0.875rem', flexShrink: 0 }}>
                {searchLabel}
              </InputLabel>
            ) : null}
            <TextField
              size='small'
              placeholder={searchPlaceholder}
              value={searchValue ?? ''}
              onChange={onSearchChange}
              sx={{ minWidth: { xs: '100%', sm: 220 }, maxWidth: 400 }}
            />
          </>
        ) : null}
        {children}
      </Stack>
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        {onRefresh ? <AdminRefreshButton onClick={onRefresh} loading={refreshLoading} /> : null}
        {endAdornment}
      </Box>
    </Stack>
  )
}
