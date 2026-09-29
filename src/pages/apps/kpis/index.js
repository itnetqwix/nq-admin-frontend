import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { AdminLoadingState, AdminRefreshButton, OpsMetricTile, OpsSurfaceCard } from 'src/components/admin'
import MiniSparkline from 'src/components/admin/MiniSparkline'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import { fetchKpis } from 'src/services/growthApi'

const RANGES = [7, 30, 90]
const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)
const fmtUsd = minor =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    (Number(minor) || 0) / 100
  )
const fmtPct = r => (r == null ? '—' : `${(r * 100).toFixed(1)}%`)

const FUNNEL_LABELS = {
  trainer_profile_viewed: 'Viewed a coach profile',
  slot_selected: 'Picked a time slot',
  checkout_started: 'Started checkout',
  booking_created: 'Booked',
  lesson_completed: 'Completed a lesson'
}

function FunnelBars({ funnel }) {
  const top = Math.max(...funnel.map(f => f.users), 1)
  return (
    <Stack spacing={1.25}>
      {funnel.map((f, i) => {
        const prev = i > 0 ? funnel[i - 1].users : null
        const stepRate = prev ? f.users / prev : null
        return (
          <Box key={f.step}>
            <Stack direction='row' justifyContent='space-between' sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: 13, color: ops.ink }}>{FUNNEL_LABELS[f.step] || f.step}</Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.body }}>
                {fmtInt(f.users)}
                {stepRate != null ? ` · ${fmtPct(stepRate)} of previous` : ''}
              </Typography>
            </Stack>
            <Box sx={{ height: 10, borderRadius: 5, bgcolor: ops.canvasSoft2, overflow: 'hidden' }}>
              <Box sx={{ width: `${(f.users / top) * 100}%`, height: '100%', bgcolor: ops.indigo }} />
            </Box>
          </Box>
        )
      })}
    </Stack>
  )
}

export default function KpiDashboard() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await fetchKpis(days))
    } catch (err) {
      toast.error(err.message || 'Could not load KPIs')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  const t = data?.totals
  const r = data?.rates

  return (
    <AdminPageShell
      bare
      icon='mdi:chart-timeline-variant'
      eyebrow='Revenue · KPIs'
      title='Marketplace KPIs'
      subtitle='Bookings, revenue, quality, and funnel conversion for the selected window.'
      actions={
        <Stack direction='row' spacing={1} alignItems='center'>
          {RANGES.map(d => (
            <Chip
              key={d}
              size='small'
              clickable
              label={`${d}d`}
              onClick={() => setDays(d)}
              color={days === d ? 'primary' : 'default'}
              variant={days === d ? 'filled' : 'outlined'}
            />
          ))}
          <AdminRefreshButton onClick={load} loading={loading} />
        </Stack>
      }
    >
      {!data && loading ? (
        <AdminLoadingState message='Crunching numbers…' />
      ) : data ? (
        <>
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid item xs={6} md={3}>
              <OpsMetricTile icon='mdi:cash-multiple' label='GMV' value={fmtUsd(t.gmvMinor)} hint='Non-cancelled bookings' tone='accent' />
            </Grid>
            <Grid item xs={6} md={3}>
              <OpsMetricTile icon='mdi:bank-outline' label='Platform revenue' value={fmtUsd(t.revenueMinor)} hint={`Take rate ${fmtPct(r.takeRate)}`} tone='success' />
            </Grid>
            <Grid item xs={6} md={3}>
              <OpsMetricTile icon='mdi:calendar-check-outline' label='Bookings' value={fmtInt(t.bookings)} hint={`${fmtInt(t.completed)} completed`} />
            </Grid>
            <Grid item xs={6} md={3}>
              <OpsMetricTile icon='mdi:account-multiple-outline' label='Active users' value={`${fmtInt(t.activeTrainees)} / ${fmtInt(t.activeTrainers)}`} hint='Trainees / coaches who booked' />
            </Grid>
            <Grid item xs={6} md={3}>
              <OpsMetricTile icon='mdi:check-decagram-outline' label='Completion rate' value={fmtPct(r.completionRate)} hint='Completed ÷ (completed + cancelled)' tone='success' />
            </Grid>
            <Grid item xs={6} md={3}>
              <OpsMetricTile icon='mdi:repeat' label='Repeat booking rate' value={fmtPct(r.repeatBookingRate)} hint='Trainees with 2+ lifetime bookings' tone='accent' />
            </Grid>
            <Grid item xs={6} md={3}>
              <OpsMetricTile icon='mdi:cash-refund' label='Refund rate' value={fmtPct(r.refundRate)} hint={`Cancellation ${fmtPct(r.cancellationRate)}`} tone={r.refundRate > 0.1 ? 'warn' : 'default'} />
            </Grid>
            <Grid item xs={6} md={3}>
              <OpsMetricTile icon='mdi:account-cancel-outline' label='No-show rate' value={fmtPct(r.noShowRate)} hint={`Instant accept ${fmtPct(r.instantAcceptanceRate)}`} tone={r.noShowRate > 0.05 ? 'danger' : 'default'} />
            </Grid>
          </Grid>

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={7}>
              <OpsSurfaceCard>
                <AdminPageSection>
                  <Typography sx={{ fontWeight: 600, mb: 2 }}>Booking funnel (unique users)</Typography>
                  <FunnelBars funnel={data.funnel} />
                </AdminPageSection>
              </OpsSurfaceCard>
            </Grid>
            <Grid item xs={12} md={5}>
              <OpsSurfaceCard>
                <AdminPageSection>
                  <Typography sx={{ fontWeight: 600, mb: 2 }}>Daily trend</Typography>
                  <Stack spacing={2}>
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                      <Typography sx={{ fontSize: 13, color: ops.body }}>Bookings / day</Typography>
                      <MiniSparkline values={data.daily.map(d => d.bookings)} width={180} height={36} />
                    </Stack>
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                      <Typography sx={{ fontSize: 13, color: ops.body }}>GMV / day</Typography>
                      <MiniSparkline values={data.daily.map(d => d.gmvMinor)} width={180} height={36} color={ops.live} />
                    </Stack>
                  </Stack>
                </AdminPageSection>
              </OpsSurfaceCard>
            </Grid>
          </Grid>
        </>
      ) : null}
    </AdminPageShell>
  )
}
