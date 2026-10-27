import { useCallback, useContext, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { getPointsHistory, revertPointsConfig } from 'src/services/referralAdminApi'

const fmtVal = v => (v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))

/** Every saved change to points settings, who made it and why, with one-click revert (write access only). */
const PointsHistoryTab = () => {
  const ability = useContext(AbilityContext)
  const canWrite = ability?.can('update', 'admin-nav-points') ?? true
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await getPointsHistory())
    } catch (e) {
      setMsg({ severity: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const revert = async row => {
    const reason = window.prompt(`Why are you reverting version ${row.version}? (required)`)
    if (!reason || reason.trim().length < 5) return
    try {
      await revertPointsConfig(row._id, reason.trim())
      setMsg({ severity: 'success', text: `Reverted the changes from version ${row.version}.` })
      load()
    } catch (e) {
      setMsg({ severity: 'error', text: e.message })
    }
  }

  return (
    <>
      <Typography sx={{ fontSize: 13, mb: 2 }}>
        Revert restores the values as they were <em>before</em> that change, as a new audited change.
      </Typography>
      {msg ? <Alert severity={msg.severity} sx={{ mb: 2 }}>{msg.text}</Alert> : null}
      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminGridContainer>
          <AdminDataGrid
            rows={rows.map(r => ({ id: r._id, ...r }))}
            loading={loading}
            autoHeight
            getRowHeight={() => 'auto'}
            pageSizeOptions={[25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            columns={[
              { field: 'createdAt', headerName: 'When', width: 170, valueGetter: p => new Date(p.row.createdAt).toLocaleString() },
              { field: 'version', headerName: 'v', width: 60 },
              { field: 'admin', headerName: 'By', width: 160, valueGetter: p => p.row.admin?.name || p.row.admin?.email || '—' },
              { field: 'kind', headerName: 'Type', width: 90 },
              { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 160 },
              {
                field: 'diff',
                headerName: 'Changes',
                flex: 2,
                minWidth: 280,
                sortable: false,
                renderCell: p => (
                  <div style={{ whiteSpace: 'normal', lineHeight: 1.4, padding: '6px 0', fontSize: 12 }}>
                    {(p.row.diff || []).slice(0, 8).map(d => (
                      <div key={d.path}>
                        <b>{d.path}</b>: {fmtVal(d.before)} → {fmtVal(d.after)}
                      </div>
                    ))}
                    {(p.row.diff || []).length > 8 ? `…and ${p.row.diff.length - 8} more` : ''}
                  </div>
                )
              },
              {
                field: 'actions',
                headerName: '',
                width: 110,
                sortable: false,
                renderCell: p => (
                  <Button size='small' disabled={!canWrite} onClick={() => revert(p.row)}>Revert</Button>
                )
              }
            ]}
          />
        </AdminGridContainer>
      </OpsSurfaceCard>
    </>
  )
}

export default PointsHistoryTab
