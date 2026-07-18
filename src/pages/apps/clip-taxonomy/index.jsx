import { useState } from 'react'
import { Chip, Stack } from '@mui/material'
import Link from 'next/link'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import ClipTaxonomyPanel from 'src/components/clips/ClipTaxonomyPanel'
import { ops } from 'src/styles/opsSurface'

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
      <Stack direction='row' spacing={1} sx={{ mb: 2 }} flexWrap='wrap' useFlexGap>
        <Chip
          size='small'
          label={`${cats.length} categories`}
          sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: ops.softIndigo, color: ops.indigoDeep }}
        />
        <Chip
          size='small'
          label={`${active} active`}
          sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: '#AAFFEC', color: '#1A8F76' }}
        />
        <Chip
          size='small'
          label={`${subs} subcategories`}
          sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: ops.canvasSoft2 }}
        />
      </Stack>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminPageSection>
          <ClipTaxonomyPanel onTaxonomyChange={setTaxonomy} />
        </AdminPageSection>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}
