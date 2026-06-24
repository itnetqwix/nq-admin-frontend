import React, { useMemo, useState } from 'react'
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function parseDay(banner) {
  const start = banner.start_date ? new Date(banner.start_date) : null
  const end = banner.end_date ? new Date(banner.end_date) : null
  return { start, end }
}

function bannerActiveOnDay(banner, day) {
  const { start, end } = parseDay(banner)
  const t = day.getTime()
  if (start && t < startOfMonth(start).getTime() && day < start) return false
  if (start && day < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false
  if (end && day > new Date(end.getFullYear(), end.getMonth(), end.getDate())) return false
  if (!banner.is_active) return false
  return true
}

/** Month grid of scheduled banners for publish planning. */
export default function BannerScheduleCalendar({ banners = [] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))

  const { year, month, cells } = useMemo(() => {
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const firstDow = new Date(y, m, 1).getDay()
    const dim = daysInMonth(y, m)
    const grid = []
    for (let i = 0; i < firstDow; i++) grid.push(null)
    for (let d = 1; d <= dim; d++) grid.push(new Date(y, m, d))
    return { year: y, month: m, cells: grid }
  }, [cursor])

  const monthLabel = cursor.toLocaleString('default', { month: 'long', year: 'numeric' })

  const scheduled = banners.filter(b => b.start_date || b.end_date)

  return (
    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
        <Typography variant='subtitle2' fontWeight={700}>
          Schedule calendar
        </Typography>
        <Stack direction='row' alignItems='center' spacing={0.5}>
          <IconButton size='small' onClick={() => setCursor(new Date(year, month - 1, 1))}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant='body2' sx={{ minWidth: 140, textAlign: 'center' }}>
            {monthLabel}
          </Typography>
          <IconButton size='small' onClick={() => setCursor(new Date(year, month + 1, 1))}>
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 2 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Typography key={`${d}-${i}`} variant='caption' color='text.secondary' align='center' fontWeight={700}>
            {d}
          </Typography>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <Box key={`empty-${idx}`} sx={{ minHeight: 36 }} />
          const active = scheduled.filter(b => bannerActiveOnDay(b, day))
          return (
            <Box
              key={day.toISOString()}
              sx={{
                minHeight: 36,
                p: 0.25,
                borderRadius: 1,
                bgcolor: active.length ? 'action.selected' : 'transparent',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant='caption' display='block' align='center'>
                {day.getDate()}
              </Typography>
              {active.slice(0, 2).map(b => (
                <Typography key={b._id} variant='caption' noWrap sx={{ fontSize: 9, display: 'block', px: 0.25 }}>
                  {b.title}
                </Typography>
              ))}
            </Box>
          )
        })}
      </Box>

      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
        {scheduled.length === 0 ? (
          <Typography variant='body2' color='text.secondary'>
            No banners with start/end dates — add schedule windows in the editor.
          </Typography>
        ) : (
          scheduled.slice(0, 8).map(b => (
            <Chip
              key={b._id}
              size='small'
              label={`${b.title}${b.variant_label ? ` (${b.variant_label})` : ''}`}
              variant='outlined'
            />
          ))
        )}
      </Stack>
    </Box>
  )
}
