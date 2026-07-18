import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import NotificationDropdown from 'src/@core/layouts/components/shared-components/NotificationDropdown'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import AdminCommandPalette from 'src/layouts/components/AdminCommandPalette'
import { ops } from 'src/styles/opsSurface'
import { useEffect, useState } from 'react'

/**
 * Ops Surface app bar content — Vercel-style command pill + quiet actions.
 */
const AppBarContent = props => {
  const { hidden, settings, saveSettings, toggleNavVisibility } = props
  const [paletteOpen, setPaletteOpen] = useState(false)

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
        {hidden ? (
          <IconButton
            onClick={toggleNavVisibility}
            sx={{
              border: `1px solid ${ops.hairline}`,
              borderRadius: ops.radiusSm,
              width: 36,
              height: 36
            }}
          >
            <Icon icon='mdi:menu' fontSize={20} />
          </IconButton>
        ) : null}

        <ButtonBase
          onClick={() => setPaletteOpen(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            height: 36,
            maxWidth: 420,
            width: { xs: '100%', sm: 320 },
            borderRadius: ops.radiusSm,
            border: `1px solid ${ops.hairline}`,
            bgcolor: ops.canvasSoft,
            color: ops.mute,
            justifyContent: 'flex-start',
            transition: 'border-color 0.12s ease, background-color 0.12s ease',
            '&:hover': {
              borderColor: ops.mute,
              bgcolor: ops.canvas
            }
          }}
        >
          <Icon icon='mdi:magnify' fontSize={18} />
          <Typography
            sx={{
              fontSize: 13,
              color: ops.mute,
              flex: 1,
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            Search users, pages…
          </Typography>
          <Typography
            component='span'
            sx={{
              display: { xs: 'none', md: 'inline' },
              fontFamily: ops.mono,
              fontSize: 11,
              color: ops.mute,
              border: `1px solid ${ops.hairline}`,
              borderRadius: 4,
              px: 0.75,
              py: 0.15,
              bgcolor: ops.canvas
            }}
          >
            ⌘K
          </Typography>
        </ButtonBase>
        <AdminCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <ModeToggler settings={settings} saveSettings={saveSettings} />
        <NotificationDropdown settings={settings} />
        <UserDropdown settings={settings} />
      </Box>
    </Box>
  )
}

export default AppBarContent
