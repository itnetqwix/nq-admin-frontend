import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import Icon from 'src/@core/components/icon'
import themeConfig from 'src/configs/themeConfig'
import { ops } from 'src/styles/opsSurface'

const HIGHLIGHTS = [
  {
    icon: 'mdi:account-group-outline',
    title: 'People & Access Control',
    body: 'Manage trainers, trainees, and fine-grained role permissions.',
    color: '#60A5FA',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.25)'
  },
  {
    icon: 'mdi:chart-timeline-variant-shimmer',
    title: 'Live Desk Operations',
    body: 'Real-time telemetry, active lessons, tickets, and session metrics.',
    color: '#34D399',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)'
  },
  {
    icon: 'mdi:shield-check-outline',
    title: 'Audit & Compliance',
    body: 'Immutable activity logs, IP tracking, and enterprise RBAC.',
    color: '#A78BFA',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.25)'
  },
  {
    icon: 'mdi:lightning-bolt-outline',
    title: 'High-Velocity Match Desk',
    body: 'Edge-accelerated scheduling, auto-sync, and sub-second latency.',
    color: '#FBBF24',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)'
  }
]

export default function OpsAuthShell({
  eyebrow = 'Admin',
  title,
  subtitle,
  children,
  footerNote = 'Restricted · invite only'
}) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        bgcolor: '#080B11',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Ambient Glow & Grid Layer across entire viewport */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 70% 50% at 20% 15%, rgba(99, 102, 241, 0.14), transparent 70%),
            radial-gradient(ellipse 60% 45% at 80% 85%, rgba(59, 130, 246, 0.12), transparent 65%),
            radial-gradient(ellipse 50% 40% at 50% 100%, rgba(16, 185, 129, 0.08), transparent 60%)
          `,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse 85% 75% at 50% 50%, #000 40%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Left Showcase Pane (Desktop >= 1024px) */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flex: { lg: '1 1 52%', xl: '1 1 55%' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { lg: 6, xl: 8 },
          position: 'relative',
          zIndex: 1,
          borderRight: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {/* Brand Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Image
            width={145}
            height={36}
            src='/images/netquix_logo.png'
            alt='NetQwix'
            style={{ objectFit: 'contain', objectPosition: 'left center', filter: 'brightness(1.15)' }}
            priority
          />
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.45,
              borderRadius: '999px',
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 8,
                height: 8
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  bgcolor: ops.live,
                  opacity: 0.75,
                  animation: 'radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                  '@keyframes radarPing': {
                    '0%': { transform: 'scale(1)', opacity: 0.8 },
                    '75%, 100%': { transform: 'scale(2.6)', opacity: 0 }
                  }
                }}
              />
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: ops.live,
                  boxShadow: `0 0 8px ${ops.live}`
                }}
              />
            </Box>
            <Typography
              sx={{
                fontFamily: ops.mono,
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}
            >
              Match Desk
            </Typography>
          </Box>
        </Box>

        {/* Center Hero Content */}
        <Box sx={{ maxWidth: 580, my: 'auto', py: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: '999px',
              bgcolor: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              mb: 2.5
            }}
          >
            <Typography
              sx={{
                fontFamily: ops.mono,
                fontSize: 11,
                fontWeight: 600,
                color: '#818CF8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              {eyebrow} Console
            </Typography>
          </Box>

          <Typography
            sx={{
              fontFamily: ops.scoreboard,
              fontWeight: 700,
              fontSize: { lg: 38, xl: 46 },
              letterSpacing: '-0.025em',
              lineHeight: 1.12,
              color: '#FFFFFF',
              mb: 2
            }}
          >
            {themeConfig.templateName} Operations
          </Typography>

          <Typography
            sx={{
              fontSize: 15,
              color: '#94A3B8',
              lineHeight: 1.65,
              mb: 4,
              maxWidth: 500
            }}
          >
            Sign in with an authorized administrator email. Secure session management, real-time diagnostic telemetry,
            and RBAC enforcement.
          </Typography>

          {/* Feature Highlights: 2x2 Grid Layout with Glassmorphism */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2.25
            }}
          >
            {HIGHLIGHTS.map(h => (
              <Box
                key={h.title}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25,
                  p: 2.25,
                  borderRadius: '14px',
                  bgcolor: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: 'rgba(30, 41, 59, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 0.35)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.5)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: h.bg,
                    border: `1px solid ${h.border}`,
                    color: h.color,
                    flexShrink: 0
                  }}
                >
                  <Icon icon={h.icon} fontSize={20} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#FFFFFF', mb: 0.35, letterSpacing: '-0.01em' }}>
                    {h.title}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5 }}>
                    {h.body}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Footer Security Badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 3,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 8,
                height: 8
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  bgcolor: ops.live,
                  opacity: 0.75,
                  animation: 'radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                }}
              />
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: ops.live,
                  boxShadow: `0 0 6px ${ops.live}`
                }}
              />
            </Box>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11.5, fontWeight: 500, color: '#94A3B8', letterSpacing: '0.04em' }}>
              System Status: Operational
            </Typography>
          </Box>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11.5, color: 'rgba(255, 255, 255, 0.45)' }}>
            {footerNote}
          </Typography>
        </Box>
      </Box>

      {/* Right Auth Card Area (Responsive full on mobile, split on desktop) */}
      <Box
        sx={{
          flex: { xs: '1 1 100%', lg: '1 1 48%', xl: '1 1 45%' },
          minHeight: { xs: '100dvh', lg: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 4, md: 6 },
          position: 'relative',
          zIndex: 1
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 460,
            bgcolor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(24px)',
            borderRadius: { xs: '20px', sm: '24px' },
            p: { xs: 3, sm: 4.5 },
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* Mobile Brand Header */}
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              alignItems: 'center',
              justifyContent: 'space-between',
              pb: 3,
              mb: 3,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <Image
              width={128}
              height={30}
              src='/images/netquix_logo.png'
              alt='NetQwix'
              style={{ objectFit: 'contain', objectPosition: 'left center', filter: 'brightness(1.15)' }}
              priority
            />
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.35,
                borderRadius: '999px',
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 6,
                  height: 6
                }}
              >
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: ops.live, boxShadow: `0 0 6px ${ops.live}` }} />
              </Box>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, fontWeight: 600, color: '#E2E8F0', letterSpacing: '0.04em' }}>
                Admin
              </Typography>
            </Box>
          </Box>

          {/* Form Header */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.4,
                borderRadius: '999px',
                bgcolor: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: '#818CF8',
                fontFamily: ops.mono,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                mb: 1.5
              }}
            >
              {eyebrow}
            </Box>

            <Typography
              component='h1'
              sx={{
                fontWeight: 700,
                fontSize: { xs: 22, sm: 26 },
                letterSpacing: '-0.025em',
                color: '#FFFFFF',
                lineHeight: 1.2,
                mb: 1
              }}
            >
              {title}
            </Typography>

            {subtitle ? (
              <Typography sx={{ fontSize: 13.5, color: '#94A3B8', lineHeight: 1.55 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>

          {/* Body Content */}
          {children}
        </Box>
      </Box>
    </Box>
  )
}
