import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import Icon from 'src/@core/components/icon'
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import NotificationDropdown from 'src/@core/layouts/components/shared-components/NotificationDropdown'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import AdminCommandPalette from 'src/layouts/components/AdminCommandPalette'
import { getAdminApiEnvLabel } from 'src/configs/adminEnv'
import { ops } from 'src/styles/opsSurface'
import { useAppDispatch, useAppSelector } from 'src/store/hooks'
import { setCommandPaletteOpen, selectCommandPaletteOpen } from 'src/store/slices/uiSlice'
import { useEffect } from 'react'

/**
 * Ops Surface app bar — brand mark, command pill, env chip, actions.
 */
const AppBarContent = props => {
  const { hidden, settings, saveSettings, toggleNavVisibility } = props
  const dispatch = useAppDispatch()
  const paletteOpen = useAppSelector(selectCommandPaletteOpen)

  const openPalette = open => {
    dispatch(setCommandPaletteOpen(open))
  }

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k') {
        e.preventDefault()
        openPalette(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
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

        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
            pr: 1.5,
            borderRight: `1px solid ${ops.hairline}`,
            mr: 0.5
          }}
        >
          <Image src='/images/netquix_logo.png' width={22} height={22} alt='NetQwix' style={{ objectFit: 'contain' }} />
          <Typography sx={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.3px', color: ops.ink }}>
            NetQwix
          </Typography>
          <Chip
            size='small'
            label='Admin'
            sx={{
              height: 20,
              fontFamily: ops.mono,
              fontSize: 10,
              bgcolor: ops.softIndigo,
              color: ops.indigoDeep,
              border: 'none'
            }}
          />
        </Box>

        <ButtonBase
          onClick={() => openPalette(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            height: 36,
            maxWidth: 420,
            width: { xs: '100%', sm: 300 },
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
        <AdminCommandPalette open={paletteOpen} onClose={() => openPalette(false)} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
        <Chip
          size='small'
          icon={<Icon icon='mdi:server-outline' fontSize={14} />}
          label={getAdminApiEnvLabel()}
          sx={{
            display: { xs: 'none', lg: 'inline-flex' },
            height: 28,
            fontFamily: ops.mono,
            fontSize: 10,
            bgcolor: ops.softSky,
            color: ops.body,
            border: 'none',
            '& .MuiChip-icon': { color: ops.indigo, ml: 0.75 }
          }}
        />
        <ModeToggler settings={settings} saveSettings={saveSettings} />
        <NotificationDropdown settings={settings} />
        <UserDropdown settings={settings} />
      </Box>
    </Box>
  )
}

export default AppBarContent
