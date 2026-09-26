// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const defaultSeries = [
  {
    name: 'Earning',
    data: [120, 200, 150, 120]
  },
  {
    name: 'Expense',
    data: [72, 120, 50, 65]
  }
]

const AnalyticsTotalRevenue = ({
  valueText = '$42.5k',
  trendText = 'Live',
  trendPositive = false,
  chipSubtext = 'Paid bookings (excl. canceled)',
  series = defaultSeries,
  onClick
}) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    grid: {
      padding: {
        top: -15,
        left: -14,
        right: -4,
        bottom: -15
      },
      yaxis: {
        lines: { show: false }
      }
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: [isDark ? '#6366F1' : theme.palette.primary.main, isDark ? '#38BDF8' : theme.palette.info.main],
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '46%',
        startingShape: 'rounded'
      }
    },
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: ['Jan', 'Feb', 'Mar', 'Apr']
    },
    yaxis: {
      labels: { show: false }
    }
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`,
        background: isDark
          ? 'linear-gradient(180deg, rgba(17, 24, 39, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%)'
          : '#FFFFFF',
        backdropFilter: 'blur(16px)',
        boxShadow: isDark
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          borderColor: isDark ? 'rgba(99, 102, 241, 0.45)' : 'rgba(99, 102, 241, 0.3)',
          boxShadow: isDark
            ? '0 12px 24px -6px rgba(0, 0, 0, 0.5), 0 0 20px -3px rgba(99, 102, 241, 0.15)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        } : undefined
      }}
    >
      <CardContent sx={{ p: '20px !important', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: isDark ? '#94A3B8' : '#64748B' }}>
              Total Revenue
            </Typography>
            {trendText && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.4,
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontWeight: 600,
                  border: `1px solid ${
                    trendPositive
                      ? 'rgba(16, 185, 129, 0.3)'
                      : isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(203, 213, 225, 0.8)'
                  }`,
                  bgcolor: trendPositive
                    ? 'rgba(16, 185, 129, 0.1)'
                    : isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)',
                  color: trendPositive
                    ? '#34D399'
                    : isDark ? '#CBD5E1' : '#475569'
                }}
              >
                {trendPositive ? (
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
                <span>{trendText}</span>
              </Box>
            )}
          </Box>
          <Typography
            sx={{
              fontSize: { xs: '1.65rem', sm: '1.9rem' },
              fontWeight: 700,
              color: isDark ? '#F8FAFC' : '#0F172A',
              fontFamily: '"IBM Plex Mono", monospace',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              my: 0.5
            }}
          >
            {valueText}
          </Typography>
          <Typography variant='caption' sx={{ display: 'block', color: isDark ? '#64748B' : '#94A3B8', mb: 1.5 }}>
            {chipSubtext}
          </Typography>
        </Box>
        <ReactApexcharts type='bar' height={100} options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default AnalyticsTotalRevenue
