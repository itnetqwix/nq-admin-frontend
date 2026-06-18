import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'
import AdminRefreshButton from './AdminRefreshButton'

/**
 * Standard search + refresh row above admin tables.
 */
export default function AdminFilterBar({
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onRefresh,
  refreshLoading,
  resultCount,
  children,
  endAdornment,
  helperText
}) {
  return (
    <Stack spacing={1.25} sx={{ mb: 2.5 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        justifyContent='space-between'
      >
        <Stack direction='row' spacing={1.5} alignItems='center' flexWrap='wrap' useFlexGap sx={{ flex: 1, minWidth: 0 }}>
          {searchPlaceholder != null ? (
            <TextField
              size='small'
              label={searchLabel || undefined}
              placeholder={searchPlaceholder}
              value={searchValue ?? ''}
              onChange={onSearchChange}
              onKeyDown={e => {
                if (e.key === 'Enter' && onSearchSubmit) onSearchSubmit()
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon fontSize='small' color='action' />
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: { xs: '100%', sm: 280 }, maxWidth: 420 }}
            />
          ) : null}
          {children}
        </Stack>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
          {typeof resultCount === 'number' ? (
            <Chip size='small' variant='outlined' label={`${resultCount.toLocaleString()} results`} />
          ) : null}
          {onRefresh ? <AdminRefreshButton onClick={onRefresh} loading={refreshLoading} /> : null}
          {endAdornment}
        </Box>
      </Stack>
      {helperText ? (
        <Box component='span' sx={{ typography: 'caption', color: 'text.secondary', lineHeight: 1.5 }}>
          {helperText}
        </Box>
      ) : null}
    </Stack>
  )
}
