import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  CA_PAYMENT_METHODS,
  CA_PROVINCE_OPTIONS,
  PRODUCT_TYPES,
  US_PAYMENT_METHODS,
  US_STATE_OPTIONS,
  fmtMoney,
  fmtPct,
  inputToCents
} from 'src/constants/pricingAdmin'
import { previewPricingQuote } from 'src/services/pricingApi'

const DEFAULT_INPUT = {
  region: 'US',
  productType: 'session_booking',
  sessionDollars: '100.00',
  state: 'TX',
  paymentMethodHint: 'card_domestic_us',
  promoDollars: '0'
}

export default function PricingSimulatorTab({ config, isDirty }) {
  const [input, setInput] = useState(DEFAULT_INPUT)
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  const paymentOptions = input.region === 'CA' ? CA_PAYMENT_METHODS : US_PAYMENT_METHODS
  const stateOptions = input.region === 'CA' ? CA_PROVINCE_OPTIONS : US_STATE_OPTIONS
  const currency = input.region === 'CA' ? 'CAD' : 'USD'

  const runQuote = useCallback(async () => {
    if (!config) return
    setLoading(true)
    try {
      const sessionSubtotalCents = inputToCents(input.sessionDollars)
      const promoDiscountCents = inputToCents(input.promoDollars)
      const result = await previewPricingQuote({
        region: input.region,
        productType: input.productType,
        sessionSubtotalCents: sessionSubtotalCents + promoDiscountCents,
        promoDiscountCents,
        paymentMethodHint: input.paymentMethodHint,
        billingAddress: { country: input.region, state: input.state },
        draftConfig: config
      })
      setQuote(result)
    } catch {
      setQuote(null)
    } finally {
      setLoading(false)
    }
  }, [input, config])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void runQuote(), 400)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [runQuote])

  useEffect(() => {
    setInput(prev => ({
      ...prev,
      paymentMethodHint: prev.region === 'CA' ? 'card_domestic_ca' : 'card_domestic_us',
      state: prev.region === 'CA' ? 'ON' : 'TX'
    }))
  }, [input.region])

  const marginColor = useMemo(() => {
    if (!quote) return 'text.secondary'
    return quote.platformNetMarginCents >= 0 ? 'success.main' : 'error.main'
  }, [quote])

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <AdminPageSection title='Quote simulator'>
          <Stack spacing={2}>
            {isDirty ? (
              <Chip size='small' color='warning' label='Preview uses unsaved draft' sx={{ alignSelf: 'flex-start' }} />
            ) : (
              <Chip size='small' color='success' variant='outlined' label='Preview uses saved config' sx={{ alignSelf: 'flex-start' }} />
            )}
            <FormControl fullWidth size='small'>
              <InputLabel>Region</InputLabel>
              <Select
                label='Region'
                value={input.region}
                onChange={e => setInput(p => ({ ...p, region: e.target.value }))}
              >
                <MenuItem value='US'>United States (USD)</MenuItem>
                <MenuItem value='CA'>Canada (CAD)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size='small'>
              <InputLabel>Product</InputLabel>
              <Select
                label='Product'
                value={input.productType}
                onChange={e => setInput(p => ({ ...p, productType: e.target.value }))}
              >
                {PRODUCT_TYPES.map(p => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size='small'
              fullWidth
              label='Session price'
              type='number'
              value={input.sessionDollars}
              onChange={e => setInput(p => ({ ...p, sessionDollars: e.target.value }))}
            />
            <TextField
              size='small'
              fullWidth
              label='Promo discount'
              type='number'
              value={input.promoDollars}
              onChange={e => setInput(p => ({ ...p, promoDollars: e.target.value }))}
            />
            <FormControl fullWidth size='small'>
              <InputLabel>State / Province</InputLabel>
              <Select
                label='State / Province'
                value={input.state}
                onChange={e => setInput(p => ({ ...p, state: e.target.value }))}
              >
                {stateOptions.map(s => (
                  <MenuItem key={s.code} value={s.code}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size='small'>
              <InputLabel>Payment method</InputLabel>
              <Select
                label='Payment method'
                value={input.paymentMethodHint}
                onChange={e => setInput(p => ({ ...p, paymentMethodHint: e.target.value }))}
              >
                {paymentOptions.map(m => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant='outlined' onClick={() => void runQuote()} disabled={loading}>
              Refresh now
            </Button>
          </Stack>
        </AdminPageSection>
      </Grid>

      <Grid item xs={12} md={7}>
        <Card variant='outlined' sx={{ height: '100%' }}>
          <CardContent>
            <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 2 }}>
              <Typography variant='h6' fontWeight={600}>
                Checkout breakdown
              </Typography>
              {loading ? <CircularProgress size={18} /> : null}
            </Stack>

            {!quote && !loading ? (
              <Typography color='text.secondary'>Enter values to preview a quote.</Typography>
            ) : null}

            {quote ? (
              <>
                {(quote.breakdown || []).map(row => (
                  <Stack
                    key={row.key}
                    direction='row'
                    justifyContent='space-between'
                    sx={{
                      py: 0.75,
                      fontWeight: row.key === 'total' ? 700 : 400,
                      borderTop: row.key === 'total' ? 1 : 0,
                      borderColor: 'divider',
                      mt: row.key === 'total' ? 1 : 0
                    }}
                  >
                    <Typography variant='body2'>{row.label}</Typography>
                    <Typography variant='body2'>{fmtMoney(row.amountMinor, currency)}</Typography>
                  </Stack>
                ))}

                <Divider sx={{ my: 2 }} />

                <Typography variant='subtitle2' gutterBottom>
                  Platform split (internal)
                </Typography>
                <Stack spacing={0.5}>
                  <Stack direction='row' justifyContent='space-between'>
                    <Typography variant='body2' color='text.secondary'>
                      % commission ({fmtPct(quote.commissionRate)})
                    </Typography>
                    <Typography variant='body2'>
                      {fmtMoney(quote.platformFeePercentCents, currency)}
                    </Typography>
                  </Stack>
                  <Stack direction='row' justifyContent='space-between'>
                    <Typography variant='body2' color='text.secondary'>
                      Coach receives
                    </Typography>
                    <Typography variant='body2' fontWeight={600}>
                      {fmtMoney(quote.trainerNetCents, currency)}
                    </Typography>
                  </Stack>
                  <Stack direction='row' justifyContent='space-between'>
                    <Typography variant='body2' color='text.secondary'>
                      Platform net margin
                    </Typography>
                    <Typography variant='body2' fontWeight={600} color={marginColor}>
                      {fmtMoney(quote.platformNetMarginCents, currency)}
                    </Typography>
                  </Stack>
                </Stack>
              </>
            ) : null}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
