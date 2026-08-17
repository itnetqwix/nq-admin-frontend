import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminTabs from 'src/components/admin/AdminTabs'
import { useAdminConfirm } from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import {
  createCareerJob,
  deleteCareerJob,
  listCareerApplications,
  listCareerJobs,
  toggleCareerJob,
  updateCareerJob
} from 'src/services/careersApi'
import { APPLICATION_STATUSES, DEPARTMENTS, EMPTY_JOB, FilterChip, JOB_STATUSES, jobFromRow, jobPayload } from './helpers'
import { buildApplicationColumns, buildJobColumns } from './columns'
import JobEditor from './JobEditor'
import ApplicationDrawer from './ApplicationDrawer'

export default function CareersPage() {
  const router = useRouter()
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [tab, setTab] = useState('jobs')
  const [jobs, setJobs] = useState([])
  const [jobTotal, setJobTotal] = useState(0)
  const [apps, setApps] = useState([])
  const [appTotal, setAppTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_JOB })
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState(null)
  const searchTimer = useRef(null)

  useEffect(() => {
    if (!router.isReady) return
    const q = router.query
    if (q.tab === 'applications' || q.tab === 'jobs') setTab(String(q.tab))
    if (q.status != null) setStatusFilter(String(q.status))
    if (q.department != null) setDepartmentFilter(String(q.department))
    if (q.jobId != null) setJobFilter(String(q.jobId))
    if (q.search != null) {
      setSearchInput(String(q.search))
      setSearch(String(q.search))
    }
  }, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const pushQuery = useCallback(
    next => {
      const q = {
        tab: next.tab || tab,
        ...(next.status ? { status: next.status } : {}),
        ...(next.department ? { department: next.department } : {}),
        ...(next.jobId ? { jobId: next.jobId } : {}),
        ...(next.search ? { search: next.search } : {})
      }
      void router.replace({ pathname: '/apps/careers', query: q }, undefined, { shallow: true })
    },
    [router, tab]
  )

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listCareerJobs({
        search,
        status: statusFilter,
        department: departmentFilter,
        page,
        pageSize
      })
      const items = data?.data?.items || []
      setJobs(items.map(p => ({ ...p, id: p._id })))
      setJobTotal(data?.data?.total || 0)
    } catch (err) {
      toast.error(err.message || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, departmentFilter, page, pageSize])

  const loadApps = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listCareerApplications({
        search,
        status: statusFilter,
        jobId: jobFilter,
        page,
        pageSize
      })
      const items = data?.data?.items || []
      setApps(items.map(p => ({ ...p, id: p._id })))
      setAppTotal(data?.data?.total || 0)
    } catch (err) {
      toast.error(err.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, jobFilter, page, pageSize])

  useEffect(() => {
    if (tab === 'jobs') void loadJobs()
    else void loadApps()
  }, [tab, loadJobs, loadApps])

  useEffect(() => {
    if (tab !== 'applications') return
    void listCareerJobs({ pageSize: 100 }).then(res => {
      const items = res?.data?.items || []
      setJobs(items.map(p => ({ ...p, id: p._id })))
    }).catch(() => {})
  }, [tab])

  const handleSearchChange = value => {
    setSearchInput(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(value.trim())
      setPage(1)
      pushQuery({ search: value.trim(), status: statusFilter, department: departmentFilter, jobId: jobFilter })
    }, 400)
  }

  const openCreate = () => {
    setEditId(null)
    setForm({ ...EMPTY_JOB })
    setFormOpen(true)
  }

  const openEdit = row => {
    setEditId(row._id)
    const next = jobFromRow(row)
    next.questions = (next.questions || []).map(q => ({
      ...q,
      optionsText: (q.options || []).join('\n')
    }))
    setForm(next)
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required.')
    setSaving(true)
    try {
      const body = jobPayload(form)
      if (editId) {
        await updateCareerJob(editId, body)
        toast.success('Job updated.')
      } else {
        await createCareerJob(body)
        toast.success('Job created.')
      }
      setFormOpen(false)
      void loadJobs()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const requestDelete = async row => {
    const ok = await confirm({
      title: 'Delete job?',
      message: `"${row.title}" will be removed from the careers page.`,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteCareerJob(row._id)
      toast.success('Job deleted.')
      void loadJobs()
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const handleToggle = async row => {
    try {
      await toggleCareerJob(row._id)
      void loadJobs()
    } catch (err) {
      toast.error(err.message || 'Toggle failed')
    }
  }

  const jobColumns = buildJobColumns({ openEdit, requestDelete, handleToggle })
  const appColumns = buildApplicationColumns({ openDetail: setDetail })

  return (
    <>
      <AdminPageShell
        title='Careers'
        subtitle='Job openings and applications for netqwix.com/careers'
        actions={
          tab === 'jobs' ? (
            <Button variant='contained' startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: 'none' }}>
              New job
            </Button>
          ) : null
        }
      >
        <AdminTabs
          value={tab}
          onChange={next => {
            setTab(next)
            setPage(1)
            setStatusFilter('')
            setSearch('')
            setSearchInput('')
            pushQuery({ tab: next })
          }}
          tabs={[
            { value: 'jobs', label: `Openings (${jobTotal})` },
            { value: 'applications', label: `Applications (${appTotal})` }
          ]}
        />
        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
          <AdminPageSection>
            <AdminFilterBar
              searchPlaceholder={tab === 'jobs' ? 'Title, slug, location…' : 'Name, email, phone…'}
              searchValue={searchInput}
              onSearchChange={e => handleSearchChange(e.target.value)}
              onRefresh={() => (tab === 'jobs' ? loadJobs() : loadApps())}
              refreshLoading={loading}
              resultCount={tab === 'jobs' ? jobTotal : appTotal}
            >
              {tab === 'jobs' ? (
                <>
                  <FilterChip active={statusFilter === ''} label='Any status' onClick={() => { setStatusFilter(''); setPage(1) }} />
                  {JOB_STATUSES.map(s => (
                    <FilterChip
                      key={s.value}
                      active={statusFilter === s.value}
                      label={s.label}
                      onClick={() => { setStatusFilter(s.value); setPage(1) }}
                    />
                  ))}
                  {DEPARTMENTS.map(s => (
                    <FilterChip
                      key={s.value}
                      active={departmentFilter === s.value}
                      label={s.label}
                      onClick={() => {
                        setDepartmentFilter(departmentFilter === s.value ? '' : s.value)
                        setPage(1)
                      }}
                    />
                  ))}
                </>
              ) : (
                <>
                  <FilterChip active={statusFilter === ''} label='Any status' onClick={() => { setStatusFilter(''); setPage(1) }} />
                  {APPLICATION_STATUSES.map(s => (
                    <FilterChip
                      key={s.value}
                      active={statusFilter === s.value}
                      label={s.label}
                      onClick={() => { setStatusFilter(s.value); setPage(1) }}
                    />
                  ))}
                  <FormControl size='small' sx={{ minWidth: 180 }}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      label='Role'
                      value={jobFilter}
                      onChange={e => {
                        setJobFilter(e.target.value)
                        setPage(1)
                      }}
                    >
                      <MenuItem value=''>All roles</MenuItem>
                      {jobs.map(j => (
                        <MenuItem key={j._id} value={j._id}>
                          {j.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
            </AdminFilterBar>
            <AdminGridContainer>
              {tab === 'jobs' ? (
                <AdminDataGrid
                  autoHeight={false}
                  rows={jobs}
                  columns={jobColumns}
                  loading={loading}
                  getRowId={r => r._id}
                  getRowHeight={() => 64}
                  onRowClick={p => openEdit(p.row)}
                  clickableRows
                  emptyMessage='No job openings'
                  emptyDescription='Create a role to list it on the public careers page.'
                  paginationMode='server'
                  rowCount={jobTotal}
                  paginationModel={{ page: page - 1, pageSize }}
                  onPaginationModelChange={m => {
                    setPage(m.page + 1)
                    setPageSize(m.pageSize)
                  }}
                />
              ) : (
                <AdminDataGrid
                  autoHeight={false}
                  rows={apps}
                  columns={appColumns}
                  loading={loading}
                  getRowId={r => r._id}
                  getRowHeight={() => 64}
                  onRowClick={p => setDetail(p.row)}
                  clickableRows
                  emptyMessage='No applications'
                  emptyDescription='Submitted applications will appear here.'
                  paginationMode='server'
                  rowCount={appTotal}
                  paginationModel={{ page: page - 1, pageSize }}
                  onPaginationModelChange={m => {
                    setPage(m.page + 1)
                    setPageSize(m.pageSize)
                  }}
                />
              )}
            </AdminGridContainer>
          </AdminPageSection>
        </OpsSurfaceCard>
      </AdminPageShell>
      <JobEditor
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        editId={editId}
        form={form}
        setForm={setForm}
        handleSave={handleSave}
        saving={saving}
      />
      <ApplicationDrawer
        row={detail}
        onClose={() => setDetail(null)}
        onUpdated={() => {
          setDetail(null)
          void loadApps()
        }}
      />
      {ConfirmDialog}
    </>
  )
}
