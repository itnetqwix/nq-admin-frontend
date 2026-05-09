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

const AnalyticsSessions = ({
  valueText = '$38.5k',
  trendText = '+62%',
  trendPositive = true,
  series,
  onClick
}) => {
  const theme = useTheme()
  const n = Number(String(valueText).replace(/[^\d.]/g, '')) || 0
  const spark = series || [{ data: [0, Math.min(n, 20), n * 0.4, n * 0.7, n * 0.85, n] }]

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: { enabled: false },
    grid: {
      strokeDashArray: 6,
      borderColor: theme.palette.divider,
      xaxis: {
        lines: { show: true }
      },
      yaxis: {
        lines: { show: false }
      },
      padding: {
        top: -15,
        left: -7,
        right: 7,
        bottom: -15
      }
    },
    stroke: { width: 3 },
    colors: [hexToRGBA(theme.palette.info.main, 1)],
    markers: {
      size: 6,
      offsetY: 2,
      offsetX: -1,
      strokeWidth: 3,
      colors: ['transparent'],
      strokeColors: 'transparent',
      discrete: [
        {
          size: 6,
          seriesIndex: 0,
          strokeColor: theme.palette.info.main,
          fillColor: theme.palette.background.paper,
          dataPointIndex: spark[0].data.length - 1
        }
      ],
      hover: { size: 7 }
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: {
      labels: { show: false }
    }
  }

  return (
    <Card
      onClick={onClick}
      sx={
        onClick
          ? { cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }
          : undefined
      }
    >
      <CardContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant='h6' sx={{ mr: 1.5 }}>
            {valueText}
          </Typography>
          <Typography variant='subtitle2' sx={{ color: trendPositive ? 'success.main' : 'error.main' }}>
            {trendText}
          </Typography>
        </Box>
        <Typography variant='body2'>Sessions</Typography>
        <Typography variant='caption' sx={{ display: 'block', color: 'text.secondary', mb: 1 }}>
          Active bookings (non-canceled)
        </Typography>
        <ReactApexcharts type='line' height={108} options={options} series={spark} />
      </CardContent>
    </Card>
  )
}

export default AnalyticsSessions
