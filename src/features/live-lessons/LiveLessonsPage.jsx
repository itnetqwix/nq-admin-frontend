import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Stack } from '@mui/material'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { getLiveLessonDebug, getLiveLessons } from 'src/services/user360Api'
import Icon from 'src/@core/components/icon'
import { useAdminRealtime } from 'src/realtime'
import { copyText, DEFAULT_HOURS } from './parts'
import LessonList from './LessonList'
import LessonStory from './LessonStory'

export default function LiveLessonsPage() {
  const router = useRouter()
  const searchTimer = useRef(null)
  const { lastEvent } = useAdminRealtime()


  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [trainerInput, setTrainerInput] = useState('')
  const [traineeInput, setTraineeInput] = useState('')
  const [trainer, setTrainer] = useState('')
  const [trainee, setTrainee] = useState('')
  const [live, setLive] = useState('') // '' | '1' | '0'
  const [kind, setKind] = useState('') // '' | instant | scheduled
  const [hasClipIssues, setHasClipIssues] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [limit, setLimit] = useState(40)
  const [skip, setSkip] = useState(0)

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({ returned: 0, live: 0, withClipIssues: 0 })
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [storyFilter, setStoryFilter] = useState('all')

  const selectedId = useMemo(() => {
    if (!router.isReady) return ''
    const sid = router.query.sessionId
    return sid ? String(Array.isArray(sid) ? sid[0] : sid) : ''
  }, [router.isReady, router.query.sessionId])

  const listView = !selectedId
  const usingDateRange = Boolean(fromDate || toDate)
  const activeAdvanced = Boolean(fromDate || toDate || trainer || trainee || hasClipIssues)

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        limit,
        skip,
        live: live || undefined,
        kind: kind || undefined,
        hasClipIssues: hasClipIssues ? '1' : undefined,
        q: q || undefined,
        trainer: trainer || undefined,
        trainee: trainee || undefined
      }
      if (usingDateRange) {
        if (fromDate) params.from = fromDate
        if (toDate) params.to = toDate
      } else {
        params.hours = hours
      }
      const data = await getLiveLessons(params)
      setRows(data?.items || [])
      setTotal(Number(data?.total) || (data?.items || []).length)
      setSummary(data?.summary || { returned: (data?.items || []).length, live: 0, withClipIssues: 0 })
    } catch (e) {
      toast.error(e?.message || 'Failed to load live lessons')
      setRows([])
      setTotal(0)
      setSummary({ returned: 0, live: 0, withClipIssues: 0 })
    } finally {
      setLoading(false)
    }
  }, [hours, fromDate, toDate, usingDateRange, limit, skip, live, kind, hasClipIssues, q, trainer, trainee])

  useEffect(() => {
    if (!lastEvent || lastEvent.event !== 'ADMIN_LIVE_LESSON_CHANGED') return
    void loadList()
  }, [lastEvent, loadList])

  const loadDetail = useCallback(async sessionId => {

    if (!sessionId) {
      setDetail(null)
      return
    }
    setDetailLoading(true)
    try {
      const data = await getLiveLessonDebug(sessionId)
      setDetail(data)
    } catch (e) {
      toast.error(e?.message || 'Failed to load session')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!router.isReady || !listView) return
    void loadList()
  }, [router.isReady, listView, loadList])

  useEffect(() => {
    if (!router.isReady) return
    void loadDetail(selectedId)
  }, [router.isReady, selectedId, loadDetail])

  // Hydrate filters from URL when opening list
  useEffect(() => {
    if (!router.isReady || selectedId) return
    const query = router.query
    if (query.q) {
      const v = String(Array.isArray(query.q) ? query.q[0] : query.q)
      setQInput(v)
      setQ(v)
    }
    if (query.trainer) {
      const v = String(Array.isArray(query.trainer) ? query.trainer[0] : query.trainer)
      setTrainerInput(v)
      setTrainer(v)
      setFiltersOpen(true)
    }
    if (query.trainee) {
      const v = String(Array.isArray(query.trainee) ? query.trainee[0] : query.trainee)
      setTraineeInput(v)
      setTrainee(v)
      setFiltersOpen(true)
    }
    if (query.hours) setHours(Number(query.hours) || DEFAULT_HOURS)
    if (query.from) {
      setFromDate(String(Array.isArray(query.from) ? query.from[0] : query.from))
      setFiltersOpen(true)
    }
    if (query.to) {
      setToDate(String(Array.isArray(query.to) ? query.to[0] : query.to))
      setFiltersOpen(true)
    }
    if (query.live != null) setLive(String(Array.isArray(query.live) ? query.live[0] : query.live))
    if (query.kind) setKind(String(Array.isArray(query.kind) ? query.kind[0] : query.kind))
    // only on first ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])

  const scheduleDebounced = (value, setApplied) => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setApplied(value.trim())
      setSkip(0)
    }, 400)
  }

  const selectSession = id => {
    void router.push(
      {
        pathname: '/apps/live-lessons',
        query: id ? { sessionId: id } : {}
      },
      undefined,
      { shallow: true }
    )
  }

  const story = detail?.story || []
  const filteredStory = useMemo(() => {
    if (storyFilter === 'all') return story
    if (storyFilter === 'clip') return story.filter(s => s.kind === 'clip')
    if (storyFilter === 'media') {
      return story.filter(s => s.kind === 'media' || s.kind === 'annotation' || s.kind === 'plan')
    }
    if (storyFilter === 'call') return story.filter(s => s.kind === 'call' || s.kind === 'join')
    if (storyFilter === 'lifecycle') {
      return story.filter(s => s.kind === 'lifecycle' || s.kind === 'join' || s.kind === 'extension' || s.kind === 'ops')
    }
    if (storyFilter === 'problems') {
      return story.filter(s => s.severity === 'error' || s.severity === 'warn')
    }
    return story
  }, [story, storyFilter])

  const onCopyPack = async () => {
    try {
      await copyText(detail?.shareText || '')
      toast.success('Copied full share pack')
    } catch (e) {
      toast.error(e?.message || 'Copy failed')
    }
  }

  const applyNameFilters = () => {
    setTrainer(trainerInput.trim())
    setTrainee(traineeInput.trim())
    setSkip(0)
  }

  const clearAdvanced = () => {
    setFromDate('')
    setToDate('')
    setTrainerInput('')
    setTraineeInput('')
    setTrainer('')
    setTrainee('')
    setHasClipIssues(false)
    setHours(DEFAULT_HOURS)
    setSkip(0)
  }

  const setPresetHours = h => {
    setHours(h)
    setFromDate('')
    setToDate('')
    setSkip(0)
  }

  const page = Math.floor(skip / limit) + 1
  const canPrev = skip > 0
  const canNext = skip + rows.length < total

  return (
    <AdminPageShell
      title='Live lessons'
      eyebrow='OPS · LESSONS'
      icon='mdi:record-rec'
      subtitle={
        listView
          ? 'Both-joined sessions — search by coach or trainee, filter by date / live / clip issues, open a row for the full story.'
          : detail?.title || 'Session story'
      }
      bare
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          {!listView ? (
            <Button variant='outlined' startIcon={<Icon icon='mdi:arrow-left' />} onClick={() => selectSession('')}>
              All lessons
            </Button>
          ) : null}
          <Button
            variant='outlined'
            onClick={() => void (listView ? loadList() : loadDetail(selectedId))}
            disabled={listView ? loading : detailLoading}
          >
            Refresh
          </Button>
        </Stack>
      }
    >
      {listView ? (
        <LessonList
          total={total}
          summary={summary}
          usingDateRange={usingDateRange}
          hours={hours}
          live={live}
          setLive={setLive}
          setSkip={setSkip}
          setHasClipIssues={setHasClipIssues}
          setFiltersOpen={setFiltersOpen}
          setPresetHours={setPresetHours}
          qInput={qInput}
          setQInput={setQInput}
          scheduleDebounced={scheduleDebounced}
          setQ={setQ}
          loadList={loadList}
          loading={loading}
          kind={kind}
          setKind={setKind}
          filtersOpen={filtersOpen}
          activeAdvanced={activeAdvanced}
          trainerInput={trainerInput}
          setTrainerInput={setTrainerInput}
          traineeInput={traineeInput}
          setTraineeInput={setTraineeInput}
          applyNameFilters={applyNameFilters}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          limit={limit}
          setLimit={setLimit}
          hasClipIssues={hasClipIssues}
          clearAdvanced={clearAdvanced}
          rows={rows}
          selectSession={selectSession}
          page={page}
          canPrev={canPrev}
          canNext={canNext}
        />
      ) : (
        <LessonStory
          detail={detail}
          detailLoading={detailLoading}
          storyFilter={storyFilter}
          setStoryFilter={setStoryFilter}
          filteredStory={filteredStory}
          story={story}
          onCopyPack={onCopyPack}
        />
      )}
    </AdminPageShell>
  )
}
