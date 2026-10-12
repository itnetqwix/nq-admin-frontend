import { useState } from 'react'
import NextLink from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import EntityLink from 'src/components/admin/EntityLink'
import StatusPill from 'src/components/admin/StatusPill'
import { DrawerError, DrawerLoading, FactList, SectionTitle } from 'src/features/entity-drawers/drawers/shared'
import { useEntityDrawer } from 'src/features/entity-drawers/EntityDrawerContext'
import { getInboxItem, updateInboxItem } from 'src/services/inboxApi'
import { ops } from 'src/styles/opsSurface'
import { timeAgo } from 'src/utils/format'
import { assignmentAction, changesFor, relatedLinks, slaPill, STATUS_LABEL, statusOptionsFor, STATUS_TONE, TYPE_LABEL } from './inboxView'

const fmt = v => (v ? new Date(v).toLocaleString() : null)

export default function InboxDetail({ type, id, meId, canWrite }) {
  const queryClient = useQueryClient()
  const drawer = useEntityDrawer()
  const [note, setNote] = useState('')
  const key = ['inbox', 'item', type, id]
  const q = useQuery({ queryKey: key, queryFn: () => getInboxItem(type, id) })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['inbox'] })
  }
  const save = useMutation({
    mutationFn: changes => updateInboxItem(type, id, changes),
    onSuccess: () => {
      setNote('')
      toast.success('Saved')
      refresh()
    },
    onError: e => toast.error(e?.message || 'Could not save')
  })

  if (q.isLoading) return <DrawerLoading />
  if (q.isError) return <DrawerError error={q.error} onRetry={q.refetch} />
  const d = q.data
  const item = d.item
  const sla = slaPill(item)
  const assign = assignmentAction(item, meId)
  const links = relatedLinks(d)

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
          <StatusPill tone={STATUS_TONE[item.status]} size='sm'>{STATUS_LABEL[item.status]}</StatusPill>
          <StatusPill tone='neutral' size='sm'>{TYPE_LABEL[item.type]}</StatusPill>
          {item.priority === 'high' ? <StatusPill tone='danger' size='sm'>Urgent</StatusPill> : null}
          {sla ? <StatusPill tone={sla.tone} size='sm'>{sla.label}</StatusPill> : null}
        </Box>
        <Typography sx={{ fontSize: 18, fontWeight: 600, lineHeight: 1.3 }}>{item.subject}</Typography>
        <Typography sx={{ fontSize: 12, color: ops.mute, mt: 0.5 }}>
          Received {timeAgo(item.createdAt)}
          {d.firstResponseAt ? ` · first response ${timeAgo(d.firstResponseAt)}` : ' · no response yet'}
          {d.resolvedAt ? ` · resolved ${timeAgo(d.resolvedAt)}` : ''}
        </Typography>
      </Box>

      {canWrite ? (
        <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center', p: 1.5, borderRadius: ops.radiusMd, bgcolor: ops.canvasSoft }}>
          <TextField
            select
            size='small'
            label='Status'
            value={item.status}
            disabled={save.isPending}
            onChange={e => {
              const changes = changesFor(item, { status: e.target.value })
              if (Object.keys(changes).length) save.mutate(changes)
            }}
            sx={{ minWidth: 150 }}
          >
            {statusOptionsFor(item.type).map(s => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </TextField>
          <Button
            size='small'
            variant='outlined'
            disabled={save.isPending}
            onClick={() => save.mutate({ assignee: assign.kind === 'unassign' ? null : 'me' })}
          >
            {assign.label}
          </Button>
          <Button
            size='small'
            variant='text'
            disabled={save.isPending}
            onClick={() => save.mutate({ priority: item.priority === 'high' ? 'normal' : 'high' })}
          >
            {item.priority === 'high' ? 'Mark normal' : 'Mark urgent'}
          </Button>
          {d.assignee ? <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Assigned to {d.assignee.name || 'someone'}</Typography> : null}
        </Box>
      ) : (
        <Typography sx={{ fontSize: 12, color: ops.mute }}>You can read this but your role can’t change it.</Typography>
      )}

      {d.reporter || item.userName ? (
        <Box>
          <SectionTitle>From</SectionTitle>
          <FactList
            rows={[
              { label: 'Name', value: d.reporter ? <EntityLink type='user' id={d.reporter.id}>{d.reporter.name || d.reporter.email}</EntityLink> : item.userName },
              { label: 'Email', value: d.reporter?.email || item.userEmail },
              { label: 'Account', value: d.reporter ? `${d.reporter.accountType || ''} · ${d.reporter.status || ''}`.replace(/^ · | · $/g, '') : 'Not signed in' },
              { label: 'Phone', value: d.details.phone },
              { label: 'Company', value: d.details.company }
            ]}
          />
        </Box>
      ) : null}

      <Box>
        <SectionTitle>Message</SectionTitle>
        <Box sx={{ p: 1.5, borderRadius: ops.radiusMd, border: `1px solid ${ops.hairline}`, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.55 }}>
          {d.body || 'No message text.'}
        </Box>
        <Box sx={{ mt: 1 }}>
          <FactList
            rows={[
              { label: 'Reason', value: d.details.reason },
              { label: 'Refund related', value: d.details.refundRelated },
              { label: 'Page', value: d.details.pageUrl },
              { label: 'App', value: [d.details.platform, d.details.appVersion].filter(Boolean).join(' · ') || null },
              { label: 'Flag type', value: d.details.flagType ? d.details.flagType.replace(/_/g, ' ') : null }
            ]}
          />
        </Box>
      </Box>

      {links.length ? (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {links.map(l =>
            l.drawer ? (
              <Box
                key={l.key}
                component='button'
                onClick={() => drawer.open(l.drawer.type, l.drawer.id)}
                sx={{ border: 0, p: 0, bgcolor: 'transparent', cursor: 'pointer', color: ops.link, fontSize: 13, '&:hover': { textDecoration: 'underline' } }}
              >
                {l.label} →
              </Box>
            ) : (
              <Box key={l.key} component={NextLink} href={l.href} sx={{ color: ops.link, fontSize: 13 }}>
                {l.label} →
              </Box>
            )
          )}
        </Box>
      ) : null}

      <Box>
        <SectionTitle>Team notes</SectionTitle>
        {d.notes.length ? (
          <Box component='ul' sx={{ m: 0, mb: 1.5, p: 0, listStyle: 'none', display: 'grid', gap: 1 }}>
            {d.notes.map(n => (
              <li key={n.id}>
                <Box sx={{ p: 1.25, borderRadius: ops.radiusMd, bgcolor: ops.canvasSoft }}>
                  <Typography sx={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{n.text}</Typography>
                  <Typography sx={{ fontSize: 11, color: ops.mute, mt: 0.5 }}>{n.by || 'Admin'} · {timeAgo(n.at)}</Typography>
                </Box>
              </li>
            ))}
          </Box>
        ) : (
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.5 }}>No notes yet.</Typography>
        )}
        {canWrite ? (
          <>
            <TextField fullWidth multiline minRows={2} size='small' label='Add a note' placeholder='What you did, what is left…' value={note} onChange={e => setNote(e.target.value)} inputProps={{ maxLength: 2000 }} />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button size='small' variant='outlined' disabled={note.trim().length < 2 || save.isPending} onClick={() => save.mutate({ note: note.trim() })}>
                Add note
              </Button>
              {item.status !== 'resolved' && item.type !== 'feedback' ? (
                <Button size='small' variant='contained' disabled={note.trim().length < 2 || save.isPending} onClick={() => save.mutate({ note: note.trim(), status: 'resolved' })}>
                  Add note & resolve
                </Button>
              ) : null}
            </Box>
          </>
        ) : null}
        <Typography sx={{ mt: 1, fontSize: 11, color: ops.mute }}>
          Notes are for your team. Replies to the person aren’t sent from here yet.
        </Typography>
      </Box>

      {d.history.length ? (
        <Box>
          <SectionTitle>Status history</SectionTitle>
          <Box component='ul' sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 0.5 }}>
            {d.history.map((h, i) => (
              <li key={i}>
                <Typography sx={{ fontSize: 12.5 }}>
                  {h.status} <Box component='span' sx={{ color: ops.mute }}>· {fmt(h.at)}{h.note ? ` · ${h.note}` : ''}</Box>
                </Typography>
              </li>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}
