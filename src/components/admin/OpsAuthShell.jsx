import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import themeConfig from 'src/configs/themeConfig'
import { ops } from 'src/styles/opsSurface'

/**
 * Guest auth chrome — night rail + Vercel mesh + canvas form.
 * Mesh is auth-hero only (not used on /apps/*).
 */
export default function OpsAuthShell({ eyebrow = 'Admin', title, subtitle, children }) {
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
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Image width={28} height={34} src='/images/apple-touch-icon.png' alt='' />
          <Typography sx={{ fontWeight: 700, letterSpacing: '-0.4px', fontSize: 18 }}>
            {themeConfig.templateName}
          </Typography>
        </Box>
        <Box sx={{ position: 'relative', maxWidth: 360 }}>
          <Typography
            sx={{
              fontFamily: ops.mono,
              fontSize: 11,
              color: ops.onNightMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              mb: 1.5
            }}
          >
            {eyebrow}
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 28, letterSpacing: '-0.8px', lineHeight: 1.25, mb: 1.5 }}>
            Operations console
          </Typography>
          <Typography sx={{ fontSize: 14, color: ops.onNightMuted, lineHeight: 1.6 }}>
            Sign in with your administrator account. Session access is logged for platform security.
          </Typography>
        </Box>
        <Typography sx={{ position: 'relative', fontFamily: ops.mono, fontSize: 11, color: ops.onNightMuted }}>
          Restricted · staff only
        </Typography>
      </Box>

      <Box
        sx={{
          width: { xs: '100%', md: 440, lg: 480 },
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
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Image width={28} height={34} src='/images/apple-touch-icon.png' alt='' />
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{themeConfig.templateName}</Typography>
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
