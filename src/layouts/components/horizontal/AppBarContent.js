// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** Components
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import NotificationDropdown from 'src/@core/layouts/components/shared-components/NotificationDropdown'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import AdminCommandPalette from 'src/layouts/components/AdminCommandPalette'
import AdminEnvBanner from 'src/layouts/components/AdminEnvBanner'

const AppBarContent = props => {
  // ** Props
  const { settings, saveSettings } = props
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
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton color='inherit' onClick={() => setPaletteOpen(true)} title='Jump to (⌘/Ctrl+K)'>
        <Icon icon='mdi:magnify' />
      </IconButton>
      <AdminCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <ModeToggler settings={settings} saveSettings={saveSettings} />
      <NotificationDropdown settings={settings} />
      <AdminEnvBanner />
      <UserDropdown settings={settings} />
    </Box>
  )
}

export default AppBarContent
