import { Chip } from '@mui/material'
import { ops } from 'src/styles/opsSurface'

export const DEPARTMENTS = [
  { value: 'technology', label: 'Technology' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Design' },
  { value: 'operations', label: 'Operations' },
  { value: 'other', label: 'Other' }
]

export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' }
]

export const LOCATION_TYPES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' }
]

export const JOB_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' }
]

export const APPLICATION_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' }
]

export const QUESTION_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'select', label: 'Select' }
]

export const EMPTY_JOB = {
  title: '',
  slug: '',
  department: 'technology',
  employment_type: 'full_time',
  location_type: 'remote',
  location: '',
  summary: '',
  description_html: '',
  requirements_html: '',
  compensation: '',
  closes_at: '',
  status: 'draft',
  sort_order: '0',
  questions: []
}

export function labelOf(list, value) {
  return list.find(x => x.value === value)?.label || value || '—'
}

export function jobFromRow(row) {
  return {
    title: row.title || '',
    slug: row.slug || '',
    department: row.department || 'technology',
    employment_type: row.employment_type || 'full_time',
    location_type: row.location_type || 'remote',
    location: row.location || '',
    summary: row.summary || '',
    description_html: row.description_html || '',
    requirements_html: row.requirements_html || '',
    compensation: row.compensation || '',
    closes_at: row.closes_at ? String(row.closes_at).slice(0, 10) : '',
    status: row.status || 'draft',
    sort_order: String(row.sort_order ?? 0),
    questions: Array.isArray(row.questions) ? row.questions.map(q => ({ ...q, options: q.options || [] })) : []
  }
}

export function jobPayload(form) {
  return {
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    department: form.department,
    employment_type: form.employment_type,
    location_type: form.location_type,
    location: form.location.trim(),
    summary: form.summary.trim(),
    description_html: form.description_html || '',
    requirements_html: form.requirements_html || '',
    compensation: form.compensation.trim(),
    closes_at: form.closes_at || null,
    status: form.status,
    sort_order: Number(form.sort_order) || 0,
    questions: (form.questions || [])
      .filter(q => String(q.label || '').trim())
      .map(q => ({
        id: q.id,
        label: String(q.label).trim(),
        type: q.type || 'text',
        required: q.required === true,
        options:
          q.type === 'select'
            ? String(q.optionsText || (q.options || []).join('\n'))
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean)
            : []
      }))
  }
}

export function statusChip(status, map) {
  const tones = {
    published: { bg: '#AAFFEC', color: '#1A8F76' },
    draft: { bg: ops.canvasSoft2, color: ops.body },
    closed: { bg: ops.errorSoft, color: ops.error },
    new: { bg: ops.softIndigo, color: ops.indigoDeep },
    reviewing: { bg: '#ffefcf', color: '#ab570a' },
    shortlisted: { bg: '#AAFFEC', color: '#1A8F76' },
    rejected: { bg: ops.errorSoft, color: ops.error },
    hired: { bg: ops.softIndigo, color: ops.indigoDeep }
  }
  const t = tones[status] || { bg: ops.canvasSoft2, color: ops.body }
  return (
    <Chip
      label={labelOf(map, status)}
      size='small'
      sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: t.bg, color: t.color, fontWeight: 600 }}
    />
  )
}

export function FilterChip({ active, label, onClick }) {
  return (
    <Chip
      size='small'
      clickable
      onClick={onClick}
      label={label}
      sx={{
        height: 28,
        fontFamily: ops.mono,
        fontSize: 11,
        fontWeight: active ? 600 : 500,
        bgcolor: active ? ops.softIndigo : ops.canvas,
        color: active ? ops.indigoDeep : ops.body,
        border: `1px solid ${active ? ops.indigo : ops.hairline}`
      }}
    />
  )
}
