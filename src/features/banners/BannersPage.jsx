import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { useAdminConfirm } from 'src/components/admin'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import BannerScheduleCalendar from 'src/components/admin/content/BannerScheduleCalendar'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner
} from 'src/services/bannersApi'
import { getCmsSummary } from 'src/services/cmsApi'
import { ops } from 'src/styles/opsSurface'

import { AUDIENCES, PLACEMENTS, EMPTY_FORM, FilterChip, normalizeCtasFromRow, buildCtasPayload } from './helpers'
import { buildBannerColumns } from './columns'
import BannerEditor from './BannerEditor'


export default function BannersPage() {
  const router = useRouter()
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [banners, setBanners] = useState([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('')
  const [placementFilter, setPlacementFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [previewRow, setPreviewRow] = useState(null)
  const [previewAudience, setPreviewAudience] = useState('trainee')

  const searchTimer = useRef(null)

  useEffect(() => {
    if (!router.isReady) return
    const q = router.query
    if (q.placement != null) setPlacementFilter(String(q.placement))
    if (q.status != null) setStatusFilter(String(q.status))
    if (q.audience != null) setAudienceFilter(String(q.audience))
    if (q.search != null) {
      setSearchInput(String(q.search))
      setSearch(String(q.search))
    }
  }, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    },
    []
  )

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getCmsSummary()
      setSummary(res?.data || null)
    } catch {
      /* ignore */
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listBanners({
        search,
        audience: audienceFilter,
        placement: placementFilter,
        status: statusFilter,
        page,
        pageSize
      })
      const items = data?.data?.items || []
      setBanners(items.map(p => ({ ...p, id: p._id })))
      setTotal(data?.data?.total || 0)
    } catch (err) {
      toast.error(err.message || 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [search, audienceFilter, placementFilter, statusFilter, page, pageSize])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  const pushQuery = useCallback(
    next => {
      const q = {
        ...(next.placement ? { placement: next.placement } : {}),
        ...(next.status ? { status: next.status } : {}),
        ...(next.audience ? { audience: next.audience } : {}),
        ...(next.search ? { search: next.search } : {})
      }
      void router.replace({ pathname: '/apps/banners', query: q }, undefined, { shallow: true })
    },
    [router]
  )

  const setPlacement = value => {
    setPlacementFilter(value)
    setPage(1)
    pushQuery({ placement: value, status: statusFilter, audience: audienceFilter, search })
  }

  const setStatus = value => {
    setStatusFilter(value)
    setPage(1)
    pushQuery({ placement: placementFilter, status: value, audience: audienceFilter, search })
  }

  const setAudience = value => {
    setAudienceFilter(value)
    setPage(1)
    pushQuery({ placement: placementFilter, status: statusFilter, audience: value, search })
  }

  const handleSearchChange = value => {
    const val = value
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val.trim())
      setPage(1)
      pushQuery({
        placement: placementFilter,
        status: statusFilter,
        audience: audienceFilter,
        search: val.trim()
      })
    }, 400)
  }

  const applySearchImmediately = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    setSearch(searchInput.trim())
    setPage(1)
    pushQuery({
      placement: placementFilter,
      status: statusFilter,
      audience: audienceFilter,
      search: searchInput.trim()
    })
  }

  const clearSearch = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const openCreate = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setFormOpen(true)
  }

  const openEdit = row => {
    setEditId(row._id)
    setForm({
      title: row.title || '',
      body: row.body || '',
      image_url: row.image_url || '',
      background_image_url: row.background_image_url || '',
      background_color: row.background_color || '',
      image_height: String(row.image_height ?? 140),
      image_fit: row.image_fit || 'cover',
      text_align: row.text_align || 'left',
      overlay_opacity: String(row.overlay_opacity ?? 0.45),
      audience: Array.isArray(row.audience) && row.audience.length ? row.audience : ['all'],
      severity: row.severity || 'info',
      placement: row.placement || 'hero',
      auto_advance_sec: String(row.auto_advance_sec ?? 5),
      ctas: normalizeCtasFromRow(row),
      cta_label: row.cta_label || '',
      cta_url: row.cta_url || '',
      dismissible: row.dismissible !== false,
      is_active: row.is_active ?? true,
      sort_order: String(row.sort_order ?? '0'),
      start_date: row.start_date ? row.start_date.slice(0, 10) : '',
      end_date: row.end_date ? row.end_date.slice(0, 10) : '',
      experiment_key: row.experiment_key || '',
      variant_label: row.variant_label || ''
    })
    setFormOpen(true)
  }

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required.')
    if (!form.audience.length) return toast.error('Select at least one audience.')
    setSaving(true)
    try {
      const ctas = buildCtasPayload(form.ctas)
      const body = {
        title: form.title.trim(),
        body: form.body.trim(),
        image_url: form.image_url || null,
        background_image_url: form.background_image_url || null,
        background_color: form.background_color?.trim() || null,
        image_height: Number(form.image_height) || 140,
        image_fit: form.image_fit === 'contain' ? 'contain' : 'cover',
        text_align: form.text_align === 'center' ? 'center' : 'left',
        overlay_opacity: Math.min(1, Math.max(0, Number(form.overlay_opacity) || 0.45)),
        audience: form.audience,
        severity: form.severity,
        placement: form.placement || 'hero',
        auto_advance_sec: Number(form.auto_advance_sec) || 5,
        ctas,
        cta_label: ctas.length ? null : form.cta_label || null,
        cta_url: ctas.length ? null : form.cta_url || null,
        dismissible: form.dismissible,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date + 'T23:59:59').toISOString() : null,
        experiment_key: form.experiment_key?.trim() || null,
        variant_label: form.variant_label?.trim() || null
      }
      if (editId) {
        await updateBanner(editId, body)
        toast.success('Banner updated.')
      } else {
        await createBanner(body)
        toast.success('Banner created.')
      }
      setFormOpen(false)
      void fetchData()
      void fetchSummary()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const requestDelete = async row => {
    const ok = await confirm({
      title: 'Delete banner?',
      message: `"${row.title}" will be removed from all mobile placements.`,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteBanner(row._id)
      toast.success('Banner deleted.')
      void fetchData()
      void fetchSummary()
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const handleToggle = async row => {
    try {
      await toggleBanner(row._id)
      void fetchData()
      void fetchSummary()
    } catch (err) {
      toast.error(err.message || 'Toggle failed')
    }
  }

  const columns = useMemo(
    () => buildBannerColumns({ openEdit, setPreviewRow, requestDelete, handleToggle }),
    [openEdit, setPreviewRow, requestDelete, handleToggle]
  )


  const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

  return (
    <>
      <AdminPageShell
        bare
        icon='mdi:image-multiple-outline'
        eyebrow='CMS'
        title='Banners & placements'
        subtitle='Hero, strip, and sticky promos — filter by placement, audience, and schedule status.'
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip component={NextLink} href='/apps/cms' label='CMS overview' clickable variant='outlined' size='small' />
            <Chip component={NextLink} href='/apps/tips' label='Tips' clickable variant='outlined' size='small' />
            <Button
              variant='contained'
              size='small'
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ textTransform: 'none', bgcolor: ops.indigo, boxShadow: 'none' }}
            >
              New banner
            </Button>
          </Stack>
        }
      >
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:view-carousel-outline'
              label='Hero live'
              value={summary ? fmtInt(summary.live?.banners_hero) : '—'}
              hint='Carousel'
              tone={summary?.health?.hero_empty ? 'danger' : 'accent'}
              onClick={() => setPlacement('hero')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:page-layout-header'
              label='Strip live'
              value={summary ? fmtInt(summary.live?.banners_strip) : '—'}
              hint='Announcement'
              onClick={() => setPlacement('strip')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:dock-bottom'
              label='Sticky live'
              value={summary ? fmtInt(summary.live?.banners_sticky_bottom) : '—'}
              hint='Tab bar'
              onClick={() => setPlacement('sticky_bottom')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:check-circle-outline'
              label='Active total'
              value={summary ? fmtInt(summary.live?.banners) : '—'}
              hint='All placements'
              tone='success'
              onClick={() => setStatus('active')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:pause-circle-outline'
              label='Inactive'
              value={summary ? fmtInt(summary.inactive?.banners) : '—'}
              hint='Paused'
              tone='warn'
              onClick={() => setStatus('inactive')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:calendar-clock'
              label='Off-window'
              value={summary ? fmtInt(summary.scheduled_off_window) : '—'}
              hint='Outside dates'
              tone={(summary?.scheduled_off_window || 0) > 0 ? 'warn' : 'default'}
            />
          </Grid>
        </Grid>

        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden', mb: 2 }}>
          <AdminPageSection>
            <ContentPlacementGuide kind='banners' defaultExpanded={false} />
            <Box sx={{ mb: 2 }}>
              <BannerScheduleCalendar banners={banners} />
            </Box>
            <AdminFilterBar
              searchPlaceholder='Title, body, CTA, audience…'
              searchValue={searchInput}
              onSearchChange={e => handleSearchChange(e.target.value)}
              onSearchSubmit={applySearchImmediately}
              resultCount={total}
              onRefresh={() => {
                void fetchData()
                void fetchSummary()
              }}
              refreshLoading={loading}
              helperText='Placement chips sync to the URL — shareable with CMS overview deep links.'
            >
              <FilterChip active={placementFilter === ''} label='All placements' onClick={() => setPlacement('')} />
              {PLACEMENTS.map(p => (
                <FilterChip
                  key={p.value}
                  active={placementFilter === p.value}
                  label={p.label}
                  onClick={() => setPlacement(p.value)}
                />
              ))}
              <FilterChip active={statusFilter === ''} label='Any status' onClick={() => setStatus('')} />
              <FilterChip active={statusFilter === 'active'} label='Active' onClick={() => setStatus('active')} />
              <FilterChip active={statusFilter === 'inactive'} label='Inactive' onClick={() => setStatus('inactive')} />
              <FilterChip active={audienceFilter === ''} label='Any audience' onClick={() => setAudience('')} />
              {AUDIENCES.map(a => (
                <FilterChip key={a} active={audienceFilter === a} label={a} onClick={() => setAudience(a)} />
              ))}
            </AdminFilterBar>

            <AdminGridContainer>
              <AdminDataGrid
                autoHeight={false}
                rows={banners}
                columns={columns}
                loading={loading}
                rowCount={total}
                paginationMode='server'
                paginationModel={{ page: page - 1, pageSize }}
                onPaginationModelChange={m => {
                  setPage(m.page + 1)
                  setPageSize(m.pageSize)
                }}
                getRowHeight={() => 72}
                emptyMessage='No banners match'
                emptyDescription='Try clearing placement or status chips.'
              />
            </AdminGridContainer>
          </AdminPageSection>
        </OpsSurfaceCard>
      </AdminPageShell>

      <BannerEditor
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        editId={editId}
        form={form}
        handleSave={handleSave}
        saving={saving}
        handleFormChange={handleFormChange}
        previewRow={previewRow}
        setPreviewRow={setPreviewRow}
        previewAudience={previewAudience}
        setPreviewAudience={setPreviewAudience}
        openEdit={openEdit}
      />
    </>
  )
}
