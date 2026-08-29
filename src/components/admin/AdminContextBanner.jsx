import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import { ops } from 'src/styles/opsSurface'

/**
 * Single contextual help strip — step label, hint, optional next + side links.
 * Replaces duplicate tab chip rows under main AdminTabs.
 */
export default function AdminContextBanner({
  stepLabel,
  title,
  description,
  nextLabel,
  onNext,
  links = [],
  sx
}) {
  return (
    <Box
      sx={{
        mb: 2.5,
        p: { xs: 1.5, sm: 2 },
        borderRadius: ops.radiusLg,
        bgcolor: ops.canvasSoft,
        boxShadow: ops.shadowCard,
        ...sx
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        justifyContent='space-between'
      >
        <Box sx={{ minWidth: 0 }}>
          {stepLabel ? (
            <Typography
              sx={{
                fontFamily: ops.mono,
                fontSize: 11,
                color: ops.mute,
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}
            >
              {stepLabel}
            </Typography>
          ) : null}
          {title ? (
            <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mt: 0.25 }}>{title}</Typography>
          ) : null}
          {description ? (
            <Typography sx={{ fontSize: 13, color: ops.body, mt: 0.5, lineHeight: 1.5, maxWidth: 720 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
          {links.map(link => (
            <Chip
              key={link.href || link.label}
              component={link.href ? Link : 'div'}
              href={link.href}
              clickable={!!link.href}
              size='small'
              label={link.label}
              variant='outlined'
              onClick={link.onClick}
              sx={{ fontFamily: ops.mono, fontSize: 11 }}
            />
          ))}
          {nextLabel && onNext ? (
            <Button
              size='small'
              variant='contained'
              onClick={onNext}
              sx={{
                textTransform: 'none',
                bgcolor: ops.ink,
                borderRadius: ops.radiusSm,
                '&:hover': { bgcolor: '#000' }
              }}
            >
              {nextLabel}
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  )
}
