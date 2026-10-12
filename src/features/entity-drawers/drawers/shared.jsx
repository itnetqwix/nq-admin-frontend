import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'

export const DrawerLoading = () => (
  <Box sx={{ display: 'grid', gap: 1.5 }}>
    <Skeleton variant='rounded' height={28} width='60%' />
    <Skeleton variant='rounded' height={90} />
    <Skeleton variant='rounded' height={90} />
  </Box>
)

export const DrawerError = ({ error, onRetry }) => (
  <Box sx={{ p: 2, borderRadius: ops.radiusMd, bgcolor: ops.dangerBg, border: `1px solid ${ops.dangerBorder}` }}>
    <Typography sx={{ fontWeight: 600, color: ops.dangerFg, fontSize: 14 }}>Couldn’t load this</Typography>
    <Typography sx={{ fontSize: 13, color: ops.dangerFg, mt: 0.5 }}>
      {error?.message || 'Something went wrong.'}
      {error?.requestId ? ` (request ${error.requestId})` : ''}
    </Typography>
    {onRetry ? (
      <Box component='button' onClick={onRetry} sx={{ mt: 1, border: 0, bgcolor: 'transparent', color: ops.dangerFg, textDecoration: 'underline', cursor: 'pointer', p: 0, fontSize: 13 }}>
        Try again
      </Box>
    ) : null}
  </Box>
)

/** Label / value rows used by every drawer tab. */
export const FactList = ({ rows }) => (
  <Box component='dl' sx={{ m: 0, display: 'grid', gridTemplateColumns: 'minmax(110px, 38%) 1fr', rowGap: 1, columnGap: 2 }}>
    {rows
      .filter(r => r && r.value !== undefined && r.value !== null && r.value !== '')
      .map(r => (
        <Box key={r.label} sx={{ display: 'contents' }}>
          <Box component='dt' sx={{ fontSize: 12, color: ops.mute }}>{r.label}</Box>
          <Box component='dd' sx={{ m: 0, fontSize: 13, fontWeight: r.strong ? 600 : 400, wordBreak: 'break-word' }}>{r.value}</Box>
        </Box>
      ))}
  </Box>
)

export const SectionTitle = ({ children }) => (
  <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
    {children}
  </Typography>
)
