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

const AnalyticsOverview = ({
  valueText = '$67.1k',
  trendText = '+49%',
  trendPositive = true,
  radialPercent = 64,
  caption = 'Share of sessions completed',
  onClick
}) => {
  const theme = useTheme()
  const pct = Math.min(100, Math.max(0, Number(radialPercent) || 0))

  const options = {
    chart: {
      sparkline: { enabled: true }
    },
    stroke: { lineCap: 'round' },
    colors: [hexToRGBA(theme.palette.primary.main, 1)],
    plotOptions: {
      radialBar: {
        hollow: { size: '55%' },
        track: {
          background: theme.palette.customColors.trackBg
        },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: 5,
            fontWeight: 600,
            fontSize: '1rem',
            color: theme.palette.text.primary
          }
        }
      }
    },
    grid: {
      padding: {
        bottom: -12
      }
    },
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
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
        <Typography variant='body2'>Overview</Typography>
        <Typography variant='caption' sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
          {caption}
        </Typography>
        <ReactApexcharts type='radialBar' height={119} series={[pct]} options={options} />
      </CardContent>
    </Card>
  )
}

export default AnalyticsOverview
