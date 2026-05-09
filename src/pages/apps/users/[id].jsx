import { Box, CircularProgress, Container, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import AdminUser360Tabs from 'src/pages/components/user360/AdminUser360Tabs'
import { getAuditLogs, getUser360, getUserAssets, getUserLessons, getUserReviews } from 'src/pages/components/user360/api'

export default function User360Page() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
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
    activity: { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }
  })

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [user360, lessonsData, reviewsData, assetsData, logs] = await Promise.all([
        getUser360(id),
        getUserLessons(id, query.lessons),
        getUserReviews(id, query.reviews),
        getUserAssets(id, query.assets),
        getAuditLogs(id, query.activity)
      ])
      setUserData(user360)
      setLessons(lessonsData)
      setReviews(reviewsData)
      setAssets(assetsData)
      setAuditLogs(logs)
    } catch (error) {
      setUserData(null)
      setLessons({ items: [], pagination: { page: 1, limit: 20, total: 0 } })
      setReviews({ items: [], pagination: { page: 1, limit: 20, total: 0 } })
      setAssets({
        clips: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
        reports: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
        savedSessions: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
      })
      setAuditLogs({ items: [], pagination: { page: 1, limit: 20, total: 0 } })
    } finally {
      setLoading(false)
    }
  }, [id, query])

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
    loadData()
  }, [loadData])

  return (
    <Container maxWidth='xl'>
      <Box sx={{ p: 3, backgroundColor: '#fff', borderRadius: 2 }}>
        <Typography variant='h5' sx={{ mb: 2 }}>Admin Full Access User Console</Typography>
        {loading ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <AdminUser360Tabs
            userData={userData}
            lessons={lessons}
            reviews={reviews}
            assets={assets}
            auditLogs={auditLogs}
            onRefresh={loadData}
            query={query}
            onQueryChange={updateSectionQuery}
            hardDeletePolicy={userData?.policy}
          />
        )}
      </Box>
    </Container>
  )
}
