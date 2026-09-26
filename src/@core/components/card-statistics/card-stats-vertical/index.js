// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { useTheme } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const getColorStyles = (color, theme) => {
  const isDark = (theme?.palette?.mode ?? 'dark') === 'dark'
  switch (color) {
    case 'warning':
      return {
        bg: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.1)',
        color: isDark ? '#FBBF24' : '#D97706',
        border: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.2)'
      }
    case 'error':
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.1)',
        color: isDark ? '#F87171' : '#DC2626',
        border: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.2)'
      }
    case 'success':
      return {
        bg: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)',
        color: isDark ? '#34D399' : '#059669',
        border: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)'
      }
    case 'info':
      return {
        bg: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 165, 233, 0.1)',
        color: isDark ? '#38BDF8' : '#0284C7',
        border: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.2)'
      }
    case 'secondary':
      return {
        bg: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(147, 51, 234, 0.1)',
        color: isDark ? '#C084FC' : '#9333EA',
        border: isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(147, 51, 234, 0.2)'
      }
    default:
      return {
        bg: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.1)',
        color: isDark ? '#818CF8' : '#4F46E5',
        border: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.2)'
      }
  }
}

const CardStatsVertical = props => {
  // ** Hook
  const theme = useTheme()

  // ** Props
  const { title, color = 'primary', icon, stats, chipText, trendNumber, trend = 'positive', onCardClick } = props

  const isLive = String(trendNumber || '').trim().toLowerCase() === 'live'

  return (
    <Card
      onClick={onCardClick}
      sx={theme => ({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, rgba(17, 24, 39, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%)'
          : '#FFFFFF',
        backdropFilter: 'blur(16px)',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onCardClick ? 'pointer' : 'default',
        '&:hover': onCardClick ? {
          transform: 'translateY(-2px)',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.45)' : 'rgba(99, 102, 241, 0.3)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 12px 24px -6px rgba(0, 0, 0, 0.5), 0 0 20px -3px rgba(99, 102, 241, 0.15)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        } : undefined
      })}
    >
      <CardContent sx={{ p: '20px !important', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        {/* Top Row: Icon badge + Timeframe / Status Pill */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box
            sx={theme => {
              const c = getColorStyles(color, theme)
              return {
                width: 42,
                height: 42,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: c.bg,
                color: c.color,
                border: `1px solid ${c.border}`,
                flexShrink: 0,
                '& svg': {
                  fontSize: '1.4rem'
                }
              }
            }}
          >
            {icon}
          </Box>

          {trendNumber && String(trendNumber).trim() ? (
            <Box
              sx={theme => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.4,
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
                fontWeight: 600,
                border: `1px solid ${
                  isLive
                    ? 'rgba(16, 185, 129, 0.3)'
                    : theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.6)' : 'rgba(203, 213, 225, 0.8)'
                }`,
                bgcolor: isLive
                  ? 'rgba(16, 185, 129, 0.1)'
                  : theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)',
                color: isLive
                  ? '#34D399'
                  : theme.palette.mode === 'dark' ? '#CBD5E1' : '#475569'
              })}
            >
              {isLive ? (
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: '#34D399',
                    boxShadow: '0 0 8px #34D399, 0 0 2px #10B981',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.45, transform: 'scale(0.85)' }
                    },
                    mr: 0.75
                  }}
                />
              ) : null}
              <span>{trendNumber}</span>
              {!isLive ? (
                <Icon
                  icon={trend === 'positive' ? 'mdi:arrow-top-right' : 'mdi:arrow-bottom-right'}
                  fontSize={13}
                  style={{ opacity: 0.7 }}
                />
              ) : null}
            </Box>
          ) : null}
        </Box>

        {/* Metric Value & Description */}
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={theme => ({
              fontSize: { xs: '1.65rem', sm: '1.9rem' },
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? '#F8FAFC' : '#0F172A',
              fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              mb: 0.75
            })}
          >
            {stats}
          </Typography>
          <Typography
            sx={theme => ({
              fontSize: '0.85rem',
              fontWeight: 500,
              color: theme.palette.mode === 'dark' ? '#94A3B8' : '#64748B',
              lineHeight: 1.35
            })}
          >
            {title}
          </Typography>
        </Box>

        {/* Footer Tag / Interactive Chip */}
        {chipText ? (
          <Box
            sx={theme => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              fontSize: '0.72rem',
              fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
              fontWeight: 500,
              px: 1.5,
              py: 0.5,
              borderRadius: '8px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
              color: theme.palette.mode === 'dark' ? '#A5B4FC' : '#4F46E5',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`,
              alignSelf: 'flex-start',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)',
                color: theme.palette.mode === 'dark' ? '#C7D2FE' : '#4338CA'
              }
            })}
          >
            {chipText}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default CardStatsVertical
