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

  return (
    <CanViewNavSectionTitle navTitle={item}>
      <ListSubheader
        className='nav-section-title'
        sx={{
          ...(navCollapsed && !navHover
            ? { py: 4.75, px: (collapsedNavWidth - navigationBorderWidth - 22) / 8 }
            : { pl: 0 })
        }}
      >
        <Divider
          textAlign='left'
          sx={{
            m: '0 !important',
            lineHeight: 'normal',
            ...conditionalBorderColor(),
            '&:after': { display: 'none' },
            ...(navCollapsed && !navHover
              ? { width: 22 }
              : {
                  width: '100%',
                  '&:before': { top: 7, transform: 'none', width: theme.spacing(4) },
                  '& .MuiDivider-wrapper': {
                    px: 4,
                    fontSize: '0.6875rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontWeight: 500
                  }
                })
          }}
        >
          {navCollapsed && !navHover ? null : (
            <Typography
              noWrap
              variant='caption'
              sx={{
                ...conditionalColor(),
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                color: '#6b6b6b !important',
                fontWeight: 600
              }}
            >
              {item.icon ? (
                <Box component='span' sx={{ display: 'inline-flex', color: '#533afd', opacity: 0.85 }}>
                  <Icon icon={item.icon} fontSize={14} />
                </Box>
              ) : null}
              <Translations text={item.sectionTitle} />
            </Typography>
          )}
        </Divider>
      </ListSubheader>
    </CanViewNavSectionTitle>
  )
}

export default VerticalNavSectionTitle
