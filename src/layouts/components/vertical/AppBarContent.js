// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import AdminCommandPalette from 'src/layouts/components/AdminCommandPalette'
import AdminEnvBanner from 'src/layouts/components/AdminEnvBanner'
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'

const AppBarContent = props => {
  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { socketConnected } = useAdminRealtime()

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      {/* Left side: Hamburger (mobile) + Global Search Trigger */}
      <Box className='actions-left' sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, minWidth: 0 }}>
        {hidden ? (
          <Tooltip title='Open navigation' arrow>
            <IconButton
              color='inherit'
              onClick={toggleNavVisibility}
              aria-label='Open navigation menu'
              sx={{
                p: 1,
                borderRadius: '8px',
                border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                color: 'text.primary',
                '&:hover': {
                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
                }
              }}
            >
              <Icon icon='mdi:menu' fontSize={22} />
            </IconButton>
          </Tooltip>
        ) : null}

        {/* Global Search Command Trigger Button */}
        <Box
          component='button'
          onClick={() => setPaletteOpen(true)}
          aria-label='Search commands and pages'
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: { xs: 1.5, sm: 2.25 },
            py: 0.85,
            height: 38,
            minWidth: { xs: 38, sm: 240, md: 280 },
            border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            borderRadius: '8px',
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
            color: 'text.secondary',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            outline: 'none',
            '&:hover': {
              borderColor: 'rgba(99, 102, 241, 0.4)',
              bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.04)',
              color: 'text.primary'
            }
          }}
        >
          <Icon icon='mdi:magnify' fontSize={18} style={{ flexShrink: 0 }} />
          <Typography
            variant='body2'
            sx={{
              display: { xs: 'none', sm: 'inline-block' },
              color: 'inherit',
              fontSize: '0.8125rem',
              fontWeight: 400,
              flex: 1,
              textAlign: 'left'
            }}
          >
            Search or jump to...
          </Typography>
          <Box
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              alignItems: 'center',
              px: 1,
              py: 0.2,
              borderRadius: '5px',
              bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              fontFamily: 'monospace',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'text.secondary',
              letterSpacing: '0.02em'
            }}
          >
            ⌘K
          </Box>
        </Box>
        <AdminCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </Box>

      {/* Right side: Telemetry badge + Env Banner + Dark Toggle + Profile Dropdown */}
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flexShrink: 0 }}>
        {/* Realtime API Telemetry Status Pill */}
        <Tooltip
          title={socketConnected ? 'Realtime WebSocket connected — Live updates active' : 'Realtime reconnecting — Polling fallback active'}
          arrow
        >
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1,
              px: 1.75,
              py: 0.6,
              height: 28,
              borderRadius: '9999px',
              border: theme => `1px solid ${
                socketConnected
                  ? theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.3)'
                  : theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.3)'
              }`,
              bgcolor: theme => `rgba(${socketConnected ? '16, 185, 129' : '245, 158, 11'}, ${theme.palette.mode === 'dark' ? '0.1' : '0.08'})`,
              cursor: 'default'
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: socketConnected ? '#10B981' : '#F59E0B',
                boxShadow: socketConnected ? '0 0 8px #10B981' : '0 0 6px #F59E0B'
              }}
            />
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: socketConnected ? '#10B981' : '#F59E0B',
                letterSpacing: '0.02em',
                lineHeight: 1
              }}
            >
              {socketConnected ? 'API Live' : 'Polling'}
            </Typography>
          </Box>
        </Tooltip>

        <AdminEnvBanner />
        <ModeToggler settings={settings} saveSettings={saveSettings} />
        <UserDropdown settings={settings} />
      </Box>
    </Box>
  )
}

export default AppBarContent
