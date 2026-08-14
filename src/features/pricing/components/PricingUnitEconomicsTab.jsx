import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { OpsSurfaceCard } from 'src/components/admin'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import toast from 'react-hot-toast'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import {
  INFRA_CATEGORIES,
  DEFAULT_INFRA_FORM,
  formToInfraPayload,
  infraDocToForm,
  infraFieldLabel,
  infraValueFieldForAllocation,
  readInfraFieldValue,
  writeInfraFieldValue
} from 'src/constants/unitEconomicsAdmin'
import { PRODUCT_TYPES, fmtMoney, fmtPct, inputToCents } from 'src/constants/pricingAdmin'
import {
  fetchUnitEconomics,
  fetchUnitEconomicsConfig,
  fetchUnitEconomicsDefaults,
  saveUnitEconomicsConfig
} from 'src/services/pricingApi'

const DEFAULT_CUSTOM = {
  productType: 'session_booking',
  durationMinutes: '30',
  hourlyRateDollars: '80.00'
}

function ProfitChip({ profitable, label }) {
  return (
    <Chip
      size='small'
      color={profitable ? 'success' : 'error'}
      label={label || (profitable ? 'Profitable' : 'Loss')}
      variant={profitable ? 'filled' : 'outlined'}
    />
  )
}

function ScenarioInfraRow({ row, currency }) {
  const [open, setOpen] = useState(false)
  const infraLines = (row.economics?.breakdown || []).filter(l => l.key?.startsWith('infra:'))

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size='small' onClick={() => setOpen(v => !v)} aria-label='expand'>
            {open ? <KeyboardArrowUpIcon fontSize='small' /> : <KeyboardArrowDownIcon fontSize='small' />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant='body2' fontWeight={600}>
            {row.label}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {fmtPct(row.quote.commissionRate)} commission
          </Typography>
        </TableCell>
        <TableCell align='right'>{fmtMoney(row.economics.sessionSubtotalCents, currency)}</TableCell>
        <TableCell align='right'>{fmtMoney(row.economics.platformGrossCents, currency)}</TableCell>
        <TableCell align='right'>{fmtMoney(row.economics.infraCostCents, currency)}</TableCell>
        <TableCell align='right'>
          <Typography variant='body2' fontWeight={600} color={row.economics.profitable ? 'success.main' : 'error.main'}>
            {fmtMoney(row.economics.netProfitCents, currency)}
          </Typography>
        </TableCell>
        <TableCell align='center'>
          <ProfitChip profitable={row.economics.profitable} />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, borderBottom: open ? undefined : 0 }}>
          <Collapse in={open}>
            <Box sx={{ py: 1.5, pl: 6 }}>
              <Typography variant='caption' color='text.secondary' fontWeight={600}>
                Per-service infra
              </Typography>
              <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                {infraLines.map(line => (
                  <Stack key={line.key} direction='row' justifyContent='space-between'>
                    <Typography variant='body2' color='text.secondary'>
                      {line.label}
                    </Typography>
                    <Typography variant='body2'>{fmtMoney(Math.abs(line.amountMinor), currency)}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default function PricingUnitEconomicsTab({ config, isDirty }) {
  const ability = useContext(AbilityContext)
  const canEdit = ability?.can('update', 'admin-action-pricing') ?? true

  const [infraForm, setInfraForm] = useState({ global: { ...DEFAULT_INFRA_FORM }, services: {} })
  const [infraDirty, setInfraDirty] = useState(false)
  const [infraLoading, setInfraLoading] = useState(true)
  const [infraSaving, setInfraSaving] = useState(false)

  const [custom, setCustom] = useState(DEFAULT_CUSTOM)
  const [region, setRegion] = useState('US')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef(null)

  const currency = region === 'CA' ? 'CAD' : 'USD'

  useEffect(() => {
    void (async () => {
      setInfraLoading(true)
      try {
        const saved = await fetchUnitEconomicsConfig()
        setInfraForm(infraDocToForm(saved))
      } catch {
        try {
          const defaults = await fetchUnitEconomicsDefaults()
          setInfraForm(infraDocToForm(defaults))
        } catch {
          setInfraForm({ global: { ...DEFAULT_INFRA_FORM }, services: {} })
        }
      } finally {
        setInfraLoading(false)
      }
    })()
  }, [])

  const payload = useMemo(
    () => ({
      region,
      days: Number(infraForm.global.analysisPeriodDays) || 30,
      draftConfig: config,
      infraConfig: formToInfraPayload(infraForm),
      customScenario: {
        productType: custom.productType,
        durationMinutes: Number(custom.durationMinutes) || 30,
        hourlyRateCents: inputToCents(custom.hourlyRateDollars)
      },
      useSavedInfra: false
    }),
    [custom, config, infraForm, region]
  )

  const load = useCallback(async () => {
    if (!config || infraLoading) return
    setLoading(true)
    setError('')
    try {
      const data = await fetchUnitEconomics(payload)
      setReport(data)
    } catch (e) {
      setReport(null)
      setError(e?.message || 'Could not load unit economics')
    } finally {
      setLoading(false)
    }
  }, [config, infraLoading, payload])

  useEffect(() => {
    if (infraLoading) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void load(), 500)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [load, infraLoading])

  const patchService = (key, patch) => {
    setInfraDirty(true)
    setInfraForm(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [key]: { ...(prev.services[key] || {}), ...patch }
      }
    }))
  }

  const saveInfra = async () => {
    setInfraSaving(true)
    try {
      const saved = await saveUnitEconomicsConfig(formToInfraPayload(infraForm))
      setInfraForm(infraDocToForm(saved))
      setInfraDirty(false)
      toast.success('Infrastructure costs saved')
      void load()
    } catch (e) {
      toast.error(e?.message || 'Save failed')
    } finally {
      setInfraSaving(false)
    }
  }

  const resetInfraDefaults = async () => {
    try {
      const defaults = await fetchUnitEconomicsDefaults()
      setInfraForm(infraDocToForm(defaults))
      setInfraDirty(true)
    } catch (e) {
      toast.error(e?.message || 'Could not load defaults')
    }
  }

  const catalogByCategory = useMemo(() => {
    const map = {}
    for (const cat of INFRA_CATEGORIES) map[cat.id] = []
    for (const item of report?.infraCatalog || []) {
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    }
    return map
  }, [report?.infraCatalog])

  const actuals = report?.actuals
  const scenarios = report?.scenarios || []
  const customRow = report?.custom
  const monthlyBurn = report?.monthlyBurn

  return (
    <Stack spacing={3}>
      {isDirty ? (
        <Alert severity='warning'>
          Session pricing uses your <strong>unsaved pricing draft</strong>. Save pricing to align commission math with production.
        </Alert>
      ) : null}

      {error ? <Alert severity='error'>{error}</Alert> : null}

      {(report?.recommendations || []).map((rec, i) => (
        <Alert key={i} severity={rec.severity === 'critical' ? 'error' : rec.severity}>
          <strong>{rec.title}</strong> — {rec.detail}
        </Alert>
      ))}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <AdminPageSection
            title='Infrastructure cost model'
            subtitle='Every production vendor in the stack — costs persist across admin sessions.'
            actions={
              canEdit ? (
                <Stack direction='row' spacing={1}>
                  <Button size='small' onClick={() => void resetInfraDefaults()} disabled={infraSaving}>
                    Reset defaults
                  </Button>
                  <Button
                    size='small'
                    variant='contained'
                    onClick={() => void saveInfra()}
                    disabled={!infraDirty || infraSaving}
                  >
                    {infraSaving ? 'Saving…' : 'Save infra'}
                  </Button>
                </Stack>
              ) : null
            }
          >
            <Stack spacing={2} sx={{ mb: 2 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Checkout region</InputLabel>
                <Select label='Checkout region' value={region} onChange={e => setRegion(e.target.value)}>
                  <MenuItem value='US'>United States (USD)</MenuItem>
                  <MenuItem value='CA'>Canada (CAD)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size='small'
                label='Analysis period (days)'
                type='number'
                value={infraForm.global.analysisPeriodDays}
                onChange={e => {
                  setInfraDirty(true)
                  setInfraForm(p => ({ ...p, global: { ...p.global, analysisPeriodDays: e.target.value } }))
                }}
              />
              <TextField
                size='small'
                label='Lessons / month (volume)'
                type='number'
                value={infraForm.global.monthlyLessonVolume}
                onChange={e => {
                  setInfraDirty(true)
                  setInfraForm(p => ({ ...p, global: { ...p.global, monthlyLessonVolume: e.target.value } }))
                }}
                helperText='Amortizes fixed monthly costs per session'
              />
              <TextField
                size='small'
                label='Trainer onboardings / month'
                type='number'
                value={infraForm.global.monthlyTrainerOnboardings}
                onChange={e => {
                  setInfraDirty(true)
                  setInfraForm(p => ({
                    ...p,
                    global: { ...p.global, monthlyTrainerOnboardings: e.target.value }
                  }))
                }}
                helperText='Spreads Rekognition onboarding cost'
              />
            </Stack>

            {infraLoading ? (
              <CircularProgress size={24} />
            ) : (
              INFRA_CATEGORIES.map(cat => {
                const items = catalogByCategory[cat.id]?.length
                  ? catalogByCategory[cat.id]
                  : (report?.infraCatalog || []).filter(s => s.category === cat.id)

                if (!items?.length) return null

                return (
                  <Accordion key={cat.id} disableGutters sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction='row' justifyContent='space-between' width='100%' pr={1}>
                        <Typography fontWeight={600}>{cat.label}</Typography>
                        {monthlyBurn?.byCategory?.[cat.id] != null ? (
                          <Typography variant='body2' color='text.secondary'>
                            ~{fmtMoney(monthlyBurn.byCategory[cat.id], currency)}/mo
                          </Typography>
                        ) : null}
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        {items.map(svc => {
                          const field = infraValueFieldForAllocation(svc.allocation)
                          const override = infraForm.services[svc.key] || {}
                          const enabled = override.enabled ?? svc.defaultEnabled !== false

                          return (
                            <Box key={svc.key} sx={{ p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
                                <Box sx={{ flex: 1, pr: 1 }}>
                                  <Typography variant='subtitle2' fontWeight={700}>
                                    {svc.label}
                                  </Typography>
                                  <Typography variant='caption' color='text.secondary' display='block'>
                                    {svc.vendor} · {svc.description}
                                  </Typography>
                                  {svc.perLessonAt30MinCents != null ? (
                                    <Typography variant='caption' color='text.secondary'>
                                      ~{fmtMoney(svc.perLessonAt30MinCents, currency)} / 30-min lesson
                                    </Typography>
                                  ) : null}
                                </Box>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      size='small'
                                      checked={enabled}
                                      disabled={!canEdit || svc.allocation === 'pricing_live_cogs'}
                                      onChange={e =>
                                        patchService(svc.key, { enabled: e.target.checked })
                                      }
                                    />
                                  }
                                  label=''
                                />
                              </Stack>
                              {field && enabled ? (
                                <TextField
                                  size='small'
                                  fullWidth
                                  sx={{ mt: 1 }}
                                  label={infraFieldLabel(svc.allocation)}
                                  value={readInfraFieldValue(override, field, svc.allocation)}
                                  disabled={!canEdit}
                                  onChange={e =>
                                    patchService(svc.key, {
                                      [field]: writeInfraFieldValue(field, e.target.value, svc.allocation)
                                    })
                                  }
                                  InputProps={
                                    field === 'monthlyCostCents'
                                      ? { startAdornment: <InputAdornment position='start'>$</InputAdornment> }
                                      : field === 'percentRate'
                                        ? { endAdornment: <InputAdornment position='end'>%</InputAdornment> }
                                        : field !== 'monthlyCostCents'
                                          ? { endAdornment: <InputAdornment position='end'>¢</InputAdornment> }
                                          : undefined
                                  }
                                />
                              ) : null}
                            </Box>
                          )
                        })}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )
              })
            )}
          </AdminPageSection>

          <Box sx={{ mt: 2 }}>
            <AdminPageSection title='Custom session' subtitle='Model any coach rate and duration.'>
              <Stack spacing={2}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Product</InputLabel>
                  <Select
                    label='Product'
                    value={custom.productType}
                    onChange={e => setCustom(p => ({ ...p, productType: e.target.value }))}
                  >
                    {PRODUCT_TYPES.filter(
                      p => p.value !== 'wallet_topup' && p.value !== 'storage_subscription'
                    ).map(p => (
                      <MenuItem key={p.value} value={p.value}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size='small'
                  label='Duration (minutes)'
                  type='number'
                  value={custom.durationMinutes}
                  onChange={e => setCustom(p => ({ ...p, durationMinutes: e.target.value }))}
                />
                <TextField
                  size='small'
                  label='Coach hourly rate'
                  type='number'
                  value={custom.hourlyRateDollars}
                  onChange={e => setCustom(p => ({ ...p, hourlyRateDollars: e.target.value }))}
                  InputProps={{ startAdornment: <InputAdornment position='start'>$</InputAdornment> }}
                />
              </Stack>
            </AdminPageSection>
          </Box>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Stack spacing={3}>
            {monthlyBurn ? (
              <OpsSurfaceCard>
                  <Typography variant='h6' fontWeight={600} gutterBottom>
                    Monthly infrastructure burn
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={4}>
                      <Typography variant='caption' color='text.secondary'>
                        Estimated total
                      </Typography>
                      <Typography variant='h5' fontWeight={800}>
                        {fmtMoney(monthlyBurn.totalCents, currency)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={4}>
                      <Typography variant='caption' color='text.secondary'>
                        Per lesson (volume)
                      </Typography>
                      <Typography variant='h5' fontWeight={800}>
                        {fmtMoney(
                          Math.round(
                            monthlyBurn.totalCents / Math.max(1, Number(infraForm.global.monthlyLessonVolume) || 1)
                          ),
                          currency
                        )}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack direction='row' flexWrap='wrap' gap={0.5}>
                        {INFRA_CATEGORIES.map(cat =>
                          monthlyBurn.byCategory?.[cat.id] ? (
                            <Chip
                              key={cat.id}
                              size='small'
                              variant='outlined'
                              label={`${cat.label}: ${fmtMoney(monthlyBurn.byCategory[cat.id], currency)}`}
                            />
                          ) : null
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </OpsSurfaceCard>
            ) : null}

            <OpsSurfaceCard>
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant='h6' fontWeight={600}>
                      Actual sessions ({infraForm.global.analysisPeriodDays}d)
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Escrow holds — real average ticket vs modeled infra.
                    </Typography>
                  </Box>
                  {loading ? <CircularProgress size={22} /> : null}
                  {actuals ? (
                    <ProfitChip
                      profitable={actuals.profitable}
                      label={actuals.profitable ? 'Net positive' : 'Net negative'}
                    />
                  ) : null}
                </Stack>

                {actuals ? (
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Typography variant='caption' color='text.secondary'>
                        Completed
                      </Typography>
                      <Typography variant='h6' fontWeight={700}>
                        {actuals.completedSessions}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant='caption' color='text.secondary'>
                        Avg price
                      </Typography>
                      <Typography variant='h6' fontWeight={700}>
                        {fmtMoney(actuals.averages.sessionSubtotalCents, currency)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant='caption' color='text.secondary'>
                        Avg platform gross
                      </Typography>
                      <Typography variant='h6' fontWeight={700}>
                        {fmtMoney(actuals.averages.platformGrossCents, currency)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant='caption' color='text.secondary'>
                        Est. net / lesson
                      </Typography>
                      <Typography
                        variant='h6'
                        fontWeight={700}
                        color={actuals.profitable ? 'success.main' : 'error.main'}
                      >
                        {fmtMoney(actuals.estimatedNetPerLessonCents, currency)}
                      </Typography>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography color='text.secondary'>Calculating…</Typography>
                )}
              </OpsSurfaceCard>

            {customRow ? (
              <OpsSurfaceCard>
                <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
                  <Box>
                    <Typography variant='subtitle1' fontWeight={700}>
                      Custom session
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {customRow.durationMinutes} min · {fmtMoney(customRow.economics.sessionSubtotalCents, currency)}{' '}
                      · Breakeven {fmtPct(customRow.economics.breakevenCommissionRate)}
                    </Typography>
                  </Box>
                  <ProfitChip profitable={customRow.economics.profitable} />
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={0.5}>
                  {(customRow.economics.breakdown || []).map(line => (
                    <Stack key={line.key} direction='row' justifyContent='space-between'>
                      <Typography
                        variant='body2'
                        color={
                          line.key === 'net_profit'
                            ? customRow.economics.profitable
                              ? 'success.main'
                              : 'error.main'
                            : 'text.secondary'
                        }
                        fontWeight={line.key === 'net_profit' ? 700 : 400}
                      >
                        {line.label}
                      </Typography>
                      <Typography variant='body2' fontWeight={line.key === 'net_profit' ? 700 : 400}>
                        {fmtMoney(line.amountMinor, currency)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </OpsSurfaceCard>
            ) : null}

            <AdminPageSection title='Preset scenarios' subtitle='Expand a row for per-vendor infra breakdown.'>
              <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell width={48} />
                      <TableCell>Scenario</TableCell>
                      <TableCell align='right'>Subtotal</TableCell>
                      <TableCell align='right'>Gross</TableCell>
                      <TableCell align='right'>Infra</TableCell>
                      <TableCell align='right'>Net</TableCell>
                      <TableCell align='center'>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scenarios.map(row => (
                      <ScenarioInfraRow key={row.label} row={row} currency={currency} />
                    ))}
                  </TableBody>
                </Table>
              </OpsSurfaceCard>
            </AdminPageSection>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}
