import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import EntityLink from 'src/components/admin/EntityLink'
import Money from 'src/components/admin/Money'
import StatusPill from 'src/components/admin/StatusPill'
import { disputeUrgency, reasonLabel } from 'src/features/money/moneyView'
import { addDisputeNote, getDispute } from 'src/services/moneyApi'
import { ops } from 'src/styles/opsSurface'
import { timeAgo } from 'src/utils/format'
import { DrawerError, DrawerLoading, FactList, SectionTitle } from './shared'

const fmt = v => (v ? new Date(v).toLocaleString() : null)

export default function DisputeDrawer({ id }) {
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const key = ['dispute', id]
  const q = useQuery({ queryKey: key, queryFn: () => getDispute(id) })
  const add = useMutation({
    mutationFn: note => addDisputeNote(id, note),
    onSuccess: () => {
      setText('')
      toast.success('Note added')
      queryClient.invalidateQueries({ queryKey: key })
    },
    onError: e => toast.error(e?.message || 'Could not add the note')
  })

  if (q.isLoading) return <DrawerLoading />
  if (q.isError) return <DrawerError error={q.error} onRetry={q.refetch} />
  const d = q.data
  const u = disputeUrgency(d)
  const person = p => (p?._id ? <EntityLink type='user' id={String(p._id)}>{p.fullname || p.email}</EntityLink> : '—')

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box>
        <Typography sx={{ fontFamily: ops.scoreboard, fontSize: 34, fontWeight: 600, lineHeight: 1 }}>
          <Money minor={d.amount_minor} currency={String(d.currency || 'usd').toUpperCase()} />
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, mt: 1, flexWrap: 'wrap' }}>
          <StatusPill tone={u.tone}>{u.label}</StatusPill>
          <StatusPill tone='neutral'>{reasonLabel(d.reason)}</StatusPill>
        </Box>
      </Box>

      {d.state === 'open' && !d.evidence_submitted ? (
        <Box sx={{ p: 1.5, borderRadius: ops.radiusMd, bgcolor: ops.warningBg, border: `1px solid ${ops.warningBorder}` }}>
          <Typography sx={{ fontSize: 13, color: ops.warningFg }}>
            No evidence has been submitted. Respond in the Stripe Dashboard before {fmt(d.evidence_due_by) || 'the deadline'}.
            {d.evidence_staged ? ' Evidence was auto-collected and is waiting for your review.' : ''}
          </Typography>
        </Box>
      ) : null}

      <FactList
        rows={[
          { label: 'Trainee', value: person(d.trainee_id) },
          { label: 'Coach', value: person(d.trainer_id) },
          { label: 'Lesson', value: d.session_id ? <EntityLink type='lesson' id={String(d.session_id)}>Open lesson</EntityLink> : null },
          { label: 'Payment', value: d.payment_intent_id ? <Box component='span' sx={{ fontFamily: ops.mono, fontSize: 12 }}>{d.payment_intent_id}</Box> : null },
          { label: 'Opened', value: d.opened_at ? `${fmt(d.opened_at)} (${timeAgo(d.opened_at)})` : null },
          { label: 'Evidence due', value: fmt(d.evidence_due_by) },
          { label: 'Closed', value: fmt(d.closed_at) },
          { label: 'Stripe status', value: d.status },
          { label: 'Dispute id', value: <Box component='span' sx={{ fontFamily: ops.mono, fontSize: 12 }}>{d.stripe_dispute_id}</Box> }
        ]}
      />

      <Box>
        <SectionTitle>Team notes</SectionTitle>
        {d.notes?.length ? (
          <Box component='ul' sx={{ m: 0, mb: 1.5, p: 0, listStyle: 'none', display: 'grid', gap: 1 }}>
            {d.notes.map(n => (
              <li key={n._id}>
                <Box sx={{ p: 1.25, borderRadius: ops.radiusMd, bgcolor: ops.canvasSoft }}>
                  <Typography sx={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{n.text}</Typography>
                  <Typography sx={{ fontSize: 11, color: ops.mute, mt: 0.5 }}>
                    {n.admin_id?.fullname || 'Admin'} · {timeAgo(n.at)}
                  </Typography>
                </Box>
              </li>
            ))}
          </Box>
        ) : (
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.5 }}>No notes yet.</Typography>
        )}
        <TextField
          fullWidth
          multiline
          minRows={2}
          size='small'
          label='Add a note'
          placeholder='What was done, who was contacted…'
          value={text}
          onChange={e => setText(e.target.value)}
          inputProps={{ maxLength: 2000 }}
        />
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant='contained' size='small' disabled={text.trim().length < 2 || add.isPending} onClick={() => add.mutate(text.trim())}>
            Add note
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
