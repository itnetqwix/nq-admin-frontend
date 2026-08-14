import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Chip,
  Stack
} from '@mui/material'
import NextLink from 'next/link'
import toast from 'react-hot-toast'

import { useAdminConfirm } from 'src/components/admin'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import UserQuickPreviewModal from 'src/components/user360/UserQuickPreviewModal'
import { getUser360 } from 'src/services/user360Api'
import { deleteUser, listUsers } from 'src/services/userAdminApi'
import { ops } from 'src/styles/opsSurface'

import { buildUserColumns } from './columns'
import DirectoryBody from './DirectoryBody'


export default function UsersDirectoryPage() {
  const router = useRouter()
  const searchTimerRef = useRef(null)
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  // Applied filters (drive API). Draft fields only commit on Apply.
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [country, setCountry] = useState('')
  const [timeZone, setTimeZone] = useState('')
  const [category, setCategory] = useState('')
  const [loginType, setLoginType] = useState('')
  const [minSessions, setMinSessions] = useState('')
  const [maxSessions, setMaxSessions] = useState('')
  const [draft, setDraft] = useState({
    from: '',
    to: '',
    country: '',
    time_zone: '',
    category: '',
    login_type: '',
    min_sessions: '',
    max_sessions: ''
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState({})
  const [previewUserId, setPreviewUserId] = useState(null)

  // Sync URL → state (shareable filters)
  useEffect(() => {
    if (!router.isReady) return
    const q = router.query
    if (q.search != null) {
      setSearchInput(String(q.search))
      setSearch(String(q.search))
    }
    if (q.account_type != null) setTypeFilter(String(q.account_type))
    if (q.status != null) setStatusFilter(String(q.status))
    const next = {
      from: q.from != null ? String(q.from) : '',
      to: q.to != null ? String(q.to) : '',
      country: q.country != null ? String(q.country) : '',
      time_zone: q.time_zone != null ? String(q.time_zone) : '',
      category: q.category != null ? String(q.category) : '',
      login_type: q.login_type != null ? String(q.login_type) : '',
      min_sessions: q.min_sessions != null ? String(q.min_sessions) : '',
      max_sessions: q.max_sessions != null ? String(q.max_sessions) : ''
    }
    setFromDate(next.from)
    setToDate(next.to)
    setCountry(next.country)
    setTimeZone(next.time_zone)
    setCategory(next.category)
    setLoginType(next.login_type)
    setMinSessions(next.min_sessions)
    setMaxSessions(next.max_sessions)
    setDraft(next)
    if (
      next.from ||
      next.to ||
      next.country ||
      next.time_zone ||
      next.category ||
      next.login_type ||
      next.min_sessions ||
      next.max_sessions
    ) {
      setFiltersOpen(true)
    }
  }, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const pushQuery = useCallback(
    next => {
      const q = {
        ...(next.search ? { search: next.search } : {}),
        ...(next.account_type ? { account_type: next.account_type } : {}),
        ...(next.status ? { status: next.status } : {}),
        ...(next.from ? { from: next.from } : {}),
        ...(next.to ? { to: next.to } : {}),
        ...(next.country ? { country: next.country } : {}),
        ...(next.time_zone ? { time_zone: next.time_zone } : {}),
        ...(next.category ? { category: next.category } : {}),
        ...(next.login_type ? { login_type: next.login_type } : {}),
        ...(next.min_sessions !== '' && next.min_sessions != null ? { min_sessions: next.min_sessions } : {}),
        ...(next.max_sessions !== '' && next.max_sessions != null ? { max_sessions: next.max_sessions } : {})
      }
      void router.replace({ pathname: '/apps/users', query: q }, undefined, { shallow: true })
    },
    [router]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listUsers({
        page,
        limit: pageSize,
        search,
        account_type: typeFilter,
        status: statusFilter,
        category,
        login_type: loginType,
        time_zone: timeZone,
        country,
        from: fromDate,
        to: toDate,
        min_sessions: minSessions,
        max_sessions: maxSessions
      })
      setRows(data.items)
      setTotal(data.total)
      setCounts(data.counts)
    } catch (e) {
      toast.error(e?.message || 'Failed to load users')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    pageSize,
    search,
    typeFilter,
    statusFilter,
    category,
    loginType,
    timeZone,
    country,
    fromDate,
    toDate,
    minSessions,
    maxSessions
  ])

  useEffect(() => {
    void load()
  }, [load])

  const scheduleSearch = value => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setSearch(value)
      setPage(1)
      pushQuery({
        search: value,
        account_type: typeFilter,
        status: statusFilter,
        from: fromDate,
        to: toDate,
        country,
        time_zone: timeZone,
        category,
        login_type: loginType,
        min_sessions: minSessions,
        max_sessions: maxSessions
      })
    }, 400)
  }

  const applyAdvanced = () => {
    setFromDate(draft.from)
    setToDate(draft.to)
    setCountry(draft.country)
    setTimeZone(draft.time_zone)
    setCategory(draft.category)
    setLoginType(draft.login_type)
    setMinSessions(draft.min_sessions)
    setMaxSessions(draft.max_sessions)
    setPage(1)
    pushQuery({
      search,
      account_type: typeFilter,
      status: statusFilter,
      from: draft.from,
      to: draft.to,
      country: draft.country,
      time_zone: draft.time_zone,
      category: draft.category,
      login_type: draft.login_type,
      min_sessions: draft.min_sessions,
      max_sessions: draft.max_sessions
    })
  }

  const clearAdvanced = () => {
    const empty = {
      from: '',
      to: '',
      country: '',
      time_zone: '',
      category: '',
      login_type: '',
      min_sessions: '',
      max_sessions: ''
    }
    setDraft(empty)
    setFromDate('')
    setToDate('')
    setCountry('')
    setTimeZone('')
    setCategory('')
    setLoginType('')
    setMinSessions('')
    setMaxSessions('')
    setPage(1)
    pushQuery({
      search,
      account_type: typeFilter,
      status: statusFilter
    })
  }

  const advancedQuerySlice = () => ({
    from: fromDate,
    to: toDate,
    country,
    time_zone: timeZone,
    category,
    login_type: loginType,
    min_sessions: minSessions,
    max_sessions: maxSessions
  })

  const setType = value => {
    setTypeFilter(value)
    setPage(1)
    pushQuery({
      search,
      account_type: value,
      status: statusFilter,
      ...advancedQuerySlice()
    })
  }

  const setStatus = value => {
    setStatusFilter(value)
    setPage(1)
    pushQuery({
      search,
      account_type: typeFilter,
      status: value,
      ...advancedQuerySlice()
    })
  }

  const openPreview = async (e, id) => {
    e.stopPropagation()
    if (!id) return
    setPreviewUserId(String(id))
    setPreviewOpen(true)
    setPreviewLoading(true)
    try {
      setPreviewData((await getUser360(id)) || {})
    } catch (err) {
      toast.error(err?.message || 'Preview failed')
      setPreviewData({})
    } finally {
      setPreviewLoading(false)
    }
  }

  const requestDelete = async (e, id, name) => {
    e.stopPropagation()
    const ok = await confirm({
      title: 'Delete user permanently?',
      message: 'This cannot be undone. Prefer Account deletions for soft-delete workflow.',
      detail: name || id,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteUser(id)
      toast.success('User deleted')
      void load()
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const copyId = (e, id) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(String(id)).then(
      () => toast.success('User ID copied'),
      () => toast.error('Copy failed')
    )
  }

  const activeAdvanced = Boolean(
    fromDate || toDate || country || timeZone || category || loginType || minSessions || maxSessions
  )

  const columns = useMemo(
    () => buildUserColumns({ copyId, openPreview, requestDelete }),
    [copyId, openPreview, requestDelete]
  )


  return (
    <>
      <UserQuickPreviewModal
        open={previewOpen}
        handleClose={() => {
          setPreviewOpen(false)
          setPreviewUserId(null)
        }}
        loading={previewLoading}
        user360Data={previewData}
        userId={previewUserId || previewData?.user?._id}
      />

      <AdminPageShell
        bare
        icon='mdi:account-search-outline'
        eyebrow='People'
        title='Users & accounts'
        subtitle='Directory of trainers and trainees — filter by identity, dates, location, and status. Click a row for User 360.'
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip
              component={NextLink}
              href='/apps/manage-trainer'
              label='Trainers'
              clickable
              variant='outlined'
              size='small'
            />
            <Chip
              component={NextLink}
              href='/apps/manage-trainee'
              label='Trainees'
              clickable
              variant='outlined'
              size='small'
            />
            <Chip
              component={NextLink}
              href='/apps/trainer-verifications'
              label='Verifications'
              clickable
              variant='outlined'
              size='small'
            />
            <Chip
              component={NextLink}
              href='/apps/account-deletions'
              label='Deletions'
              clickable
              variant='outlined'
              size='small'
            />
          </Stack>
        }
      >
        <DirectoryBody
          counts={counts}
          setType={setType}
          setStatus={setStatus}
          pushQuery={pushQuery}
          search={search}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          fromDate={fromDate}
          toDate={toDate}
          country={country}
          timeZone={timeZone}
          category={category}
          loginType={loginType}
          setFiltersOpen={setFiltersOpen}
          setPage={setPage}
          setDraft={setDraft}
          setFromDate={setFromDate}
          setToDate={setToDate}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          scheduleSearch={scheduleSearch}
          load={load}
          loading={loading}
          total={total}
          filtersOpen={filtersOpen}
          activeAdvanced={activeAdvanced}
          draft={draft}
          applyAdvanced={applyAdvanced}
          clearAdvanced={clearAdvanced}
          rows={rows}
          columns={columns}
          page={page}
          pageSize={pageSize}
          setPageSize={setPageSize}
          router={router}
        />
      </AdminPageShell>
      {ConfirmDialog}
    </>
  )
}
