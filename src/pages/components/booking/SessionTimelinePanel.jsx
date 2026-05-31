import React, { useEffect, useState } from 'react'
import { Box, Chip, CircularProgress, Divider, Typography } from '@mui/material'
import moment from 'moment'
import { getAdminSessionTimeline } from 'src/services/bookingApi'

function TimelineRow({ label, value }) {
  if (value == null || value === '') return null
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.5 }}>
      <Typography variant='caption' color='text.secondary' sx={{ minWidth: 140, fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant='caption' sx={{ flex: 1, wordBreak: 'break-word' }}>
        {String(value)}
      </Typography>
    </Box>
  )
}

const fmt = v => (v ? moment(v).format('MMM D, YYYY h:mm A') : '—')

export default function SessionTimelinePanel({ bookingId, refreshKey = 0 }) {
  const [loading, setLoading] = useState(false)
  const [timeline, setTimeline] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!bookingId) return
    setLoading(true)
    setError(null)
    getAdminSessionTimeline(bookingId)
      .then(data => setTimeline(data))
      .catch(e => setError(e?.message || 'Could not load timeline'))
      .finally(() => setLoading(false))
  }, [bookingId, refreshKey])

  if (!bookingId) return null

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>
        Session timeline (ops)
      </Typography>
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
        Join, instant phase, timer snapshot, and extension events for disputes and support.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={22} />
        </Box>
      ) : null}

      {error ? (
        <Typography variant='body2' color='error'>
          {error}
        </Typography>
      ) : null}

      {timeline ? (
        <Box sx={{ pl: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Chip size='small' label={timeline.status || 'unknown'} />
            {timeline.isInstant ? <Chip size='small' color='info' label='Instant' /> : null}
            {timeline.instantPhase ? (
              <Chip size='small' variant='outlined' label={`Phase: ${timeline.instantPhase}`} />
            ) : null}
            {timeline.timer?.status ? (
              <Chip size='small' variant='outlined' label={`Timer: ${timeline.timer.status}`} />
            ) : null}
          </Box>

          <TimelineRow label='Booked date' value={fmt(timeline.bookedDate)} />
          <TimelineRow label='Start (UTC)' value={fmt(timeline.startTimeUtc)} />
          <TimelineRow label='End (UTC)' value={fmt(timeline.endTimeUtc)} />
          <TimelineRow label='Accepted' value={fmt(timeline.acceptedAt)} />
          <TimelineRow label='Join deadline' value={fmt(timeline.joinDeadlineAt)} />
          <TimelineRow label='Both joined' value={fmt(timeline.bothJoinedAt)} />
          {timeline.timer ? (
            <TimelineRow
              label='Timer (live)'
              value={`${timeline.timer.remainingSeconds}s left · ${timeline.timer.duration ?? '?'}s duration`}
            />
          ) : null}

          {Array.isArray(timeline.extensionRequests) && timeline.extensionRequests.length > 0 ? (
            <>
              <Typography variant='caption' sx={{ display: 'block', mt: 1.5, mb: 0.5, fontWeight: 700 }}>
                Extension requests
              </Typography>
              {timeline.extensionRequests.map(req => (
                <Box
                  key={req.requestId}
                  sx={{ mb: 1, pl: 1, borderLeft: 2, borderColor: 'warning.main' }}
                >
                  <Typography variant='caption' fontWeight={600}>
                    {req.status} · +{req.minutes} min · ${Number(req.amount).toFixed(2)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' display='block'>
                    Requested {fmt(req.requestedAt)} · Expires {fmt(req.expiresAt)}
                  </Typography>
                </Box>
              ))}
            </>
          ) : null}

          {Array.isArray(timeline.extensions) && timeline.extensions.length > 0 ? (
            <>
              <Typography variant='caption' sx={{ display: 'block', mt: 1.5, mb: 0.5, fontWeight: 700 }}>
                Applied extensions
              </Typography>
              {timeline.extensions.map((ext, idx) => (
                <Box key={`ext-applied-${idx}`} sx={{ mb: 0.75, pl: 1, borderLeft: 2, borderColor: 'success.main' }}>
                  <Typography variant='caption'>
                    +{ext.minutes} min · ${Number(ext.amount).toFixed(2)} · {fmt(ext.appliedAt)}
                  </Typography>
                </Box>
              ))}
            </>
          ) : null}

          <TimelineRow label='Record updated' value={fmt(timeline.updatedAt)} />
        </Box>
      ) : null}
    </Box>
  )
}
