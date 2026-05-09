import { Box, Button, CircularProgress, Container, Typography } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AdminUser360Tabs from 'src/pages/components/user360/AdminUser360Tabs'
import { getAuditLogs, getUser360, getUserAssets, getUserLessons, getUserReviews } from 'src/services/user360Api'

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
  const [auditLoading, setAuditLoading] = useState(false)

  const [userData, setUserData] = useState(null)
  const [lessons, setLessons] = useState({ items: [], pagination: { page: 1, limit: 20, total: 0 } })
  const [reviews, setReviews] = useState({ items: [], pagination: { page: 1, limit: 20, total: 0 } })
  const [assets, setAssets] = useState({
    clips: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
    reports: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
    savedSessions: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
  })
  const [auditLogs, setAuditLogs] = useState({ items: [], pagination: { page: 1, limit: 20, total: 0 } })

  const [query, setQuery] = useState({
    lessons: { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc', status: '', search: '' },
    reviews: { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc', status: '', search: '' },
    assets: { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc', search: '' },
    activity: { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc', search: '' }
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
      setAuditLoading(true)
      try {
        const logs = await getAuditLogs(userId, query.activity)
        if (!cancelled) setAuditLogs(logs)
      } catch (e) {
        if (!cancelled) {
          setAuditLogs({ items: [], pagination: { page: 1, limit: 20, total: 0 } })
          toast.error(e?.message || 'Failed to load audit log')
        }
      } finally {
        if (!cancelled) setAuditLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, tab, query.activity])

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
        setAuditLogs(await getAuditLogs(userId, query.activity))
      }
    } catch (e) {
      toast.error(e?.message || 'Refresh failed')
    }
  }, [userId, tab, query.lessons, query.reviews, query.assets, query.activity])

  if (!router.isReady) {
    return (
      <Container maxWidth='xl'>
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (!userId) {
    return (
      <Container maxWidth='xl'>
        <Box sx={{ p: 3 }}>
          <Typography variant='h6' sx={{ mb: 2 }}>User not found</Typography>
          <Typography variant='body2' sx={{ mb: 2 }}>The link may be invalid or the user id is missing.</Typography>
          <Button component={Link} href='/apps/manage-trainer' variant='contained'>
            Back to trainers
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth='xl'>
      <Box sx={{ p: 3, backgroundColor: '#fff', borderRadius: 2 }}>
        <Typography variant='h5' sx={{ mb: 2 }}>Admin Full Access User Console</Typography>
        {overviewLoading && !userData ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <AdminUser360Tabs
            tab={tab}
            onTabChange={setTab}
            userData={userData}
            lessons={lessons}
            reviews={reviews}
            assets={assets}
            auditLogs={auditLogs}
            loadingLessons={lessonsLoading}
            loadingReviews={reviewsLoading}
            loadingAssets={assetsLoading}
            loadingAudit={auditLoading}
            onRefresh={refreshActiveTab}
            query={query}
            onQueryChange={updateSectionQuery}
            hardDeletePolicy={userData?.policy}
          />
        )}
      </Box>
    </Container>
  )
}
