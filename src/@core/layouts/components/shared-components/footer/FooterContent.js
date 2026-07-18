import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'

/**
 * Ops Surface footer — mono caption, no Envato leftover links.
 */
const FooterContent = () => {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        py: 0.5
      }}
    >
      <Typography
        sx={{
          fontFamily: ops.mono,
          fontSize: 11,
          color: ops.mute,
          letterSpacing: '0.04em'
        }}
      >
        NetQwix Admin · {new Date().getFullYear()}
      </Typography>
      <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>Ops Surface</Typography>
    </Box>
  )
}

export default FooterContent
