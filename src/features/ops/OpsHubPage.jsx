import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Link from 'next/link'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import AdminTabs from 'src/components/admin/AdminTabs'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import { ops } from 'src/styles/opsSurface'
import { useAppDispatch, useAppSelector } from 'src/store/hooks'
import {
  fetchFailedJobsList,
  fetchOpsEvents,
  fetchOpsStats,
  invalidateOpsStats,
  selectFailedJobs,
  selectOpsEvents
} from 'src/store/slices/opsSlice'

import OpsHealthTab from './tabs/OpsHealthTab'
import OpsEventsTab from './tabs/OpsEventsTab'
import OpsJobsTab from './tabs/OpsJobsTab'
import OpsCallsTab from './tabs/OpsCallsTab'

const TABS = [
  { value: 'health', label: 'Health' },
  { value: 'events', label: 'Events' },
  { value: 'jobs', label: 'Failed jobs' },
  { value: 'calls', label: 'Calls' }
]

const TAB_COPY = {
  health: {
    eyebrow: 'Ops · health',
    title: 'Platform health.',
    subtitle: 'Messaging channels, finance queues, and ops signals.'
  },
  events: {
    eyebrow: 'Ops · events',
    title: 'Ops events.',
    subtitle: 'Actionable incidents (instant, calls, wallet, support). Resolve here — not in Platform logs.'
  },
  jobs: {
    eyebrow: 'Ops · jobs',
    title: 'Failed jobs.',
    subtitle: 'BullMQ dead-letter visibility — retry after fixing root cause. List omits raw job payloads.'
  },
  calls: {
    eyebrow: 'Ops · calls',
    title: 'Call diagnostics.',
    subtitle: 'Preflight, in-call quality, clip playback, and lesson actions.'
  }
}

export default function OpsHubPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const eventsState = useAppSelector(selectOpsEvents)
  const jobsState = useAppSelector(selectFailedJobs)
  const tab = TABS.some(t => t.value === router.query.tab) ? String(router.query.tab) : 'health'
  const copy = TAB_COPY[tab] || TAB_COPY.health
  const [refreshTick, setRefreshTick] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    if (!router.query.tab) {
      void router.replace({ pathname: '/apps/ops', query: { tab: 'health' } }, undefined, { shallow: true })
    }
  }, [router.isReady, router.query.tab])

  const setTab = next => {
    void router.replace({ pathname: '/apps/ops', query: { tab: next } }, undefined, { shallow: true })
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      if (tab === 'health') {
        setRefreshTick(t => t + 1)
      } else if (tab === 'events') {
        dispatch(invalidateOpsStats())
        await dispatch(fetchOpsStats())
        await dispatch(
          fetchOpsEvents({
            page: eventsState.page,
            limit: eventsState.limit,
            filters: eventsState.filters
          })
        )
      } else if (tab === 'jobs') {
        await dispatch(
          fetchFailedJobsList({ page: jobsState.page, limit: jobsState.limit, search: jobsState.search })
        )
      } else if (tab === 'calls') {
        setRefreshTick(t => t + 1)
      }
    } finally {
      setRefreshing(false)
    }
  }, [tab, dispatch, eventsState.page, eventsState.limit, eventsState.filters, jobsState.page, jobsState.limit, jobsState.search])

  return (
    <AdminPageShell
      bare
      eyebrow={copy.eyebrow}
      icon='mdi:shield-account-outline'
      title={copy.title}
      subtitle={copy.subtitle}
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
          <Button size='small' component={Link} href='/apps/logs' sx={{ textTransform: 'none' }}>
            Logs hub →
          </Button>
          <Button size='small' component={Link} href='/apps/audit-logs' sx={{ textTransform: 'none' }}>
            Audit log →
          </Button>
          <AdminRefreshButton onClick={() => void onRefresh()} loading={refreshing} />
        </Stack>
      }
    >
      <AdminTabs value={tab} onChange={setTab} tabs={TABS} sx={{ mb: 2, borderBottom: `1px solid ${ops.hairline}` }} />
      {tab === 'health' ? <OpsHealthTab hub refreshTick={refreshTick} /> : null}
      {tab === 'events' ? <OpsEventsTab hub /> : null}
      {tab === 'jobs' ? <OpsJobsTab hub /> : null}
      {tab === 'calls' ? <OpsCallsTab hub refreshTick={refreshTick} /> : null}
    </AdminPageShell>
  )
}

OpsHubPage.acl = {
  action: 'read',
  subject: 'admin-nav-ops-logs'
}
