import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AdminSubTabs from 'src/components/admin/AdminSubTabs'
import EntityLink from 'src/components/admin/EntityLink'
import StatusPill from 'src/components/admin/StatusPill'
import { filterTrace, SOURCE_LABEL, SEVERITY_TONE } from 'src/features/ops/traceView'
import { traceLookup } from 'src/services/commandApi'
import { queryKeys } from 'src/services/queryKeys'
import { ops } from 'src/styles/opsSurface'
import { timeAgo } from 'src/utils/format'

const KIND_LABEL = { objectId: 'User / lesson / booking id', email: 'Email', requestId: 'Request ref' }

function TraceRow({ item, onTrace }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '110px 1fr' },
        gap: { xs: 0.5, sm: 1.5 },
        p: 1.25,
        borderRadius: ops.radiusMd,
        border: `1px solid ${ops.hairline}`
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 12, color: ops.mute }} title={item.at || ''}>
          {item.at ? timeAgo(item.at) : '—'}
        </Typography>
        <StatusPill tone={SEVERITY_TONE[item.severity] || 'neutral'} size='sm'>
          {SOURCE_LABEL[item.source] || item.source}
        </StatusPill>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-word' }}>{item.title}</Typography>
        {item.detail ? (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', wordBreak: 'break-word' }}>{item.detail}</Typography>
        ) : null}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap', fontSize: 12 }}>
          {item.requestId ? (
            <Box
              component='button'
              type='button'
              onClick={() => onTrace(item.requestId)}
              title='Trace this request'
              sx={{
                border: 0,
                p: 0,
                bgcolor: 'transparent',
                cursor: 'pointer',
                color: ops.link,
                fontFamily: ops.mono,
                fontSize: 12
              }}
            >
              ref {item.requestId}
            </Box>
          ) : null}
          {item.ref ? (
            <EntityLink type={item.ref.type} id={item.ref.id}>
              {item.ref.type === 'lesson' ? 'Open lesson' : 'Open user'}
            </EntityLink>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}

export default function OpsTraceTab() {
  const router = useRouter()
  const initial = typeof router.query.q === 'string' ? router.query.q : ''
  const [input, setInput] = useState(initial)
  const [q, setQ] = useState(initial.trim())
  const [source, setSource] = useState('all')

  // Keep the URL shareable: ?tab=trace&q=<ref>
  useEffect(() => {
    if (!router.isReady) return
    const current = typeof router.query.q === 'string' ? router.query.q : ''
    if (current === q) return
    const query = { ...router.query }
    if (q) query.q = q
    else delete query.q
    void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const result = useQuery({
    queryKey: queryKeys.trace(q),
    queryFn: () => traceLookup(q),
    enabled: q.length >= 3,
    retry: false
  })
  const run = value => {
    const next = String(value ?? input).trim()
    setInput(next)
    setQ(next)
    setSource('all')
  }

  const data = result.data
  const items = filterTrace(data?.items, source)

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <TextField
          size='small'
          label='Request ref, user / lesson / booking id, or email'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => (e.key === 'Enter' ? run() : null)}
          sx={{ flex: 1, minWidth: 260 }}
          inputProps={{ maxLength: 64, spellCheck: false }}
        />
        <Button variant='contained' onClick={() => run()} disabled={input.trim().length < 3 || result.isFetching}>
          Trace
        </Button>
      </Box>

      {!q ? (
        <Typography color='text.secondary' sx={{ fontSize: 13 }}>
          Server errors in the apps end with “(Ref: …)”. Paste that ref to see the API call, any ops events, and the
          matching Sentry issue together.
        </Typography>
      ) : null}
      {result.isLoading ? <Typography color='text.secondary'>Tracing…</Typography> : null}
      {result.isError ? <Typography color='error'>{result.error?.message || 'Trace failed.'}</Typography> : null}

      {data ? (
        <>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusPill tone='neutral'>{KIND_LABEL[data.query?.kind] || 'No match'}</StatusPill>
            {data.resolvedUser ? (
              <EntityLink type='user' id={data.resolvedUser.id}>
                {data.resolvedUser.name || data.resolvedUser.email}
              </EntityLink>
            ) : null}
          </Box>
          <AdminSubTabs
            value={source}
            onChange={setSource}
            tabs={[
              { value: 'all', label: `All (${data.items?.length ?? 0})` },
              { value: 'api', label: `API (${data.counts?.api ?? 0})` },
              { value: 'ops', label: `Ops events (${data.counts?.ops ?? 0})` },
              { value: 'sentry', label: `Sentry (${data.counts?.sentry ?? 0})` }
            ]}
          />
          {data.sentryError ? (
            <Typography sx={{ fontSize: 12, color: ops.warningFg }}>
              Sentry wasn’t searched: {data.sentryError}
            </Typography>
          ) : null}
          {items.length ? (
            <Box sx={{ display: 'grid', gap: 1 }}>
              {items.map((item, i) => (
                <TraceRow key={`${item.source}:${item.at}:${i}`} item={item} onTrace={run} />
              ))}
            </Box>
          ) : (
            <Typography color='text.secondary' sx={{ fontSize: 13 }}>
              Nothing recorded for this.
            </Typography>
          )}
          <Typography sx={{ fontSize: 11, color: ops.mute }}>
            API hits keep every error plus a sample of successful reads, for a few days only. Ops events and Sentry go
            back further.
          </Typography>
        </>
      ) : null}
    </Box>
  )
}
