import { Button, IconButton, Stack, Switch } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import Icon from 'src/@core/components/icon'
import {
  AdminDataGrid,
  AdminGridContainer,
  AdminRefreshButton,
  OpsSurfaceCard,
  useAdminConfirm
} from 'src/components/admin'
import FlagDialog, { EMPTY_FLAG } from 'src/features/featureFlags/FlagDialog'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { deleteFeatureFlag, fetchFeatureFlags, saveFeatureFlag } from 'src/services/growthApi'

export default function FeatureFlagsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows((await fetchFeatureFlags()) || [])
    } catch (err) {
      toast.error(err.message || 'Could not load flags')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async flag => {
      try {
        await saveFeatureFlag(flag)
        toast.success(`Saved ${flag.key}`)
        load()
      } catch (err) {
        toast.error(err.message || 'Save failed')
        throw err
      }
    },
    [load]
  )

  const quickToggle = useCallback(
    async row => {
      const next = !row.enabled
      const ok = await confirm({
        title: `${next ? 'Enable' : 'Disable'} ${row.key}?`,
        message: 'Clients pick this up within about a minute.',
        confirmLabel: next ? 'Enable' : 'Disable',
        variant: next ? 'default' : 'danger'
      })
      if (ok) save({ ...row, enabled: next }).catch(() => {})
    },
    [confirm, save]
  )

  const remove = useCallback(
    async row => {
      const ok = await confirm({
        title: `Delete ${row.key}?`,
        message: 'Code checking this flag will treat it as off.',
        confirmLabel: 'Delete',
        variant: 'danger'
      })
      if (!ok) return
      try {
        await deleteFeatureFlag(row.key)
        toast.success('Flag deleted')
        load()
      } catch (err) {
        toast.error(err.message || 'Delete failed')
      }
    },
    [confirm, load]
  )

  const columns = useMemo(
    () => [
      { field: 'key', headerName: 'Key', flex: 1, minWidth: 160 },
      { field: 'description', headerName: 'Description', flex: 1.5 },
      {
        field: 'enabled',
        headerName: 'On',
        width: 90,
        renderCell: p => <Switch size='small' checked={!!p.row.enabled} onChange={() => quickToggle(p.row)} />
      },
      { field: 'rollout_percent', headerName: 'Rollout', width: 100, valueGetter: p => `${p.row.rollout_percent}%` },
      {
        field: 'roles',
        headerName: 'Audience',
        width: 160,
        valueGetter: p => (p.row.roles?.length ? p.row.roles.join(', ') : 'Everyone')
      },
      {
        field: 'updatedAt',
        headerName: 'Updated',
        width: 120,
        valueGetter: p => (p.row.updatedAt ? new Date(p.row.updatedAt).toLocaleDateString() : '—')
      },
      {
        field: 'actions',
        headerName: '',
        width: 100,
        sortable: false,
        renderCell: p => (
          <>
            <IconButton size='small' aria-label='Edit flag' onClick={() => setEditing(p.row)}>
              <Icon icon='mdi:pencil-outline' fontSize={18} />
            </IconButton>
            <IconButton size='small' aria-label='Delete flag' onClick={() => remove(p.row)}>
              <Icon icon='mdi:delete-outline' fontSize={18} />
            </IconButton>
          </>
        )
      }
    ],
    [quickToggle, remove]
  )

  return (
    <AdminPageShell
      bare
      icon='mdi:flag-variant-outline'
      eyebrow='Ops · feature flags'
      title='Feature flags'
      subtitle='Kill-switches and gradual rollouts for web and mobile. Evaluated on the server per user.'
      actions={
        <Stack direction='row' spacing={1}>
          <Button variant='contained' size='small' onClick={() => setEditing(EMPTY_FLAG)}>
            New flag
          </Button>
          <AdminRefreshButton onClick={load} loading={loading} />
        </Stack>
      }
    >
      <OpsSurfaceCard>
        <AdminPageSection>
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              rows={rows}
              columns={columns}
              loading={loading}
              getRowId={r => r._id || r.key}
              emptyMessage='No flags yet'
              emptyDescription='Create a flag, then gate code with useFeatureFlag("key").'
            />
          </AdminGridContainer>
        </AdminPageSection>
      </OpsSurfaceCard>
      <FlagDialog open={!!editing} initial={editing} onClose={() => setEditing(null)} onSave={save} />
      {ConfirmDialog}
    </AdminPageShell>
  )
}
