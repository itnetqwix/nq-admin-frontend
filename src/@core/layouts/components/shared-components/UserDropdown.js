// ** React Imports
import { useState, Fragment } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Context
import { useAuth } from 'src/hooks/useAuth'

// ** Styled Components
const BadgeContentSpan = styled('span')(({ theme }) => ({
  width: 9,
  height: 9,
  borderRadius: '50%',
  backgroundColor: '#10B981',
  boxShadow: `0 0 0 2px ${theme.palette.mode === 'dark' ? '#0E131F' : '#ffffff'}`
}))

const UserDropdown = props => {
  // ** Props
  const { settings } = props

  // ** States
  const [anchorEl, setAnchorEl] = useState(null)

  // ** Hooks
  const router = useRouter()
  const { user, logout } = useAuth()

  // ** Vars
  const { direction } = settings
  const displayName = user?.fullname || user?.name || 'Administrator'
  const displayRole = user?.account_type ? user.account_type.toUpperCase() : 'SUPER ADMIN'
  const displayEmail = user?.email || 'admin@netqwix.com'

  const handleDropdownOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleDropdownClose = url => {
    if (url && typeof url === 'string') {
      router.push(url)
    }
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    handleDropdownClose()
  }

  return (
    <Fragment>
      <Badge
        overlap='circular'
        onClick={handleDropdownOpen}
        sx={{ ml: { xs: 0.5, sm: 1.5 }, cursor: 'pointer' }}
        badgeContent={<BadgeContentSpan />}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
      >
        <Avatar
          alt={displayName}
          onClick={handleDropdownOpen}
          sx={{
            width: 38,
            height: 38,
            border: theme => `2px solid ${theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)'}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#818CF8',
              transform: 'scale(1.04)'
            }
          }}
          src='/images/avatars/1.png'
        />
      </Badge>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleDropdownClose()}
        PaperProps={{
          sx: {
            width: 240,
            maxWidth: 'calc(100vw - 24px)',
            mt: 2,
            borderRadius: '12px',
            border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(18, 24, 38, 0.98)' : '#ffffff',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
          }
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: direction === 'ltr' ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: direction === 'ltr' ? 'right' : 'left' }}
      >
        <Box sx={{ pt: 2, pb: 2, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Badge
              overlap='circular'
              badgeContent={<BadgeContentSpan />}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
            >
              <Avatar alt={displayName} src='/images/avatars/1.png' sx={{ width: 38, height: 38 }} />
            </Badge>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 }} noWrap>
                {displayName}
              </Typography>
              <Typography variant='caption' sx={{ fontSize: '0.75rem', color: '#818CF8', fontWeight: 600 }}>
                {displayRole}
              </Typography>
              <Typography variant='caption' sx={{ fontSize: '0.7rem', color: 'text.disabled' }} noWrap>
                {displayEmail}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            px: 3,
            color: '#EF4444',
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: '#F87171'
            },
            '& svg': { mr: 1.5, fontSize: '1.25rem' }
          }}
        >
          <Icon icon='mdi:logout-variant' />
          <Typography sx={{ color: 'inherit', fontWeight: 500, fontSize: '0.875rem' }}>Logout</Typography>
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

export default UserDropdown
