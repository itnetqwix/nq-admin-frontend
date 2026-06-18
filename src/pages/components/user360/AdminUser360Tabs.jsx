import { alpha, Box, Tab, Tabs, useTheme } from '@mui/material'
import { useMemo, useState } from 'react'

import LessonTimelineDialog from 'src/pages/components/booking/LessonTimelineDialog'

import { USER360_TAB_LABELS } from './constants'
import User360WalletTab from './User360WalletTab'
import User360TicketsTab from './tabs/User360TicketsTab'
import User360ReferralsTab from './tabs/User360ReferralsTab'
import User360IssuesTab from './tabs/User360IssuesTab'
import User360OverviewTab from './tabs/User360OverviewTab'
import User360LessonsTab from './tabs/User360LessonsTab'
import User360ReviewsTab from './tabs/User360ReviewsTab'
import User360ClipsTab from './tabs/User360ClipsTab'
import User360PlansTab from './tabs/User360PlansTab'
import User360ActivityTab from './tabs/User360ActivityTab'
import { ClipPlayDialog } from './user360Parts'
import { SectionShell } from './user360Shared'

export default function AdminUser360Tabs({
  userId,
  tab,
  onTabChange,
  userData,
  lessons = { items: [], pagination: { page: 1, limit: 20, total: 0 } },
  reviews = { items: [], pagination: { page: 1, limit: 20, total: 0 } },
  assets = {
    clips: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
    reports: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
    savedSessions: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
  },
  timeline = { items: [], pagination: { page: 1, limit: 30, total: 0 } },
  opsEvents = { items: [], total: 0 },
  loadingLessons = false,
  loadingReviews = false,
  loadingAssets = false,
  loadingTimeline = false,
  loadingOpsEvents = false,
  onRefresh,
  query,
  onQueryChange,
  hardDeletePolicy
}) {
  const theme = useTheme()
  const overview = userData?.overview || {}
  const money = overview.money || {}
  const opsItems = opsEvents?.items || []

  const [playClipId, setPlayClipId] = useState(null)
  const [timelineBookingId, setTimelineBookingId] = useState(null)

  const walletProps = useMemo(
    () => ({
      userId,
      walletAmount: money.wallet_amount,
      currency: money.currency || 'USD'
    }),
    [userId, money.wallet_amount, money.currency]
  )

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: alpha(theme.palette.background.paper, 0.92),
          backdropFilter: 'blur(8px)',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => onTabChange(value)}
          variant='scrollable'
          scrollButtons='auto'
          sx={{
            px: { xs: 1, md: 2 },
            minHeight: 48,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 }
          }}
        >
          {USER360_TAB_LABELS.map((label, i) => (
            <Tab key={label} label={label} id={`user360-tab-${i}`} />
          ))}
        </Tabs>
      </Box>

      <Box>
        {tab === 0 ? (
          <User360OverviewTab userId={userId} userData={userData} onRefresh={onRefresh} />
        ) : null}

        {tab === 1 ? (
          <User360LessonsTab
            lessons={lessons}
            loadingLessons={loadingLessons}
            query={query}
            onQueryChange={onQueryChange}
            onRefresh={onRefresh}
            hardDeletePolicy={hardDeletePolicy}
            onOpenTimeline={setTimelineBookingId}
          />
        ) : null}

        {tab === 2 ? (
          <User360ReviewsTab
            reviews={reviews}
            loadingReviews={loadingReviews}
            query={query}
            onQueryChange={onQueryChange}
            onRefresh={onRefresh}
          />
        ) : null}

        {tab === 3 ? (
          <User360ClipsTab
            assets={assets}
            loadingAssets={loadingAssets}
            query={query}
            onQueryChange={onQueryChange}
            onRefresh={onRefresh}
            hardDeletePolicy={hardDeletePolicy}
            onPlayClip={setPlayClipId}
          />
        ) : null}

        {tab === 4 ? (
          <User360PlansTab
            assets={assets}
            loadingAssets={loadingAssets}
            query={query}
            onQueryChange={onQueryChange}
            onRefresh={onRefresh}
            hardDeletePolicy={hardDeletePolicy}
          />
        ) : null}

        {tab === 5 ? (
          <User360ActivityTab
            timeline={timeline}
            loadingTimeline={loadingTimeline}
            query={query}
            onQueryChange={onQueryChange}
            onRefresh={onRefresh}
          />
        ) : null}

        {tab === 6 ? (
          <SectionShell
            title='Wallet ledger'
            subtitle='Per-user wallet ledger entries (credits, debits, escrow holds, refunds).'
          >
            <User360WalletTab {...walletProps} />
          </SectionShell>
        ) : null}

        {tab === 7 ? (
          <User360IssuesTab userId={userId} opsItems={opsItems} loadingOpsEvents={loadingOpsEvents} />
        ) : null}

        {tab === 8 ? <User360TicketsTab userId={userId} /> : null}
        {tab === 9 ? <User360ReferralsTab userId={userId} /> : null}
      </Box>

      <LessonTimelineDialog
        open={Boolean(timelineBookingId)}
        bookingId={timelineBookingId}
        onClose={() => setTimelineBookingId(null)}
      />
      <ClipPlayDialog clipId={playClipId} open={Boolean(playClipId)} onClose={() => setPlayClipId(null)} />
    </Box>
  )
}
