// ** MUI Imports
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import FooterContent from './FooterContent'

const Footer = props => {
  const { settings, footerStyles, footerContent: userFooterContent } = props
  const theme = useTheme()
  const { footer, contentWidth } = settings
  if (footer === 'hidden') {
    return null
  }

  return (
    <Box
      component='footer'
      className='layout-footer'
      sx={{
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        ...footerStyles
      }}
    >
      <Box
        className='footer-content-container'
        sx={{
          width: '100%',
          px: { xs: 2, sm: 3, md: 4 },
          py: 1.5,
          ...(contentWidth === 'boxed' && { '@media (min-width:1440px)': { maxWidth: 1440 } })
        }}
      >
        {userFooterContent ? userFooterContent(props) : <FooterContent />}
      </Box>
    </Box>
  )
}

export default Footer
