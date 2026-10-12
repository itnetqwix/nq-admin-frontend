import { useMemo } from 'react'
import Box from '@mui/material/Box'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import useChartColors from 'src/hooks/useChartColors'
import { buildTrendOptions } from './chartOptions'

/**
 * Trend chart adapter. `series` is [{ name, data: number[] }]; `categories` are the x labels.
 * Pages pass data and a `format`; they never build Apex options themselves, so swapping the chart
 * library later touches only this folder.
 */
export default function AreaTrend({ series, categories, format = 'count', type = 'area', height = 260, stacked = false }) {
  const colors = useChartColors()
  const options = useMemo(
    () => buildTrendOptions({ colors, categories, format, type, stacked }),
    [colors, categories, format, type, stacked]
  )
  return (
    <Box sx={{ mx: -1 }}>
      <ReactApexcharts type={type} height={height} width='100%' options={options} series={series} />
    </Box>
  )
}
