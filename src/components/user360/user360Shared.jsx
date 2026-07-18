import React from 'react'
import { Box, Stack, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import { ops } from 'src/styles/opsSurface'

export const SectionShell = ({ title, subtitle, action, children }) => (
  <Box sx={{ p: { xs: 2, md: 3 } }}>
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ sm: 'flex-start' }}
      justifyContent='space-between'
      sx={{ mb: 2.5 }}
    >
      <Box>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16 }}>{title}</Typography>
        {subtitle ? (
          <Typography sx={{ mt: 0.5, maxWidth: 720, fontSize: 13, color: ops.body, lineHeight: 1.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Stack>
    <Box
      sx={{
        borderRadius: ops.radiusLg,
        bgcolor: ops.canvasSoft,
        p: { xs: 1.5, md: 2 },
        boxShadow: 'inset 0 0 0 1px ' + ops.hairline
      }}
    >
      {children}
    </Box>
  </Box>
)

/** @deprecated Prefer importing OpsSurfaceCard from `src/components/admin`. */
export { default as OpsSurfaceCard } from 'src/components/admin/OpsSurfaceCard'

export const EmptyHint = ({ icon: Icon, title, hint }) => (
  <AdminEmptyState compact title={title} description={hint} icon={Icon} />
)

/** Thin alias — prefer OpsMetricTile in new code. */
export function StatTile({ label, value, emphasize, onClick, tone }) {
  return (
    <OpsMetricTile
      label={label}
      value={value ?? 0}
      onClick={onClick}
      tone={tone || (emphasize ? 'accent' : 'default')}
    />
  )
}

export const downloadCsv = (rows, filename) => {
  if (!rows?.length) {
    toast.error('No data available to export')
    return
  }
  const headers = Object.keys(rows[0] || {})
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(h => {
          const value = row[h] === null || row[h] === undefined ? '' : String(row[h]).replaceAll('"', '""')
          return `"${value}"`
        })
        .join(',')
    )
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const lessonStatusColor = status => {
  const s = String(status || '').toLowerCase()
  if (s.includes('complete')) return 'success'
  if (s.includes('cancel')) return 'error'
  if (s.includes('confirm') || s.includes('book')) return 'info'
  if (s.includes('pending') || s.includes('start')) return 'warning'
  return 'default'
}
