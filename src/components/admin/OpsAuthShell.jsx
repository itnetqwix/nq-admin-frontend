import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import themeConfig from 'src/configs/themeConfig'
import { ops } from 'src/styles/opsSurface'

const HIGHLIGHTS = [
  { icon: '◆', title: 'People & verifications', body: 'Trainers, trainees, and account reviews in one place.' },
  { icon: '◇', title: 'Ops & bookings', body: 'Live queues, tickets, and call diagnostics.' },
  { icon: '○', title: 'Logs & roles', body: 'Who did what, when — with admin RBAC.' }
]

/**
 * Guest auth chrome — night rail + brand + canvas form.
 */
export default function OpsAuthShell({
  eyebrow = 'Admin',
  title,
  subtitle,
  children,
  footerNote = 'Restricted · staff only'
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: ops.canvasSoft
      }}
    >
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
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(21,15,35,0.55)',
            pointerEvents: 'none'
          }}
        />
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: ops.radiusMd,
              bgcolor: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.12)',
              overflow: 'hidden'
            }}
          >
            <Image width={32} height={32} src='/images/netquix_logo.png' alt='NetQwix' style={{ objectFit: 'contain' }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, letterSpacing: '-0.4px', fontSize: 18 }}>
              {themeConfig.templateName}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.onNightMuted }}>
              Operations console
            </Typography>
          </Box>
        </Box>

        <Box sx={{ position: 'relative', maxWidth: 400 }}>
          <Typography
            sx={{
              fontFamily: ops.mono,
              fontSize: 11,
              color: ops.lime,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              mb: 1.5
            }}
          >
            {eyebrow}
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 28, letterSpacing: '-0.8px', lineHeight: 1.25, mb: 1.5 }}>
            Run the platform with confidence.
          </Typography>
          <Typography sx={{ fontSize: 14, color: ops.onNightMuted, lineHeight: 1.65, mb: 3 }}>
            Sign in with your administrator email or Google account. Sessions are logged for security and audit.
          </Typography>
          <Stack spacing={1.75}>
            {HIGHLIGHTS.map(h => (
              <Box key={h.title} sx={{ display: 'flex', gap: 1.5 }}>
                <Typography sx={{ color: ops.lime, fontFamily: ops.mono, fontSize: 12, mt: 0.25 }}>{h.icon}</Typography>
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
            <Image width={36} height={36} src='/images/netquix_logo.png' alt='NetQwix' style={{ objectFit: 'contain' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{themeConfig.templateName}</Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>Admin</Typography>
            </Box>
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
