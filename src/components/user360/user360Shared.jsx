import React from 'react'
import { Box, Paper, Stack, Typography, alpha, useTheme } from '@mui/material'
import toast from 'react-hot-toast'

export const SectionShell = ({ title, subtitle, action, children }) => {
  const theme = useTheme()
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'flex-start' }}
        justifyContent='space-between'
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, maxWidth: 720 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
      </Stack>
      <Box
        sx={{
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          p: { xs: 1.5, md: 2 }
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export const EmptyHint = ({ icon: Icon, title, hint }) => (
  <Box
    sx={{
      py: 6,
      px: 2,
      textAlign: 'center',
      color: 'text.secondary',
      borderRadius: 2,
      border: '1px dashed',
      borderColor: 'divider',
      bgcolor: 'background.paper'
    }}
  >
    {Icon ? <Icon sx={{ fontSize: 40, opacity: 0.35, mb: 1 }} /> : null}
    <Typography variant='subtitle1' color='text.primary' sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant='body2'>{hint}</Typography>
  </Box>
)

export function StatTile({ label, value, emphasize }) {
  const theme = useTheme()
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        bgcolor: 'background.paper',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: `0 4px 14px ${alpha(theme.palette.common.black, 0.06)}` }
      }}
    >
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}
      >
        {label}
      </Typography>
      <Typography variant={emphasize ? 'h4' : 'h5'} sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.2 }}>
        {value ?? 0}
      </Typography>
    </Paper>
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
