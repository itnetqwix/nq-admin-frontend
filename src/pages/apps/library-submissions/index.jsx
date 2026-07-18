import { useCallback, useEffect, useState } from 'react'
import { Chip, Grid, Stack } from '@mui/material'
import Link from 'next/link'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import LibrarySubmissionsPanel from 'src/components/clips/LibrarySubmissionsPanel'
import { getLibrarySubmissions } from 'src/services/clipsAdminApi'

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

export default function LibrarySubmissionsPage() {
  const [counts, setCounts] = useState({ pending: 0, underReview: 0 })

  const refreshCounts = useCallback(async () => {
    try {
      const data = await getLibrarySubmissions({ limit: 1 })
      setCounts({
        pending: data?.pendingCount ?? 0,
        underReview: data?.underReviewCount ?? 0
      })
    } catch {
      /* panel will toast on full load */
    }
  }, [])

  useEffect(() => {
    void refreshCounts()
  }, [refreshCounts])

  return (
    <AdminPageShell
      bare
      icon='mdi:clipboard-check-outline'
      eyebrow='Library'
      title='Library requests'
      subtitle='Review trainer/trainee clips submitted for the public NetQwix Library — watch, place, approve or reject.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Chip
            component={Link}
            href='/apps/clip-taxonomy'
            label='Categories'
            clickable
            variant='outlined'
            size='small'
          />
          <Chip
            component={Link}
            href='/apps/netqwix-library'
            label='Published clips'
            clickable
            variant='outlined'
            size='small'
          />
        </Stack>
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={4}>
          <OpsMetricTile
            icon='mdi:inbox-outline'
            label='Pending'
            value={fmtInt(counts.pending)}
            hint='Needs review'
            tone={counts.pending > 0 ? 'warn' : 'default'}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <OpsMetricTile
            icon='mdi:eye-outline'
            label='In review'
            value={fmtInt(counts.underReview)}
            hint='Claimed'
            tone='accent'
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <OpsMetricTile
            icon='mdi:library-outline'
            label='Queue signal'
            value={fmtInt(counts.pending + counts.underReview)}
            hint='Open work'
            tone={counts.pending + counts.underReview > 0 ? 'warn' : 'success'}
          />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminPageSection>
          <LibrarySubmissionsPanel onCountsChange={refreshCounts} />
        </AdminPageSection>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}
