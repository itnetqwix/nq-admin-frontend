import { useState } from 'react'
import { Chip, Grid, Stack } from '@mui/material'
import Link from 'next/link'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import ClipTaxonomyPanel from 'src/components/clips/ClipTaxonomyPanel'

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

export default function ClipTaxonomyPage() {
  const [taxonomy, setTaxonomy] = useState([])
  const cats = Array.isArray(taxonomy) ? taxonomy : []
  const active = cats.filter(c => c.is_active !== false).length
  const subs = cats.reduce((n, c) => n + ((c.subcategories || []).filter(s => s.is_active !== false).length || 0), 0)

  return (
    <AdminPageShell
      bare
      icon='mdi:folder-outline'
      eyebrow='Library'
      title='Clip categories'
      subtitle='Master taxonomy for uploads and NetQwix Library publishing. Active categories appear in the mobile picker.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Chip
            component={Link}
            href='/apps/library-submissions'
            label='Library requests'
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
          <OpsMetricTile icon='mdi:folder-outline' label='Categories' value={fmtInt(cats.length)} hint='All rows' />
        </Grid>
        <Grid item xs={6} sm={4}>
          <OpsMetricTile
            icon='mdi:check-circle-outline'
            label='Active'
            value={fmtInt(active)}
            hint='Shown in picker'
            tone='success'
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <OpsMetricTile icon='mdi:subdirectory-arrow-right' label='Subcategories' value={fmtInt(subs)} hint='Active only' />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminPageSection>
          <ClipTaxonomyPanel onTaxonomyChange={setTaxonomy} />
        </AdminPageSection>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}
