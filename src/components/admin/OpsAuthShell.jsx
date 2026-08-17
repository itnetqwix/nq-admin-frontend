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
  footerNote = 'Restricted · invite only'
}) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', bgcolor: ops.canvasSoft }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 5, lg: 6.5 },
          position: 'relative',
          overflow: 'hidden',
          bgcolor: ops.night,
          color: ops.onNight,
          backgroundImage: ops.meshAuth
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(14,18,24,0.55)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Image
            width={148}
            height={36}
            src='/images/netquix_logo.png'
            alt='NetQwix'
            style={{ objectFit: 'contain', objectPosition: 'left center' }}
          />
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.onNightMuted, letterSpacing: '0.06em' }}>
            Match desk
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', maxWidth: 440 }}>
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
          <Typography
            sx={{
              fontFamily: ops.scoreboard,
              fontWeight: 600,
              fontSize: { md: 36, lg: 42 },
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              mb: 1.75
            }}
          >
            {themeConfig.templateName} operations
          </Typography>
          <Typography sx={{ fontSize: 15, color: ops.onNightMuted, lineHeight: 1.65, mb: 3.5, maxWidth: 380 }}>
            Sign in with an invited administrator email. Sessions are logged. New staff cannot self-register.
          </Typography>
          <Stack spacing={2}>
            {HIGHLIGHTS.map(h => (
              <Box key={h.title} sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: ops.live, mt: 0.7, flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 0.25, letterSpacing: '-0.2px' }}>
                    {h.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: ops.onNightMuted, lineHeight: 1.5 }}>{h.body}</Typography>
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
          width: { xs: '100%', md: 480, lg: 520 },
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 5 },
          pt: { xs: 'max(20px, env(safe-area-inset-top, 20px))', sm: 5 },
          pb: { xs: 'max(20px, env(safe-area-inset-bottom, 20px))', sm: 5 },
          bgcolor: ops.canvas,
          boxShadow: { md: 'inset 1px 0 0 ' + ops.hairline }
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 3.5 }}>
            <Image
              width={148}
              height={36}
              src='/images/netquix_logo.png'
              alt='NetQwix'
              style={{ objectFit: 'contain', objectPosition: 'left center' }}
            />
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
          <Typography sx={{ fontWeight: 600, fontSize: 24, letterSpacing: '-0.6px', color: ops.ink, mb: 0.75 }}>
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
