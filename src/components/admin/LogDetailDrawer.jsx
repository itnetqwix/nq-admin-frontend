import { useMemo, useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import PublicIcon from '@mui/icons-material/Public'
import DevicesIcon from '@mui/icons-material/Devices'
import HttpIcon from '@mui/icons-material/Http'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ScheduleIcon from '@mui/icons-material/Schedule'
import Link from 'next/link'
import moment from 'moment'
import toast from 'react-hot-toast'
import { categoryChipSx, ops } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'

function hasVal(v) {
  return v != null && v !== '' && v !== '—'
}

function joinParts(...parts) {
  const out = parts.filter(hasVal)
  return out.length ? out.join(' · ') : null
}

function initials(name, email) {
  const src = String(name || email || '?').trim()
  const parts = src.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return src.slice(0, 2).toUpperCase()
}

function copyText(text, label = 'Copied') {
  if (!hasVal(text)) return
  void navigator.clipboard.writeText(String(text)).then(
    () => toast.success(label),
    () => toast.error('Copy failed')
  )
}

function Fact({ label, value, href, wide }) {
  if (!hasVal(value)) return null
  const display = String(value)
  return (
    <Box
      sx={{
        gridColumn: wide ? '1 / -1' : 'auto',
        p: 1.25,
        borderRadius: ops.radiusMd,
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        minWidth: 0,
        transition: 'border-color 120ms ease, background 120ms ease',
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.07)',
          borderColor: 'rgba(194,239,78,0.28)',
          '& .fact-copy': { opacity: 1 }
        }
      }}
    >
      <Stack direction='row' alignItems='flex-start' justifyContent='space-between' spacing={0.5}>
        <Typography
          sx={{
            fontFamily: ops.mono,
            fontSize: 10,
            color: ops.onNightMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            mb: 0.5
          }}
        >
          {label}
        </Typography>
        <Tooltip title='Copy'>
          <IconButton
            className='fact-copy'
            size='small'
            onClick={() => copyText(display, `${label} copied`)}
            sx={{
              opacity: 0,
              p: 0.25,
              color: ops.onNightMuted,
              transition: 'opacity 120ms ease',
              '&:hover': { color: ops.lime }
            }}
          >
            <ContentCopyIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
      </Stack>
      {href ? (
        <Typography
          component={Link}
          href={href}
          sx={{
            color: ops.lime,
            textDecoration: 'none',
            fontSize: 13,
            fontFamily: ops.mono,
            wordBreak: 'break-all',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            lineHeight: 1.4,
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          {display}
          <OpenInNewIcon sx={{ fontSize: 12, flexShrink: 0 }} />
        </Typography>
      ) : (
        <Typography
          sx={{
            fontSize: 13,
            color: ops.onNight,
            fontFamily: ops.mono,
            fontVariantNumeric: 'tabular-nums',
            wordBreak: 'break-all',
            lineHeight: 1.4
          }}
        >
          {display}
        </Typography>
      )}
    </Box>
  )
}

function FactGrid({ items }) {
  const visible = items.filter(it => hasVal(it.value))
  if (!visible.length) return null
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1
      }}
    >
      {visible.map(it => (
        <Fact key={it.label} {...it} />
      ))}
    </Box>
  )
}

function DetailSection({ title, icon, badge, defaultExpanded = true, children }) {
  if (!children) return null
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        bgcolor: 'transparent',
        color: ops.onNight,
        '&:before': { display: 'none' },
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: `${ops.radiusMd} !important`,
        overflow: 'hidden',
        mb: 1.25,
        '&.Mui-expanded': { margin: '0 0 10px 0' }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: ops.onNightMuted }} />}
        sx={{
          minHeight: 44,
          px: 1.5,
          bgcolor: 'rgba(255,255,255,0.03)',
          '& .MuiAccordionSummary-content': { my: 1, alignItems: 'center', gap: 1 }
        }}
      >
        <Box sx={{ color: ops.lime, display: 'flex', alignItems: 'center' }}>{icon}</Box>
        <Typography
          sx={{
            fontFamily: ops.mono,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: ops.onNight,
            fontWeight: 600
          }}
        >
          {title}
        </Typography>
        {badge != null && badge !== 0 ? (
          <Chip
            size='small'
            label={badge}
            sx={{
              height: 18,
              fontSize: 10,
              fontFamily: ops.mono,
              bgcolor: ops.nightLift,
              color: ops.lime,
              ml: 0.5
            }}
          />
        ) : null}
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pb: 1.5, pt: 0.5 }}>{children}</AccordionDetails>
    </Accordion>
  )
}

function statusTone(row) {
  const code = row.status ?? row.status_code
  if (code == null) return null
  if (code >= 500) return { label: String(code), bg: ops.errorSoft, color: ops.error }
  if (code >= 400) return { label: String(code), bg: 'rgba(245,166,35,0.2)', color: ops.warning }
  if (code >= 200) return { label: String(code), bg: 'rgba(194,239,78,0.18)', color: ops.lime }
  return { label: String(code), bg: ops.nightLift, color: ops.onNightMuted }
}

/**
 * Shared night detail drawer for logs + platform activity.
 * Sections render only when they have data.
 */
export default function LogDetailDrawer({ open, row, onClose, kind = 'log' }) {
  const [payloadOpen, setPayloadOpen] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)

  const model = useMemo(() => {
    if (!row) return null
    const actor = row.actor || {}
    const title =
      row.title ||
      (row.method && row.path ? `${row.method} ${row.path}` : null) ||
      row.action ||
      'Detail'
    const location = joinParts(row.city, row.region, row.country)
    const browser = joinParts(
      row.browser && row.browser_version ? `${row.browser} ${row.browser_version}` : row.browser,
      row.os && row.os_version ? `${row.os} ${row.os_version}` : row.os
    )
    const isError = (row.status >= 400 || row.status_code >= 400) ||
      String(row.action || '').includes('fail') ||
      String(row.action || '').includes('lock')
    const riskFlags = Array.isArray(row.risk_flags) ? row.risk_flags.filter(Boolean) : []
    const status = statusTone(row)
    const apiLine =
      row.method || row.path ? `${row.method || ''} ${row.path || ''}`.trim() : null

    const identityFacts = [
      { label: 'Full name', value: actor.fullname, href: actor.id ? `/apps/users/${actor.id}` : null },
      { label: 'Email', value: actor.email },
      { label: 'User ID', value: actor.id, href: actor.id ? `/apps/users/${actor.id}` : null },
      { label: 'Account type', value: actor.account_type || row.account_type },
      {
        label: 'Target',
        value: row.target?.label,
        href: row.target?.id ? `/apps/users/${row.target.id}` : null
      }
    ]

    const whenFacts = [
      { label: 'Timestamp', value: row.at ? formatOpsDateTime(row.at) : null, wide: true },
      { label: 'Relative', value: row.at ? moment(row.at).fromNow() : null }
    ]

    const networkFacts = [
      { label: 'IP address', value: row.ip },
      { label: 'Country', value: row.country },
      { label: 'State / region', value: row.region },
      { label: 'City', value: row.city },
      { label: 'Location', value: location, wide: true },
      { label: 'Timezone', value: row.timezone },
      { label: 'Locale', value: row.locale },
      { label: 'Network', value: row.network_type },
      { label: 'Referrer', value: row.referrer, wide: true },
      { label: 'Entry page', value: row.entry_path, wide: true }
    ]

    const deviceFacts = [
      { label: 'Device', value: row.device },
      { label: 'Browser', value: browser || row.browser },
      { label: 'OS', value: joinParts(row.os, row.os_version) },
      { label: 'Platform', value: joinParts(row.platform, row.client_type) },
      { label: 'Screen', value: row.screen },
      { label: 'App version', value: row.app_version },
      { label: 'Device ID', value: row.device_id, wide: true },
      { label: 'Session', value: row.session_public_id || row.session_id },
      { label: 'Session ID', value: row.session_id, wide: true },
      { label: 'Environment', value: row.environment_label, wide: true },
      { label: 'User-Agent', value: row.user_agent, wide: true }
    ]

    const requestFacts = [
      { label: 'Action', value: row.action },
      { label: 'Kind', value: row.kind },
      { label: 'Category', value: row.category },
      { label: 'Channel', value: row.channel },
      { label: 'Source', value: row.source },
      { label: 'Request ID', value: row.request_id, wide: true },
      {
        label: 'Entity',
        value: row.entity ? `${row.entity.type} · ${row.entity.id}` : null,
        wide: true
      },
      { label: 'Amount', value: row.meta?.amount }
    ]

    const summaryPills = [
      row.at ? { key: 'when', label: moment(row.at).fromNow(), icon: <ScheduleIcon sx={{ fontSize: 14 }} /> } : null,
      row.ip ? { key: 'ip', label: row.ip, icon: <PublicIcon sx={{ fontSize: 14 }} /> } : null,
      location ? { key: 'loc', label: location, icon: <PublicIcon sx={{ fontSize: 14 }} /> } : null,
      row.device || row.browser
        ? {
            key: 'dev',
            label: row.device || row.browser,
            icon: <DevicesIcon sx={{ fontSize: 14 }} />
          }
        : null,
      row.network_type
        ? { key: 'net', label: row.network_type, icon: <DevicesIcon sx={{ fontSize: 14 }} /> }
        : null
    ].filter(Boolean)

    return {
      actor,
      title,
      location,
      browser,
      isError,
      riskFlags,
      status,
      apiLine,
      identityFacts,
      whenFacts,
      networkFacts,
      deviceFacts,
      requestFacts,
      summaryPills,
      identityCount: identityFacts.filter(f => hasVal(f.value)).length,
      networkCount: networkFacts.filter(f => hasVal(f.value)).length,
      deviceCount: deviceFacts.filter(f => hasVal(f.value)).length,
      requestCount: requestFacts.filter(f => hasVal(f.value)).length + (apiLine ? 1 : 0)
    }
  }, [row])

  if (!row || !model) return null

  const payload = row.meta && Object.keys(row.meta).length ? row.meta : row

  const copyAll = () => {
    copyText(JSON.stringify(row, null, 2), 'Full detail copied')
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1600)
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      transitionDuration={{ enter: 280, exit: 200 }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520 },
          bgcolor: ops.night,
          color: ops.onNight,
          boxShadow: ops.shadowDrawer,
          backgroundImage:
            'radial-gradient(ellipse 90% 40% at 100% 0%, rgba(194,239,78,0.08), transparent 55%), radial-gradient(ellipse 70% 35% at 0% 100%, rgba(83,58,253,0.18), transparent 50%)'
        }
      }}
    >
      <Stack sx={{ height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            pt: 2.25,
            pb: 2,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            bgcolor: 'rgba(21,15,35,0.92)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Stack direction='row' alignItems='flex-start' justifyContent='space-between' spacing={1}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 0.75 }}>
                <Chip
                  size='small'
                  label={String(kind).replace(/_/g, ' ')}
                  sx={{
                    height: 20,
                    fontFamily: ops.mono,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    bgcolor: 'rgba(194,239,78,0.12)',
                    color: ops.lime,
                    border: '1px solid rgba(194,239,78,0.25)'
                  }}
                />
                {model.isError ? (
                  <Chip
                    size='small'
                    label='Attention'
                    sx={{
                      height: 20,
                      fontFamily: ops.mono,
                      fontSize: 10,
                      bgcolor: ops.errorSoft,
                      color: ops.error
                    }}
                  />
                ) : null}
              </Stack>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '-0.45px',
                  lineHeight: 1.25,
                  pr: 1
                }}
              >
                {model.title}
              </Typography>
              <Stack direction='row' spacing={0.75} sx={{ mt: 1.25 }} flexWrap='wrap' useFlexGap>
                {row.category ? (
                  <Chip size='small' label={row.category} sx={{ ...categoryChipSx(row.category), height: 22 }} />
                ) : null}
                {row.action ? (
                  <Chip
                    size='small'
                    label={String(row.action).replace(/_/g, ' ')}
                    sx={{
                      height: 22,
                      fontFamily: ops.mono,
                      fontSize: 10,
                      bgcolor: ops.nightLift,
                      color: ops.onNightMuted
                    }}
                  />
                ) : null}
                {model.status ? (
                  <Chip
                    size='small'
                    label={model.status.label}
                    sx={{
                      height: 22,
                      fontFamily: ops.mono,
                      fontSize: 10,
                      bgcolor: model.status.bg,
                      color: model.status.color
                    }}
                  />
                ) : null}
                {row.country ? (
                  <Chip
                    size='small'
                    label={row.country}
                    sx={{
                      height: 22,
                      fontFamily: ops.mono,
                      fontSize: 10,
                      bgcolor: ops.nightLift,
                      color: ops.onNightMuted
                    }}
                  />
                ) : null}
                {row.duration_ms != null ? (
                  <Chip
                    size='small'
                    label={`${row.duration_ms}ms`}
                    sx={{
                      height: 22,
                      fontFamily: ops.mono,
                      fontSize: 10,
                      bgcolor: ops.nightLift,
                      color: ops.onNightMuted
                    }}
                  />
                ) : null}
              </Stack>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                color: ops.onNightMuted,
                bgcolor: 'rgba(255,255,255,0.04)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: ops.onNight }
              }}
            >
              <CloseIcon fontSize='small' />
            </IconButton>
          </Stack>

          {model.summaryPills.length ? (
            <Stack
              direction='row'
              spacing={1}
              sx={{ mt: 1.75, overflowX: 'auto', pb: 0.25 }}
              flexWrap='nowrap'
            >
              {model.summaryPills.map(p => (
                <Box
                  key={p.key}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.1,
                    py: 0.65,
                    borderRadius: ops.radiusPill,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <Box sx={{ color: ops.lime, display: 'flex' }}>{p.icon}</Box>
                  <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.onNightMuted }}>
                    {p.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : null}
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>
          {/* Identity hero */}
          {(model.actor.fullname || model.actor.email || model.actor.id) && (
            <Box
              sx={{
                mb: 1.5,
                p: 1.75,
                borderRadius: ops.radiusLg,
                bgcolor: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <Stack direction='row' spacing={1.5} alignItems='center'>
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: 'rgba(194,239,78,0.15)',
                    color: ops.lime,
                    fontFamily: ops.mono,
                    fontSize: 14,
                    fontWeight: 700
                  }}
                >
                  {initials(model.actor.fullname, model.actor.email)}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' }} noWrap>
                    {model.actor.fullname || model.actor.label || 'Unknown user'}
                  </Typography>
                  {model.actor.email ? (
                    <Typography
                      sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.onNightMuted }}
                      noWrap
                    >
                      {model.actor.email}
                    </Typography>
                  ) : null}
                  <Stack direction='row' spacing={0.75} sx={{ mt: 0.75 }} flexWrap='wrap' useFlexGap>
                    {model.actor.account_type || row.account_type ? (
                      <Chip
                        size='small'
                        label={model.actor.account_type || row.account_type}
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontFamily: ops.mono,
                          bgcolor: ops.nightLift,
                          color: ops.onNightMuted
                        }}
                      />
                    ) : null}
                    {model.actor.id ? (
                      <Chip
                        size='small'
                        label={String(model.actor.id).slice(0, 10) + '…'}
                        onClick={() => copyText(model.actor.id, 'User ID copied')}
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontFamily: ops.mono,
                          bgcolor: ops.nightLift,
                          color: ops.onNightMuted,
                          cursor: 'pointer'
                        }}
                      />
                    ) : null}
                  </Stack>
                </Box>
                {model.actor.id ? (
                  <Button
                    component={Link}
                    href={`/apps/users/${model.actor.id}`}
                    size='small'
                    startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                    sx={{
                      textTransform: 'none',
                      color: ops.night,
                      bgcolor: ops.lime,
                      fontWeight: 600,
                      fontSize: 12,
                      px: 1.25,
                      '&:hover': { bgcolor: '#d4f56a' }
                    }}
                  >
                    User 360
                  </Button>
                ) : null}
              </Stack>
            </Box>
          )}

          {/* Risk banner */}
          {model.riskFlags.length ? (
            <Box
              sx={{
                mb: 1.5,
                p: 1.5,
                borderRadius: ops.radiusMd,
                bgcolor: 'rgba(238,0,0,0.12)',
                border: `1px solid ${ops.errorSoft}`
              }}
            >
              <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
                <WarningAmberIcon sx={{ color: ops.error, fontSize: 18 }} />
                <Typography sx={{ fontWeight: 600, fontSize: 13, color: ops.error }}>
                  Risk signals
                </Typography>
              </Stack>
              <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap>
                {model.riskFlags.map(flag => (
                  <Chip
                    key={flag}
                    size='small'
                    label={String(flag).replace(/_/g, ' ')}
                    sx={{
                      fontFamily: ops.mono,
                      fontSize: 10,
                      bgcolor: ops.errorSoft,
                      color: ops.error,
                      height: 22
                    }}
                  />
                ))}
              </Stack>
            </Box>
          ) : null}

          {/* HTTP request inspector */}
          {model.apiLine ? (
            <Box
              sx={{
                mb: 1.5,
                p: 1.5,
                borderRadius: ops.radiusMd,
                bgcolor: '#0c0a12',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: ops.mono
              }}
            >
              <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 0.75 }}>
                <HttpIcon sx={{ fontSize: 16, color: ops.lime }} />
                <Typography
                  sx={{
                    fontSize: 10,
                    color: ops.onNightMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}
                >
                  Request
                </Typography>
                {model.status ? (
                  <Chip
                    size='small'
                    label={model.status.label}
                    sx={{
                      height: 18,
                      ml: 'auto',
                      fontFamily: ops.mono,
                      fontSize: 10,
                      bgcolor: model.status.bg,
                      color: model.status.color
                    }}
                  />
                ) : null}
              </Stack>
              <Typography
                sx={{
                  fontSize: 13,
                  color: ops.lime,
                  wordBreak: 'break-all',
                  lineHeight: 1.45
                }}
              >
                {model.apiLine}
              </Typography>
              {row.duration_ms != null || row.request_id ? (
                <Typography sx={{ mt: 0.75, fontSize: 11, color: ops.onNightMuted }}>
                  {[
                    row.duration_ms != null ? `${row.duration_ms}ms` : null,
                    row.request_id ? `req ${row.request_id}` : null
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              ) : null}
            </Box>
          ) : null}

          {model.whenFacts.some(f => hasVal(f.value)) ? (
            <DetailSection
              title='When'
              icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
              defaultExpanded
            >
              <FactGrid items={model.whenFacts} />
            </DetailSection>
          ) : null}

          {model.identityCount > 0 ? (
            <DetailSection
              title='Identity'
              icon={<PersonOutlineIcon sx={{ fontSize: 16 }} />}
              badge={model.identityCount}
              defaultExpanded={!model.actor.fullname && !model.actor.email}
            >
              <FactGrid items={model.identityFacts} />
            </DetailSection>
          ) : null}

          {model.networkCount > 0 ? (
            <DetailSection
              title='Network & location'
              icon={<PublicIcon sx={{ fontSize: 16 }} />}
              badge={model.networkCount}
              defaultExpanded
            >
              <FactGrid items={model.networkFacts} />
            </DetailSection>
          ) : null}

          {model.deviceCount > 0 ? (
            <DetailSection
              title='Device & browser'
              icon={<DevicesIcon sx={{ fontSize: 16 }} />}
              badge={model.deviceCount}
              defaultExpanded
            >
              <FactGrid items={model.deviceFacts} />
            </DetailSection>
          ) : null}

          {model.requestCount > 0 ? (
            <DetailSection
              title='Event & request'
              icon={<HttpIcon sx={{ fontSize: 16 }} />}
              badge={model.requestCount}
              defaultExpanded={!model.apiLine}
            >
              <FactGrid items={model.requestFacts} />
            </DetailSection>
          ) : null}

          {/* Payload */}
          <Box
            sx={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: ops.radiusMd,
              overflow: 'hidden'
            }}
          >
            <Stack
              direction='row'
              alignItems='center'
              justifyContent='space-between'
              sx={{ px: 1.5, py: 1, bgcolor: 'rgba(255,255,255,0.03)' }}
            >
              <Button
                size='small'
                onClick={() => setPayloadOpen(v => !v)}
                sx={{
                  color: ops.lime,
                  textTransform: 'none',
                  fontFamily: ops.mono,
                  fontSize: 12,
                  px: 0
                }}
              >
                {payloadOpen ? 'Hide raw payload' : 'Show raw payload'}
              </Button>
              <IconButton
                size='small'
                onClick={() => copyText(JSON.stringify(payload, null, 2), 'Payload copied')}
                sx={{ color: ops.onNightMuted }}
              >
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Stack>
            <Collapse in={payloadOpen}>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <Box
                component='pre'
                sx={{
                  m: 0,
                  p: 1.5,
                  fontFamily: ops.mono,
                  fontSize: 11,
                  lineHeight: 1.5,
                  overflow: 'auto',
                  maxHeight: 280,
                  color: ops.onNightMuted,
                  bgcolor: '#0c0a12'
                }}
              >
                {JSON.stringify(payload, null, 2)}
              </Box>
            </Collapse>
          </Box>
        </Box>

        {/* Footer */}
        <Stack
          direction='row'
          spacing={1}
          sx={{
            p: 2,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            bgcolor: 'rgba(21,15,35,0.95)'
          }}
        >
          <Button
            fullWidth
            variant='outlined'
            startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
            onClick={copyAll}
            sx={{
              textTransform: 'none',
              fontFamily: ops.mono,
              fontSize: 12,
              color: ops.onNight,
              borderColor: 'rgba(255,255,255,0.16)',
              '&:hover': { borderColor: ops.lime, color: ops.lime }
            }}
          >
            {copiedAll ? 'Copied' : 'Copy JSON'}
          </Button>
          {model.actor.id ? (
            <Button
              fullWidth
              component={Link}
              href={`/apps/users/${model.actor.id}`}
              startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: 'none',
                fontFamily: ops.mono,
                fontSize: 12,
                fontWeight: 600,
                color: ops.night,
                bgcolor: ops.lime,
                '&:hover': { bgcolor: '#d4f56a' }
              }}
            >
              Open profile
            </Button>
          ) : (
            <Button
              fullWidth
              onClick={onClose}
              sx={{
                textTransform: 'none',
                fontFamily: ops.mono,
                fontSize: 12,
                color: ops.onNightMuted,
                bgcolor: ops.nightLift
              }}
            >
              Close
            </Button>
          )}
        </Stack>
      </Stack>
    </Drawer>
  )
}
