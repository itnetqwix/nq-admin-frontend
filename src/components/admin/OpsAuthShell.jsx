import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import themeConfig from 'src/configs/themeConfig'
import { ops } from 'src/styles/opsSurface'

const HIGHLIGHTS = [
  { title: 'People', body: 'Trainers, trainees, and account reviews.' },
  { title: 'Live desk', body: 'Lessons, tickets, and call diagnostics as they happen.' },
  { title: 'Audit', body: 'Who did what, from which app, with RBAC.' }
]

export default function OpsAuthShell({
  eyebrow = 'Admin',
  title,
  subtitle,
  children,
  footerNote = 'Restricted · staff only'
}) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: ops.canvasSoft }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 5,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: ops.night,
          color: ops.onNight,
          backgroundImage: ops.meshAuth
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(14,18,24,0.55)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box
            sx={{
              height: 40,
              px: 1.25,
              borderRadius: ops.radiusMd,
              bgcolor: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          >
            <Image width={120} height={28} src='/images/netquix_logo.png' alt='NetQwix' style={{ objectFit: 'contain' }} />
          </Box>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.onNightMuted }}>Match desk</Typography>
        </Box>

        <Box sx={{ position: 'relative', maxWidth: 400 }}>
          <Typography
            sx={{
              fontFamily: ops.mono,
              fontSize: 11,
              color: ops.live,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              mb: 1.5
            }}
          >
            {eyebrow}
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 28, letterSpacing: '-0.8px', lineHeight: 1.25, mb: 1.5 }}>
            {themeConfig.templateName} operations
          </Typography>
          <Typography sx={{ fontSize: 14, color: ops.onNightMuted, lineHeight: 1.65, mb: 3 }}>
            Sign in with your administrator email. Sessions are logged.
          </Typography>
          <Stack spacing={1.75}>
            {HIGHLIGHTS.map(h => (
              <Box key={h.title} sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: ops.live, mt: 0.75, flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.25 }}>{h.title}</Typography>
                  <Typography sx={{ fontSize: 12, color: ops.onNightMuted, lineHeight: 1.5 }}>{h.body}</Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>

        <Typography sx={{ position: 'relative', fontFamily: ops.mono, fontSize: 11, color: ops.onNightMuted }}>
          {footerNote}
        </Typography>
      </Box>

      <Box
        sx={{
          width: { xs: '100%', md: 460, lg: 500 },
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5 },
          bgcolor: ops.canvas,
          boxShadow: { md: 'inset 1px 0 0 ' + ops.hairline }
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 3.5 }}>
            <Image width={132} height={32} src='/images/netquix_logo.png' alt='NetQwix' style={{ objectFit: 'contain' }} />
          </Box>
          <Typography
            sx={{
              fontFamily: ops.mono,
              fontSize: 11,
              color: ops.mute,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              mb: 1
            }}
          >
            {eyebrow}
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 22, letterSpacing: '-0.6px', color: ops.ink, mb: 0.75 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ fontSize: 14, color: ops.body, lineHeight: 1.55, mb: 3 }}>{subtitle}</Typography>
          ) : (
            <Box sx={{ mb: 3 }} />
          )}
          {children}
        </Box>
      </Box>
    </Box>
  )
}
