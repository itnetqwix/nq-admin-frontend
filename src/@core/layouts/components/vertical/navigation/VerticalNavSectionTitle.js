import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'
import MuiListSubheader from '@mui/material/ListSubheader'

// ** Custom Components Imports
import Translations from 'src/layouts/components/Translations'
import CanViewNavSectionTitle from 'src/layouts/components/acl/CanViewNavSectionTitle'
import Icon from 'src/@core/components/icon'

// ** Styled Components
const ListSubheader = styled(props => <MuiListSubheader component='li' {...props} />)(({ theme }) => ({
  lineHeight: 1,
  display: 'flex',
  position: 'static',
  padding: theme.spacing(3),
  marginTop: theme.spacing(6.25),
  backgroundColor: 'transparent',
  color: theme.palette.text.disabled,
  transition: 'padding-left .25s ease-in-out'
}))

const VerticalNavSectionTitle = props => {
  // ** Props
  const { item, navHover, settings, collapsedNavWidth, navigationBorderWidth } = props

  // ** Hook
  const theme = useTheme()

  // ** Vars
  const { mode, navCollapsed } = settings

  const conditionalBorderColor = () => {
    if (mode === 'semi-dark') {
      return {
        '&, &:before': {
          borderColor: `rgba(${theme.palette.customColors.dark}, 0.12)`
        }
      }
    } else return {}
  }

  const conditionalColor = () => {
    if (mode === 'semi-dark') {
      return {
        color: `rgba(${theme.palette.customColors.dark}, 0.38) !important`
      }
    } else {
      return {
        color: 'text.disabled'
      }
    }
  }

  const isCollapsed = navCollapsed && !navHover

  return (
    <CanViewNavSectionTitle navTitle={item}>
      <ListSubheader
        className='nav-section-title'
        sx={{
          py: isCollapsed ? 2 : 1.5,
          mt: 2,
          mb: 0.5,
          px: isCollapsed ? 2 : 3,
          justifyContent: isCollapsed ? 'center' : 'flex-start'
        }}
      >
        {isCollapsed ? (
          <Box
            sx={{
              width: 16,
              height: 2,
              borderRadius: 1,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Typography
              noWrap
              variant='caption'
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: theme.palette.mode === 'dark' ? '#64748B' : '#94A3B8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75
              }}
            >
              {item.icon ? (
                <Box component='span' sx={{ display: 'inline-flex', color: '#818CF8' }}>
                  <Icon icon={item.icon} fontSize={13} />
                </Box>
              ) : null}
              <Translations text={item.sectionTitle} />
            </Typography>
            <Box
              sx={{
                flex: 1,
                height: '1px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'
              }}
            />
          </Box>
        )}
      </ListSubheader>
    </CanViewNavSectionTitle>
  )
}

export default VerticalNavSectionTitle
