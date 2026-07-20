import { Box, Button, CircularProgress, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AdminUser360Tabs from 'src/components/user360/AdminUser360Tabs'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { getUser360, getUserAssets, getUserLessons, getUserReviews, getUserTimeline } from 'src/services/user360Api'
import { getOpsEventsForUser } from 'src/services/opsApi'
import { ops } from 'src/styles/opsSurface'

export default function User360Page() {
  const router = useRouter()
  const userId = useMemo(() => {
    if (!router.isReady) return null
    const raw = router.query?.id
    const v = Array.isArray(raw) ? raw[0] : raw
    if (v == null || v === 'undefined' || String(v).trim() === '') return null
    return String(v)
  }, [router.isReady, router.query?.id])

  const [tab, setTab] = useState(0)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [opsEventsLoading, setOpsEventsLoading] = useState(false)

  const [userData, setUserData] = useState(null)
  const [lessons, setLessons] = useState({ items: [], pagination: { page: 1, limit: 20, total: 0 } })
  const [reviews, setReviews] = useState({ items: [], pagination: { page: 1, limit: 20, total: 0 } })
  const [assets, setAssets] = useState({
    clips: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
    reports: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
    savedSessions: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
  })
  const [timeline, setTimeline] = useState({ items: [], pagination: { page: 1, limit: 30, total: 0 } })
  const [opsEvents, setOpsEvents] = useState({ items: [], total: 0 })

  const [query, setQuery] = useState({
    lessons: { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc', status: '', search: '' },
    reviews: { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc', status: '', search: '' },
    assets: { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc', search: '' },
    activity: { page: 1, limit: 30, eventType: '' }
  })

  const updateSectionQuery = (section, nextPatch) => {
    setQuery(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...nextPatch
      }
    }))
  }

  useEffect(() => {
    if (!router.isReady || !userId) return
    let cancelled = false
    ;(async () => {
      setOverviewLoading(true)
      try {
        const u = await getUser360(userId)
        if (!cancelled) setUserData(u)
      } catch (e) {
        if (!cancelled) {
          setUserData(null)
          toast.error(e?.message || 'Failed to load user')
        }
      } finally {
        if (!cancelled) setOverviewLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router.isReady, userId])

  useEffect(() => {
    if (!userId || tab !== 1) return
    let cancelled = false
    ;(async () => {
      setLessonsLoading(true)
      try {
        const d = await getUserLessons(userId, query.lessons)
        if (!cancelled) setLessons(d)
      } catch (e) {
        if (!cancelled) {
          setLessons({ items: [], pagination: { page: 1, limit: 20, total: 0 } })
          toast.error(e?.message || 'Failed to load lessons')
        }
      } finally {
        if (!cancelled) setLessonsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, tab, query.lessons])

  useEffect(() => {
    if (!userId || tab !== 2) return
    let cancelled = false
    ;(async () => {
      setReviewsLoading(true)
      try {
        const d = await getUserReviews(userId, query.reviews)
        if (!cancelled) setReviews(d)
      } catch (e) {
        if (!cancelled) {
          setReviews({ items: [], pagination: { page: 1, limit: 20, total: 0 } })
          toast.error(e?.message || 'Failed to load reviews')
        }
      } finally {
        if (!cancelled) setReviewsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, tab, query.reviews])

  useEffect(() => {
    if (!userId || tab !== 3) return
    let cancelled = false
    ;(async () => {
      setAssetsLoading(true)
      try {
        const d = await getUserAssets(userId, { ...query.assets, section: 'clips' })
        if (!cancelled) setAssets(d)
      } catch (e) {
        if (!cancelled) {
          setAssets({
            clips: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
            reports: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
            savedSessions: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
          })
          toast.error(e?.message || 'Failed to load clips')
        }
      } finally {
        if (!cancelled) setAssetsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, tab, query.assets])

  useEffect(() => {
    if (!userId || tab !== 4) return
    let cancelled = false
    ;(async () => {
      setAssetsLoading(true)
      try {
        const d = await getUserAssets(userId, { ...query.assets, section: 'plans' })
        if (!cancelled) setAssets(d)
      } catch (e) {
        if (!cancelled) {
          setAssets({
            clips: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
            reports: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
            savedSessions: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
          })
          toast.error(e?.message || 'Failed to load plans')
        }
      } finally {
        if (!cancelled) setAssetsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, tab, query.assets])

  useEffect(() => {
    if (!userId || tab !== 5) return
    let cancelled = false
    ;(async () => {
      setTimelineLoading(true)
      try {
        const d = await getUserTimeline(userId, query.activity)
        if (!cancelled) setTimeline(d)
      } catch (e) {
        if (!cancelled) {
          setTimeline({ items: [], pagination: { page: 1, limit: 30, total: 0 } })
          toast.error(e?.message || 'Failed to load activity timeline')
        }
      } finally {
        if (!cancelled) setTimelineLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, tab, query.activity])

  useEffect(() => {
    if (!userId || tab !== 7) return
    let cancelled = false
    ;(async () => {
      setOpsEventsLoading(true)
      try {
        const d = await getOpsEventsForUser(userId, { page: 1, limit: 50 })
        if (!cancelled) setOpsEvents({ items: d?.items || [], total: d?.total || 0 })
      } catch (e) {
        if (!cancelled) {
          setOpsEvents({ items: [], total: 0 })
          toast.error(e?.message || 'Failed to load issues')
        }
      } finally {
        if (!cancelled) setOpsEventsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, tab])

  const refreshActiveTab = useCallback(async () => {
    if (!userId) return
    try {
      if (tab === 0) {
        setUserData(await getUser360(userId))
      } else if (tab === 1) {
        setLessons(await getUserLessons(userId, query.lessons))
      } else if (tab === 2) {
        setReviews(await getUserReviews(userId, query.reviews))
      } else if (tab === 3) {
        setAssets(await getUserAssets(userId, { ...query.assets, section: 'clips' }))
      } else if (tab === 4) {
        setAssets(await getUserAssets(userId, { ...query.assets, section: 'plans' }))
      } else if (tab === 5) {
        setTimeline(await getUserTimeline(userId, query.activity))
      } else if (tab === 7) {
        const d = await getOpsEventsForUser(userId, { page: 1, limit: 50 })
        setOpsEvents({ items: d?.items || [], total: d?.total || 0 })
      }
    } catch (e) {
      toast.error(e?.message || 'Refresh failed')
    }
  }, [userId, tab, query.lessons, query.reviews, query.assets, query.activity])

  const copyText = (label, text) => {
    if (!text) return
    void navigator.clipboard.writeText(String(text)).then(() => toast.success(`${label} copied`))
  }

  const displayName =
    userData?.overview?.identity?.fullname || userData?.user?.fullname || 'User profile'
  const email = userData?.overview?.identity?.email || userData?.user?.email || ''
  const accountType =
    userData?.user?.account_type || userData?.overview?.identity?.account_type || 'trainer'
  const listHref =
    accountType === 'trainee'
      ? '/apps/manage-trainee'
      : accountType === 'trainer'
        ? '/apps/manage-trainer'
        : '/apps/users'
  const listLabel =
    accountType === 'trainee' ? 'Trainees' : accountType === 'trainer' ? 'Trainers' : 'Users'

  if (!router.isReady) {
    return (
      <AdminPageShell
        bare
        eyebrow='People · user 360'
        icon='mdi:account-search-outline'
        title='User 360.'
        subtitle='Loading…'
        loading
      />
    )
  }

  if (!userId) {
    return (
      <AdminPageShell
        bare
        eyebrow='People · user 360'
        icon='mdi:account-search-outline'
        title='User not found.'
        subtitle='The link may be invalid or the user id is missing.'
        actions={
          <Button component={Link} href='/apps/users' variant='contained' sx={{ textTransform: 'none' }}>
            Back to users
          </Button>
        }
      />
    )
  }

  return (
    <AdminPageShell
      bare
      eyebrow='People · user 360'
      icon='mdi:account-search-outline'
      title={overviewLoading && !userData ? 'Loading…' : `${displayName}.`}
      subtitle={
        email
          ? `${email} · Full access view for support, moderation, and billing.`
          : 'Full access view for support, moderation, and billing context.'
      }
      actions={
        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
          <Button
            component={Link}
            href={listHref}
            size='small'
            variant='outlined'
            sx={{ textTransform: 'none' }}
          >
            ← {listLabel}
          </Button>
          <Button
            component={Link}
            href={`/apps/logs?tab=login&userId=${userId}`}
            size='small'
            variant='outlined'
            sx={{ textTransform: 'none' }}
          >
            Login history
          </Button>
          <Tooltip title='Copy MongoDB user id'>
            <Button
              size='small'
              variant='outlined'
              startIcon={<ContentCopyOutlinedIcon />}
              onClick={() => copyText('User ID', userId)}
              sx={{ textTransform: 'none' }}
            >
              Copy ID
            </Button>
          </Tooltip>
          {email ? (
            <Tooltip title='Copy email'>
              <IconButton size='small' onClick={() => copyText('Email', email)} aria-label='copy email'>
                <ContentCopyOutlinedIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      }
    >
      <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mb: 2 }}>
        <Box component={Link} href='/apps/users' sx={{ color: ops.indigo, textDecoration: 'none' }}>
          All users
        </Box>
        {' · '}
        <Box component={Link} href={listHref} sx={{ color: ops.indigo, textDecoration: 'none' }}>
          {listLabel}
        </Box>
        {' · '}
        {userId}
      </Typography>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        {overviewLoading && !userData ? (
          <Box sx={{ py: 12, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} sx={{ color: ops.ink }} />
          </Box>
        ) : (
          <AdminUser360Tabs
            userId={userId}
            tab={tab}
            onTabChange={setTab}
            userData={userData}
            lessons={lessons}
            reviews={reviews}
            assets={assets}
            timeline={timeline}
            opsEvents={opsEvents}
            loadingLessons={lessonsLoading}
            loadingReviews={reviewsLoading}
            loadingAssets={assetsLoading}
            loadingTimeline={timelineLoading}
            loadingOpsEvents={opsEventsLoading}
            onRefresh={refreshActiveTab}
            query={query}
            onQueryChange={updateSectionQuery}
            hardDeletePolicy={userData?.policy}
          />
        )}
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}
