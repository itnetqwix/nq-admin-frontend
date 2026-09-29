import { Button, Chip, Stack } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import {
  AdminDataGrid,
  AdminGridContainer,
  AdminRefreshButton,
  OpsSurfaceCard,
  useAdminConfirm
} from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { fetchPackageCredits, refundPackageCredit } from 'src/services/growthApi'

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'exhausted', label: 'Used up' },
  { value: 'refunded', label: 'Refunded' }
]

const fmtUsd = minor =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((Number(minor) || 0) / 100)

export default function PackageCreditsPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [data, setData] = useState({ rows: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await fetchPackageCredits({ status, page, limit }))
    } catch (err) {
      toast.error(err.message || 'Could not load packages')
    } finally {
      setLoading(false)
    }
  }, [status, page, limit])

  useEffect(() => {
    load()
  }, [load])

  const refund = useCallback(
    async row => {
      const ok = await confirm({
        title: 'Refund unused lessons?',
        message: `${row.lessons_remaining} unused lesson(s) · ${fmtUsd(
          row.lessons_remaining * row.price_per_lesson_minor
        )} back to the trainee wallet.`,
        detail: 'The package closes and can no longer be used to book.',
        confirmLabel: 'Refund',
        variant: 'danger'
      })
      if (!ok) return
      try {
        await refundPackageCredit(row._id)
        toast.success('Unused lessons refunded to wallet')
        load()
      } catch (err) {
        toast.error(err.message || 'Refund failed')
      }
    },
    [confirm, load]
  )

  const columns = useMemo(
    () => [
      { field: 'trainee', headerName: 'Trainee', flex: 1, valueGetter: p => p.row.trainee_id?.fullname || '—' },
      { field: 'trainer', headerName: 'Coach', flex: 1, valueGetter: p => p.row.trainer_id?.fullname || '—' },
      {
        field: 'lessons',
        headerName: 'Lessons left',
        width: 130,
        valueGetter: p => `${p.row.lessons_remaining} / ${p.row.lessons_total} × ${p.row.duration_minutes}m`
      },
      { field: 'paid', headerName: 'Paid', width: 110, valueGetter: p => fmtUsd(p.row.total_paid_minor) },
      { field: 'discount_pct', headerName: 'Discount', width: 100, valueGetter: p => `${p.row.discount_pct}%` },
      { field: 'status', headerName: 'Status', width: 110 },
      {
        field: 'createdAt',
        headerName: 'Bought',
        width: 120,
        valueGetter: p => new Date(p.row.createdAt).toLocaleDateString()
      },
      {
        field: 'actions',
        headerName: '',
        width: 130,
        sortable: false,
        renderCell: p =>
          p.row.status === 'active' && p.row.lessons_remaining > 0 ? (
            <Button size='small' color='error' onClick={() => refund(p.row)}>
              Refund unused
            </Button>
          ) : null
      }
    ],
    [refund]
  )

  return (
    <AdminPageShell
      bare
      icon='mdi:package-variant-closed'
      eyebrow='Revenue · packages'
      title='Lesson packages'
      subtitle='Prepaid bundles held by the platform until each lesson is booked into escrow.'
      actions={<AdminRefreshButton onClick={load} loading={loading} />}
    >
      <OpsSurfaceCard>
        <AdminPageSection>
          <Stack direction='row' spacing={1} sx={{ mb: 2 }}>
            {STATUSES.map(s => (
              <Chip
                key={s.value || 'all'}
                size='small'
                clickable
                label={s.label}
                color={status === s.value ? 'primary' : 'default'}
                variant={status === s.value ? 'filled' : 'outlined'}
                onClick={() => {
                  setStatus(s.value)
                  setPage(1)
                }}
              />
            ))}
          </Stack>
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              rows={data.rows || []}
              columns={columns}
              loading={loading}
              getRowId={r => r._id}
              emptyMessage='No packages yet'
              emptyDescription='Packages appear here once trainees buy a coach bundle.'
              paginationMode='server'
              rowCount={data.total || 0}
              paginationModel={{ page: page - 1, pageSize: limit }}
              onPaginationModelChange={m => {
                setPage(m.page + 1)
                setLimit(m.pageSize)
              }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </AdminGridContainer>
        </AdminPageSection>
      </OpsSurfaceCard>
      {ConfirmDialog}
    </AdminPageShell>
  )
}
